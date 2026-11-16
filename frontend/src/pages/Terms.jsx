import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Container } from '../components/ui/Container';
import { PageHeader } from '../components/layout/PageHeader';

export default function Terms() {
  useDocumentTitle('Terms of Service');

  return (
    <Container className="py-8 sm:py-12 max-w-4xl">
      <PageHeader
        title="Terms of Service"
        subtitle="Last revised: November 2026"
        breadcrumbs={[{ label: 'Terms of Service' }]}
      />

      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-xs space-y-6 text-sm text-zinc-700 leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-ink mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using PetMart Bangladesh, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">2. Prohibited Animal Sales & Wildlife Protection</h2>
          <p>
            PetMart strictly prohibits the sale, barter, or trade of wild or endangered animals protected under the Bangladesh Wildlife (Conservation and Security) Act. Violators will be banned immediately and reported to relevant forest and law enforcement departments.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-ink mb-2">3. Moderation and Listing Approvals</h2>
          <p>
            All listings submitted to PetMart undergo review by our admin moderation team. We reserve the absolute right to reject or remove listings that fail animal welfare standards, lack clear imagery, or present suspicion of scam activity.
          </p>
        </section>
      </div>
    </Container>
  );
}

