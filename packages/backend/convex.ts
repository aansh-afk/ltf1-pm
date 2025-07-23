// Re-export only types - NOT the api object which contains server-side code
import type { Id as ConvexId, Doc as ConvexDoc } from '../../convex/_generated/dataModel'

export type Id<TableName extends string = string> = ConvexId<TableName>
export type Doc<TableName extends string = string> = ConvexDoc<TableName>

// Re-export common Convex utilities for client use
export { ConvexProvider, useConvex, useQuery, useMutation, useAction } from 'convex/react'
export { ConvexHttpClient } from 'convex/browser'