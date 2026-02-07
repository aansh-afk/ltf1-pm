import { Link } from 'react-router-dom'
import { motion, type Variants } from 'framer-motion'
import ColoredPre from '../ascii/ColoredPre'

interface FeatureCard {
  slug: string
  category: string
  categoryColor: string
  title: string
  description: string
  ascii: string
  fullWidth: boolean
}

const cards: FeatureCard[] = [
  {
    slug: 'pr-driven-updates',
    category: 'Git Integration',
    categoryColor: '#22C55E',
    title: 'PR-Driven Updates',
    description: 'Tasks update themselves when you push, review, or merge.',
    fullWidth: true,
    ascii: [
      '  {g:$ git push origin feat/auth-flow}',
      '  ',
      '  +-- {w:PR #142} opened -------------------------+',
      '  |                                            |',
      '  |  {c:3 tasks linked}        {p:<- auto}            |',
      '  |  {c:status: IN REVIEW}     {p:<- auto}            |',
      '  |  {g:2 approvals, checks passing}               |',
      '  |  {g:merged -> main}                            |',
      '  |  {g:3 tasks moved to DONE} {p:<- auto}            |',
      '  +--------------------------------------------+',
    ].join('\n'),
  },
  {
    slug: 'git-based-velocity',
    category: 'Analytics',
    categoryColor: '#8B5CF6',
    title: 'Git-Based Velocity',
    description: 'Velocity from shipping data, not story point guesses.',
    fullWidth: true,
    ascii: [
      '  {w:velocity} ------------------- {c:last 14 days} -------------------',
      '  |',
      '  |  commits    [{g:====================}..........] {p:82}  {g:+ 12%}',
      '  |  merged     [{g:================}..............] {p:47}  {g:+ 23%}',
      '  |  deployed   [{g:==============}................] {p:31}  {g:+  8%}',
      '  |  reverted   [{r:=}.............................}  {p:2}  {r:- 50%}',
      '  |',
      '  |  {w:cycle time} -------------------------------------------',
      '  |  |  PR open -> merge    avg {p:4.2h}   [{g:==}....] {g: good}',
      '  |  |  merge -> deploy     avg {p:1.1h}   [{g:=}.....]  {g:great}',
      '  |  |  deploy -> rollback  avg {p:0.3%}   [......] {g: excellent}',
      '  |',
      '  |  {w:trend: shipping 23% faster than last sprint}',
      '  +--------------------------------------------------------',
    ].join('\n'),
  },
  {
    slug: 'code-complexity-estimates',
    category: 'Intelligence',
    categoryColor: '#F59E0B',
    title: 'Code Complexity Estimates',
    description: 'AI estimates points from actual diffs.',
    fullWidth: false,
    ascii: [
      '  {w:diff --stat} ---------------',
      '  |',
      '  |  {w:auth.ts}     {g:+142}  {r:-38}',
      '  |  {w:db.ts}        {g:+67}  {r:-12}',
      '  |  {w:routes.ts}    {g:+23}   {r:-8}',
      '  |  {w:tests.ts}     {g:+89}   {r:-4}',
      '  |',
      '  |  complexity: [{y:====}..] {p:67%}',
      '  |  estimate:   {w:5 pts} [{y:med}]',
      '  |  confidence: [{g:======}] {p:94%}',
      '  +---------------------------',
    ].join('\n'),
  },
  {
    slug: 'tech-debt-surfacing',
    category: 'Quality',
    categoryColor: '#EF4444',
    title: 'Tech Debt Surfacing',
    description: 'Flags drift before it becomes a problem.',
    fullWidth: false,
    ascii: [
      '  {r:!} {w:debt detected} -----------',
      '  |',
      '  |  complexity [{y:====}..] {p:67%}',
      '  |  coverage   [{r:==}....] {p:34%}',
      '  |  drift      [{g:=}.....] {p:12%}',
      '  |  duplication[{y:==}....] {p:28%}',
      '  |',
      '  |  {w:3 items flagged}',
      '  |  > auth.ts  {r:crit}',
      '  |  > db.ts    {y:warn}',
      '  +---------------------------',
    ].join('\n'),
  },
  {
    slug: 'sprint-planning',
    category: 'Planning',
    categoryColor: '#06B6D4',
    title: 'Sprint Planning',
    description: 'AI-assisted sprints from your backlog.',
    fullWidth: false,
    ascii: [
      '  +-- {w:sprint 14} ------------+',
      '  |                          |',
      '  |  capacity:  {p:8 devs}      |',
      '  |  planned:   {p:34 pts}      |',
      '  |  loaded:  [{g:======}.] {p:87%} |',
      '  |                          |',
      '  |  risk: {g:low}              |',
      '  |  suggested scope: {y:-2}    |',
      '  |  confidence: {g:91%}        |',
      '  +--------------------------+',
    ].join('\n'),
  },
  {
    slug: 'team-management',
    category: 'Collaboration',
    categoryColor: '#EC4899',
    title: 'Team Management',
    description: 'Workload visibility with Slack & Discord notifications.',
    fullWidth: false,
    ascii: [
      '  +-- {w:team load} ------------+',
      '  |                          |',
      '  |  {c:@ada}  {g:****}o  {p:4/5 pts}   |',
      '  |  {c:@bob}  {g:***}oo  {p:3/5 pts}   |',
      '  |  {c:@eve}  {g:*}oooo  {p:1/5 pts}   |',
      '  |  {c:@max}  {g:**}ooo  {p:2/5 pts}   |',
      '  |                          |',
      '  |  {r:blocked}: @bob (PR)     |',
      '  |  {g:available}: @eve        |',
      '  +--------------------------+',
    ].join('\n'),
  },
  {
    slug: 'terminal-first',
    category: 'Developer Experience',
    categoryColor: '#10B981',
    title: 'Terminal-First',
    description: 'Full TUI without leaving your terminal.',
    fullWidth: false,
    ascii: [
      '  {g:$ ltf1 tasks --mine}',
      '  +----------------------+',
      '  | {w:#38} auth flow   [{g:*}]  |',
      '  | {w:#41} api cache   [o]  |',
      '  | {w:#55} token ref   [{g:v}]  |',
      '  |                      |',
      '  | {p:2} active, {g:1} done     |',
      '  | velocity: {g:+ 23%}      |',
      '  +----------------------+',
    ].join('\n'),
  },
  {
    slug: 'open-source',
    category: 'Open Source',
    categoryColor: '#F9FAFB',
    title: 'Open Source',
    description: 'AGPL licensed. Self-host, audit, fork.',
    fullWidth: false,
    ascii: [
      '  license: {w:AGPL-3.0}',
      '  +----------------------+',
      '  | source    {g:+} available|',
      '  | modify    {g:+} allowed  |',
      '  | self-host {g:+} yes      |',
      '  | audit     {g:+} full     |',
      '  | vendor    {g:+} no lock  |',
      '  |                      |',
      '  | {w:your data. your infra}|',
      '  +----------------------+',
    ].join('\n'),
  },
]

const cardVariants: Variants = {
  rest: {
    borderColor: 'rgba(46, 46, 53, 1)',
    y: 0,
  },
  hover: {
    borderColor: 'rgba(249, 250, 251, 0.2)',
    y: -2,
  },
}

const arrowVariants: Variants = {
  rest: { x: 0, opacity: 0.5 },
  hover: { x: 4, opacity: 1 },
}

export default function ProductShowcaseSection({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  return (
    <section id="features" className="py-24 md:py-32 bg-[#050505]">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section header */}
        {!hideHeader && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <span className="text-[#9CA3AF] text-xs font-mono font-semibold uppercase tracking-wider inline-block mb-4">
              Product
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F9FAFB]">
              Built for how developers
              <br />
              actually work
            </h2>
          </motion.div>
        )}

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className={card.fullWidth ? 'md:col-span-2' : ''}
            >
              <Link to={`/features/${card.slug}`} className="block">
                <motion.div
                  variants={cardVariants}
                  initial="rest"
                  whileHover="hover"
                  className="bg-[#111111] border-2 border-[#2E2E35] overflow-hidden flex flex-col h-full cursor-pointer"
                >
                  {/* ASCII visualization area */}
                  <div className="flex-1 bg-[#0A0A0A] p-6 md:p-8 overflow-x-auto">
                    <ColoredPre
                      text={card.ascii}
                      className="font-mono text-[11px] md:text-xs text-[#6B7280] leading-relaxed whitespace-pre select-none"
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-5 md:p-6 flex items-end justify-between gap-4">
                    <div className="min-w-0">
                      {/* Category */}
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="w-2 h-2 flex-shrink-0"
                          style={{ backgroundColor: card.categoryColor }}
                        />
                        <span className="text-xs font-mono text-[#6B7280] uppercase tracking-wider truncate">
                          {card.category}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg md:text-xl font-bold text-[#F9FAFB] mb-1">
                        {card.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-[#9CA3AF] leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <motion.span
                      variants={arrowVariants}
                      className="text-[#F9FAFB] text-xl flex-shrink-0"
                    >
                      →
                    </motion.span>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
