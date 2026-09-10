#!/usr/bin/env python3
"""
One-shot migration: push a shared stylesheet's rules down into the documents
themselves, so a file carries its own presentation and context-viewer ships no
opinion about how anyone's notes are marked up.

For each HTML file it:
  - applies every rule that CAN be inlined as a style="" attribute,
  - keeps the few that cannot (::before, :hover, :last-child, print) in a small
    <style> block in that same file,
  - deletes every class that is then doing nothing.

It rewrites only the text of the start tags it touches, spliced back into the
original by byte offset, so indentation, quoting and everything between tags
survive byte for byte.

    python3 ops/inline-css.py --css public/custom.css --root ~/notes [--apply]

Without --apply it writes nothing and prints what it would do.
"""

import argparse
import os
import re
import sys
from html.parser import HTMLParser

# ── The stylesheet ────────────────────────────────────────────────────────

# Colours resolve to literals: they came from custom.css, which is going away.
# var(--doc-*) is deliberately left alone, because those live on :root in
# viewer.css and must keep responding to the theme picker.
LITERALS = {
    '--paper': '#faf8f4', '--card': '#fffefb', '--rule': '#e0d8c9',
    '--ink': '#26231f', '--ink-soft': '#7a736a',
    '--blue-bg': '#e5e9ef', '--blue-accent': '#7e8ea3', '--blue-ink': '#445468',
    '--teal-bg': '#e2eae3', '--teal-accent': '#7d9a85', '--teal-ink': '#41604b',
    '--purple-bg': '#eae4ec', '--purple-accent': '#9483a0', '--purple-ink': '#5e4b6b',
    '--amber-bg': '#f3e9d3', '--amber-accent': '#bd9a55', '--amber-ink': '#7d5f1d',
    '--rose-bg': '#f1e0dc', '--rose-accent': '#b98a80', '--rose-ink': '#8a4d40',
    '--coral-bg': '#f3e4d7', '--coral-accent': '#bf8355', '--coral-ink': '#8f5227',
    '--gray-bg': '#ebe6dd', '--gray-accent': '#9c9488', '--gray-ink': '#55504a',
}
THEME_DEFAULT = 'gray'
UNINLINABLE = ('::', ':hover', ':last-child', ':first-child', ':nth-child',
               ':empty', ':has(', ':first-of-type', ':not(')


def parse_css(path):
    """-> (inlinable rules, leftover rules). Rules are (chain, decls, order)."""
    css = open(path).read()
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    # @media rules are dropped: the only ones present narrowed a grid that
    # already uses auto-fit, so the layout survives without them.
    for block in re.findall(r'@media[^{]*\{.*?\n\}', css, flags=re.S):
        css = css.replace(block, '')

    inlinable, leftover = [], []
    for order, (sels, body) in enumerate(re.findall(r'([^{}]+)\{([^}]*)\}', css)):
        decls = parse_decls(body)
        if not decls:
            continue
        for sel in sels.split(','):
            sel = ' '.join(sel.split())
            if not sel:
                continue
            if any(u in sel for u in UNINLINABLE):
                trivial = all(p.startswith(('margin', 'padding')) for p, _ in decls)
                if not trivial:
                    leftover.append((sel, body.strip(), order))
            else:
                inlinable.append((compile_selector(sel), decls, order))
    return inlinable, leftover


# border-radius: 0 existed to flatten the old site's rounded cards. Nothing
# rounds these elements any more, so inlining it onto hundreds of tags would
# be noise that changes nothing.
NOOP = {('border-radius', '0')}


def parse_decls(body):
    out = []
    for decl in re.split(r';(?![^(]*\))', body):
        if ':' in decl:
            prop, _, val = decl.partition(':')
            prop, val = prop.strip(), ' '.join(val.split())
            if prop and val and not prop.startswith('--') and (prop, val) not in NOOP:
                out.append((prop, val))
    return out


def compile_selector(sel):
    """A chain of steps, outermost first. Each: (tag|None, classes, attrs, child)."""
    chain, want_child = [], False
    for part in sel.split():
        if part == '>':
            want_child = True
            continue
        attrs = dict(re.findall(r'\[([\w-]+)="([^"]*)"\]', part))
        bare = re.sub(r'\[[^\]]*\]', '', part)
        classes = set(re.findall(r'\.([\w-]+)', bare))
        tag = re.match(r'^([a-zA-Z][\w-]*)', bare)
        chain.append({'tag': tag.group(1).lower() if tag else None,
                      'classes': classes, 'attrs': attrs, 'child': want_child})
        want_child = False
    return chain


def specificity(chain):
    ids = 0
    cls = sum(len(s['classes']) + len(s['attrs']) for s in chain)
    typ = sum(1 for s in chain if s['tag'])
    return (ids, cls, typ)


def matches(chain, stack):
    """stack is the ancestor path including the element itself, innermost last."""
    if not chain:
        return False

    def step_ok(step, el):
        if step['tag'] and step['tag'] != el['tag']:
            return False
        if not step['classes'] <= el['classes']:
            return False
        return all(el['attrs'].get(k) == v for k, v in step['attrs'].items())

    def walk(ci, si):
        if ci < 0:
            return True
        step = chain[ci]
        if ci == len(chain) - 1:
            if si != len(stack) - 1 or not step_ok(step, stack[si]):
                return False
            return walk(ci - 1, si - 1)
        for j in range(si, -1, -1):
            if step_ok(step, stack[j]) and walk(ci - 1, j - 1):
                return True
            if chain[ci + 1]['child']:
                break
        return False

    return walk(len(chain) - 1, len(stack) - 1)


def resolve_vars(value, theme):
    """--t-* follow the nearest data-theme; the rest are fixed palette entries."""
    for slot in ('bg', 'accent', 'ink'):
        value = value.replace(f'var(--t-{slot})', LITERALS[f'--{theme}-{slot}'])
        value = re.sub(rf'var\(--t-{slot},\s*[^)]*\)', LITERALS[f'--{theme}-{slot}'], value)
    for name, literal in LITERALS.items():
        value = value.replace(f'var({name})', literal)
    return value


# ── The rewriter ──────────────────────────────────────────────────────────

class Rewriter(HTMLParser):
    def __init__(self, src, inlinable, leftover, keep_classes):
        super().__init__(convert_charrefs=False)
        self.src, self.inlinable, self.leftover = src, inlinable, leftover
        self.keep_classes = keep_classes
        # context-viewer wraps every document in <article class="cv-content">,
        # which is not in the file on disk. Seed it, or every rule scoped to
        # .cv-content (which is all of them) matches nothing and the styling
        # is quietly dropped instead of inlined.
        self.stack = [{'tag': 'article', 'classes': {'cv-content'}, 'attrs': {}}]
        self.edits, self.used_leftover = [], set()
        self.line_offsets = [0]
        for line in src.split('\n'):
            self.line_offsets.append(self.line_offsets[-1] + len(line) + 1)

    def abs_offset(self):
        line, col = self.getpos()
        return self.line_offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        self.push(tag, attrs)
        self.emit(tag, attrs, self.get_starttag_text())
        if tag in ('br', 'hr', 'img', 'input', 'meta', 'link', 'source'):
            self.stack.pop()

    def handle_startendtag(self, tag, attrs):
        self.push(tag, attrs)
        self.emit(tag, attrs, self.get_starttag_text())
        self.stack.pop()

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]['tag'] == tag:
                del self.stack[i:]
                return

    def push(self, tag, attrs):
        d = {k.lower(): (v or '') for k, v in attrs}
        self.stack.append({'tag': tag.lower(),
                           'classes': set(d.get('class', '').split()),
                           'attrs': d})

    def theme(self):
        for el in reversed(self.stack):
            t = el['attrs'].get('data-theme')
            if t in ('blue', 'teal', 'purple', 'amber', 'rose', 'coral', 'gray'):
                return t
        return THEME_DEFAULT

    def emit(self, tag, attrs, text):
        if text is None:
            return
        el = self.stack[-1]

        winners = {}
        for chain, decls, order in self.inlinable:
            if matches(chain, self.stack):
                for prop, val in decls:
                    key = (specificity(chain), order)
                    if prop not in winners or winners[prop][0] < key:
                        winners[prop] = (key, val)
        new_decls = [(p, resolve_vars(v, self.theme())) for p, (_, v) in winners.items()]

        # Which of this element's classes still earn their keep?
        kept = []
        for cls in el['classes']:
            if cls in self.keep_classes:
                for sel, _, _ in self.leftover:
                    if f'.{cls}' in sel:
                        self.used_leftover.add(sel)
                kept.append(cls)

        if not new_decls and set(kept) == el['classes'] and 'data-theme' not in el['attrs']:
            return

        out = text
        # Merge into any hand-written style="", which wins over what we add.
        existing = el['attrs'].get('style', '').strip().rstrip(';')
        if new_decls:
            own = {p for p, _ in parse_decls(existing)}
            merged = '; '.join(f'{p}: {v}' for p, v in new_decls if p not in own)
            style = '; '.join(x for x in (merged, existing) if x)
            out = set_attr(out, 'style', style)

        out = set_attr(out, 'class', ' '.join(sorted(kept)))
        if 'data-theme' in el['attrs'] and not kept:
            out = set_attr(out, 'data-theme', '')

        if out != text:
            start = self.abs_offset()
            self.edits.append((start, start + len(text), out))


def set_attr(tag_text, name, value):
    """Replace, drop (empty value) or append an attribute in a start tag."""
    pattern = re.compile(rf'\s{name}="[^"]*"', re.I)
    if pattern.search(tag_text):
        return pattern.sub(f' {name}="{value}"' if value else '', tag_text, count=1)
    if not value:
        return tag_text
    close = '/>' if tag_text.rstrip().endswith('/>') else '>'
    return tag_text[: tag_text.rstrip().rfind(close)].rstrip() + f' {name}="{value}"' + close


def own_style_classes(src):
    """Classes a file styles in its own <style> block.

    These are invisible to this script's stylesheet but very much alive: strip
    them and the file's own CSS stops matching its own markup, and the file
    quietly breaks.
    """
    own = set()
    for block in re.findall(r'<style[^>]*>(.*?)</style>', src, re.S | re.I):
        own |= set(re.findall(r'\.([a-zA-Z][\w-]*)', block))
    return own


def process(path, inlinable, leftover, keep_classes):
    src = open(path, encoding='utf-8').read()
    keep_classes = keep_classes | own_style_classes(src)
    r = Rewriter(src, inlinable, leftover, keep_classes)
    r.feed(src)
    r.close()

    out = src
    for start, end, text in sorted(r.edits, reverse=True):
        out = out[:start] + text + out[end:]

    if r.used_leftover:
        rules = [f'{sel} {{ {body} }}' for sel, body, _ in leftover if sel in r.used_leftover]
        block = '<style>\n' + '\n'.join(
            resolve_vars(rule.replace('.cv-content ', ''), THEME_DEFAULT) for rule in rules
        ) + '\n</style>\n'
        anchor = re.search(r'<site-page[^>]*>|<body[^>]*>', out, re.I)
        if anchor:
            out = out[: anchor.end()] + '\n' + block + out[anchor.end():]
        else:
            out = block + out
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--css', required=True)
    ap.add_argument('--root', required=True)
    ap.add_argument('--apply', action='store_true')
    ap.add_argument('--only')
    args = ap.parse_args()

    inlinable, leftover = parse_css(args.css)
    keep_classes = set()
    for sel, _, _ in leftover:
        keep_classes |= set(re.findall(r'\.([\w-]+)', sel))
    keep_classes.discard('cv-content')
    # Deliberately dropped rather than kept: changelog tables go back to being
    # tables, which is what the markup says they are.
    keep_classes.discard('timeline')

    root = os.path.expanduser(args.root)
    changed = 0
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not d.startswith('.')]
        for name in sorted(filenames):
            if not name.endswith(('.html', '.htm')):
                continue
            path = os.path.join(dirpath, name)
            if args.only and args.only not in path:
                continue
            before = open(path, encoding='utf-8').read()
            after = process(path, inlinable, leftover, keep_classes)
            if after != before:
                changed += 1
                if args.apply:
                    open(path, 'w', encoding='utf-8').write(after)
                else:
                    print(f'would change {os.path.relpath(path, root)}')
    print(f'{changed} files {"changed" if args.apply else "would change"}')


if __name__ == '__main__':
    main()
