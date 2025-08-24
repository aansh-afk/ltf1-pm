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
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-10 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`}>
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
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
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`} style={{ animationDelay: '-8s' }}>
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
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
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
              className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px opacity-5 select-none"
            >
              {text}
            </span>
          ))}
        </div>
        <div className={`flex whitespace-nowrap ${animation2Class}`} style={{ animationDelay: '-16s' }}>
          {Array.from({ length: 15 }, (_, i) => (
            <span 
              key={i} 
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