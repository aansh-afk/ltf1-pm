import { m } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import ProductShowcaseSection from '../components/landing/sections/ProductShowcaseSection'
import { usePageTitle } from '../hooks/usePageTitle'

export default function FeaturesPage() {
  usePageTitle('Features — Git-Native Project Management')
  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-32 pb-4 md:pt-40 md:pb-6">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
              Features
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-4">
              Everything you need to
              <br />
              ship with confidence
            </h1>
            <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
              Git-native project management that tracks what you actually ship,
              not what you say you will.
            </p>
          </m.div>
        </div>
      </section>

      {/* Reuse the bento grid, skip its header since we have our own */}
      <ProductShowcaseSection hideHeader />

      <Footer />
    </div>
  )
}
