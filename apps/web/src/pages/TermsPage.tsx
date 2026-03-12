import { Link } from "react-router-dom";
import ErrorBoundary from '@/components/common/ErrorBoundary'
import LegalLayout from "@/components/legal/LegalLayout";
import { usePageTitle } from "@/hooks/usePageTitle";

const COMPANY_NAME = "Vividverseglobal";
const CONTACT_EMAIL = "Aansh.Naidu@vividverseglobal.com";
const EFFECTIVE_DATE = "1 January 2026";

export default function TermsPage() {
  usePageTitle("Terms of Service");

  return (
    <ErrorBoundary>
    <LegalLayout
      title="Terms of Service"
      summary="These Terms govern your use of LTF1. Plain-English version: use LTF1 responsibly, respect other users, and we will do our best to keep the service stable and secure."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          1) Who these Terms apply to
        </h2>
        <p>
          These Terms are between you and {COMPANY_NAME} ("we", "us", "our") for
          the use of LTF1 and related services. You must be at least 16 years
          old to use LTF1. If you are under 18, you should use the service with
          parent or guardian oversight.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Service scope
        </h2>
        <p>
          LTF1 is a developer-focused project management platform with optional
          integrations and AI features. The service may evolve quickly, and some
          features may change, be limited, or be discontinued.
        </p>
        <p className="mt-2 text-[#9CA3AF]">
          Friendly note: we ship fast, so this policy includes room for product
          changes without surprise legal gymnastics.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) Accounts and security
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>
            You are responsible for account activity and safeguarding your
            credentials.
          </li>
          <li>
            You must provide accurate information and keep it reasonably up to
            date.
          </li>
          <li>
            You must notify us promptly if you suspect unauthorized access.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Acceptable use
        </h2>
        <p>
          You agree not to misuse LTF1. Please review our{" "}
          <Link
            to="/acceptable-use"
            className="text-[#6366F1] hover:text-[#818CF8]"
          >
            Acceptable Use Policy
          </Link>{" "}
          for specific prohibited behavior.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Integrations and AI features
        </h2>
        <p>
          If you connect third-party services (for example GitHub, GitLab,
          Slack, or AI providers), you authorize LTF1 to exchange data necessary
          for those features. You are responsible for your rights to connect and
          share that data.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          6) Intellectual property
        </h2>
        <p>
          We retain all rights in LTF1 and related branding, software, and
          materials, except where open-source licenses apply. You retain
          ownership of your own content and grant us the limited rights needed
          to operate and improve the service.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          7) Beta status and disclaimers
        </h2>
        <p>
          LTF1 is provided on an "as is" and "as available" basis. To the
          maximum extent allowed by law, we disclaim warranties of
          merchantability, fitness for a particular purpose, and
          non-infringement.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          8) Fees, billing, and refunds
        </h2>
        <p>
          LTF1 currently has no paid plans. If paid plans launch, billing terms
          and plan-specific rights will be added before purchase. Current refund
          position is published at{" "}
          <Link to="/refunds" className="text-[#6366F1] hover:text-[#818CF8]">
            Refund Policy
          </Link>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          9) Suspension and termination
        </h2>
        <p>
          We may suspend or terminate access where necessary to protect users,
          systems, or legal compliance, including for serious or repeated
          violations of these Terms.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          10) Limitation of liability
        </h2>
        <p>
          To the extent permitted by law, {COMPANY_NAME} will not be liable for
          indirect, incidental, special, consequential, exemplary, or punitive
          damages, or for lost profits, revenues, data, or goodwill.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          11) Governing law and disputes
        </h2>
        <p>
          These Terms are governed by the laws of the United Kingdom. Disputes
          are subject to the courts of the United Kingdom.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          12) Changes to these Terms
        </h2>
        <p>
          We may update these Terms from time to time. Material updates will be
          posted on this page with a revised "Last updated" date.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">13) Contact</h2>
        <p>
          For legal questions, contact{" "}
          <a
            className="text-[#6366F1] hover:text-[#818CF8]"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
    </ErrorBoundary>
  );
}
