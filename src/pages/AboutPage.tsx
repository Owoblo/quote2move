import React from 'react';
import Navigation from '../components/landing/Navigation';
import Footer from '../components/landing/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-32 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            About MovSense
          </h1>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-xl text-text-secondary mb-8">
              MovSense is revolutionizing the moving industry with AI-powered quote generation that saves time and increases accuracy.
            </p>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Our Mission</h2>
              <p className="text-text-secondary leading-relaxed">
                We believe moving companies shouldn't waste hours on free walkthroughs and manual inventory counts.
                MovSense automates the tedious parts of quoting—analyzing MLS photos, detecting furniture, and building
                accurate inventories—so you can focus on what matters: growing your business and serving more customers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">How It Works</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                MovSense uses advanced AI to analyze property photos from MLS listings. Our system:
              </p>
              <ul className="list-disc list-inside text-text-secondary space-y-2 ml-4">
                <li>Detects furniture and items with 96% accuracy</li>
                <li>Classifies rooms automatically (bedroom, living room, kitchen, etc.)</li>
                <li>Estimates cubic footage and weight for each item</li>
                <li>Generates professional quotes in minutes instead of hours</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Why Moving Companies Choose MovSense</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-surface p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-text-primary mb-2">Save Time</h3>
                  <p className="text-text-secondary">
                    Quote 10x more jobs without leaving the office. No more hours wasted on free walkthroughs.
                  </p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-text-primary mb-2">Increase Accuracy</h3>
                  <p className="text-text-secondary">
                    AI-powered detection catches items human eyes might miss, reducing surprise costs on moving day.
                  </p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-text-primary mb-2">Win More Jobs</h3>
                  <p className="text-text-secondary">
                    Respond to leads instantly with professional quotes while competitors are still scheduling walkthroughs.
                  </p>
                </div>
                <div className="bg-surface p-6 rounded-lg border border-border">
                  <h3 className="font-bold text-text-primary mb-2">Scale Efficiently</h3>
                  <p className="text-text-secondary">
                    Handle more quotes with the same team. Grow your business without growing your overhead.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Trusted by Moving Companies</h2>
              <p className="text-text-secondary leading-relaxed">
                MovSense is trusted by 50+ moving companies across North America. From small local movers to
                regional operations, we help moving companies of all sizes quote faster, win more jobs, and
                grow their revenue.
              </p>
            </section>

            <section className="bg-primary/10 p-8 rounded-2xl border border-primary/20">
              <h2 className="text-2xl font-bold text-text-primary mb-4">Get Started Today</h2>
              <p className="text-text-secondary mb-6">
                Ready to transform your quoting process? Start your free trial and see the difference MovSense can make.
              </p>
              <div className="flex gap-4">
                <a href="/login" className="btn btn-primary">
                  Start Free Trial
                </a>
                <a href="https://movsense.com/demo" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                  See Live Demo
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
