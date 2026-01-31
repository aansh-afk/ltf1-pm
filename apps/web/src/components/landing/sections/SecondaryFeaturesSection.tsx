import { motion } from 'framer-motion'

const extras = [
  { title: 'SPRINT PLANNING', description: 'AI-ASSISTED SPRINT CREATION FROM YOUR BACKLOG' },
  { title: 'TEAM MANAGEMENT', description: 'WORKLOAD VISIBILITY AND CAPACITY PLANNING' },
  { title: 'WHITEBOARD', description: 'REAL-TIME COLLABORATIVE DIAGRAMMING' },
  { title: 'AUTOMATION', description: 'CUSTOM WORKFLOWS TRIGGERED BY GIT EVENTS' },
  { title: 'MULTI-PLATFORM', description: 'GITHUB, GITLAB, BITBUCKET. WEB + CLI' },
]

export default function SecondaryFeaturesSection() {
  return (
    <section className="marketing-section bg-event-horizon">
      <div className="marketing-container">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-48px md:mb-64px"
        >
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">&gt;&gt;</span>
            + MORE
          </p>
          <h2 className="text-section-title md:text-hero-sm font-bold uppercase text-cathode-white">
            EVERYTHING ELSE YOU NEED
          </h2>
        </motion.div>

        {/* Mobile: horizontal scroll. Desktop: grid */}
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-5 gap-16px overflow-x-auto md:overflow-x-visible pb-16px md:pb-0 snap-x snap-mandatory md:snap-none max-w-5xl mx-auto"
             style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
          {extras.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="snap-start flex-shrink-0 md:flex-shrink-auto w-[200px] md:w-auto border-2 border-basalt-border bg-carbon-plate p-16px md:p-24px text-center hover:border-brutal-info"
            >
              <h3 className="text-sm font-bold text-cathode-white uppercase mb-8px">
                {item.title}
              </h3>
              <p className="text-xs text-cathode-white/40 uppercase">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
