import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Container } from '../components/ui/Container';
import { PageHeader } from '../components/layout/PageHeader';

export default function Privacy() {
  useDocumentTitle('Privacy Policy');

  return (
    <Container className="py-8 sm:py-12 max-w-4xl">
      <PageHeader
        title="Privacy Policy"
        subtitle="Last revised: November 2026"
        breadcrumbs={[{ label: 'Privacy Policy' }]}
      />

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6 text-sm text-zinc-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-ink mb-2">1. Information We Collect</h2>
          <p>
            When registering on PetMart Bangladesh, we collect your name, phone number, and location (division, district, area). For sellers requesting verified status, national identification details may be requested securely for verification purposes only.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">2. Phone Number Protection</h2>
          <p>
            To prevent unsolicited spam, automated scrapers, and harassment, contact phone numbers are masked for anonymous and non-authenticated visitors. Only registered and logged-in community members may reveal contact telephone details.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">3. Data Security & Storage</h2>
          <p>
            We implement industry-standard encryption protocols to safeguard user passwords, session tokens, and inquiry messaging history. We never sell your personal contact numbers to third-party telemarketing networks.
          </p>
        </section>
      </div>
    </Container>
  );
}

