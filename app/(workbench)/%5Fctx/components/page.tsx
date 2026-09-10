import type { ReactNode } from 'react'

import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Components' }

/**
 * The component reference, written with the components it documents, so the
 * page is broken the moment they are. Every example shows its own markup
 * underneath it: a reference you have to view-source to use is not one.
 */

/** One example: the thing itself, then the markup that made it. */
function Demo({ children, code }: { children: ReactNode; code: string }) {
  return (
    <>
      <div className="cv-demo">{children}</div>
      <pre><code>{code.trim()}</code></pre>
    </>
  )
}

export default function ComponentsPage() {
  return (
    <article className="cv-content cv-reference">
      <header className="ctx-header">
        <p className="ctx-eyebrow">Reference</p>
        <h1>Document components</h1>
        <p>
          Classes any file in this tree can use. They are shipped with the viewer, they follow
          whichever colour theme is set, and they are all optional: a document that uses none of
          them renders exactly as it always did.
        </p>
      </header>

      <p>
        Add them to ordinary HTML. There is nothing to import and nothing to configure, and a file
        that carries its own <code>&lt;style&gt;</code> block can still use them alongside it.
      </p>

      <h2>Header</h2>
      <p>A title block, ruled in the page&apos;s accent. Set <code>--ctx-accent</code> to change the colour.</p>
      <Demo code={`<header class="ctx-header" style="--ctx-accent: #7e6699">
  <p class="ctx-eyebrow">Project</p>
  <h1>Kitchen renovation</h1>
</header>`}>
        <header className="ctx-header" style={{ '--ctx-accent': '#7e6699' } as React.CSSProperties}>
          <p className="ctx-eyebrow">Project</p>
          <h1>Kitchen renovation</h1>
        </header>
      </Demo>

      <h2>Meta</h2>
      <p>
        Label and value pairs across the measure. Each pair goes in its own <code>div</code>: a bare
        <code>dl</code> cannot make a <code>dt</code> and its <code>dd</code> into one grid cell.
      </p>
      <Demo code={`<dl class="ctx-meta">
  <div><dt>Budget</dt><dd>12,000</dd></div>
  <div><dt>Rooms</dt><dd>Kitchen, pantry</dd></div>
  <div><dt>Status</dt><dd>Planning</dd></div>
</dl>`}>
        <dl className="ctx-meta">
          <div><dt>Budget</dt><dd>12,000</dd></div>
          <div><dt>Rooms</dt><dd>Kitchen, pantry</dd></div>
          <div><dt>Status</dt><dd>Planning</dd></div>
        </dl>
      </Demo>

      <h2>Card</h2>
      <p>The one place a box is right: things that belong together, inside a document that is otherwise unboxed prose.</p>
      <Demo code={`<section class="ctx-card">
  <div class="ctx-card-head">
    <div>
      <h3>Contractor quotes</h3>
      <p class="ctx-sub">Three bids before choosing</p>
    </div>
    <span class="ctx-tag ctx-tag-active">In progress</span>
  </div>
  <div class="ctx-chips">
    <span class="ctx-chip ctx-chip-done">First quote in</span>
    <span class="ctx-chip">Ask for references</span>
  </div>
  <p class="ctx-note">Compare on schedule as well as price.</p>
</section>`}>
        <section className="ctx-card">
          <div className="ctx-card-head">
            <div>
              <h3>Contractor quotes</h3>
              <p className="ctx-sub">Three bids before choosing</p>
            </div>
            <span className="ctx-tag ctx-tag-active">In progress</span>
          </div>
          <div className="ctx-chips">
            <span className="ctx-chip ctx-chip-done">First quote in</span>
            <span className="ctx-chip">Ask for references</span>
          </div>
          <p className="ctx-note">Compare on schedule as well as price.</p>
        </section>
      </Demo>

      <h2>Tags</h2>
      <p>
        Tones are named for what they mean, not for their colour, so the document says what a thing
        is and the stylesheet decides how that looks.
      </p>
      <Demo code={`<span class="ctx-tag ctx-tag-done">Done</span>
<span class="ctx-tag ctx-tag-active">In progress</span>
<span class="ctx-tag ctx-tag-next">Next</span>
<span class="ctx-tag ctx-tag-blocked">Blocked</span>
<span class="ctx-tag ctx-tag-idea">Idea</span>
<span class="ctx-tag ctx-tag-idle">Someday</span>`}>
        <span className="ctx-tag ctx-tag-done">Done</span>{' '}
        <span className="ctx-tag ctx-tag-active">In progress</span>{' '}
        <span className="ctx-tag ctx-tag-next">Next</span>{' '}
        <span className="ctx-tag ctx-tag-blocked">Blocked</span>{' '}
        <span className="ctx-tag ctx-tag-idea">Idea</span>{' '}
        <span className="ctx-tag ctx-tag-idle">Someday</span>
      </Demo>

      <h2>Chips</h2>
      <p>
        A checklist that wraps and reads at a glance. Done is struck through as well as tinted,
        since colour alone is not a state everyone can read.
      </p>
      <Demo code={`<div class="ctx-chips">
  <span class="ctx-chip ctx-chip-done">Measure the room</span>
  <span class="ctx-chip">Order samples</span>
</div>`}>
        <div className="ctx-chips">
          <span className="ctx-chip ctx-chip-done">Measure the room</span>
          <span className="ctx-chip">Order samples</span>
        </div>
      </Demo>

      <h2>Callout</h2>
      <p>
        An aside that must not be missed. A rule in the tone rather than a tinted panel, because a
        coloured box in the middle of prose reads as an advertisement.
      </p>
      <Demo code={`<p class="ctx-callout">The lease renews automatically.</p>
<p class="ctx-callout ctx-callout-warn">Renew before 3 March.</p>
<p class="ctx-callout ctx-callout-stop">Do not order until the permit clears.</p>
<p class="ctx-callout ctx-callout-good">Approved on 12 January.</p>`}>
        <p className="ctx-callout">The lease renews automatically.</p>
        <p className="ctx-callout ctx-callout-warn">Renew before 3 March.</p>
        <p className="ctx-callout ctx-callout-stop">Do not order until the permit clears.</p>
        <p className="ctx-callout ctx-callout-good">Approved on 12 January.</p>
      </Demo>

      <h2>Grid</h2>
      <p>
        Columns that fold to one when the pane is narrow. Set <code>--ctx-col</code> to change the
        narrowest a column may get.
      </p>
      <Demo code={`<div class="ctx-grid">
  <section class="ctx-card"><h3>One</h3></section>
  <section class="ctx-card"><h3>Two</h3></section>
</div>`}>
        <div className="ctx-grid">
          <section className="ctx-card"><h3>One</h3><p className="ctx-sub">Folds at 15rem</p></section>
          <section className="ctx-card"><h3>Two</h3><p className="ctx-sub">Same</p></section>
        </div>
      </Demo>

      <h2>Log</h2>
      <p>
        A dated list: a changelog, a decision record, a diary. Dates run down one column in the
        monospace face so the eye can scan them.
      </p>
      <Demo code={`<dl class="ctx-log">
  <dt>2026-06-27</dt><dd>Project created.</dd>
</dl>`}>
        <dl className="ctx-log">
          <dt>2026-06-27</dt><dd>Project created. Three workstreams defined.</dd>
          <dt>2026-05-02</dt><dd>Decided against moving the sink.</dd>
        </dl>
      </Demo>

      <h2>Where each thing lives</h2>
      <dl className="ctx-log">
        <dt>viewer.css</dt><dd>The workbench and ordinary HTML. Knows nothing about anyone&apos;s files.</dd>
        <dt>themes.css</dt><dd>Every colour and type token. One block per theme.</dd>
        <dt>components.css</dt><dd>This page. Generic, shipped, opt-in by class name.</dd>
        <dt>custom.css</dt><dd>Yours. Git-ignored, absent by default, loaded last if present.</dd>
      </dl>
    </article>
  )
}
