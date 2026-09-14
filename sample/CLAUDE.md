# CLAUDE.md

Notes for whoever, or whatever, is working in this directory. context-viewer
does not read this file: it is an ordinary document like every other one here.
It sits at the root because the agent in the panel below can read it, and
because a tree of notes with no note about the tree is how conventions get
lost.

## How this is organised

PARA, and the numbers are only there to keep the folders in order:

```
00_inbox/       things that landed and have not been filed. Meant to be
                emptied, not read.
01_projects/    something with an end. One folder each, and it moves to
                04_archive when it is done or abandoned.
02_areas/       ongoing, no finish line: reading, health, a house.
03_resources/   things kept because they were useful, belonging to no project.
04_archive/     finished, abandoned, or simply over. Nothing is deleted here,
                it just stops being in the way.
```

Folder names are lowercase with underscores. A project folder is named for the
thing, not the date: `website_redesign`, not `2026_q2_redesign`.

## Writing the files

Markdown or plain text for anything that is mostly words. HTML when the page
wants a layout of its own, which is the point of `status-page.html` in the
archive: it brings its own stylesheet and renders here exactly as it would in
a browser.

A note that wants a card, a status pill or a row of metadata should use the
viewer's own components (`class="ctx-card"`, `ctx-tag`, `ctx-meta`) rather
than inventing them again in a `<style>` block. `/_ctx/components` is the
reference, and it is written with the components it documents.

An HTML file that is just content and no design, like
`03_resources/http-status-codes.html`, is fine as it is. Turn on **Document
style** in the gear menu to give those a reading width and a familiar face.

## Decisions go in the file

A decision that lives only in a conversation is a decision nobody can find in
six months. Write it into the page it belongs to, with the date and the reason
it went that way, and keep what was rejected: the rejected option is usually
the part someone re-proposes later.

## Style

No em dashes. Comma, colon, full stop, or parentheses. Keep it brief, and use
the plain word rather than the clever one.
