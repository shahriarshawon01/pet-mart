import React from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { Container } from '../components/ui/Container';
import { PageHeader } from '../components/layout/PageHeader';
import { ShieldAlert, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export default function SafetyTips() {
  useDocumentTitle('Safety Tips & Buyer Protection');

  return (
    <Container className="py-8 sm:py-12 max-w-4xl">
      <PageHeader
        title="Safety Tips & Pet Buyer Guidelines"
        subtitle="Practical rules to protect yourself against fraudulent sellers, pet health scams, and dishonest transactions."
        breadcrumbs={[{ label: 'Safety Tips' }]}
      />

      <div className="space-y-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 sm:p-6 flex items-start gap-4">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={24} />
          <div>
            <h3 className="font-bold text-amber-900 text-base">Golden Rule of PetMart</h3>
            <p className="text-amber-800 text-sm mt-1">
              Never send advance bKash/Nagad money for "booking", "courier transportation charges", or "vaccination deposits" before physically inspecting the animal in person.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          <h2 className="text-xl font-bold text-ink">Buyer Safety Checklist</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-ink text-sm">Always Meet in a Safe, Public Location</h4>
                <p className="text-muted text-xs sm:text-sm mt-0.5">
                  Visit the breeder's facility or home, or arrange meetings in busy daylit public areas. Check the living conditions of the mother animal when purchasing puppies or kittens.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-ink text-sm">Verify Vaccination Card with a Registered Veterinarian</h4>
                <p className="text-muted text-xs sm:text-sm mt-0.5">
                  Request the original vaccination booklet stamped and signed by a licensed veterinarian. Never accept photocopies or verbal assurances.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-ink text-sm">Look for Verified Seller Badges</h4>
                <p className="text-muted text-xs sm:text-sm mt-0.5">
                  Sellers with our green Verified badge have had their government NID and physical location verified by our moderation team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
}

