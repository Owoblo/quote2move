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
    <section className="section-padding bg-surface border-y border-border">
      <div className="container-max space-y-12">
        <div className="text-center">
          <p className="text-sm text-text-muted uppercase tracking-widest font-bold mb-8">
            Trusted by moving companies like yours
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            {logos.map((logo) => (
              <div
                key={logo.name}
                className="h-24 w-56 rounded-xl bg-card-bg shadow-sm border border-border flex flex-col items-center justify-center p-4 hover:shadow-md transition-shadow duration-300"
              >
                <span className="text-lg font-bold text-text-primary mb-1">{logo.name}</span>
                <div className="flex items-center gap-1 text-xs text-text-secondary">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  <span>{logo.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="card p-8 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors duration-500"></div>
              
              <div className="relative">
                <svg className="w-8 h-8 text-primary/20 mb-4" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21L14.017 18C14.017 16.068 12.62 15.447 11.632 15.447C10.918 15.447 10.362 15.772 10.362 16.757C10.362 17.374 10.52 17.884 10.52 18.16C10.52 18.16 9.333 21 6.21 21C4.095 21 3 19.456 3 17.741C3 15.506 4.943 10 10.341 10C10.435 10 10.492 10.008 10.552 10.008C10.492 9.789 10.468 9.537 10.468 9.213C10.468 6.563 12.61 3 17.178 3C19.395 3 21 4.52 21 6.385C21 8.705 19.042 11.612 15.436 13.009C15.436 13.009 15.436 13.009 15.436 13.009C15.468 13.306 15.485 13.607 15.485 13.91C15.485 14.767 15.276 15.576 14.914 16.304C14.609 16.906 14.017 21 14.017 21ZM14.017 21H14.017ZM6.21 21H6.21ZM17.178 3H17.178Z"></path></svg>
                
                <p className="text-xl md:text-2xl text-text-primary font-medium mb-6 leading-relaxed">"{testimonial.quote}"</p>
                
                <div className="flex items-center gap-4 border-t border-border pt-6">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/20">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-text-primary">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-text-secondary font-medium">
                      {testimonial.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
