import LegalLayout from "../components/legal/LegalLayout";
import { usePageTitle } from "../hooks/usePageTitle";

const COMPANY_NAME = "Vividverseglobal";
const CONTACT_EMAIL = "Aansh.Naidu@vividverseglobal.com";
const EFFECTIVE_DATE = "1 January 2026";

export default function DpaPage() {
  usePageTitle("Data Processing Addendum (DPA)");

  return (
    <LegalLayout
      title="Data Processing Addendum (DPA)"
      summary="This DPA summary describes how LTF1 processes personal data on behalf of workspace customers."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">1) Scope</h2>
        <p>
          This DPA applies when {COMPANY_NAME} processes personal data as a
          processor for a customer (controller) through LTF1.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Subject matter and duration
        </h2>
        <p>
          Processing covers the operation of LTF1 features used by the customer
          and continues for the duration of the customer&apos;s use of the
          service, plus any limited retention required for legal, security, or
          operational reasons.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) Nature and purpose of processing
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>User authentication and access management</li>
          <li>
            Workspace collaboration features (projects, tasks, comments,
            meetings, files)
          </li>
          <li>Optional integrations and automation workflows</li>
          <li>AI-assisted functionality where enabled by the customer</li>
          <li>Security monitoring, logging, and platform reliability</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Categories of data subjects and data
        </h2>
        <p className="mb-2">
          Data subjects may include users, team members, and customer contacts.
        </p>
        <p className="mb-2">Personal data may include:</p>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Identity and profile data (name, email, account identifiers)</li>
          <li>Workspace/project/task collaboration content</li>
          <li>
            Integration metadata and related repository/communication context
          </li>
          <li>Technical usage and audit/security log data</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Subprocessors
        </h2>
        <p className="mb-2">LTF1 may use subprocessors including:</p>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Clerk (authentication)</li>
          <li>Convex (backend/database)</li>
          <li>PostHog (analytics)</li>
          <li>Resend (transactional email)</li>
          <li>GitHub, GitLab, Slack (optional integrations)</li>
          <li>Cerebras and Groq (AI providers when used)</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          6) Security measures
        </h2>
        <p>
          We implement commercially reasonable technical and organizational
          controls intended to protect personal data, including access controls
          and operational monitoring.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          7) Assistance and cooperation
        </h2>
        <p>
          We will provide reasonable assistance to help customers respond to
          data subject requests and applicable data protection obligations,
          considering the nature of processing and information available to us.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          8) Incident notification
        </h2>
        <p>
          If we become aware of a personal data incident affecting customer
          data, we will notify the customer without undue delay and provide
          relevant details reasonably required for response obligations.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          9) Deletion or return of data
        </h2>
        <p>
          Upon valid customer request and subject to legal/operational
          constraints, we will support deletion or return of applicable customer
          personal data.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          10) International transfers
        </h2>
        <p>
          Where personal data is transferred outside the UK, we use appropriate
          safeguards as required by applicable law.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          11) Executable DPA requests
        </h2>
        <p>
          For an executable/signed DPA for your organization, contact{" "}
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
  );
}
