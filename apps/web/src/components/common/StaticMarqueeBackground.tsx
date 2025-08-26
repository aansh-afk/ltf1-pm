interface StaticMarqueeBackgroundProps {
  text?: string;
  className?: string;
}

export default function StaticMarqueeBackground({ 
  text = "YOUR REPO IS THE SOURCE OF TRUTH", 
  className = '' 
}: StaticMarqueeBackgroundProps) {
  return (
    <div className={`absolute inset-0 overflow-hidden transform -skew-y-12 ${className}`}>
      {/* First row - highest opacity for visibility */}
      <div className="flex whitespace-nowrap">
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className="text-[#3A3A3A] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.25 }}
          >
            {text}
          </span>
        ))}
      </div>
      
      {/* Second row with offset for visual interest */}
      <div className="flex whitespace-nowrap mt-56px" style={{ transform: 'translateX(-200px)' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className="text-[#333333] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.20 }}
          >
            {text}
          </span>
        ))}
      </div>
      
      {/* Third row */}
      <div className="flex whitespace-nowrap mt-56px" style={{ transform: 'translateX(-100px)' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className="text-[#2F2F2F] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.15 }}
          >
            {text}
          </span>
        ))}
      </div>
      
      {/* Fourth row for better coverage */}
      <div className="flex whitespace-nowrap mt-56px" style={{ transform: 'translateX(-300px)' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className="text-[#2A2A2A] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.10 }}
          >
            {text}
          </span>
        ))}
      </div>
      
      {/* Fifth row for full background coverage */}
      <div className="flex whitespace-nowrap mt-56px" style={{ transform: 'translateX(-50px)' }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span 
            key={i} 
            className="text-[#252525] text-4xl md:text-6xl font-bold uppercase tracking-wider mx-32px select-none"
            style={{ opacity: 0.08 }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}