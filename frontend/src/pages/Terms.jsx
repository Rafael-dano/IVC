// src/pages/Terms.jsx
import { useEffect } from "react";

const effectiveDate = "September 19, 2025"; // update when you publish

export default function Terms() {
  useEffect(() => {
    document.title = "Terms of Service — IVContent";
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-gray-800">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-sm text-gray-500 mt-1">Effective date: {effectiveDate}</p>
      </header>

      <nav aria-label="Table of contents" className="mb-8">
        <ul className="list-disc pl-5 text-sm text-gray-700 grid sm:grid-cols-2 gap-x-6 gap-y-1">
          {[
            "Agreement to Terms",
            "Who We Are",
            "Accounts & Eligibility",
            "Plans, LTD, Billing & Taxes",
            "Acceptable Use",
            "Your Content; License to Us",
            "AI Outputs & Accuracy",
            "Intellectual Property",
            "Third-Party Services",
            "Beta Features",
            "Warranty Disclaimer",
            "Limitation of Liability",
            "Indemnity",
            "Termination",
            "Changes to the Service or Terms",
            "Governing Law; Venue",
            "Contact"
          ].map((t, i) => (
            <li key={i}>
              <a className="hover:underline" href={`#s${i+1}`}>{t}</a>
            </li>
          ))}
        </ul>
      </nav>

      <section className="prose prose-neutral max-w-none">
        <h2 id="s1">1. Agreement to Terms</h2>
        <p>
          By accessing or using IVContent (the “Service”), you agree to be bound by these Terms of Service (“Terms”).
          If you do not agree, do not use the Service.
        </p>

        <h2 id="s2">2. Who We Are</h2>
        <p>
          IVContent is a content-repurposing platform that helps users transform long-form content (e.g., text, audio, video) into multiple formats.
        </p>

        <h2 id="s3">3. Accounts &amp; Eligibility</h2>
        <p>
          You must be at least 13 (or the age of digital consent in your region) to use the Service. You are responsible for safeguarding your
          account credentials and for all activity under your account.
        </p>

        <h2 id="s4">4. Plans, LTD, Billing &amp; Taxes</h2>
        <ul>
          <li><strong>Plans.</strong> We may offer free, beta, subscription, and lifetime-deal (“LTD”) plans. Plan features and limits are described in-app and may change.</li>
          <li><strong>LTD.</strong> LTD is a one-time purchase granting ongoing access to the features and limits available to LTD holders, which may evolve over time. LTDs are non-renewing.</li>
          <li><strong>Pricing &amp; Taxes.</strong> Prices may change. You authorize us (and our payment processor) to charge your payment method for due amounts, including applicable taxes.</li>
          <li><strong>Refunds.</strong> Except where required by law, payments are non-refundable.</li>
        </ul>

        <h2 id="s5">5. Acceptable Use</h2>
        <p>
          You agree not to: (a) violate any law; (b) attempt to access non-public areas; (c) interfere with the Service’s operation;
          (d) upload infringing, unlawful, or harmful content; (e) use outputs to deceive or cause harm.
        </p>

        <h2 id="s6">6. Your Content; License to Us</h2>
        <p>
          You retain ownership of content you upload. You grant us a non-exclusive, worldwide, royalty-free license to host, process, display,
          and create derivative works as needed to operate and improve the Service. You represent you have all rights necessary to grant this license.
        </p>

        <h2 id="s7">7. AI Outputs &amp; Accuracy</h2>
        <p>
          Outputs may be inaccurate, incomplete, or inappropriate for your use case. You are responsible for reviewing outputs and for your decisions based on them.
        </p>

        <h2 id="s8">8. Intellectual Property</h2>
        <p>
          The Service, including software, designs, and trademarks, is owned by us or our licensors. Except for rights expressly granted, no license is implied.
        </p>

        <h2 id="s9">9. Third-Party Services</h2>
        <p>
          The Service may integrate third-party services (e.g., payments, authentication, hosting). We are not responsible for third-party content or services.
        </p>

        <h2 id="s10">10. Beta Features</h2>
        <p>
          We may offer experimental features that may be modified, suspended, or discontinued at any time and may be subject to additional terms.
        </p>

        <h2 id="s11">11. Warranty Disclaimer</h2>
        <p>
          THE SERVICE IS PROVIDED “AS IS” AND “AS AVAILABLE.” WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h2 id="s12">12. Limitation of Liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES,
          OR ANY LOSS OF PROFITS OR DATA. OUR TOTAL LIABILITY FOR ANY CLAIMS RELATING TO THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID TO US IN THE
          12 MONTHS BEFORE THE EVENT GIVING RISE TO LIABILITY (OR $50 IF YOU PAID NOTHING).
        </p>

        <h2 id="s13">13. Indemnity</h2>
        <p>
          You will indemnify and hold us harmless from any claims, damages, liabilities, and expenses arising from your content, use of the Service,
          or breach of these Terms.
        </p>

        <h2 id="s14">14. Termination</h2>
        <p>
          You may stop using the Service at any time. We may suspend or terminate access for any reason, including violation of these Terms.
          Upon termination, Sections 6–13 survive.
        </p>

        <h2 id="s15">15. Changes to the Service or Terms</h2>
        <p>
          We may modify the Service and these Terms. If changes are material, we will provide reasonable notice (e.g., in-app).
          Your continued use after changes take effect constitutes acceptance.
        </p>

        <h2 id="s16">16. Governing Law; Venue</h2>
        <p>
          These Terms are governed by the laws of the State of Texas, USA, without regard to conflict-of-laws rules.
          Courts located in Texas will have exclusive jurisdiction.
        </p>

        <h2 id="s17">17. Contact</h2>
        <p>
          Questions? Email us at <a className="underline" href="mailto:ivcontent.com@gmail.com">ivcontent.com@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
