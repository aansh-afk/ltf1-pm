import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  HiCheck,
  HiX,
  HiCode,
  HiLightningBolt,
  HiCube,
  HiChip,
} from 'react-icons/hi'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const yearlyDiscount = 0.2

  const tiers = [
    {
      name: 'LOCALHOST',
      tagline: 'For side projects and testing',
      price: 0,
      minUsers: 1,
      maxUsers: 5,
      icon: HiCode,
      popular: false,
      enterprise: false,
      features: [
        { name: '3 projects maximum', included: true },
        { name: 'Up to 5 team members', included: true },
        { name: 'Basic Git integration', included: true },
        { name: '100 AI credits/month', included: true },
        { name: 'Commit → Task generation', included: true },
        { name: 'Community support', included: true },
        { name: '7-day activity history', included: true },
        { name: 'CSV export', included: true },
        { name: 'Unlimited projects', included: false },
        { name: 'Story point estimation', included: false },
        { name: 'PR descriptions', included: false },
        { name: 'Priority support', included: false },
      ]
    },
    {
      name: 'STARTUP',
      tagline: 'For growing teams that ship fast',
      price: 19,
      minUsers: 3,
      maxUsers: 50,
      icon: HiLightningBolt,
      popular: true,
      enterprise: false,
      features: [
        { name: 'Unlimited projects', included: true },
        { name: 'Full Git integration (GitHub/GitLab)', included: true },
        { name: '1,000 AI credits/user/month', included: true },
        { name: 'Commit → Task generation', included: true },
        { name: 'Story point estimation', included: true },
        { name: 'PR description generation', included: true },
        { name: 'Velocity tracking', included: true },
        { name: 'Sprint planning assistant', included: true },
        { name: 'Slack/Discord webhooks', included: true },
        { name: 'Email support (48h)', included: true },
        { name: 'API access', included: false },
        { name: 'SSO/SAML', included: false },
      ]
    },
    {
      name: 'SCALE',
      tagline: 'For teams building the future',
      price: 49,
      minUsers: 10,
      maxUsers: 500,
      icon: HiCube,
      popular: false,
      enterprise: false,
      features: [
        { name: '10,000 AI credits/user/month', included: true },
        { name: 'Everything in STARTUP', included: true },
        { name: 'API access with high limits', included: true },
        { name: 'SSO/SAML authentication', included: true },
        { name: 'BYOK (Bring Your Own Key)', included: true },
        { name: 'Release notes generation', included: true },
        { name: 'Advanced analytics', included: true },
        { name: 'Custom integrations', included: true },
        { name: 'Priority support (4h)', included: true },
        { name: 'Audit logs', included: true },
        { name: 'Role-based access control', included: true },
        { name: 'Data retention controls', included: true },
      ]
    },
    {
      name: 'ENTERPRISE',
      tagline: 'For organizations that need control',
      price: 99,
      minUsers: 50,
      maxUsers: null,
      icon: HiChip,
      popular: false,
      enterprise: true,
      features: [
        { name: 'Unlimited AI operations', included: true },
        { name: 'Everything in SCALE', included: true },
        { name: 'On-premise deployment option', included: true },
        { name: 'Custom contracts & SLA', included: true },
        { name: 'Dedicated support manager', included: true },
        { name: '24/7 phone & chat support', included: true },
        { name: 'Custom AI model fine-tuning', included: true },
        { name: 'Advanced security controls', included: true },
        { name: 'Compliance reports (SOC2, ISO)', included: true },
        { name: 'Executive dashboards', included: true },
        { name: 'Quarterly business reviews', included: true },
        { name: 'Training & onboarding', included: true },
      ]
    }
  ]

  const calculatePrice = (basePrice: number, minUsers: number) => {
    if (basePrice === 0) return 0
    const price = basePrice * (billingCycle === 'yearly' ? (1 - yearlyDiscount) : 1)
    return price * minUsers
  }

  return (
    <div className="min-h-screen bg-carbon-plate">
      <PublicNavigation />

      {/* HERO SECTION */}
      <section className="py-48px md:py-80px px-16px md:px-24px">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold mb-16px md:mb-24px"
          >
            <span className="text-cathode-white">PRICING THAT</span>{' '}
            <span className="text-brutal-info">MAKES SENSE</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-cathode-white/80 uppercase tracking-wider mb-32px md:mb-48px px-16px sm:px-0"
          >
            NO HIDDEN FEES. NO SEAT MINIMUMS. JUST TOOLS THAT WORK.
          </motion.p>

          {/* BILLING TOGGLE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-16px mb-64px"
          >
            <div className="flex items-center gap-16px md:gap-24px">
              <span
                className={`text-sm md:text-lg font-bold cursor-pointer ${billingCycle === 'monthly' ? 'text-brutal-info' : 'text-cathode-white/40'}`}
                onClick={() => setBillingCycle('monthly')}
              >
                MONTHLY
              </span>

              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-[80px] h-[40px] bg-[var(--theme-background-tertiary)] border-2 border-basalt-border cursor-pointer hover:border-cathode-white/30"
                aria-label="Toggle billing cycle"
                role="switch"
                aria-checked={billingCycle === 'yearly'}
              >
                <motion.div
                  className="absolute w-[36px] h-[36px] border-2 border-event-horizon"
                  initial={false}
                  animate={{
                    x: billingCycle === 'monthly' ? 0 : 40,
                    backgroundColor: billingCycle === 'monthly' ? '#FF2D78' : '#00FF00'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ top: '0px', left: '0px' }}
                />
              </button>

              <span
                className={`text-sm md:text-lg font-bold cursor-pointer ${billingCycle === 'yearly' ? 'text-brutal-success' : 'text-cathode-white/40'}`}
                onClick={() => setBillingCycle('yearly')}
              >
                YEARLY
              </span>
            </div>

            {billingCycle === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-brutal-success text-event-horizon px-16px py-8px font-bold text-sm border-2 border-event-horizon shadow-brutal-sm"
              >
                SAVE 20% WITH ANNUAL BILLING
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* PRICING TIERS */}
      <section className="px-16px md:px-24px pb-48px md:pb-80px">
        <div className="max-w-full md:max-w-6xl mx-auto">
          <div className="relative">
            <div className="flex lg:grid lg:grid-cols-4 gap-24px overflow-x-auto lg:overflow-x-visible pb-16px lg:pb-0 snap-x snap-mandatory lg:snap-none"
                 style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            {tiers.map((tier, index) => {
              const Icon = tier.icon

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`
                    snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto brutal-card p-32px relative
                    flex flex-col h-full
                    ${tier.popular ? 'border-4 border-brutal-info' : 'border-2 border-basalt-border'}
                    hover:border-cathode-white
                  `}
                >
                  {tier.popular && (
                    <div className="absolute -top-16px left-1/2 -translate-x-1/2">
                      <div className="bg-brutal-info text-event-horizon px-16px py-4px text-sm font-bold uppercase">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  <div className="mb-24px">
                    <Icon className="w-48px h-48px mx-auto text-brutal-info" />
                  </div>

                  <h3 className="text-2xl font-bold mb-8px text-cathode-white">
                    {tier.name}
                  </h3>

                  <p className="text-sm text-cathode-white/60 mb-24px">
                    {tier.tagline}
                  </p>

                  <div className="mb-24px">
                    {tier.price === 0 ? (
                      <div className="text-5xl font-bold text-brutal-info">FREE</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold text-cathode-white">
                          ${billingCycle === 'yearly' ? Math.floor(tier.price * (1 - yearlyDiscount)) : tier.price}
                        </div>
                        <div className="text-sm text-cathode-white/60 uppercase">
                          per user/month
                        </div>
                        <div className="text-sm text-brutal-info mt-8px">
                          {tier.minUsers}-{tier.maxUsers || '∞'} users
                        </div>
                        {tier.minUsers > 1 && (
                          <div className="text-sm text-cathode-white/40 mt-4px">
                            ${calculatePrice(tier.price, tier.minUsers)}/month minimum
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="space-y-12px mb-24px">
                    {tier.features.slice(0, 12).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-8px">
                        {feature.included ? (
                          <HiCheck className="w-20px h-20px text-brutal-success flex-shrink-0 mt-2px" />
                        ) : (
                          <HiX className="w-20px h-20px text-brutal-error flex-shrink-0 mt-2px" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-cathode-white' : 'text-cathode-white/40 line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-grow"></div>

                  <Link
                    to={tier.enterprise ? '/contact' : '/sign-up'}
                    className={`
                      brutal-btn w-full text-center block mt-auto
                      ${tier.popular ? 'bg-brutal-info text-event-horizon border-brutal-info' : ''}
                      ${tier.enterprise ? 'bg-brutal-info text-event-horizon border-brutal-info' : ''}
                    `}
                  >
                    {tier.enterprise ? 'CONTACT SALES' : tier.price === 0 ? 'START FREE' : 'START TRIAL'}
                  </Link>
                </motion.div>
              )
            })}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-24px bg-gradient-to-l from-carbon-plate to-transparent lg:hidden flex items-center justify-end pr-8px pointer-events-none">
              <div className="text-brutal-info text-xs animate-pulse">&rarr;</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI OPERATIONS */}
      <section className="py-80px border-t-2 border-basalt-border bg-event-horizon">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px">
          <h2 className="text-5xl font-bold text-center mb-48px text-cathode-white">
            WHAT&apos;S AN <span className="text-brutal-info">AI OPERATION?</span>
          </h2>

          <div className="flex md:grid md:grid-cols-2 gap-16px md:gap-24px mb-32px md:mb-48px overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
               style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-brutal-info">
                COUNTS AS 1 OPERATION:
              </h3>
              <ul className="space-y-8px text-cathode-white/80">
                <li>&bull; Generating task from commit</li>
                <li>&bull; Estimating story points</li>
                <li>&bull; Creating PR description</li>
                <li>&bull; Formatting commit message</li>
                <li>&bull; Calculating sprint velocity</li>
                <li>&bull; Generating subtasks</li>
              </ul>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-cathode-white/60">
                DOESN&apos;T COUNT:
              </h3>
              <ul className="space-y-8px text-cathode-white/80">
                <li>&bull; Viewing existing data</li>
                <li>&bull; Manual task creation</li>
                <li>&bull; Git webhook processing</li>
                <li>&bull; Slack notifications</li>
                <li>&bull; Basic calculations</li>
                <li>&bull; CSV exports</li>
              </ul>
            </div>
          </div>

          <div className="brutal-card p-32px text-center">
            <h3 className="text-2xl font-bold mb-16px text-cathode-white">
              TYPICAL USAGE
            </h3>
            <p className="text-cathode-white/80 mb-24px">
              Average developer: 10 commits/day + 5 PR descriptions + 10 story points = 25 AI credits/day<br/>
              Monthly: ~500 AI credits per developer
            </p>
            <p className="text-sm text-brutal-success">
              STARTUP tier (1,000 credits) = 2x headroom for power users
            </p>
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section className="py-80px">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px text-center">
          <h2 className="text-5xl font-bold mb-48px text-cathode-white">
            THE <span className="text-brutal-info">MATH</span>
          </h2>

          <div className="brutal-card p-48px">
            <div className="grid md:grid-cols-2 gap-24px md:gap-48px text-left">
              <div>
                <h3 className="text-2xl font-bold mb-24px text-brutal-error">WITHOUT LTF1</h3>
                <div className="space-y-16px text-cathode-white/80">
                  <div>Check Git &rarr; 1 min</div>
                  <div>Copy commit &rarr; 30 sec</div>
                  <div>Open Jira &rarr; 30 sec</div>
                  <div>Create task &rarr; 2 min</div>
                  <div>Estimate points &rarr; 5 min</div>
                  <div>Update sprint &rarr; 1 min</div>
                  <div className="pt-16px border-t-2 border-basalt-border">
                    <span className="text-brutal-error font-bold">TOTAL: 10 min &times; 10/day = 100 min/day</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-24px text-brutal-success">WITH LTF1</h3>
                <div className="space-y-16px text-cathode-white/80">
                  <div>Push code &rarr; 0 min</div>
                  <div>Auto-created &rarr; 0 min</div>
                  <div>Already there &rarr; 0 min</div>
                  <div>Auto-generated &rarr; 0 min</div>
                  <div>AI estimated &rarr; 0 min</div>
                  <div>Auto-updated &rarr; 0 min</div>
                  <div className="pt-16px border-t-2 border-basalt-border">
                    <span className="text-brutal-success font-bold">TOTAL: 0 minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-48px pt-32px border-t-2 border-basalt-border">
              <div className="text-3xl font-bold mb-16px text-cathode-white">
                100 min/day &times; 20 days = <span className="text-primary-brutalist">33 HOURS/MONTH SAVED</span>
              </div>
              <div className="text-xl text-cathode-white/80">
                33 hours &times; $100/hour = $3,300 value<br/>
                Cost: $19/month<br/>
                <span className="text-3xl font-bold text-brutal-success">ROI: 17,268%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-80px border-t-2 border-basalt-border bg-event-horizon">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px">
          <h2 className="text-5xl font-bold text-center mb-48px text-cathode-white">
            ACTUALLY USEFUL <span className="text-brutal-info">FAQ</span>
          </h2>

          <div className="space-y-24px">
            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-brutal-info">
                DOES IT ACTUALLY WORK WITH MY GIT WORKFLOW?
              </h3>
              <p className="text-cathode-white/80">
                Yes. We support GitHub, GitLab, and Bitbucket. Works with any branching strategy.
                Push to main, feature branches, or PRs - we track it all. No special setup required.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-cathode-white/60">
                WHAT IF I RUN OUT OF AI OPERATIONS?
              </h3>
              <p className="text-cathode-white/80">
                Everything else keeps working - Git integration, task management, sprints.
                You just lose AI features (auto-generation, estimates) until next month.
                Or upgrade/add more operations anytime.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-cathode-white/60">
                CAN I USE MY OWN GEMINI API KEY?
              </h3>
              <p className="text-cathode-white/80">
                Yes, on SCALE tier and above. Bring Your Own Key (BYOK) means unlimited AI operations
                using your own Google Cloud account. We just orchestrate the calls.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-cathode-white/60">
                HOW IS THIS DIFFERENT FROM JIRA/LINEAR/MONDAY?
              </h3>
              <p className="text-cathode-white/80">
                Those tools don&apos;t understand code. We watch your Git repo and automatically
                create/update tasks from your actual work. No double-entry. No &ldquo;updating the board.&rdquo;
                Your code IS the source of truth.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
