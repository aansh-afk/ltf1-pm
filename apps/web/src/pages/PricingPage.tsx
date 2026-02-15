import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import posthog from 'posthog-js'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import { usePageTitle } from '../hooks/usePageTitle'

/* ─── Tier Data ─────────────────────────────────────────────── */

interface Tier {
  name: string
  price: string
  period: string
  highlight?: boolean
  badge?: string
  features: string[]
  cta: { label: string; to: string; style: 'primary' | 'ghost' | 'disabled' }
}

const tiers: Tier[] = [
  {
    name: 'Open Source',
    price: '$0',
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
    cta: { label: 'Get Started', to: '/sign-up', style: 'primary' },
  },
  {
    name: 'Pro',
    price: '$12',
    period: '/user/month',
    badge: 'Coming Soon',
    highlight: true,
    features: [
      'Everything in Open Source',
      'Unlimited team members',
      'Unlimited AI credits',
      'Advanced analytics',
      'SSO / SAML',
      'Priority support (48h)',
      'Audit logs',
      'Data retention controls',
    ],
    cta: { label: 'Join Waitlist', to: '/coming-soon', style: 'ghost' },
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: [
      'Everything in Pro',
      'Unlimited everything',
      'Dedicated support',
      'Custom SLA',
      'On-premise deployment',
      'Advanced security',
      'Custom integrations',
      'Invoice billing',
    ],
    cta: { label: 'Contact Sales', to: '/contact', style: 'ghost' },
  },
]

/* ─── Feature Comparison Data ───────────────────────────────── */

interface ComparisonRow {
  feature: string
  open: string | boolean
  pro: string | boolean
  enterprise: string | boolean
}

interface ComparisonCategory {
  name: string
  rows: ComparisonRow[]
}

const comparison: ComparisonCategory[] = [
  {
    name: 'Core Features',
    rows: [
      { feature: 'Projects', open: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Team members', open: 'Up to 5', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Tasks & issues', open: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Sprint management', open: true, pro: true, enterprise: true },
      { feature: 'Whiteboard', open: true, pro: true, enterprise: true },
      { feature: 'Custom fields', open: true, pro: true, enterprise: true },
      { feature: 'Import & export', open: true, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Git Integration',
    rows: [
      { feature: 'GitHub sync', open: true, pro: true, enterprise: true },
      { feature: 'GitLab sync', open: true, pro: true, enterprise: true },
      { feature: 'Bitbucket sync', open: true, pro: true, enterprise: true },
      { feature: 'PR-driven updates', open: true, pro: true, enterprise: true },
      { feature: 'Branch tracking', open: true, pro: true, enterprise: true },
      { feature: 'Custom webhooks', open: false, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Integrations',
    rows: [
      { feature: 'Slack notifications', open: true, pro: true, enterprise: true },
      { feature: 'Discord notifications', open: true, pro: true, enterprise: true },
      { feature: 'Email digests', open: true, pro: true, enterprise: true },
      { feature: 'Custom webhooks', open: false, pro: true, enterprise: true },
      { feature: 'API access', open: true, pro: true, enterprise: true },
    ],
  },
  {
    name: 'AI & Intelligence',
    rows: [
      { feature: 'AI credits', open: '100/month', pro: 'Unlimited', enterprise: 'Unlimited' },
      { feature: 'Code complexity estimates', open: true, pro: true, enterprise: true },
      { feature: 'Tech debt surfacing', open: false, pro: true, enterprise: true },
      { feature: 'Sprint suggestions', open: false, pro: true, enterprise: true },
      { feature: 'BYOK (Bring Your Own Key)', open: false, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Analytics & Reporting',
    rows: [
      { feature: 'Git-based velocity', open: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Team dashboards', open: true, pro: true, enterprise: true },
      { feature: 'Cycle time metrics', open: false, pro: true, enterprise: true },
      { feature: 'Custom reports', open: false, pro: true, enterprise: true },
      { feature: 'Data warehouse sync', open: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Team Management',
    rows: [
      { feature: 'Workload visibility', open: true, pro: true, enterprise: true },
      { feature: 'Role-based access', open: 'Basic', pro: 'Advanced', enterprise: 'Advanced' },
      { feature: 'Private teams', open: false, pro: true, enterprise: true },
      { feature: 'Guest accounts', open: false, pro: true, enterprise: true },
    ],
  },
  {
    name: 'Security & Compliance',
    rows: [
      { feature: 'SOC 2 Type II', open: false, pro: true, enterprise: true },
      { feature: 'SSO / SAML', open: false, pro: true, enterprise: true },
      { feature: 'Audit logs', open: false, pro: true, enterprise: true },
      { feature: 'Data retention controls', open: false, pro: true, enterprise: true },
      { feature: 'On-premise deployment', open: false, pro: false, enterprise: true },
      { feature: 'SCIM provisioning', open: false, pro: false, enterprise: true },
    ],
  },
  {
    name: 'Support',
    rows: [
      { feature: 'Community support', open: true, pro: true, enterprise: true },
      { feature: 'Priority support', open: false, pro: '48h SLA', enterprise: '4h SLA' },
      { feature: 'Dedicated account manager', open: false, pro: false, enterprise: true },
      { feature: 'Custom SLA', open: false, pro: false, enterprise: true },
      { feature: 'Onboarding assistance', open: false, pro: false, enterprise: true },
    ],
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

/* ─── Cell Renderer ─────────────────────────────────────────── */

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <span className="text-[#F9FAFB]">+</span>
  if (value === false) return <span className="text-[#2E2E35]">-</span>
  return <span className="text-[#9CA3AF]">{value}</span>
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
          <motion.div
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
            <p className="text-lg text-[#6B7280] max-w-xl mx-auto">
              Start free with the open source plan. Upgrade for
              advanced analytics, security, and priority support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tier Cards */}
      <section className="pb-14 md:pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map((tier, i) => (
              <motion.div
                key={tier.name}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <motion.div
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
                        <span className="text-[10px] font-mono text-[#6366F1] uppercase tracking-wider border border-[#6366F1]/30 px-2 py-0.5">
                          {tier.badge}
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="mb-3">
                      <span className="text-4xl font-bold text-[#F9FAFB]">
                        {tier.price}
                      </span>
                      <span className="text-sm text-[#6B7280] ml-1">
                        {tier.period}
                      </span>
                    </div>

                    {/* Features */}
                    <div className="space-y-2.5 mb-4 flex-1">
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
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="pb-14 md:pb-20">
        <div className="max-w-5xl mx-auto px-4">
          {/* Sticky header row */}
          <div className="border-b-2 border-[#2E2E35] pb-4 mb-0 sticky top-0 bg-[#050505] z-20 pt-4">
            <div className="grid grid-cols-4 gap-4">
              <div />
              {tiers.map((t) => (
                <div key={t.name} className="text-xs font-mono text-[#6B7280] uppercase tracking-wider">
                  {t.name}
                </div>
              ))}
            </div>
          </div>

          {/* Categories */}
          {comparison.map((cat, catIdx) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.4, delay: catIdx * 0.04 }}
            >
              {/* Category header */}
              <div className="pt-10 pb-4 border-b border-[#2E2E35]">
                <span className="text-sm font-bold text-[#F9FAFB]">
                  {cat.name}
                </span>
              </div>

              {/* Rows */}
              {cat.rows.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-4 gap-4 py-3 border-b border-[#2E2E35]/50 text-xs font-mono"
                >
                  <div className="text-[#9CA3AF]">{row.feature}</div>
                  <div><CellValue value={row.open} /></div>
                  <div><CellValue value={row.pro} /></div>
                  <div><CellValue value={row.enterprise} /></div>
                </div>
              ))}
            </motion.div>
          ))}

          {/* Bottom CTA row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {tiers.map((t) => (
              <div key={t.name}>
                {t.cta.style === 'primary' ? (
                  <Link
                    to={t.cta.to}
                    className="block w-full text-center bg-[#F9FAFB] text-[#050505] font-bold text-xs px-4 py-2.5"
                  >
                    {t.cta.label}
                  </Link>
                ) : (
                  <Link
                    to={t.cta.to}
                    className="block w-full text-center text-[#9CA3AF] font-bold text-xs px-4 py-2.5 border border-[#2E2E35]"
                  >
                    {t.cta.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-12 md:py-16 border-t border-[#2E2E35]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#F9FAFB] mb-4">
              Ship faster. Track smarter.
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/contact"
                className="text-[#9CA3AF] font-bold text-sm px-6 py-3 border border-[#2E2E35]"
              >
                Contact Sales
              </Link>
              <Link
                to="/sign-up"
                className="bg-[#F9FAFB] text-[#050505] font-bold text-sm px-6 py-3"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
