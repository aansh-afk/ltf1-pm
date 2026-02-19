interface MarqueeTextProps {
  text: string;
  sizes: string[];
  opacity: string;
  color: string;
  animationClass: string;
  delay?: string;
}

function MarqueeTextStrip({ text, sizes, opacity, color, animationClass, delay }: MarqueeTextProps) {
  // Generate random size for each text element
  const getRandomSize = () => sizes[Math.floor(Math.random() * sizes.length)];
  
  // Generate random vertical offset
  const getRandomOffset = () => {
    const offset = Math.floor(Math.random() * 40) - 20; // -20px to +20px
    return `translateY(${offset}px)`;
  };

  return (
    <div 
      className={`flex whitespace-nowrap ${animationClass}`}
      style={{ animationDelay: delay }}
    >
      {['a','b','c','d','e','f','g','h','i','j','k','l'].map((id) => (
        <span
          key={`${text}-${id}`}
          className={`${getRandomSize()} font-bold uppercase tracking-wider mx-[12px] md:mx-[24px] select-none`}
          style={{ 
            color,
            opacity,
            transform: getRandomOffset(),
            display: 'inline-block'
          }}
        >
          {text}
        </span>
      ))}
    </div>
  );
}

export default function EnhancedMarqueeBackground() {
  const text = "YOUR REPO IS THE SOURCE OF TRUTH";
  
  return (
    <div className="absolute inset-0 overflow-hidden transform -skew-y-12">
      {/* Layer 1: Fast, small text, higher opacity */}
      <div className="flex whitespace-nowrap">
        <MarqueeTextStrip 
          text={text}
          sizes={['text-2xl', 'text-3xl', 'text-4xl']}
          opacity="0.30"
          color="#444444"
          animationClass="css-marquee-fast"
        />
        <MarqueeTextStrip 
          text={text}
          sizes={['text-2xl', 'text-3xl', 'text-4xl']}
          opacity="0.30"
          color="#444444"
          animationClass="css-marquee-fast2"
        />
      </div>
      
      {/* Layer 2: Medium speed, medium text */}
      <div className="flex whitespace-nowrap mt-[16px]">
        <MarqueeTextStrip 
          text={text}
          sizes={['text-3xl', 'text-4xl', 'text-5xl']}
          opacity="0.25"
          color="#3A3A3A"
          animationClass="css-marquee"
          delay="-5s"
        />
        <MarqueeTextStrip 
          text={text}
          sizes={['text-3xl', 'text-4xl', 'text-5xl']}
          opacity="0.25"
          color="#3A3A3A"
          animationClass="css-marquee2"
          delay="-5s"
        />
      </div>
      
      {/* Layer 3: Slow, large text, low opacity */}
      <div className="flex whitespace-nowrap mt-[24px]">
        <MarqueeTextStrip 
          text={text}
          sizes={['text-5xl', 'text-6xl', 'text-7xl']}
          opacity="0.20"
          color="#333333"
          animationClass="css-marquee-slow"
          delay="-10s"
        />
        <MarqueeTextStrip 
          text={text}
          sizes={['text-5xl', 'text-6xl', 'text-7xl']}
          opacity="0.20"
          color="#333333"
          animationClass="css-marquee-slow2"
          delay="-10s"
        />
      </div>
      
      {/* Layer 4: Very slow, mixed sizes, very low opacity */}
      <div className="flex whitespace-nowrap mt-[32px]">
        <MarqueeTextStrip 
          text={text}
          sizes={['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl']}
          opacity="0.10"
          color="#2A2A2A"
          animationClass="css-marquee-vslow"
          delay="-15s"
        />
        <MarqueeTextStrip 
          text={text}
          sizes={['text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl', 'text-8xl']}
          opacity="0.10"
          color="#2A2A2A"
          animationClass="css-marquee-vslow2"
          delay="-15s"
        />
      </div>
      
      {/* Additional scattered layer for more depth */}
      <div className="flex whitespace-nowrap mt-[16px]">
        <MarqueeTextStrip 
          text={text}
          sizes={['text-4xl', 'text-5xl', 'text-6xl']}
          opacity="0.15"
          color="#3F3F3F"
          animationClass="css-marquee"
          delay="-20s"
        />
        <MarqueeTextStrip 
          text={text}
          sizes={['text-4xl', 'text-5xl', 'text-6xl']}
          opacity="0.15"
          color="#3F3F3F"
          animationClass="css-marquee2"
          delay="-20s"
        />
      </div>
    </div>
  );
}