import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — cpproad",
  description: "How cpproad collects, uses, and shares information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy describes how cpproad (“we”, “us”) collects and uses information when you use
        the cpproad website and learning app (the “Service”). It is written to match how the
        product actually works today.
      </p>
      <p>
        Related: our <Link href="/terms">Terms of Service</Link>.
      </p>

      <h2>1. Information we collect</h2>
      <p>Depending on how you use cpproad, we may collect:</p>
      <ul>
        <li>
          <strong>Account information.</strong> Email address and authentication data. If you
          sign in with Google, we receive your Google account email and basic profile information
          (such as name) in order to create and authenticate your account. Passwords, when you set
          one, are handled by our auth provider and are not stored by us in plaintext.
        </li>
        <li>
          <strong>Profile and onboarding.</strong> Display name, experience background, motivation,
          starting point, and weekly lesson goal.
        </li>
        <li>
          <strong>Learning data.</strong> Lesson progress, exercise and playground code, submission
          results, concept-check answers and review schedule, notes, and capstone work.
        </li>
        <li>
          <strong>Tutor conversations.</strong> Messages you send to the AI tutor and the replies
          we store so the conversation can continue.
        </li>
        <li>
          <strong>Your Gemini API key (optional).</strong> If you enable the tutor, you paste your
          own Google Gemini key. We encrypt it (AES-256-GCM) before storing it and decrypt it only
          to send tutor requests on your behalf. We do not use a shared operator key.
        </li>
        <li>
          <strong>GitHub connection (optional).</strong> If you connect GitHub, we store your GitHub
          username, the target repository, and an encrypted access token so we can commit passed
          submissions to your public <code>cpproad-submissions</code> repo.
        </li>
        <li>
          <strong>Bug reports.</strong> Whatever you include when you report a problem.
        </li>
        <li>
          <strong>Usage and device data.</strong> Product analytics (page views, learning events,
          feature-flag evaluation) and hosting/performance metrics. Signed-in product analytics
          are associated with your account; site-wide analytics are typically aggregated.
        </li>
      </ul>
      <p>
        Some settings (onboarding drafts, playground code, notepad position) are also stored
        locally in your browser.
      </p>

      <h2>2. How we use information</h2>
      <p>We use this information to:</p>
      <ul>
        <li>Create and authenticate your account, including Sign in with Google.</li>
        <li>Provide lessons, exercises, review, notes, and the sandboxed compiler.</li>
        <li>
          Run the AI tutor using <em>your</em> Gemini key, including sending conversation context
          to Google’s Gemini API.
        </li>
        <li>Sync passed submissions to GitHub when you have connected that feature.</li>
        <li>Remember progress, goals, and preferences.</li>
        <li>Keep the Service reliable, debug issues, and understand how the product is used.</li>
        <li>Protect the Service against abuse of the compiler and other systems.</li>
      </ul>
      <p>We do not sell your personal information, and we do not use it to serve third-party ads.</p>

      <h2>3. Google user data</h2>
      <p>
        If you use Sign in with Google, Google shows you what is shared. We use that data only to
        sign you in and operate your cpproad account. We do not use Google user data for
        advertising, and we do not sell it. You can disconnect Google access from your Google
        account settings at any time; you can also delete your cpproad account from Profile.
      </p>

      <h2>4. Processors and other services</h2>
      <p>We rely on other companies to run the Service. The important ones are:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, and row-level security for your
          data.
        </li>
        <li>
          <strong>Vercel</strong> — hosting, plus analytics and speed insights on the site.
        </li>
        <li>
          <strong>Google</strong> — Sign in with Google, and Gemini when you use the tutor with
          your own key.
        </li>
        <li>
          <strong>Judge0 (currently via RapidAPI)</strong> — compiling and running C++ you submit.
          Your source and stdin are sent to that sandbox.
        </li>
        <li>
          <strong>Statsig</strong> — feature flags and product analytics in the signed-in app.
        </li>
        <li>
          <strong>GitHub</strong> — only if you connect it; passed submissions are written to a
          public repo you authorize.
        </li>
      </ul>
      <p>
        Those providers process data under their own terms and in the regions they operate (often
        including the United States).
      </p>

      <h2>5. Cookies</h2>
      <p>We use:</p>
      <ul>
        <li>
          <strong>Essential cookies</strong> to keep you signed in (session cookies from our auth
          provider).
        </li>
        <li>
          <strong>A short-lived cookie</strong> during GitHub OAuth to protect the connect flow.
        </li>
        <li>
          <strong>Analytics</strong> from Vercel on the site, and Statsig in the signed-in app.
        </li>
      </ul>

      <h2>6. How long we keep data</h2>
      <p>
        We keep account and learning data while your account exists. You can delete your account
        from Profile at any time. Deletion removes your auth user and cascades to user-scoped
        records (progress, submissions, notes, conversations, API keys, GitHub connection, and
        similar). Anonymized tutor usage/cost records may remain without your account attached.
      </p>
      <p>
        Code you chose to publish to GitHub stays on GitHub under your account; deleting cpproad
        does not automatically delete that public repo.
      </p>
      <p>Local browser storage stays on your device until you clear it.</p>

      <h2>7. Your choices</h2>
      <ul>
        <li>Update display name and weekly goal in Profile.</li>
        <li>Add, rotate, or remove your Gemini key in Profile.</li>
        <li>Connect or disconnect GitHub in Profile.</li>
        <li>Reset learning progress from Profile.</li>
        <li>Delete your account from Profile. This cannot be undone.</li>
      </ul>
      <p>
        Depending on where you live, you may also have rights to access, correct, or export
        personal data, or to object to certain processing. Use account deletion for a full erasure
        of identified account data, or include a privacy request in an in-app bug report.
      </p>

      <h2>8. Children</h2>
      <p>
        cpproad is not directed at children under 13, and we do not knowingly collect personal
        information from them. If you believe a child under 13 has created an account, delete it
        from Profile or contact us via an in-app bug report so we can remove it.
      </p>

      <h2>9. Security</h2>
      <p>
        We use HTTPS, encrypted storage for API keys and GitHub tokens, and per-user database
        policies. Code you run is sent to a third-party sandbox whose isolation and patch level we
        do not fully control. Do not put secrets, passwords, or production credentials into code you
        run on cpproad.
      </p>
      <p>No method of transmission or storage is perfectly secure.</p>

      <h2>10. Changes</h2>
      <p>
        We may update this policy as the Service changes. The effective date at the top will
        change when we do. Continued use after an update means the new policy applies.
      </p>

      <h2>11. Contact</h2>
      <p>
        For privacy requests, use Profile → Delete account for erasure, or send an in-app bug
        report describing what you need. See also our <Link href="/terms">Terms of Service</Link>.
      </p>
    </LegalPage>
  );
}
