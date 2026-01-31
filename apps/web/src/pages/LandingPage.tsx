import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import HeroSection from '../components/landing/sections/HeroSection'
import ProblemSection from '../components/landing/sections/ProblemSection'
import HowItWorksSection from '../components/landing/sections/HowItWorksSection'
import CoreFeaturesSection from '../components/landing/sections/CoreFeaturesSection'
import SecondaryFeaturesSection from '../components/landing/sections/SecondaryFeaturesSection'
import PricingPreviewSection from '../components/landing/sections/PricingPreviewSection'
import FinalCTASection from '../components/landing/sections/FinalCTASection'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-event-horizon">
      <PublicNavigation />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <CoreFeaturesSection />
      <SecondaryFeaturesSection />
      <PricingPreviewSection />
      <FinalCTASection />
      <Footer />
    </div>
  )
}
