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
  HiGlobe
} from 'react-icons/hi'
import PublicNavigation from '../components/common/PublicNavigation'

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const yearlyDiscount = 0.2 // 20% discount for yearly

  const tiers = [
    {
      name: 'LOCALHOST',
      tagline: 'For side projects and testing',
      price: 0,
      minUsers: 1,
      maxUsers: 5,
      icon: HiCode,
      color: '#00FFFF',
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
      color: '#FFFF00',
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
      color: '#FF00FF',
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
      color: 'linear-gradient(45deg, #00FFFF 0%, #FF00FF 50%, #FFFF00 100%)',
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* NAVIGATION */}
      <PublicNavigation currentPage="pricing" />

      {/* HERO SECTION */}
      <section className="py-48px md:py-80px px-16px md:px-24px">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-bold mb-16px md:mb-24px"
          >
            <span className="text-[#FFFFFF]">PRICING THAT</span>{' '}
            <span className="glitch-text">MAKES SENSE</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl md:text-2xl text-[#FFFFFF]/80 uppercase tracking-wider mb-32px md:mb-48px px-16px sm:px-0"
          >
            NO HIDDEN FEES. NO SEAT MINIMUMS.<br className="sm:hidden" /> JUST TOOLS THAT WORK.
          </motion.p>

          {/* BILLING TOGGLE */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-16px mb-64px"
          >
            {/* Toggle Switch Container */}
            <div className="flex items-center gap-16px md:gap-24px">
              {/* Monthly Label */}
              <span 
                className={`text-sm md:text-lg font-bold transition-colors cursor-pointer ${billingCycle === 'monthly' ? 'text-[#00FFFF]' : 'text-[#FFFFFF]/40'}`}
                onClick={() => setBillingCycle('monthly')}
              >
                MONTHLY
              </span>
              
              {/* Toggle Switch */}
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-[80px] h-[40px] bg-[#1A1A1A] border-2 border-[#333333] cursor-pointer hover:border-[#555555] transition-colors"
                aria-label="Toggle billing cycle"
                role="switch"
                aria-checked={billingCycle === 'yearly'}
              >
                {/* Sliding Thumb */}
                <motion.div
                  className="absolute w-[36px] h-[36px] bg-[#00FFFF] border-2 border-[#000000]"
                  initial={false}
                  animate={{
                    x: billingCycle === 'monthly' ? 0 : 40,
                    backgroundColor: billingCycle === 'monthly' ? '#00FFFF' : '#00FF00'
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ top: '0px', left: '0px' }}
                />
              </button>
              
              {/* Yearly Label */}
              <span 
                className={`text-sm md:text-lg font-bold transition-colors cursor-pointer ${billingCycle === 'yearly' ? 'text-[#00FF00]' : 'text-[#FFFFFF]/40'}`}
                onClick={() => setBillingCycle('yearly')}
              >
                YEARLY
              </span>
            </div>
            
            {/* Save Badge */}
            {billingCycle === 'yearly' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#00FF00] text-[#000000] px-16px py-8px font-bold text-sm border-2 border-[#000000] shadow-[3px_3px_0px_#000000]"
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
              const isGradient = tier.color.includes('gradient')
              
              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`
                    snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto brutal-card p-32px relative
                    flex flex-col h-full
                    ${tier.popular ? 'border-4 border-[#00FF00]' : 'border-2 border-[#333333]'}
                    hover:border-[#FFFFFF] transition-none
                  `}
                >
                  {/* POPULAR BADGE */}
                  {tier.popular && (
                    <div className="absolute -top-16px left-1/2 -translate-x-1/2">
                      <div className="bg-[#00FF00] text-[#000000] px-16px py-4px text-sm font-bold uppercase">
                        MOST POPULAR
                      </div>
                    </div>
                  )}

                  {/* TIER ICON */}
                  <div className="mb-24px">
                    <Icon
                      className="w-48px h-48px mx-auto"
                      style={{
                        color: isGradient ? undefined : tier.color,
                        background: isGradient ? tier.color : undefined,
                        WebkitBackgroundClip: isGradient ? 'text' : undefined,
                        WebkitTextFillColor: isGradient ? 'transparent' : undefined,
                      }}
                    />
                  </div>

                  {/* TIER NAME */}
                  <h3 className="text-2xl font-bold mb-8px text-[#FFFFFF]">
                    {tier.name}
                  </h3>

                  {/* TAGLINE */}
                  <p className="text-sm text-[#FFFFFF]/60 mb-24px">
                    {tier.tagline}
                  </p>

                  {/* PRICE */}
                  <div className="mb-24px">
                    {tier.price === 0 ? (
                      <div className="text-5xl font-bold text-[#00FFFF]">FREE</div>
                    ) : (
                      <>
                        <div className="text-5xl font-bold text-[#FFFFFF]">
                          ${billingCycle === 'yearly' ? Math.floor(tier.price * (1 - yearlyDiscount)) : tier.price}
                        </div>
                        <div className="text-sm text-[#FFFFFF]/60 uppercase">
                          per user/month
                        </div>
                        <div className="text-sm text-[#FFFF00] mt-8px">
                          {tier.minUsers}-{tier.maxUsers || '∞'} users
                        </div>
                        {tier.minUsers > 1 && (
                          <div className="text-sm text-[#FF00FF] mt-4px">
                            ${calculatePrice(tier.price, tier.minUsers)}/month minimum
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* FEATURES */}
                  <div className="space-y-12px mb-24px">
                    {tier.features.slice(0, 12).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-8px">
                        {feature.included ? (
                          <HiCheck className="w-20px h-20px text-[#00FF00] flex-shrink-0 mt-2px" />
                        ) : (
                          <HiX className="w-20px h-20px text-[#FF0000] flex-shrink-0 mt-2px" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-[#FFFFFF]' : 'text-[#FFFFFF]/40 line-through'}`}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* SPACER - Pushes button to bottom */}
                  <div className="flex-grow"></div>

                  {/* CTA BUTTON - Now at bottom */}
                  <Link
                    to={tier.enterprise ? '/contact' : '/sign-up'}
                    className={`
                      brutal-btn w-full text-center block mt-auto
                      ${tier.popular ? 'bg-[#00FF00] text-[#000000]' : ''}
                      ${tier.enterprise ? 'bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000]' : ''}
                    `}
                  >
                    {tier.enterprise ? 'CONTACT SALES' : tier.price === 0 ? 'START FREE' : 'START TRIAL'}
                  </Link>
                </motion.div>
              )
            })}
            </div>
            {/* Scroll Indicator for Pricing Tiers */}
            <div className="absolute right-0 top-0 bottom-0 w-24px bg-gradient-to-l from-[#0A0A0A] to-transparent lg:hidden flex items-center justify-end pr-8px pointer-events-none">
              <div className="text-[#00FFFF] text-xs animate-pulse">→</div>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IS AN AI OPERATION? */}
      <section className="py-80px border-t-2 border-[#333333] bg-[#000000]">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px">
          <h2 className="text-5xl font-bold text-center mb-48px">
            WHAT'S AN <span className="glitch-text">AI OPERATION?</span>
          </h2>

          <div className="flex md:grid md:grid-cols-2 gap-16px md:gap-24px mb-32px md:mb-48px overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none"
               style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#00FFFF]">
                COUNTS AS 1 OPERATION:
              </h3>
              <ul className="space-y-8px text-[#FFFFFF]/80">
                <li>• Generating task from commit</li>
                <li>• Estimating story points</li>
                <li>• Creating PR description</li>
                <li>• Formatting commit message</li>
                <li>• Calculating sprint velocity</li>
                <li>• Generating subtasks</li>
              </ul>
            </div>

            <div className="snap-start flex-shrink-0 md:flex-shrink-auto w-[85vw] md:w-auto brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#FF00FF]">
                DOESN'T COUNT:
              </h3>
              <ul className="space-y-8px text-[#FFFFFF]/80">
                <li>• Viewing existing data</li>
                <li>• Manual task creation</li>
                <li>• Git webhook processing</li>
                <li>• Slack notifications</li>
                <li>• Basic calculations</li>
                <li>• CSV exports</li>
              </ul>
            </div>
          </div>

          <div className="brutal-card p-32px text-center">
            <h3 className="text-2xl font-bold mb-16px text-[#FFFF00]">
              TYPICAL USAGE
            </h3>
            <p className="text-[#FFFFFF]/80 mb-24px">
              Average developer: 10 commits/day + 5 PR descriptions + 10 story points = 25 AI credits/day<br/>
              Monthly: ~500 AI credits per developer
            </p>
            <p className="text-sm text-[#00FF00]">
              STARTUP tier (1,000 credits) = 2x headroom for power users
            </p>
            <p className="text-xs text-[#00FFFF] mt-16px">
              Powered by GPT-OSS-120B via OpenRouter - 67% cheaper than alternatives
            </p>
          </div>
        </div>
      </section>

      {/* ROI CALCULATOR */}
      <section className="py-80px">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px text-center">
          <h2 className="text-5xl font-bold mb-48px">
            THE <span className="glitch-text">MATH</span>
          </h2>

          <div className="brutal-card p-48px">
            <div className="grid md:grid-cols-2 gap-24px md:gap-48px text-left">
              <div>
                <h3 className="text-2xl font-bold mb-24px text-[#FF0000]">WITHOUT LTF1</h3>
                <div className="space-y-16px text-[#FFFFFF]/80">
                  <div>Check Git → 1 min</div>
                  <div>Copy commit → 30 sec</div>
                  <div>Open Jira → 30 sec</div>
                  <div>Create task → 2 min</div>
                  <div>Estimate points → 5 min</div>
                  <div>Update sprint → 1 min</div>
                  <div className="pt-16px border-t-2 border-[#333333]">
                    <span className="text-[#FF0000] font-bold">TOTAL: 10 min × 10/day = 100 min/day</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-24px text-[#00FF00]">WITH LTF1</h3>
                <div className="space-y-16px text-[#FFFFFF]/80">
                  <div>Push code → 0 min</div>
                  <div>Auto-created → 0 min</div>
                  <div>Already there → 0 min</div>
                  <div>Auto-generated → 0 min</div>
                  <div>AI estimated → 0 min</div>
                  <div>Auto-updated → 0 min</div>
                  <div className="pt-16px border-t-2 border-[#333333]">
                    <span className="text-[#00FF00] font-bold">TOTAL: 0 minutes</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-48px pt-32px border-t-2 border-[#333333]">
              <div className="text-3xl font-bold mb-16px">
                100 min/day × 20 days = <span className="text-[#FFFF00]">33 HOURS/MONTH SAVED</span>
              </div>
              <div className="text-xl text-[#FFFFFF]/80">
                33 hours × $100/hour = $3,300 value<br/>
                Cost: $19/month<br/>
                <span className="text-3xl font-bold text-[#00FF00]">ROI: 17,268%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-80px border-t-2 border-[#333333] bg-[#000000]">
        <div className="max-w-full md:max-w-4xl mx-auto px-16px md:px-24px">
          <h2 className="text-5xl font-bold text-center mb-48px">
            ACTUALLY USEFUL <span className="glitch-text">FAQ</span>
          </h2>

          <div className="space-y-24px">
            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#00FFFF]">
                DOES IT ACTUALLY WORK WITH MY GIT WORKFLOW?
              </h3>
              <p className="text-[#FFFFFF]/80">
                Yes. We support GitHub, GitLab, and Bitbucket. Works with any branching strategy. 
                Push to main, feature branches, or PRs - we track it all. No special setup required.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#FF00FF]">
                WHAT IF I RUN OUT OF AI OPERATIONS?
              </h3>
              <p className="text-[#FFFFFF]/80">
                Everything else keeps working - Git integration, task management, sprints. 
                You just lose AI features (auto-generation, estimates) until next month. 
                Or upgrade/add more operations anytime.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#FFFF00]">
                CAN I USE MY OWN GEMINI API KEY?
              </h3>
              <p className="text-[#FFFFFF]/80">
                Yes, on SCALE tier and above. Bring Your Own Key (BYOK) means unlimited AI operations 
                using your own Google Cloud account. We just orchestrate the calls.
              </p>
            </div>

            <div className="brutal-card p-32px">
              <h3 className="text-xl font-bold mb-16px text-[#00FF00]">
                HOW IS THIS DIFFERENT FROM JIRA/LINEAR/MONDAY?
              </h3>
              <p className="text-[#FFFFFF]/80">
                Those tools don't understand code. We watch your Git repo and automatically 
                create/update tasks from your actual work. No double-entry. No "updating the board."
                Your code IS the source of truth.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}