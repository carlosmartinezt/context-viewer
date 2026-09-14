import type { ReactNode } from 'react'
import { files, rootName } from '@/server/runtime'
import { requireSession } from '@/server/session'
import { Workbench } from '@/components/Workbench'

/**
 * Every workbench page shares this: the chrome is rendered once and survives
 * navigation, so moving between files keeps the tab strip, the tree's open
 * folders and the agent's conversation. Only the document pane changes.
 *
 * This is also the gate for every page under it. Route handlers call
 * requireSession themselves, because a matcher that covered both would be one
 * careless pattern away from exposing one of them.
 */
export default async function WorkbenchLayout({ children }: { children: ReactNode }) {
  await requireSession()
  const tree = await files.tree()

  return (
    <>
      {/* The web font, linked here and not in the root layout, because the
          root layout is also sign in and setup: those keep a strict policy
          that names no third-party host, and they have no code on them to
          set in a monospace anyway. React hoists a stylesheet with a
          precedence into the head. */}
      <link rel="stylesheet" href="/_ctx/assets/fonts.css" precedence="default" />
      <Workbench tree={tree} root={rootName()}>
        {children}
      </Workbench>
    </>
  )
}
