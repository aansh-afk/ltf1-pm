import ErrorBoundary from '@/components/common/ErrorBoundary'
import LegalLayout from "@/components/legal/LegalLayout";
import { usePageTitle } from "@/hooks/usePageTitle";

const EFFECTIVE_DATE = "1 January 2026";
const CONTACT_EMAIL = "icloud.comnuaym@gmail.com";

export default function AcceptableUsePage() {
  usePageTitle("Acceptable Use Policy");

  return (
    <ErrorBoundary>
    <LegalLayout
      title="Acceptable Use Policy"
      summary="This policy sets rules for safe, lawful, and responsible use of LTF1. Friendly mode: be excellent to each other and don't break the platform."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">1) Purpose</h2>
        <p>
          LTF1 is designed for collaborative software and project work. You must
          use the service lawfully and in ways that do not harm others, the
          platform, or connected services.
        </p>
        <p className="mt-2 text-[#9CA3AF]">
          Friendly note: build cool things, not chaos.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Prohibited behavior
        </h2>
        <p className="mb-2">You must not:</p>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Break any law or assist illegal activity through LTF1.</li>
          <li>Attempt unauthorized access to accounts, systems, or data.</li>
          <li>Upload or transmit malware, ransomware, or malicious code.</li>
          <li>
            Abuse APIs, scrape data, or automate access in unauthorized ways.
          </li>
          <li>
            Reverse engineer, interfere with, or disrupt platform operations.
          </li>
          <li>
            Use stolen credentials, impersonate others, or misrepresent
            identity.
          </li>
          <li>Use the service to harass, threaten, or abuse other users.</li>
          <li>
            Post or distribute content that is unlawful, deceptive, or
            infringing.
          </li>
          <li>
            Use AI features to generate harmful, abusive, or policy-violating
            output.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) Security and reporting obligations
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Keep your credentials secure and avoid sharing access.</li>
          <li>Promptly report suspected vulnerabilities or abuse.</li>
          <li>
            Cooperate with reasonable investigations related to policy
            violations.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Integrations and external systems
        </h2>
        <p>
          If you connect external services (for example GitHub, GitLab, Slack,
          or AI providers), you must comply with their policies and only connect
          resources you are authorized to access.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Enforcement
        </h2>
        <p>
          We may investigate suspected misuse and take actions including
          warnings, feature restrictions, temporary suspension, permanent
          account/workspace suspension, or legal reporting where required.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">6) Contact</h2>
        <p>
          To report abuse or security issues, contact{" "}
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
