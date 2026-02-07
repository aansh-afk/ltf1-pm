import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'

interface Feature {
  slug: string
  icon: string
  title: string
  description: string
  stat: string
  statLabel: string
  color: string
}

const features: Feature[] = [
  {
    slug: 'pr-driven-updates',
    icon: '~>',
    title: 'PR-Driven Updates',
    description: 'Push code and tasks update themselves. Branch, review, merge — every git event moves your board automatically.',
    stat: '0',
    statLabel: 'manual updates needed',
    color: '#22C55E',
  },
  {
    slug: 'git-based-velocity',
    icon: '/>',
    title: 'Git-Based Velocity',
    description: 'Velocity from commits, PRs, and deploys — not story point guesses. See exactly how fast your team ships.',
    stat: '23%',
    statLabel: 'faster cycle times',
    color: '#8B5CF6',
  },
  {
    slug: 'code-complexity-estimates',
    icon: '##',
    title: 'AI Estimates',
    description: 'Story points estimated from actual code diffs and complexity analysis. No more planning poker debates.',
    stat: '94%',
    statLabel: 'estimation accuracy',
    color: '#F59E0B',
  },
]

const rowVariants: Variants = {
  rest: { borderColor: 'rgba(46, 46, 53, 1)' },
  hover: { borderColor: 'rgba(99, 102, 241, 0.4)' },
}

const arrowVariants: Variants = {
  rest: { x: 0, opacity: 0.4 },
  hover: { x: 6, opacity: 1 },
}

export default function FeaturesPreviewSection() {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#050505]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span className="text-[#9CA3AF] text-xs font-mono font-semibold uppercase tracking-wider inline-block mb-4">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F9FAFB]">
              Built for how developers
              <br />
              actually work
            </h2>
          </div>
          <Link
            to="/features"
            className="text-sm font-mono text-[#9CA3AF] hover:text-[#F9FAFB] border border-[#2E2E35] hover:border-[#6366F1] px-5 py-2.5 shrink-0 self-start md:self-auto transition-colors duration-200"
          >
            View all features &rarr;
          </Link>
        </motion.div>

        {/* Feature rows */}
        <div className="flex flex-col gap-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link to={`/features/${feature.slug}`} className="block">
                <motion.div
                  variants={rowVariants}
                  initial="rest"
                  whileHover="hover"
                  className="border-2 border-[#2E2E35] bg-[#0A0A0A] p-5 md:p-6 flex items-center gap-5 md:gap-8 cursor-pointer"
                >
                  {/* Icon */}
                  <div
                    className="w-12 h-12 flex items-center justify-center border-2 shrink-0 font-mono text-sm font-bold"
                    style={{ borderColor: feature.color, color: feature.color }}
                  >
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base md:text-lg font-bold text-[#F9FAFB] mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                      {feature.description}
                    </p>
                  </div>

                  {/* Stat */}
                  <div className="hidden sm:block text-right shrink-0 pl-4">
                    <span
                      className="text-2xl md:text-3xl font-bold font-mono"
                      style={{ color: feature.color }}
                    >
                      {feature.stat}
                    </span>
                    <p className="text-[11px] text-[#6B7280] font-mono mt-0.5">
                      {feature.statLabel}
                    </p>
                  </div>

                  {/* Arrow */}
                  <motion.span
                    variants={arrowVariants}
                    className="text-[#F9FAFB] text-xl shrink-0 hidden md:block"
                  >
                    &rarr;
                  </motion.span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
