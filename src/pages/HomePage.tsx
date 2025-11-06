import React from 'react';
import Navigation from '../components/landing/Navigation';
import HeroSection from '../components/landing/HeroSection';
import SocialProofSection from '../components/landing/SocialProofSection';
import HowItWorksSection from '../components/landing/HowItWorksSection';
import KeyFeaturesSection from '../components/landing/KeyFeaturesSection';
import UseCasesSection from '../components/landing/UseCasesSection';
import ResultsSection from '../components/landing/ResultsSection';
import IntegrationsSection from '../components/landing/IntegrationsSection';
import PricingSection from '../components/landing/PricingSection';
import FAQSection from '../components/landing/FAQSection';
import FinalCTASection from '../components/landing/FinalCTASection';
import Footer from '../components/landing/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navigation />
      <HeroSection />
      <SocialProofSection />
      <HowItWorksSection />
      <KeyFeaturesSection />
      <UseCasesSection />
      <ResultsSection />
      <IntegrationsSection />
      <PricingSection />
      <FAQSection />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
