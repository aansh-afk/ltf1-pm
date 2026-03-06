import LegalLayout from "../components/legal/LegalLayout";
import { usePageTitle } from "../hooks/usePageTitle";

const EFFECTIVE_DATE = "1 January 2026";

export default function CookiesPage() {
  usePageTitle("Cookie Policy");

  return (
    <LegalLayout
      title="Cookie Policy"
      summary="This Cookie Policy explains how LTF1 uses cookies and similar technologies. Short version: tiny files, useful jobs, no mystery snacks."
      effectiveDate={EFFECTIVE_DATE}
      lastUpdated={EFFECTIVE_DATE}
    >
      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          1) What are cookies?
        </h2>
        <p>
          Cookies are small data files stored on your device. We also use
          similar technologies such as local storage, session storage, and
          analytics identifiers.
        </p>
        <p className="mt-2 text-[#9CA3AF]">
          Friendly note: these are browser cookies, not the chocolate-chip kind.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          2) Why we use cookies and similar technologies
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>Authentication and session management</li>
          <li>Security and fraud prevention</li>
          <li>Remembering preferences (for example, UI settings)</li>
          <li>Measuring feature usage and product performance</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          3) Categories we use
        </h2>
        <h3 className="mb-2 mt-5 font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-[0.14em] text-[#9CA3AF]">
          Strictly necessary
        </h3>
        <p>
          Used for core app behavior, including sign-in/session handling and
          secure access through authentication providers.
        </p>

        <h3 className="mb-2 mt-5 font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-[0.14em] text-[#9CA3AF]">
          Analytics and performance
        </h3>
        <p>
          Used to understand product usage and improve reliability. LTF1
          currently uses PostHog for analytics when configured.
        </p>

        <h3 className="mb-2 mt-5 font-['IBM_Plex_Mono',monospace] text-xs uppercase tracking-[0.14em] text-[#9CA3AF]">
          Preference storage
        </h3>
        <p>
          Used to remember settings such as theme and accessibility preferences.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          4) Third-party technologies
        </h2>
        <p>
          Depending on your usage and enabled features, third parties such as
          Clerk and PostHog may set or read identifiers needed for
          authentication or analytics.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          5) Managing your cookie preferences
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-[#CBD5E1]">
          <li>You can manage cookies through your browser settings.</li>
          <li>You can clear local storage/session storage at any time.</li>
          <li>Blocking some technologies may affect app functionality.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-bold text-[#F9FAFB]">
          6) Changes to this policy
        </h2>
        <p>
          We may update this policy as technologies, services, or legal
          requirements evolve. Updates are posted here with a revised date.
        </p>
      </section>
    </LegalLayout>
  );
}
