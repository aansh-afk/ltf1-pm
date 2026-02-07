import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import HeroSection from '../components/landing/sections/HeroSection'
import ProblemSection from '../components/landing/sections/ProblemSection'
import HowItWorksSection from '../components/landing/sections/HowItWorksSection'
import FeaturesPreviewSection from '../components/landing/sections/FeaturesPreviewSection'
import PricingPreviewSection from '../components/landing/sections/PricingPreviewSection'
import FinalCTASection from '../components/landing/sections/FinalCTASection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FeaturesPreviewSection />
      <PricingPreviewSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}
