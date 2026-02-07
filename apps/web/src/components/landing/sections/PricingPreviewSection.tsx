import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'

const tiers = [
  {
    name: 'Open Source',
    price: '$0',
    period: 'free forever',
    features: [
      'Unlimited projects',
      'Up to 5 members',
      'Full Git integration',
      '100 AI credits/mo',
      'CLI + TUI access',
      'Community support',
    ],
    cta: { label: 'Get Started', to: '/sign-up', style: 'primary' as const },
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/month',
    badge: 'Coming Soon',
    highlight: true,
    features: [
      'Everything in OS',
      'Unlimited members',
      'Unlimited AI',
      'Advanced analytics',
      'SSO / SAML',
      'Priority support',
    ],
    cta: { label: 'Join Waitlist', to: '/coming-soon', style: 'ghost' as const },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'Custom SLA',
      'On-premise deploy',
      'SCIM provisioning',
      'Invoice billing',
    ],
    cta: { label: 'Contact Sales', to: '/contact', style: 'ghost' as const },
  },
]

const cardVariants: Variants = {
  rest: { borderColor: 'rgba(46, 46, 53, 1)', y: 0 },
  hover: { borderColor: 'rgba(249, 250, 251, 0.2)', y: -2 },
}

const highlightCardVariants: Variants = {
  rest: { borderColor: 'rgba(99, 102, 241, 0.6)', y: 0 },
  hover: { borderColor: 'rgba(99, 102, 241, 1)', y: -2 },
}

export default function PricingPreviewSection() {
  return (
    <section className="py-24 md:py-32 bg-[#050505] relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <span className="text-[#6B7280] text-xs font-mono uppercase tracking-wider inline-block mb-4">
            Pricing
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F9FAFB] mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-base text-[#6B7280] max-w-lg">
            Start free. Scale when you need to.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.5 }}
            >
              <motion.div
                variants={tier.highlight ? highlightCardVariants : cardVariants}
                initial="rest"
                whileHover="hover"
                className={`bg-[#111111] border-2 overflow-hidden flex flex-col h-full ${
                  tier.highlight ? 'border-[#6366F1]/60' : 'border-[#2E2E35]'
                }`}
              >
                <div className="p-6 md:p-8 flex flex-col flex-1">
                  {/* Name + Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
                      {tier.name}
                    </span>
                    {tier.badge && (
                      <span className="text-[10px] font-mono text-[#6366F1] uppercase tracking-wider border border-[#6366F1]/30 px-2 py-0.5">
                        {tier.badge}
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-[#F9FAFB]">
                      {tier.price}
                    </span>
                    <span className="text-sm text-[#6B7280] ml-1">
                      {tier.period}
                    </span>
                  </div>

                  {/* Features */}
                  <div className="space-y-2.5 mb-8 flex-1">
                    {tier.features.map((f) => (
                      <div key={f} className="flex items-start gap-2.5 text-xs font-mono">
                        <span className="text-[#F9FAFB] mt-px">+</span>
                        <span className="text-[#9CA3AF]">{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  {tier.cta.style === 'primary' ? (
                    <Link
                      to={tier.cta.to}
                      className="block w-full text-center bg-[#F9FAFB] text-[#050505] font-bold text-sm px-6 py-3"
                    >
                      {tier.cta.label}
                    </Link>
                  ) : (
                    <Link
                      to={tier.cta.to}
                      className="block w-full text-center text-[#9CA3AF] font-bold text-sm px-6 py-3 border border-[#2E2E35]"
                    >
                      {tier.cta.label}
                    </Link>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/pricing"
            className="text-xs font-mono text-[#6B7280] uppercase tracking-wider"
          >
            view full comparison →
          </Link>
        </div>
      </div>
    </section>
  )
}
