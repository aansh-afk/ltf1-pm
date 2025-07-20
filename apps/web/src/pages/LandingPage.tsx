import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineCode, HiOutlineLightningBolt, HiOutlineUsers } from 'react-icons/hi'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <nav className="navbar bg-base-200 border-b border-base-300">
        <div className="container mx-auto">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gradient">LTF1</h1>
          </div>
          <div className="flex-none gap-2">
            <Link to="/sign-in" className="btn btn-ghost btn-sm">
              Sign In
            </Link>
            <Link to="/sign-up" className="btn btn-primary btn-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="hero min-h-[calc(100vh-4rem)]">
        <div className="hero-content text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-8">
              Project Management for{' '}
              <span className="text-gradient">Developers</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-base-content/80">
              The first project management platform built by developers, for developers.
              Seamlessly integrate with your Git workflow and boost your team's productivity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sign-up" className="btn btn-primary btn-lg">
                Start Free Trial
              </Link>
              <Link to="/demo" className="btn btn-outline btn-lg">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 bg-base-200">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for the Modern Developer Workflow
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <HiOutlineCode className="w-12 h-12 text-primary mb-4" />
                <h3 className="card-title mb-2">Git-First Approach</h3>
                <p>Automatically sync tasks with commits, PRs, and branches. Your code is your project management.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <HiOutlineLightningBolt className="w-12 h-12 text-primary mb-4" />
                <h3 className="card-title mb-2">AI-Powered Intelligence</h3>
                <p>Smart task generation from code changes, intelligent sprint planning, and automated time estimates.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <HiOutlineUsers className="w-12 h-12 text-primary mb-4" />
                <h3 className="card-title mb-2">Team Collaboration</h3>
                <p>Real-time updates, code review integration, and built-in meeting scheduler with Google Meet.</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Join thousands of development teams who've made LTF1 their command center.
          </p>
          <Link to="/sign-up" className="btn btn-primary btn-lg">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      <footer className="footer p-10 bg-base-200 text-base-content">
        <div className="container mx-auto">
          <div>
            <h3 className="text-2xl font-bold text-gradient mb-2">LTF1</h3>
            <p>Dev-focused project management platform</p>
          </div>
          <div>
            <span className="footer-title">Product</span>
            <a className="link link-hover">Features</a>
            <a className="link link-hover">Pricing</a>
            <a className="link link-hover">Integrations</a>
          </div>
          <div>
            <span className="footer-title">Company</span>
            <a className="link link-hover">About</a>
            <a className="link link-hover">Blog</a>
            <a className="link link-hover">Careers</a>
          </div>
          <div>
            <span className="footer-title">Legal</span>
            <a className="link link-hover">Terms</a>
            <a className="link link-hover">Privacy</a>
            <a className="link link-hover">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}