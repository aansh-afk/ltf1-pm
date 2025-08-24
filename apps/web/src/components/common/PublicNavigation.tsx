import { Link } from 'react-router-dom'

interface PublicNavigationProps {
  currentPage?: 'landing' | 'pricing' | 'blog' | 'contact'
}

export default function PublicNavigation({ currentPage }: PublicNavigationProps) {
  return (
    <nav className="bg-[#000000] border-b-2 border-[#333333] sticky top-0 z-50">
      <div className="container mx-auto px-24px py-16px">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold">
            <span className="text-[#FFFFFF] font-bold">LTF1</span>
          </Link>
          <div className="flex gap-16px">
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
        </div>
      </div>
    </nav>
  )
}