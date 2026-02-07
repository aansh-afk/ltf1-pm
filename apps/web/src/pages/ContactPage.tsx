import { motion, type Variants } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'

/* ─── Card Data ─────────────────────────────────────────────── */

interface ContactCard {
  icon: string
  title: string
  description: string
  linkLabel: string
  href: string
  external?: boolean
}

const primaryCards: ContactCard[] = [
  {
    icon: '◇',
    title: 'Sales',
    description: 'Speak to our team about plans, pricing, enterprise contracts, or request a demo.',
    linkLabel: 'Talk to sales',
    href: 'mailto:Aansh.Naidu@vividverseglobal.com?subject=Sales%20Inquiry',
    external: false,
  },
  {
    icon: '○',
    title: 'Help & support',
    description: 'Ask product questions, report problems, or leave feedback.',
    linkLabel: 'Contact support',
    href: 'mailto:Aansh.Naidu@vividverseglobal.com?subject=Support%20Request',
    external: false,
  },
]

const secondaryCards: ContactCard[] = [
  {
    icon: '#',
    title: 'Join the community',
    description: 'Connect with other LTF1 users, share workflows, and get help from the community.',
    linkLabel: 'Join Discord',
    href: 'https://discord.gg/ltf1',
    external: true,
  },
  {
    icon: '@',
    title: 'General communication',
    description: 'For other queries, please get in touch with us via email.',
    linkLabel: 'Aansh.Naidu@vividverseglobal.com',
    href: 'mailto:Aansh.Naidu@vividverseglobal.com',
    external: false,
  },
  {
    icon: '>',
    title: 'Documentation',
    description: 'Get an overview of LTF1\'s features, integrations, and how to use them.',
    linkLabel: 'View docs',
    href: '/coming-soon',
    external: false,
  },
  {
    icon: '{',
    title: 'Open Source',
    description: 'Explore the source, contribute, or report issues on GitHub.',
    linkLabel: 'GitHub',
    href: 'https://github.com/ltf1',
    external: true,
  },
]

/* ─── Animations ────────────────────────────────────────────── */

const cardVariants: Variants = {
  rest: { borderColor: 'rgba(46, 46, 53, 1)', y: 0 },
  hover: { borderColor: 'rgba(249, 250, 251, 0.2)', y: -2 },
}

const arrowVariants: Variants = {
  rest: { x: 0, opacity: 0.5 },
  hover: { x: 4, opacity: 1 },
}

/* ─── Component ─────────────────────────────────────────────── */

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#050505]">
      <PublicNavigation />

      {/* Hero */}
      <section className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#F9FAFB] mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-[#6B7280] max-w-lg mx-auto">
              Get in touch with our sales and support teams for demos,
              onboarding support, or product questions.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Primary Cards — Sales & Support */}
      <section className="pb-16 md:pb-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {primaryCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <motion.div
                  variants={cardVariants}
                  initial="rest"
                  whileHover="hover"
                  className="bg-[#111111] border-2 border-[#2E2E35] p-8 md:p-10 flex flex-col h-full"
                >
                  {/* Icon + Title */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-[#6B7280] text-lg font-mono">{card.icon}</span>
                    <h2 className="text-xl font-bold text-[#F9FAFB]">
                      {card.title}
                    </h2>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-[#9CA3AF] leading-relaxed mb-6 flex-1">
                    {card.description}
                  </p>

                  {/* CTA */}
                  <a
                    href={card.href}
                    target={card.external ? '_blank' : undefined}
                    rel={card.external ? 'noopener noreferrer' : undefined}
                    className="inline-flex items-center gap-2 text-sm font-bold text-[#050505] bg-[#F9FAFB] px-5 py-2.5 w-fit"
                  >
                    {card.linkLabel}
                    <motion.span variants={arrowVariants}>
                      {card.external ? '↗' : '→'}
                    </motion.span>
                  </a>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary Cards — Community, Email, Docs, GitHub */}
      <section className="pb-24 md:pb-32">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
            {secondaryCards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <h3 className="text-base font-bold text-[#F9FAFB] mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed mb-3">
                  {card.description}
                </p>
                <a
                  href={card.href}
                  target={card.external ? '_blank' : undefined}
                  rel={card.external ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center gap-1.5 text-sm font-mono text-[#9CA3AF]"
                >
                  {card.linkLabel}
                  <span className="text-xs">{card.external ? '↗' : '→'}</span>
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Status Line */}
      <section className="pb-16 md:pb-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 text-xs font-mono text-[#6B7280]">
            <span className="w-2 h-2 bg-[#10B981]" />
            All systems operational
          </span>
        </div>
      </section>

      <Footer />
    </div>
  )
}
