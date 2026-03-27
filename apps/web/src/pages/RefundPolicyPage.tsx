import ErrorBoundary from '@/components/common/ErrorBoundary'
import LegalLayout from "@/components/legal/LegalLayout";
import { usePageTitle } from "@/hooks/usePageTitle";

const EFFECTIVE_DATE = "1 January 2026";
const CONTACT_EMAIL = "icloud.comnuaym@gmail.com";

export default function RefundPolicyPage() {
  usePageTitle("Refund Policy");

  return (
    <ErrorBoundary>
    <LegalLayout
      title="Refund Policy"
      summary="LTF1 currently has no paid plans. Translation: no subscriptions yet, so no refund gymnastics yet either."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          1) Current pricing status
        </h2>
        <p>
          As of the effective date, LTF1 does not offer paid plans. No
          subscription charges are currently applied for standard product
          access.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Current refund position
        </h2>
        <p>
          Because there are no active paid subscriptions at this time, there are
          no subscription refunds to process under this policy.
        </p>
        <p className="mt-2 text-[#9CA3AF]">
          Friendly note: this page gets more detailed once paid plans go live.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) Future paid plans
        </h2>
        <p>
          If paid plans launch, we will publish plan terms, billing cycles,
          cancellation rules, and any applicable refund windows before charging
          customers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Unauthorized charges
        </h2>
        <p>
          If you believe you were charged in error, contact us promptly at{" "}
          <a
            className="text-[#6366F1] hover:text-[#818CF8]"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>{" "}
          so we can investigate.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Policy changes
        </h2>
        <p>
          We may update this policy if our billing model changes. Any updates
          will be posted here with an updated revision date.
        </p>
      </section>
    </LegalLayout>
    </ErrorBoundary>
  );
}
