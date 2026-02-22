import { Link } from 'react-router-dom'
import { m, type Variants } from 'framer-motion'
import posthog from 'posthog-js'
import { HiOutlineSparkles } from 'react-icons/hi'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import { usePageTitle } from '../hooks/usePageTitle'

/* ─── Early Access Banner ────────────────────────────────────── */

function EarlyAccessBanner() {
  return (
    <m.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="border-2 border-[#F59E0B]/40 bg-[#F59E0B]/5 p-4 md:p-5 mb-10"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-widest font-bold">
            ★ Currently in Early Access
          </span>
        </div>
        <div className="h-px w-full sm:h-4 sm:w-px bg-[#2E2E35] shrink-0" />
        <p className="text-xs font-mono text-[#9CA3AF] leading-relaxed">
          <span className="text-[#F9FAFB] font-bold">All features free until launch.</span>{' '}
          Billing starts only when we officially ship. Your feedback shapes the product.
        </p>
      </div>
    </m.div>
  )
}

/* ─── Tier Data ─────────────────────────────────────────────── */

interface Tier {
  name: string
  price: string
  period: string
  betaPrice: string
  highlight?: boolean
  badge?: string
  features: string[]
  cta: { label: string; to: string; style: 'primary' | 'ghost' | 'disabled' }
}

const tiers: Tier[] = [
  {
    name: 'Open Source',
    price: '$0',
    betaPrice: '$0',
    period: 'free forever',
    features: [
      'Unlimited projects',
      'Up to 5 team members',
      'Full Git integration',
      'PR-driven task updates',
      'Slack & Discord notifications',
      'Sprint management',
      '100 AI credits/month',
      'CLI + TUI access',
      'Community support',
    ],
    cta: { label: 'Get Started Free', to: '/sign-up', style: 'primary' },
  },
  {
    name: 'Pro',
    price: '$15',
    betaPrice: 'Free',
    period: '/seat/month',
    badge: 'Free During Early Access',
    highlight: true,
    features: [
      'Everything in Open Source',
      'Unlimited team members',
      'Git integration',
      'Chat',
      'Meetings',
      'Whiteboard',
      'AI assistance',
      'Time Tracking',
      'Custom Fields',
      'Sprint planning',
      'Role-based access control',
    ],
    cta: { label: 'Join Early Access', to: '/waitlist', style: 'primary' },
  },
]

/* ─── Animations ────────────────────────────────────────────── */

const cardVariants: Variants = {
  rest: { borderColor: 'rgba(46, 46, 53, 1)', y: 0 },
  hover: { borderColor: 'rgba(249, 250, 251, 0.2)', y: -2 },
}

const highlightCardVariants: Variants = {
  rest: { borderColor: 'rgba(99, 102, 241, 0.6)', y: 0 },
  hover: { borderColor: 'rgba(99, 102, 241, 1)', y: -2 },
}

/* ─── Footer Note ───────────────────────────────────────────── */

function FooterNote() {
  return (
    <m.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mt-8 flex items-start gap-3 justify-center"
    >
      <HiOutlineSparkles className="w-3 h-3 text-[#6B7280] shrink-0 mt-0.5" />
      <p className="text-[10px] font-mono text-[#6B7280] leading-relaxed">
        Stripe billing coming soon. During Early Access, all Pro features are available free.
      </p>
    </m.div>
  )
}

/* ─── Component ─────────────────────────────────────────────── */

export default function PricingPage() {
  usePageTitle('Pricing — Simple, Transparent Plans')
  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-32 pb-12 md:pt-40 md:pb-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
              Pricing
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-4">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-[#6B7280] max-w-xl mx-auto mb-8">
              We're building in public.{' '}
              <span className="text-[#F9FAFB]">Everything is free right now.</span>{' '}
              Billing kicks in when the app officially ships.
            </p>
          </m.div>

          {/* Early Access Banner */}
          <EarlyAccessBanner />
        </div>
      </section>

      {/* Tier Cards */}
      <section className="pb-14 md:pb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier, i) => (
              <m.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <m.div
                  variants={tier.highlight ? highlightCardVariants : cardVariants}
                  initial="rest"
                  whileHover="hover"
                  className={`bg-[#111111] border-2 overflow-hidden flex flex-col h-full ${
                    tier.highlight ? 'border-[#6366F1]/60' : 'border-[#2E2E35]'
                  }`}
                >
                  <div className="p-4 md:p-5 flex flex-col flex-1">
                    {/* Name + Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
                        {tier.name}
                      </span>
                      {tier.badge && (
                        <span className="text-[10px] font-mono text-[#F59E0B] uppercase tracking-wider border border-[#F59E0B]/30 px-2 py-0.5">
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      {tier.betaPrice === 'Free' ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-4xl font-bold text-[#6366F1]">
                            Free
                          </span>
                          <span className="text-sm text-[#6B7280] line-through">
                            {tier.price}{tier.period}
                          </span>
                        </div>
                      ) : (
                        <>
                          <span className="text-4xl font-bold text-[#F9FAFB]">
                            {tier.price}
                          </span>
                          <span className="text-sm text-[#6B7280] ml-1">
                            {tier.period}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Early access note for paid tiers */}
                    {tier.betaPrice === 'Free' && (
                      <p className="text-[10px] font-mono text-[#6B7280] mb-3 leading-relaxed">
                        During Early Access. Billing starts at launch.
                      </p>
                    )}

                    {/* Features */}
                    <div className="space-y-2.5 mb-4 flex-1">
                      {tier.features.map((f) => (
                        <div key={f} className="flex items-start gap-2.5 text-xs font-mono">
                          <span className="text-[#6366F1] mt-px">+</span>
                          <span className="text-[#9CA3AF]">{f}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    {tier.cta.style === 'primary' ? (
                      <Link
                        to={tier.cta.to}
                        onClick={() => posthog.capture('pricing_cta_clicked', { tier: tier.name, label: tier.cta.label })}
                        className="block w-full text-center bg-[#F9FAFB] text-[#050505] font-bold text-sm px-6 py-3"
                      >
                        {tier.cta.label}
                      </Link>
                    ) : tier.cta.style === 'ghost' ? (
                      <Link
                        to={tier.cta.to}
                        onClick={() => posthog.capture('pricing_cta_clicked', { tier: tier.name, label: tier.cta.label })}
                        className="block w-full text-center text-[#9CA3AF] font-bold text-sm px-6 py-3 border border-[#2E2E35]"
                      >
                        {tier.cta.label}
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="w-full text-center text-[#6B7280] font-bold text-sm px-6 py-3 border border-[#2E2E35] opacity-50 cursor-not-allowed"
                      >
                        {tier.cta.label}
                      </button>
                    )}
                  </div>
                </m.div>
              </m.div>
            ))}
          </div>

          {/* Footer note */}
          <FooterNote />
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 md:py-16 border-t border-[#2E2E35]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F9FAFB] mb-2">
              Get full access. Build with us.
            </h2>
            <p className="text-sm text-[#6B7280] font-mono mb-6">
              Early Access users get every feature free. Your feedback shapes the product.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/waitlist"
                className="bg-[#F9FAFB] text-[#050505] font-bold text-sm px-6 py-3"
              >
                Join Early Access
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
