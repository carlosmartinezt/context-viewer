import { files } from '@/server/runtime'
import { sortEntries } from '@/lib/sort'
import { Listing } from '@/components/Listing'

import type { Metadata } from 'next'
import path from 'node:path'
import { config } from '@/server/runtime'

/** The directory's own name, which is what the breadcrumb calls it too. */
export function generateMetadata(): Metadata {
  return { title: path.basename(config.root) || 'root' }
}

/** The root of the tree. */
export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const query = await searchParams
  const sort = typeof query.sort === 'string' ? query.sort : 'name'
  const dir = typeof query.dir === 'string' ? query.dir : 'asc'
  const entries = sortEntries(await files.list([]), sort, dir)
  return <Listing entries={entries} base="/" sort={sort} dir={dir} />
}
