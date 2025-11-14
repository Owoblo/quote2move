import React from 'react';

export default function SocialProofSection() {
  const logos = [
    { name: 'Sunshine Movers', location: 'Tampa, FL' },
    { name: 'Quick Move Co.', location: 'Austin, TX' },
    { name: 'Blue Ridge Relocation', location: 'Charlotte, NC' }
  ];

  const testimonials = [
    {
      quote: 'We went from 3 quotes a day to 12. MovSense paid for itself in week one.',
      name: 'Mike Rodriguez',
      title: 'Owner, Sunshine Movers (Tampa, FL)'
    },
    {
      quote: 'My reps spent 2 hours per estimate. Now it’s 10 minutes. Total game changer.',
      name: 'Jennifer Park',
      title: 'Sales Manager, Quick Move Co. (Austin, TX)'
    }
  ];

  return (
    <section className="py-16 lg:py-20 bg-[#F3F4F6] border-y border-[#E5E7EB]">
      <div className="container-max px-6 lg:px-10 space-y-12">
        <div className="text-center">
          <p className="text-sm text-[#9CA3AF] uppercase tracking-[0.3em] font-medium mb-6">
            Trusted by moving companies like yours
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="h-20 w-48 rounded-xl bg-white shadow border border-gray-200 flex flex-col items-center justify-center"
              >
                <span className="text-base font-semibold text-[#111827]">{logo.name}</span>
                <span className="text-xs text-[#6B7280]">{logo.location}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm"
            >
              <p className="text-lg text-[#111827] font-semibold mb-4">"{testimonial.quote}"</p>
              <p className="text-sm text-[#374151]">
                — {testimonial.name}
                <br />
                <span className="text-[#6B7280]">{testimonial.title}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

