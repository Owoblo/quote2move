import React from 'react';

export default function SocialProofSection() {
  const companies = [
    {
      name: 'Lets Get Moving',
      logo: '/Lets Get Moving Logo.webp',
      alt: 'Lets Get Moving Logo'
    },
    {
      name: 'Central Coast Moving',
      logo: '/Central Coast Moving logo.webp',
      alt: 'Central Coast Moving Logo'
    },
    {
      name: 'United Van Lines',
      logo: '/United-Van-Lines-Company-Logo.gif',
      alt: 'United Van Lines Logo'
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#F3F4F6] border-y border-[#E5E7EB]">
      <div className="container-max px-6 lg:px-10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm text-[#9CA3AF] mb-10 uppercase tracking-[0.3em] font-medium">
            Used by growing moving companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 w-full opacity-80 hover:opacity-100 transition-opacity">
            {companies.map((company, index) => (
              <div 
                key={index}
                className="flex items-center justify-center h-20 w-48 grayscale hover:grayscale-0 transition-all duration-300"
              >
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Failed to load logo:', company.logo, 'Trying URL encoded version...');
                    // Try with URL encoding as fallback
                    const encodedPath = company.logo.replace(/ /g, '%20');
                    if (e.currentTarget.src !== window.location.origin + encodedPath) {
                      e.currentTarget.src = encodedPath;
                    } else {
                      console.error('Both paths failed for:', company.name);
                    }
                  }}
                  onLoad={() => {
                    console.log('Successfully loaded logo:', company.name);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

