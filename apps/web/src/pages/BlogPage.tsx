import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'
import {
  HiSearch,
  HiRss,
  HiMail
} from 'react-icons/hi'
import { useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  category: string
  author: string
  authorRole: string
  date: string
  readTime: string
  tags: string[]
  featured: boolean
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'HOW WE ELIMINATED "DID YOU UPDATE JIRA?" FOREVER',
    excerpt: 'Every commit creates a task. Every PR updates the board. Your Git history IS your project management. Here\'s how we built automatic Git-to-task synchronization.',
    category: 'ENGINEERING',
    author: 'SARAH CHEN',
    authorRole: 'TECH LEAD',
    date: '2025-01-24',
    readTime: '8 MIN',
    tags: ['GIT', 'AUTOMATION', 'WORKFLOW'],
    featured: true
  },
  {
    id: '2',
    title: 'FROM MONOLITH TO MICROSERVICES: OUR JOURNEY TO 99.99% UPTIME',
    excerpt: 'Breaking down our monolithic architecture into containerized microservices reduced deployment time by 87% and achieved four nines reliability.',
    category: 'ENGINEERING',
    author: 'ALEX KUMAR',
    authorRole: 'PLATFORM ARCHITECT',
    date: '2025-01-22',
    readTime: '18 MIN',
    tags: ['ARCHITECTURE', 'KUBERNETES', 'DEVOPS'],
    featured: true
  },
  {
    id: '3',
    title: 'WHY STORY POINT MEETINGS ARE A WASTE OF TIME',
    excerpt: 'We analyzed 1,000 planning poker sessions. Average time: 2 hours. Average accuracy: 23%. Here\'s how AI estimation from code changes beats human guessing every time.',
    category: 'DESIGN',
    author: 'MARCUS WRIGHT',
    authorRole: 'DESIGN LEAD',
    date: '2025-01-20',
    readTime: '8 MIN',
    tags: ['DESIGN', 'BRUTALISM', 'UI/UX'],
    featured: false
  },
  {
    id: '4',
    title: 'GIT HOOKS THAT ACTUALLY IMPROVE YOUR WORKFLOW',
    excerpt: 'Pre-commit: format code. Post-commit: create task. Pre-push: generate PR description. Simple hooks that save 30 minutes per day.',
    category: 'PRODUCTIVITY',
    author: 'JENNIFER PARK',
    authorRole: 'PRODUCT MANAGER',
    date: '2025-01-18',
    readTime: '10 MIN',
    tags: ['PRODUCTIVITY', 'AI', 'MEETINGS'],
    featured: false
  },
  {
    id: '5',
    title: 'REAL-TIME COLLABORATION AT SCALE: HANDLING 1M CONCURRENT WEBSOCKETS',
    excerpt: 'Technical deep dive into our WebSocket infrastructure using Convex. How we handle 1 million concurrent connections with sub-100ms latency.',
    category: 'ENGINEERING',
    author: 'DMITRI VOLKOV',
    authorRole: 'BACKEND ENGINEER',
    date: '2025-01-15',
    readTime: '22 MIN',
    tags: ['WEBSOCKETS', 'CONVEX', 'SCALE'],
    featured: false
  },
  {
    id: '6',
    title: 'FROM 5 TOOLS TO 1: OUR JOURNEY AWAY FROM JIRA',
    excerpt: 'We used Jira, GitHub Projects, Linear, Notion, and Slack. Now we just use Git + LTF1. Here\'s how we consolidated our entire workflow.',
    category: 'OPEN SOURCE',
    author: 'RYAN TORRES',
    authorRole: 'DEVELOPER ADVOCATE',
    date: '2025-01-12',
    readTime: '5 MIN',
    tags: ['OPEN SOURCE', 'CLI', 'TOOLS'],
    featured: true
  },
  {
    id: '7',
    title: 'THE REAL COST OF CONTEXT SWITCHING FOR DEVELOPERS',
    excerpt: 'Every tool switch costs 23 minutes of focus. We measured 10,000 developer hours. The results will make you delete half your tools.',
    category: 'AI & ML',
    author: 'DR. LISA HUANG',
    authorRole: 'DATA SCIENTIST',
    date: '2025-01-10',
    readTime: '15 MIN',
    tags: ['ANALYTICS', 'PREDICTION', 'ML'],
    featured: false
  },
  {
    id: '8',
    title: 'PR DESCRIPTIONS IN 10 SECONDS: OUR DIFF-TO-DOCS PIPELINE',
    excerpt: 'git diff | AI | PR description. We generate comprehensive PR descriptions from code changes. No more "fixed stuff" commit messages.',
    category: 'DEVOPS',
    author: 'MIKE DAVIDSON',
    authorRole: 'DEVOPS LEAD',
    date: '2025-01-08',
    readTime: '14 MIN',
    tags: ['DEVOPS', 'CI/CD', 'CULTURE'],
    featured: false
  }
]

const categories = [
  { name: 'ALL', count: blogPosts.length },
  { name: 'ENGINEERING', count: 2 },
  { name: 'AI & ML', count: 2 },
  { name: 'DEVOPS', count: 1 },
  { name: 'DESIGN', count: 1 },
  { name: 'PRODUCTIVITY', count: 1 },
  { name: 'OPEN SOURCE', count: 1 }
]

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const subscribe = useMutation(api.waitlist.subscribeToNewsletter)

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = selectedCategory === 'ALL' || post.category === selectedCategory
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesCategory && matchesSearch
  })

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      await subscribe({ email, source: 'blog' })
      setSubscribed(true)
      toast.success('SUBSCRIBED!')
      setEmail('')
      setTimeout(() => setSubscribed(false), 5000)
    } catch {
      toast.error('SOMETHING WENT WRONG. TRY AGAIN.')
    }
  }

  return (
    <div className="min-h-screen bg-carbon-plate">
      <PublicNavigation />

      {/* HERO SECTION */}
      <section className="py-80px px-[12px] border-b-2 border-basalt-border">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold mb-[12px] text-center"
          >
            <span className="text-cathode-white">ENGINEERING</span>{' '}
            <span className="text-brutal-info">INSIGHTS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-cathode-white/80 uppercase tracking-wider text-center mb-[24px]"
          >
            DEEP DIVES. TECHNICAL BREAKDOWNS. NO FLUFF.
          </motion.p>

          {/* SEARCH BAR */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="SEARCH POSTS, TAGS, AUTHORS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-[12px] md:px-[24px] py-12px md:py-[8px] bg-event-horizon border-2 border-basalt-border text-cathode-white focus:border-brutal-info outline-none uppercase text-sm md:text-base"
              />
              <HiSearch className="absolute left-12px md:left-16px top-1/2 -translate-y-1/2 text-cathode-white/50 text-lg md:text-xl" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-[12px] md:py-32px px-[10px] md:px-[12px] border-b-2 border-basalt-border bg-event-horizon">
        <div className="max-w-full md:max-w-7xl mx-auto">
          <div className="flex flex-wrap gap-8px md:gap-[10px] justify-center">
            {categories.map((category, index) => (
              <motion.button
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  brutal-btn px-[12px] py-12px
                  ${selectedCategory === category.name ? 'border-brutal-info text-brutal-info' : ''}
                `}
              >
                {category.name} ({category.count})
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED POSTS */}
      {selectedCategory === 'ALL' && (
        <section className="py-32px md:py-48px px-[10px] md:px-[12px]">
          <div className="max-w-full md:max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-[12px] md:mb-[16px] text-cathode-white">
              FEATURED <span className="text-brutal-info">POSTS</span>
            </h2>

            <div className="relative">
              <div className="flex lg:grid lg:grid-cols-3 gap-[16px] overflow-x-auto lg:overflow-x-visible pb-16px lg:pb-0 snap-x snap-mandatory lg:snap-none"
                   style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
              {blogPosts.filter(post => post.featured).map((post, index) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="snap-start flex-shrink-0 lg:flex-shrink-auto w-[85vw] lg:w-auto brutal-card p-[16px] hover:border-brutal-info group"
                >
                  <div className="flex items-center gap-8px mb-[8px]">
                    <span className="text-xs font-bold text-brutal-info">{post.category}</span>
                    <span className="text-xs text-cathode-white/50">&bull;</span>
                    <span className="text-xs text-cathode-white/50">{post.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold mb-12px text-cathode-white group-hover:text-brutal-info">
                    {post.title}
                  </h3>

                  <p className="text-sm text-cathode-white/70 mb-[8px]">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-cathode-white/50">
                      <span className="font-bold text-cathode-white">{post.author}</span>
                      <br />
                      {post.date}
                    </div>
                    <Link
                      to={`/blog/${post.id}`}
                      className="text-brutal-info hover:text-cathode-white font-bold text-sm"
                    >
                      READ &rarr;
                    </Link>
                  </div>
                </motion.article>
              ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-24px bg-gradient-to-l from-carbon-plate to-transparent lg:hidden flex items-center justify-end pr-8px pointer-events-none">
                <div className="text-brutal-info text-xs animate-pulse">&rarr;</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ALL POSTS */}
      <section className="py-48px px-[10px] md:px-[12px]">
        <div className="max-w-full md:max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-[16px] text-cathode-white">
            {selectedCategory === 'ALL' ? 'ALL' : selectedCategory} <span className="text-brutal-info">POSTS</span>
          </h2>

          <div className="grid gap-[16px]">
            {filteredPosts.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="brutal-card p-[20px] hover:border-brutal-info group"
              >
                <div className="grid lg:grid-cols-12 gap-[20px]">
                  <div className="lg:col-span-9">
                    <div className="flex flex-wrap items-center gap-8px mb-[8px]">
                      <span className="text-sm font-bold text-brutal-info">{post.category}</span>
                      <span className="text-sm text-cathode-white/50">&bull;</span>
                      <span className="text-sm text-cathode-white/50">{post.readTime}</span>
                      <span className="text-sm text-cathode-white/50">&bull;</span>
                      {post.tags.map(tag => (
                        <span key={tag} className="text-xs px-8px py-2px bg-basalt-border text-cathode-white">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-2xl font-bold mb-[8px] text-cathode-white group-hover:text-brutal-info">
                      {post.title}
                    </h3>

                    <p className="text-cathode-white/70 mb-[8px]">
                      {post.excerpt}
                    </p>

                    <Link
                      to={`/blog/${post.id}`}
                      className="inline-block brutal-btn"
                    >
                      READ FULL POST &rarr;
                    </Link>
                  </div>

                  <div className="lg:col-span-3 border-l-2 border-basalt-border pl-32px">
                    <div className="space-y-[8px]">
                      <div>
                        <div className="text-sm text-cathode-white/50 mb-4px">AUTHOR</div>
                        <div className="font-bold text-cathode-white">{post.author}</div>
                        <div className="text-sm text-brutal-info">{post.authorRole}</div>
                      </div>
                      <div>
                        <div className="text-sm text-cathode-white/50 mb-4px">PUBLISHED</div>
                        <div className="text-cathode-white">{post.date}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-80px">
              <div className="text-6xl mb-[12px] text-cathode-white">404</div>
              <div className="text-xl text-cathode-white/60">NO POSTS FOUND</div>
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-48px md:py-80px border-t-2 border-basalt-border bg-event-horizon">
        <div className="max-w-full md:max-w-3xl mx-auto px-[10px] md:px-[12px] text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-[8px] md:mb-[12px] text-cathode-white">
            NEVER MISS AN <span className="text-brutal-info">UPDATE</span>
          </h2>

          <p className="text-xl text-cathode-white/80 mb-[16px] uppercase">
            Technical insights. Product updates. Zero spam.
          </p>

          <form onSubmit={handleSubscribe} className="flex gap-0 max-w-md mx-auto">
            <input
              type="email"
              placeholder="YOUR@EMAIL.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 px-[12px] py-[8px] bg-event-horizon border-2 border-basalt-border border-r-0 text-cathode-white focus:border-brutal-info outline-none uppercase"
              required
            />
            <button
              type="submit"
              className={`
                brutal-btn px-[16px] py-[8px]
                ${subscribed ? 'bg-brutal-success text-event-horizon border-brutal-success' : 'bg-brutal-info text-event-horizon border-brutal-info'}
              `}
            >
              {subscribed ? 'SUBSCRIBED!' : 'SUBSCRIBE'}
            </button>
          </form>

          <div className="flex items-center justify-center gap-[20px] mt-[16px]">
            <a href="/rss" className="flex items-center gap-8px text-cathode-white hover:text-brutal-info">
              <HiRss className="text-xl" />
              <span>RSS FEED</span>
            </a>
            <a href="mailto:blog@ltf1.dev" className="flex items-center gap-8px text-cathode-white hover:text-brutal-info">
              <HiMail className="text-xl" />
              <span>SUBMIT POST</span>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
