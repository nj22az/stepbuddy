import React from 'react';

const StepBuddyLogo = () => {
  return (
    <div className="flex justify-center items-center p-8 bg-[#F8F7F4] w-full">
      <div className="relative w-full max-w-2xl mx-auto">
        {/* Main Container with Border */}
        <div className="relative border-[3px] border-[#2C2C2C] p-8 mx-auto">
          {/* Content Container */}
          <div className="text-center">
            {/* Established Date with Heritage Styling */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="h-px w-16 bg-[#2C2C2C] opacity-40" />
              <div className="text-sm tracking-[0.25em] text-[#2C2C2C]" style={{
                fontFamily: 'Georgia, serif'
              }}>
                SINCE 2025
              </div>
              <div className="h-px w-16 bg-[#2C2C2C] opacity-40" />
            </div>

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

            {/* Decorative Lines */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-24 h-px bg-[#2C2C2C] opacity-30" />
              <div className="w-24 h-px bg-[#2C2C2C] opacity-30" />
            </div>

            {/* Tagline with Heritage Style */}
            <div className="text-lg italic mb-6" style={{ 
              fontFamily: 'Georgia, serif',
              color: '#4A4A4A'
            }}>
              Tradition of Excellence in Progress
            </div>

            {/* Bottom Text */}
            <div className="text-sm tracking-[0.15em] text-[#2C2C2C] opacity-80 font-serif">
              PROFESSIONAL PROGRESS MANAGEMENT
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

          {/* Subtle Texture Overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="4" height="4" viewBox="0 0 4 4" xmlns="http://www.w3.org/2000/svg"%3E%3Cpath d="M1 3h1v1H1V3zm2-2h1v1H3V1z" fill="%23000000" fill-opacity=".5" fill-rule="evenodd"/%3E%3C/svg%3E")'
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepBuddyLogo; 