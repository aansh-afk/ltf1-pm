import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import BrutalistLoader from './components/common/BrutalistLoader'

// Lazy load public pages
const LandingPage = lazy(() => import('./pages/LandingPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const BlogPage = lazy(() => import('./pages/BlogPage'))

export default function AppPublic() {
  return (
    <Suspense fallback={<BrutalistLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </Suspense>
  )
}