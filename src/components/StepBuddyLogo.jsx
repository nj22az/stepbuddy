import React from 'react';

const StepBuddyLogo = () => {
  return (
    <div className="flex justify-center items-center p-4 bg-[#F8F7F4] w-full">
      <div className="relative w-full max-w-xl mx-auto">
        {/* Main Container with Border */}
        <div className="relative border-[3px] border-[#2C2C2C] p-6 mx-auto">
          {/* Content Container */}
          <div className="text-center">
            {/* Main Logo Text */}
            <div className="mb-4">
              <h1 className="mb-2" style={{
                fontFamily: 'Georgia, serif',
                fontWeight: '900',
                letterSpacing: '0.1em',
                lineHeight: '1.2'
              }}>
                <div className="flex justify-center items-center gap-8">
                  <span className="text-8xl" style={{
                    color: '#4A4A4A',
                    WebkitTextStroke: '1.5px #2C2C2C',
                    textShadow: '2px 2px 0 #2C2C2C'
                  }}>
                    STEP
                  </span>
                  <span className="text-8xl" style={{
                    color: '#8B7355',
                    WebkitTextStroke: '1.5px #2C2C2C',
                    textShadow: '2px 2px 0 #2C2C2C'
                  }}>
                    BUDDY
                  </span>
                </div>
              </h1>
            </div>

            {/* Tagline with Heritage Style */}
            <div className="text-lg italic" style={{ 
              fontFamily: 'Georgia, serif',
              color: '#4A4A4A'
            }}>
              Professional Progress Management
            </div>
          </div>

          {/* Corner Elements - More Ornate */}
          <div className="absolute top-0 left-0 w-8 h-8">
            <div className="absolute w-full h-full border-t-[3px] border-l-[3px] border-[#2C2C2C] -translate-x-3 -translate-y-3" />
            <div className="absolute w-2.5 h-2.5 bg-[#2C2C2C] top-0 left-0 -translate-x-1.5 -translate-y-1.5" />
          </div>
          <div className="absolute top-0 right-0 w-8 h-8">
            <div className="absolute w-full h-full border-t-[3px] border-r-[3px] border-[#2C2C2C] translate-x-3 -translate-y-3" />
            <div className="absolute w-2.5 h-2.5 bg-[#2C2C2C] top-0 right-0 translate-x-1.5 -translate-y-1.5" />
          </div>
          <div className="absolute bottom-0 left-0 w-8 h-8">
            <div className="absolute w-full h-full border-b-[3px] border-l-[3px] border-[#2C2C2C] -translate-x-3 translate-y-3" />
            <div className="absolute w-2.5 h-2.5 bg-[#2C2C2C] bottom-0 left-0 -translate-x-1.5 translate-y-1.5" />
          </div>
          <div className="absolute bottom-0 right-0 w-8 h-8">
            <div className="absolute w-full h-full border-b-[3px] border-r-[3px] border-[#2C2C2C] translate-x-3 translate-y-3" />
            <div className="absolute w-2.5 h-2.5 bg-[#2C2C2C] bottom-0 right-0 translate-x-1.5 translate-y-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBuddyLogo; 