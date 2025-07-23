// Export only types, not the API reference (which contains server-side code)
export { type Id, type Doc } from './convex'

// Re-export common Convex utilities for client use
export { ConvexProvider, useConvex, useQuery, useMutation, useAction } from 'convex/react'
export { ConvexHttpClient } from 'convex/browser'