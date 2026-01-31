import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const tiers = [
  {
    name: 'LOCALHOST',
    price: 'FREE',
    users: '1-5 USERS',
    highlights: ['3 PROJECTS', '100 AI CREDITS/MO', 'BASIC GIT SYNC'],
  },
  {
    name: 'STARTUP',
    price: '$19',
    priceUnit: '/USER',
    users: '3-50 USERS',
    highlights: ['UNLIMITED PROJECTS', '1K AI CREDITS', 'SPRINT PLANNING'],
    popular: true,
  },
  {
    name: 'SCALE',
    price: '$49',
    priceUnit: '/USER',
    users: '10-500 USERS',
    highlights: ['10K AI CREDITS', 'API ACCESS', 'SSO/SAML'],
  },
  {
    name: 'ENTERPRISE',
    price: '$99',
    priceUnit: '/USER',
    users: '50+ USERS',
    highlights: ['UNLIMITED AI', 'ON-PREMISE', '24/7 SUPPORT'],
  },
]

export default function PricingPreviewSection() {
  return (
    <section className="marketing-section bg-carbon-plate">
      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-48px md:mb-64px"
        >
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">&gt;&gt;</span>
            PRICING
          </p>
          <h2 className="text-section-title md:text-hero-sm font-bold uppercase text-cathode-white">
            SIMPLE. TRANSPARENT.
          </h2>
        </motion.div>

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="flex lg:grid lg:grid-cols-4 gap-16px overflow-x-auto lg:overflow-x-visible pb-16px lg:pb-0 snap-x snap-mandatory lg:snap-none max-w-4xl mx-auto mb-48px"
             style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={`snap-start flex-shrink-0 lg:flex-shrink-auto w-[220px] lg:w-auto border-2 bg-event-horizon p-24px text-center relative group hover:border-brutal-info ${
                tier.popular
                  ? 'border-brutal-info'
                  : 'border-basalt-border'
              }`}
            >
              {/* Subtle corner mark */}
              <span aria-hidden="true" className="absolute top-8px right-12px text-brutal-info/15 font-mono text-[10px] select-none group-hover:text-brutal-info/30">//</span>

              {tier.popular && (
                <div className="absolute -top-12px left-1/2 -translate-x-1/2 bg-brutal-info text-event-horizon px-12px py-2px text-xs font-bold uppercase">
                  POPULAR
                </div>
              )}
              <h3 className="text-sm font-bold text-cathode-white mb-12px">{tier.name}</h3>
              <div className="text-2xl font-bold text-cathode-white mb-2px">
                {tier.price === 'FREE' ? (
                  <span className="text-brutal-info">{tier.price}</span>
                ) : (
                  <>{tier.price}<span className="text-sm text-cathode-white/40">{tier.priceUnit}</span></>
                )}
              </div>
              <p className="text-xs text-cathode-white/40 mb-16px">{tier.users}</p>
              <ul className="space-y-4px text-left">
                {tier.highlights.map((h) => (
                  <li key={h} className="text-xs text-cathode-white/60">
                    &bull; {h}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/pricing" className="marketing-cta">
            VIEW ALL FEATURES &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
