const MARQUEE_IDS = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o'] as const

interface MarqueeBackgroundProps {
  text?: string;
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export default function MarqueeBackground({ 
  text = "YOUR REPO IS THE SOURCE OF TRUTH", 
  speed = 'normal',
  className = '' 
}: MarqueeBackgroundProps) {
  // Use CSS classes as fallback since they're more reliable
  const animationClass = speed === 'slow' ? 'css-marquee' : speed === 'fast' ? 'css-marquee' : 'css-marquee';
  const animation2Class = speed === 'slow' ? 'css-marquee2' : speed === 'fast' ? 'css-marquee2' : 'css-marquee2';

  return (
    <div className={`absolute inset-0 overflow-hidden transform -skew-y-12 ${className}`}>
      {/* First row */}
      <div className="flex whitespace-nowrap">
        <div className={`flex whitespace-nowrap ${animationClass}`}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r1a-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-10 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r1b-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-10 select-none"
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Second row with offset */}
      <div className="flex whitespace-nowrap mt-64px">
        <div className={`flex whitespace-nowrap ${animationClass}`} style={{ animationDelay: '-8s' }}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r2a-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`} style={{ animationDelay: '-8s' }}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r2b-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Third row for full coverage */}
      <div className="flex whitespace-nowrap mt-64px">
        <div className={`flex whitespace-nowrap ${animationClass}`} style={{ animationDelay: '-16s' }}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r3a-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`} style={{ animationDelay: '-16s' }}>
          {MARQUEE_IDS.map((id) => (
            <span
              key={`r3b-${id}`}
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}