import { lazy, Suspense } from 'react'
import BrutalistLoader from './components/common/BrutalistLoader'

// Import the main app which handles all routing and optional authentication
const App = lazy(() => import('./App'))

export default function AppWrapper() {
  return (
    <Suspense fallback={<BrutalistLoader />}>
      <App />
    </Suspense>
  )
}