import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Container } from '../components/ui/Container';
import { PageHeader } from '../components/layout/PageHeader';
import { ShieldCheck, HeartHandshake, Eye, Award } from 'lucide-react';

export default function About() {
  useDocumentTitle('About Us');

  return (
    <Container className="py-8 sm:py-12 max-w-4xl">
      <PageHeader
        title="About PetMart Bangladesh"
        subtitle="Creating a safe, verified ecosystem for pets, breeders, and pet lovers across Bangladesh."
        breadcrumbs={[{ label: 'About Us' }]}
      />

      <div className="prose prose-slate max-w-none space-y-8 text-zinc-700 leading-relaxed">
        <section className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-xs">
          <h2 className="text-xl font-bold text-ink mb-3">Our Mission</h2>
          <p>
            PetMart was founded to solve a major problem in Bangladesh: the unsafe, unregulated, and scam-ridden pet trade. By combining manual admin moderation, breeder verification, and transparent spec listings, we help ensure every animal finds a loving and responsible home.
          </p>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-3">
              <ShieldCheck size={22} />
            </div>
            <h3 className="font-bold text-ink text-lg">Verified Breeders</h3>
            <p className="text-sm text-muted">
              We vet ethical breeders to combat illegal pet mills and fraudulent online animal sales.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <HeartHandshake size={22} />
            </div>
            <h3 className="font-bold text-ink text-lg">Adoption First</h3>
            <p className="text-sm text-muted">
              We offer dedicated filters for rescued pets, giving stray and abandoned animals a second chance at life.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

