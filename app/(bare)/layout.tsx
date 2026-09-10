import type { ReactNode } from 'react'

/** Sign in and first-run setup: no workbench, no tree, no session. */
export default function BareLayout({ children }: { children: ReactNode }) {
  return <main className="cv-auth">{children}</main>
}
