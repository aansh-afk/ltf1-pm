import { Link } from "react-router-dom";
import LegalLayout from "../components/legal/LegalLayout";
import { usePageTitle } from "../hooks/usePageTitle";

const COMPANY_NAME = "Vividverseglobal";
const CONTACT_EMAIL = "Aansh.Naidu@vividverseglobal.com";
const EFFECTIVE_DATE = "1 January 2026";

export default function PrivacyPage() {
  usePageTitle("Privacy Policy");

  return (
    <LegalLayout
      title="Privacy Policy"
      summary="This Privacy Policy explains what data LTF1 collects, how we use it, and your choices. We keep this readable on purpose and avoid hidden data weirdness."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          1) Controller information
        </h2>
        <p>
          {COMPANY_NAME} is the controller of personal data processed through
          LTF1, except where we process data as a processor for workspace
          customers under separate agreements (including the DPA).
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Data we collect
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>
            Account data: name, email, Clerk ID, avatar, preferences, role, and
            status.
          </li>
          <li>
            Workspace and project content: projects, tasks, comments, meetings,
            files, and related metadata.
          </li>
          <li>
            Integration data: GitHub, GitLab, and Slack connection and sync
            metadata when enabled.
          </li>
          <li>
            AI usage data: prompts, outputs, usage metrics, and configuration
            related to AI features.
          </li>
          <li>
            Technical and analytics data: product usage events and session data
            (including PostHog analytics).
          </li>
          <li>
            Operational logs: audit/security logs that may include IP address
            and user agent where available.
          </li>
          <li>
            Communication data: newsletter subscriptions and support/contact
            interactions.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) How we use personal data
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>To provide, secure, and operate LTF1.</li>
          <li>
            To authenticate users, manage accounts, and enforce permissions.
          </li>
          <li>To provide integrations and AI-assisted product features.</li>
          <li>To monitor performance, reliability, and product quality.</li>
          <li>
            To communicate service updates, support, and operational notices.
          </li>
          <li>To detect abuse, fraud, and security incidents.</li>
          <li>To comply with legal obligations.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Legal bases (UK GDPR)
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Contractual necessity: delivering core service functionality.</li>
          <li>
            Legitimate interests: security, product improvement, and abuse
            prevention.
          </li>
          <li>
            Consent: where required for optional communications or non-essential
            tracking.
          </li>
          <li>Legal obligation: compliance, legal process, and enforcement.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Service providers and subprocessors
        </h2>
        <p className="mb-2">
          LTF1 uses third parties to deliver parts of the service, including:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Clerk (authentication and identity)</li>
          <li>Convex (application backend and database)</li>
          <li>PostHog (product analytics)</li>
          <li>Resend (transactional email delivery)</li>
          <li>
            GitHub, GitLab, Slack (optional integrations enabled by
            users/workspaces)
          </li>
          <li>
            Cerebras and Groq (AI model providers, when AI features are used)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">6) Retention</h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>
            Account/workspace data is retained while your account remains active
            and as needed for operations.
          </li>
          <li>
            Some temporary records expire automatically (for example OAuth
            states and invitations).
          </li>
          <li>
            Audit logs currently use a default retention period of 90 days.
          </li>
          <li>
            We may retain limited data longer where required by law, security,
            or legitimate business purposes.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          7) Your rights
        </h2>
        <p className="mb-2">
          Subject to applicable law, you may have rights to:
        </p>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of personal data</li>
          <li>Object to or restrict certain processing</li>
          <li>Request portability where applicable</li>
          <li>Withdraw consent where processing is based on consent</li>
        </ul>
        <p className="mt-3">
          To exercise rights, contact{" "}
          <a
            className="text-[#6366F1] hover:text-[#818CF8]"
            href={`mailto:${CONTACT_EMAIL}`}
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          8) International data transfers
        </h2>
        <p>
          Our providers may process data in countries outside the UK. Where
          required, we use appropriate safeguards to protect personal data in
          cross-border transfers.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">9) Security</h2>
        <p>
          We apply commercially reasonable technical and organizational measures
          intended to protect personal data. However, no method of transmission
          or storage is completely secure.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          10) Cookies and tracking
        </h2>
        <p>
          We use cookies and similar technologies for authentication,
          performance, and analytics. See{" "}
          <Link to="/cookies" className="text-[#6366F1] hover:text-[#818CF8]">
            Cookie Policy
          </Link>{" "}
          for details.
        </p>
        <p className="mt-2 text-[#9CA3AF]">
          Friendly note: if a cookie isn&apos;t helping login, security, or
          product quality, it probably doesn&apos;t belong here.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          11) Changes to this policy
        </h2>
        <p>
          We may update this policy periodically. Material changes will be
          posted on this page with an updated revision date.
        </p>
      </section>
    </LegalLayout>
  );
}
