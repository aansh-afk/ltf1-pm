import { useNavigate } from 'react-router-dom'
import { HiOutlineHome, HiOutlineArrowLeft, HiOutlineExclamation } from 'react-icons/hi'
import { useEffect, useState } from 'react'

export default function NotFoundPage() {
  const navigate = useNavigate()
  const [glitchText, setGlitchText] = useState('404')
  
  // Glitch effect for 404 text
  useEffect(() => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    const interval = setInterval(() => {
      if (Math.random() > 0.9) {
        const glitched = '404'.split('').map(char => 
          Math.random() > 0.7 ? glitchChars[Math.floor(Math.random() * glitchChars.length)] : char
        ).join('')
        setGlitchText(glitched)
        setTimeout(() => setGlitchText('404'), 100)
      }
    }, 2000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center p-[16px]"
         style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-600px w-full">
        {/* Glitchy 404 Display */}
        <div className="text-center mb-[24px]">
          <div 
            className="text-[120px] md:text-[180px] font-bold font-mono leading-none mb-[12px]"
            style={{ 
              color: 'var(--theme-error)',
              textShadow: `
                3px 3px 0 var(--theme-primary),
                -3px -3px 0 var(--theme-info),
                6px 6px 10px var(--theme-shadow)
              `,
              letterSpacing: '0.1em'
            }}
          >
            {glitchText}
          </div>
          
          <div className="mb-[8px]">
            <div
              className="text-[16px] font-bold uppercase font-mono"
              style={{ color: 'var(--theme-foreground)' }}
            >
              ERROR: PAGE NOT FOUND
            </div>
          </div>
          
          <div 
            className="text-brutal-md uppercase"
            style={{ color: 'var(--theme-foreground-secondary)' }}
          >
            The requested resource could not be located
          </div>
        </div>

        {/* ASCII Art Border */}
        <div 
          className="font-mono text-brutal-xs mb-[16px]"
          style={{ color: 'var(--theme-border)' }}
        >
          <pre className="text-center">
{`╔════════════════════════════════════════╗
║  SYSTEM.ERROR.404.PAGE_NOT_FOUND      ║
║  > RESOURCE: ${window.location.pathname.padEnd(25, ' ').slice(0, 25)} ║
║  > STATUS: MISSING                    ║
║  > ACTION: REDIRECT_REQUIRED          ║
╚════════════════════════════════════════╝`}
          </pre>
        </div>

        {/* Error Details */}
        <div 
          className="border-2 p-[16px] mb-[16px]"
          style={{ 
            backgroundColor: 'var(--theme-background-secondary)',
            borderColor: 'var(--theme-border)'
          }}
        >
          <div className="flex items-start gap-[8px] mb-[8px]">
            <HiOutlineExclamation
              className="w-4 h-4 flex-shrink-0 mt-2px"
              style={{ color: 'var(--theme-warning)' }}
            />
            <div>
              <div 
                className="text-brutal-md uppercase mb-8px"
                style={{ color: 'var(--theme-foreground)' }}
              >
                Possible Causes:
              </div>
              <ul 
                className="space-y-4px text-brutal-sm"
                style={{ color: 'var(--theme-foreground-secondary)' }}
              >
                <li>• The page has been moved or deleted</li>
                <li>• You may have mistyped the address</li>
                <li>• You do not have access to this resource</li>
                <li>• The server encountered an unexpected error</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-[8px]">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-[12px] py-[8px] border-2 font-mono text-brutal-md uppercase tracking-wider transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal"
            style={{
              backgroundColor: 'var(--theme-primary)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-background)',
              boxShadow: '4px 4px 0 var(--theme-shadow)'
            }}
          >
            <div className="flex items-center justify-center gap-[6px]">
              <HiOutlineHome className="w-20px h-20px" />
              <span>RETURN HOME</span>
            </div>
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-[12px] py-[8px] border-2 font-mono text-brutal-md uppercase tracking-wider transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-brutal"
            style={{
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-foreground)',
              boxShadow: '4px 4px 0 var(--theme-shadow)'
            }}
          >
            <div className="flex items-center justify-center gap-[6px]">
              <HiOutlineArrowLeft className="w-20px h-20px" />
              <span>GO BACK</span>
            </div>
          </button>
        </div>

        {/* Terminal Hint */}
        <div 
          className="mt-[24px] text-center text-brutal-xs"
          style={{ color: 'var(--theme-foreground-tertiary)' }}
        >
          <div>TIP: Press Ctrl+K to open terminal and navigate directly</div>
        </div>
      </div>
    </div>
  )
}