import React from 'react'

export default function BrutalistLoader() {
  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
      <div className="relative">
        {/* Animated squares in a grid pattern */}
        <div className="grid grid-cols-3 gap-[4px]">
          {[...Array(9)].map((_, index) => (
            <div
              key={index}
              className="w-5 h-5 border-2"
              style={{
                backgroundColor: 'var(--theme-background)',
                borderColor: 'var(--theme-primary)',
                animation: `brutalPulse 1.4s infinite ease-in-out`,
                animationDelay: `${index * 0.15}s`,
              }}
            />
          ))}
        </div>
        
        {/* Optional: Terminal cursor blinking effect */}
        <div
          className="absolute -right-[10px] top-1/2 -translate-y-1/2 w-[6px] h-5"
          style={{
            backgroundColor: 'var(--theme-primary)',
            animation: 'brutalBlink 1s infinite step-end',
          }}
        />
      </div>
      
      {/* Add custom animations to the page */}
      <style>{`
        @keyframes brutalPulse {
          0%, 80%, 100% {
            background-color: var(--theme-background);
            transform: scale(1) rotate(0deg);
          }
          40% {
            background-color: var(--theme-primary);
            transform: scale(1.1) rotate(90deg);
          }
        }
        
        @keyframes brutalBlink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// Alternative version with stepping blocks
export function BrutalistStepLoader() {
  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
      <div className="flex gap-[6px]">
        {[...Array(5)].map((_, index) => (
          <div
            key={index}
            className="w-16px border-2"
            style={{
              height: `${(index + 1) * 12}px`,
              backgroundColor: 'var(--theme-background)',
              borderColor: 'var(--theme-primary)',
              animation: `brutalStep 1.2s infinite ease-in-out`,
              animationDelay: `${index * 0.1}s`,
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes brutalStep {
          0%, 40%, 100% {
            background-color: var(--theme-background);
            transform: translateY(0);
          }
          20% {
            background-color: var(--theme-primary);
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  )
}

// Terminal-style loading with command prompt
export function BrutalistTerminalLoader() {
  const [dots, setDots] = React.useState('')
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="min-h-screen bg-[var(--theme-background)] flex items-center justify-center">
      <div className="font-mono text-[var(--theme-primary)] text-brutal-lg uppercase">
        <span className="mr-8px">&gt;</span>
        <span>INITIALIZING</span>
        <span className="inline-block w-5 text-left">{dots}</span>
        <span 
          className="inline-block w-12px h-20px ml-4px"
          style={{
            backgroundColor: 'var(--theme-primary)',
            animation: 'brutalBlink 1s infinite step-end',
          }}
        />
      </div>
      
      <style>{`
        @keyframes brutalBlink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}