import { motion } from 'framer-motion'
import ParticleConstellation from '../ascii/ParticleConstellation'

const steps = [
  {
    number: '01',
    trigger: 'COMMIT',
    result: 'TASK CREATED',
    description: 'PUSH CODE. A TASK IS AUTOMATICALLY GENERATED FROM YOUR COMMIT MESSAGE AND DIFF.',
  },
  {
    number: '02',
    trigger: 'PULL REQUEST',
    result: 'TASK LINKED',
    description: 'OPEN A PR. LTF1 LINKS IT TO THE TASK, GENERATES A DESCRIPTION, AND UPDATES STATUS.',
  },
  {
    number: '03',
    trigger: 'MERGE',
    result: 'TASK CLOSED',
    description: 'MERGE TO MAIN. THE TASK CLOSES ITSELF. THE SPRINT BOARD UPDATES AUTOMATICALLY.',
  },
  {
    number: '04',
    trigger: 'GIT LOG',
    result: 'VELOCITY',
    description: 'YOUR GIT HISTORY BECOMES YOUR VELOCITY TRACKER. REAL DATA, NOT GUESSES.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="marketing-section bg-event-horizon relative overflow-hidden">
      <ParticleConstellation />
      <div className="marketing-container relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-48px md:mb-64px"
        >
          <p className="marketing-label">
            <span className="text-brutal-info/40 mr-4px">&gt;&gt;</span>
            HOW IT WORKS
          </p>
          <h2 className="text-section-title md:text-hero-sm font-bold uppercase text-cathode-white">
            4 STEPS. ZERO EFFORT.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-2px max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-carbon-plate border-2 border-basalt-border p-24px md:p-32px group hover:border-brutal-info relative"
            >
              {/* Subtle corner mark */}
              <span aria-hidden="true" className="absolute top-8px right-12px text-brutal-info/15 font-mono text-[10px] select-none group-hover:text-brutal-info/30">//</span>

              {/* Step number */}
              <div className="text-xs text-cathode-white/20 mb-16px">{step.number}</div>

              {/* Flow: trigger -> result */}
              <div className="flex items-center gap-8px mb-16px">
                <span className="text-sm font-bold text-cathode-white/60">{step.trigger}</span>
                <span className="text-brutal-info">&rarr;</span>
                <span className="text-sm font-bold text-brutal-info">{step.result}</span>
              </div>

              {/* Description */}
              <p className="text-xs text-cathode-white/40 uppercase leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
