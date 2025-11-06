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
    <section className="py-12 bg-[#F3F4F6] border-y border-[#E5E7EB]">
      <div className="container-max mx-auto px-6">
        <div className="flex flex-col items-center justify-center">
          <p className="text-sm text-[#9CA3AF] mb-8 uppercase tracking-wider font-medium">
            Used by growing moving companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-70 hover:opacity-100 transition-opacity">
            {companies.map((company, index) => (
              <div 
                key={index}
                className="flex items-center justify-center h-12 max-w-[180px] grayscale hover:grayscale-0 transition-all duration-300"
              >
                <img 
                  src={company.logo} 
                  alt={company.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

