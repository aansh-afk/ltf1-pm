export default function MarqueeTest() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-red-500 opacity-30">
      {/* Test 1: Built-in animation */}
      <div className="whitespace-nowrap animate-pulse bg-blue-500 p-2">
        <span className="text-2xl font-bold text-white">
          1. PULSE (BUILT-IN) 
        </span>
      </div>
      
      {/* Test 2: Tailwind marquee */}
      <div className="flex whitespace-nowrap mt-12 bg-green-500 p-2">
        <div className="animate-marquee flex whitespace-nowrap">
          <span className="text-2xl font-bold text-white mr-20">
            2. TAILWIND MARQUEE • TAILWIND MARQUEE • TAILWIND MARQUEE •
          </span>
        </div>
      </div>
      
      {/* Test 3: CSS marquee */}
      <div className="flex whitespace-nowrap mt-12 bg-yellow-500 p-2">
        <div className="css-marquee flex whitespace-nowrap">
          <span className="text-2xl font-bold text-black mr-20">
            3. CSS MARQUEE • CSS MARQUEE • CSS MARQUEE • CSS MARQUEE •
          </span>
        </div>
      </div>
      
      {/* Test 4: Dual CSS marquee */}
      <div className="flex whitespace-nowrap mt-12 bg-purple-500 p-2">
        <div className="css-marquee flex whitespace-nowrap">
          <span className="text-2xl font-bold text-white mr-20">
            4A. CSS DUAL 1 • CSS DUAL 1 • 
          </span>
        </div>
        <div className="css-marquee2 flex whitespace-nowrap">
          <span className="text-2xl font-bold text-white mr-20">
            4B. CSS DUAL 2 • CSS DUAL 2 • 
          </span>
        </div>
      </div>
      
      {/* Debug info */}
      <div className="absolute top-4 right-4 bg-black text-green-500 p-2 text-xs">
        MARQUEE TESTS:<br/>
        1=pulse, 2=tailwind, 3=css, 4=dual
      </div>
    </div>
  );
}