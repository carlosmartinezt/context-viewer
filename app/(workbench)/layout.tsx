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
    <Workbench tree={tree} root={rootName()}>
      {children}
    </Workbench>
  )
}
