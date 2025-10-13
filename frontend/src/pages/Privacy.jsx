// src/pages/Privacy.jsx
import { useEffect } from "react";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";

const effectiveDate = "September 19, 2025"; // update on publish

export default function Privacy() {
  useEffect(() => {
    document.title = "Privacy Policy — IVContent";
  }, []);

  return (
    <div className="page-shell">
    <Header />
    <main className="page-content page-content--narrow">
      <article className="legal-card prose-accent">
        <header>
          <h1>Privacy Policy</h1>
          <p className="legal-meta">Effective date: {effectiveDate}</p>
        </header>

        <section className="legal-body">
          <h2>1. Overview</h2>
          <p>
            This Privacy Policy explains how IVContent (the “Service”) collects, uses, and shares information when you use our website
            and applications.
          </p>

          <h2>2. Information We Collect</h2>
          <p>
            <strong>Account Data:</strong> email address, name (if provided), authentication identifiers.<br />
            <strong>Content &amp; Usage Data:</strong> content you upload or paste; prompts, outputs, and related metadata; feature usage and
            diagnostics.<br />
            <strong>Payment Data:</strong> processed by our payment processors (e.g., Stripe); we receive limited billing metadata.<br />
            <strong>Device/Log Data:</strong> IP address, browser type, pages visited, timestamps, language and region settings.<br />
            <strong>Cookies &amp; Local Storage:</strong> used for authentication, preferences, analytics, and performance.
          </p>

          <h2>3. How We Use Information</h2>
          <ul>
            <li>Provide, maintain, and improve the Service.</li>
            <li>Transcribe, process, and generate outputs you request.</li>
            <li>Prevent abuse, secure accounts, and enforce limits.</li>
            <li>Communicate service updates, transactional messages, and (with consent where required) marketing.</li>
            <li>Comply with legal obligations.</li>
          </ul>

          <h2>4. AI Processing</h2>
          <p>
            We use AI models to process content you submit and to generate outputs. Do not submit sensitive personal data unless strictly
            necessary. You are responsible for reviewing outputs before using them.
          </p>

          <h2>5. Legal Bases (where applicable)</h2>
          <p>
            We process data to perform our contract with you, for our legitimate interests (e.g., security, product improvement), with your
            consent, and to comply with legal obligations.
          </p>

          <h2>6. Sharing of Information</h2>
          <p>
            We share information with: (a) service providers (e.g., hosting, analytics, payments, email), bound by confidentiality agreements;
            (b) authorities when required by law or to protect rights; (c) in connection with a merger, acquisition, or asset sale.
          </p>

          <h2>7. Data Retention</h2>
          <p>
            We retain information for as long as needed to provide the Service, comply with legal obligations, resolve disputes, and enforce agreements.
            You may request deletion where required by law.
          </p>

          <h2>8. Security</h2>
          <p>
            We implement technical and organizational measures designed to protect information; however, no method of transmission or storage is
            completely secure.
          </p>

          <h2>9. Your Choices &amp; Rights</h2>
          <p>
            You may access and update certain account information in Settings. Depending on your region, you may have rights to access, correct, delete,
            or port your data, and to object to or restrict processing. Contact us to exercise these rights.
          </p>

          <h2>10. International Data Transfers</h2>
          <p>
            We may transfer, store, and process information in countries other than where you live. We take steps to ensure appropriate safeguards are in place.
          </p>

          <h2>11. Children</h2>
          <p>
            The Service is not directed to children under 13 (or the age of digital consent in your region). We do not knowingly collect information from such children.
          </p>

          <h2>12. Communications</h2>
          <p>
            We may send transactional emails (e.g., confirmations, receipts). With consent where required, we may send product updates or newsletters; you can unsubscribe at any time.
          </p>

          <h2>13. Changes to this Policy</h2>
          <p>
            We may update this Policy. If changes are material, we will provide reasonable notice (e.g., in-app). Your continued use of the Service after the changes take effect constitutes acceptance.
          </p>

          <h2>14. Contact</h2>
          <p>
            Questions or requests? Email <a href="mailto:ivcontent.com@gmail.com">ivcontent.com@gmail.com</a>.
          </p>
        </section>
      </article>
    </main>
    <Footer />
  </div>
  );
}
