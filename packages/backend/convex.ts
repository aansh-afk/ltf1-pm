// Re-export only types - NOT the api object which contains server-side code
import type { SystemTableNames } from 'convex/server'
import type { Id as ConvexId, Doc as ConvexDoc, TableNames } from '../../convex/_generated/dataModel'

export type Id<TableName extends TableNames | SystemTableNames = TableNames> = ConvexId<TableName>
export type Doc<TableName extends TableNames = TableNames> = ConvexDoc<TableName>

// Re-export common Convex utilities for client use
export { ConvexProvider, useConvex, useQuery, useMutation, useAction } from 'convex/react'
export { ConvexHttpClient } from 'convex/browser'
