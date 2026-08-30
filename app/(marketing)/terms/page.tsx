import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — cpproad",
  description: "Terms that apply when you use cpproad.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        These terms govern your use of the hosted cpproad website and learning app (the
        “Service”). By creating an account or using the Service, you agree to them. If you do
        not agree, do not use cpproad.
      </p>
      <p>
        Related: our <Link href="/privacy">Privacy Policy</Link>. The software that powers
        cpproad is <a href="https://github.com/1RaghavM/cpp-course">open source under the MIT
        License</a>. MIT governs copies of that source code. These terms govern use of the
        hosted Service and other people’s data on it.
      </p>

      <h2>1. The Service</h2>
      <p>
        cpproad is a C++ learning app: lesson summaries, exercises, a browser editor, a sandboxed
        compiler, spaced review, notes, and an optional AI tutor that runs on an API key you
        provide. Access is currently free with open email-and-password signup. We may change,
        limit, or discontinue features at any time.
      </p>
      <p>
        Lesson materials are original summaries and exercises organized around a public C++
        curriculum. cpproad is not affiliated with learncpp.com. Links to third-party lessons are
        provided for reference; those sites have their own terms.
      </p>

      <h2>2. Open source (MIT)</h2>
      <p>
        The cpproad source code, including curriculum files in the repository, is licensed under
        the MIT License. You may use, copy, modify, merge, publish, distribute, sublicense,
        and/or sell copies of that software, subject to keeping the copyright and permission
        notice. The license is in{" "}
        <a href="https://github.com/1RaghavM/cpp-course/blob/master/LICENSE">LICENSE</a> in the
        repository.
      </p>
      <p>MIT does not:</p>
      <ul>
        <li>Give you rights to other users’ accounts, code, notes, or personal data on this Service.</li>
        <li>Let you use the cpproad name, logo, or branding as if you operate this hosted instance.</li>
        <li>Replace these terms for people using this hosted Service.</li>
      </ul>
      <p>
        If you run your own instance from the source, you are responsible for that instance,
        including privacy and legal compliance.
      </p>

      <h2>3. Accounts</h2>
      <p>
        You must be at least 13 years old. You are responsible for your account and for keeping
        login credentials confidential. You register with email and password. We do not
        currently offer Sign in with Google.
      </p>
      <p>
        You can delete your account from Profile. Deletion is permanent for data stored in the
        Service, subject to the exceptions in the Privacy Policy (for example, code you already
        published to GitHub).
      </p>

      <h2>4. Your content</h2>
      <p>
        You retain ownership of code, notes, and other content you submit (“Your Content”). You
        grant us a license to host, store, process, and display Your Content as needed to operate
        the Service — including sending code to the compiler sandbox and, if you enable the
        tutor, sending conversation context to the model provider.
      </p>
      <p>
        If you connect GitHub, you also authorize us to commit passed submissions to the public
        repository you choose. You are responsible for that public copy.
      </p>
      <p>Do not submit content you do not have the right to use.</p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the compiler or playground to attack, probe, or disrupt any system.</li>
        <li>Attempt to escape the sandbox, mine cryptocurrency, or send spam or malware.</li>
        <li>Interfere with other users or with our infrastructure, rate limits, or security.</li>
        <li>Misrepresent your identity or access another person’s account.</li>
        <li>Use the Service in violation of applicable law.</li>
      </ul>
      <p>
        Copying the open-source repository under MIT is allowed. Using the hosted Service to
        scrape other users’ data, overload the compiler, or impersonate this instance is not.
      </p>
      <p>We may suspend or delete accounts that violate these rules.</p>

      <h2>6. AI tutor and your API key</h2>
      <p>
        The tutor is optional. To use it you supply your own Google Gemini API key. Usage is
        billed by Google to you. You are responsible for that key, its quotas, and Google’s terms
        for Gemini. We encrypt the key at rest and use it only to fulfill your tutor requests.
      </p>
      <p>
        Tutor replies can be wrong, incomplete, or unhelpful. They are not a substitute for
        reading the lesson, writing the code, or professional advice. Do not paste secrets into
        the tutor.
      </p>

      <h2>7. Code execution</h2>
      <p>
        Code you run is compiled and executed by a third-party sandbox (Judge0, currently via a
        shared RapidAPI host). Isolation, patch level, and rate limits are not fully under our
        control. The sandbox is for learning exercises, not untrusted production workloads.
      </p>
      <p>Never put production secrets or personal data you cannot afford to expose into code you run here.</p>

      <h2>8. Branding</h2>
      <p>
        The cpproad name and logo identify this project and this hosted Service. MIT covers the
        source code, not a right to present a fork or clone as the official cpproad site.
      </p>

      <h2>9. Third-party services</h2>
      <p>
        Sign-in, hosting, analytics, compilation, the tutor model, and optional GitHub sync are
        provided by third parties. Their terms apply to their services. An outage or policy
        change on their side can affect cpproad. How we share data with them is described in the{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>10. Disclaimers</h2>
      <p>
        THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM WARRANTIES OF
        MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT, TO THE
        EXTENT PERMITTED BY LAW. The MIT License contains a similar disclaimer for the software.
        We do not warrant that the curriculum is complete, that exercises are free of errors,
        that the compiler will always be available, or that the tutor is accurate.
      </p>

      <h2>11. Limitation of liability</h2>
      <p>
        TO THE EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
        CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, DATA, OR GOODWILL, ARISING FROM
        YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM RELATING TO THE SERVICE IS
        LIMITED TO THE AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM
        (CURRENTLY ZERO IF YOU USE THE FREE SERVICE).
      </p>
      <p>Some places do not allow these limits; in those places, our liability is limited to the maximum permitted.</p>

      <h2>12. Changes</h2>
      <p>
        We may update these terms. The effective date at the top will change when we do.
        Continued use after an update means you accept the new terms. If you do not, stop using
        the Service and delete your account.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions about these terms can be sent through an in-app bug report. Account deletion is
        in Profile. Source and license questions:{" "}
        <a href="https://github.com/1RaghavM/cpp-course">github.com/1RaghavM/cpp-course</a>. See
        also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
