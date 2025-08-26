import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PublicNavigationProps {
  currentPage?: 'landing' | 'pricing' | 'blog' | 'contact'
}

export default function PublicNavigation({ currentPage }: PublicNavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <>
      <nav className="bg-[#000000] border-b-2 border-[#333333] sticky top-0 z-50">
        <div className="container mx-auto px-16px md:px-24px py-12px md:py-16px">
          <div className="flex justify-between items-center">
            <Link to="/" className="text-2xl md:text-3xl font-bold z-50">
              <span className="text-[#FFFFFF] font-bold">LTF1</span>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex gap-16px">
              <Link to="/pricing" className="brutal-btn">
                PRICING
              </Link>
              <Link to="/blog" className="brutal-btn">
                BLOG
              </Link>
              <Link to="/contact" className="brutal-btn">
                CONTACT
              </Link>
              <Link to="/sign-in" className="brutal-btn">
                SIGN IN
              </Link>
              <Link to="/sign-up" className="brutal-btn bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000] hover:shadow-brutal-lg">
                GET STARTED
              </Link>
            </div>
            
            {/* Mobile Hamburger Button */}
            <button 
              onClick={toggleSidebar}
              className="md:hidden relative w-10 h-10 flex flex-col justify-center items-center gap-1.5 z-50 p-2"
              aria-label="Toggle menu"
            >
              <motion.span 
                className="block w-full h-[3px] bg-[#FFFFFF]"
                animate={{ 
                  rotate: isSidebarOpen ? 45 : 0,
                  y: isSidebarOpen ? 6 : 0
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.span 
                className="block w-full h-[3px] bg-[#FFFFFF]"
                animate={{ 
                  opacity: isSidebarOpen ? 0 : 1
                }}
                transition={{ duration: 0.2 }}
              />
              <motion.span 
                className="block w-full h-[3px] bg-[#FFFFFF]"
                animate={{ 
                  rotate: isSidebarOpen ? -45 : 0,
                  y: isSidebarOpen ? -6 : 0
                }}
                transition={{ duration: 0.2 }}
              />
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-[#000000]/80 z-40"
              onClick={toggleSidebar}
            />
            
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.2, ease: 'linear' }}
              className="md:hidden fixed right-0 top-0 h-full w-[280px] bg-[#0A0A0A] border-l-4 border-[#00FFFF] z-50 overflow-y-auto"
            >
              {/* Sidebar Header */}
              <div className="p-24px border-b-2 border-[#333333]">
                <h2 className="text-2xl font-bold text-[#FFFFFF]">MENU</h2>
              </div>
              
              {/* Sidebar Links */}
              <div className="flex flex-col p-24px gap-16px">
                <Link 
                  to="/pricing" 
                  onClick={toggleSidebar}
                  className="brutal-btn text-left py-16px px-16px bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#00FFFF] hover:shadow-brutal text-[#FFFFFF]"
                >
                  PRICING
                </Link>
                <Link 
                  to="/blog" 
                  onClick={toggleSidebar}
                  className="brutal-btn text-left py-16px px-16px bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#FF00FF] hover:shadow-brutal text-[#FFFFFF]"
                >
                  BLOG
                </Link>
                <Link 
                  to="/contact" 
                  onClick={toggleSidebar}
                  className="brutal-btn text-left py-16px px-16px bg-[#1A1A1A] border-2 border-[#333333] hover:border-[#FFFF00] hover:shadow-brutal text-[#FFFFFF]"
                >
                  CONTACT
                </Link>
                <div className="border-t-2 border-[#333333] my-16px" />
                <Link 
                  to="/sign-in" 
                  onClick={toggleSidebar}
                  className="brutal-btn text-center py-16px bg-[#1A1A1A] border-2 border-[#333333] hover:shadow-brutal text-[#FFFFFF]"
                >
                  SIGN IN
                </Link>
                <Link 
                  to="/sign-up" 
                  onClick={toggleSidebar}
                  className="brutal-btn text-center py-16px bg-gradient-to-r from-[#00FFFF] via-[#FF00FF] to-[#FFFF00] text-[#000000] font-bold hover:shadow-brutal-lg border-2 border-[#000000]"
                >
                  GET STARTED
                </Link>
              </div>
              
              {/* Sidebar Footer */}
              <div className="absolute bottom-0 w-full p-24px border-t-2 border-[#333333]">
                <p className="text-[#666666] text-xs uppercase tracking-wider">
                  YOUR REPO IS THE<br/>
                  SOURCE OF TRUTH
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}