// src/pages/Landingpage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./Landingpage.css";
import Seo from "../components/Seo";
import LanguageSwitcher from "../components/LanguageSwitcher.jsx";
import Footer from "../components/Footer.jsx";
import { supabase } from "../api/supabaseClient.js";

export default function LandingPage() {
  const { t } = useTranslation();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let unsub;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthed(!!data?.session);
      } catch {
        setIsAuthed(false);
      }

      unsub = supabase.auth
        .onAuthStateChange((_event, session) => {
          setIsAuthed(!!session);
        })
        .data?.subscription;
    })();

    return () => unsub?.unsubscribe?.();
  }, []);

  const heroBullets = [
    t("landing.heroBullet1"),
    t("landing.heroBullet2"),
    t("landing.heroBullet3"),
  ].filter(Boolean);

  const heroTags = [
    t("landing.heroCardTag1"),
    t("landing.heroCardTag2"),
    t("landing.heroCardTag3"),
  ].filter(Boolean);

  const metrics = [
    {
      stat: t("landing.metricCreators"),
      label: t("landing.metricCreatorsLabel"),
    },
    {
      stat: t("landing.metricHours"),
      label: t("landing.metricHoursLabel"),
    },
    {
      stat: t("landing.metricFormats"),
      label: t("landing.metricFormatsLabel"),
    },
  ].filter((metric) => metric.stat && metric.label);

  const features = [
    {
      icon: "🎯",
      title: t("landing.f1Title"),
      description: t("landing.f1Sub"),
    },
    {
      icon: "✨",
      title: t("landing.f2Title"),
      description: t("landing.f2Sub"),
    },
    {
      icon: "⏱️",
      title: t("landing.f3Title"),
      description: t("landing.f3Sub"),
    },
  ];

  const spotlights = [
    {
      name: t("landing.betaSpotlights.spot1.name"),
      role: t("landing.betaSpotlights.spot1.role"),
      summary: t("landing.betaSpotlights.spot1.summary"),
      result: t("landing.betaSpotlights.spot1.result"),
      quote: t("landing.betaSpotlights.spot1.quote"),
      videoTitle: t("landing.betaSpotlights.spot1.videoTitle"),
    },
    {
      name: t("landing.betaSpotlights.spot2.name"),
      role: t("landing.betaSpotlights.spot2.role"),
      summary: t("landing.betaSpotlights.spot2.summary"),
      result: t("landing.betaSpotlights.spot2.result"),
      quote: t("landing.betaSpotlights.spot2.quote"),
      videoTitle: t("landing.betaSpotlights.spot2.videoTitle"),
    },
    {
      name: t("landing.betaSpotlights.spot3.name"),
      role: t("landing.betaSpotlights.spot3.role"),
      summary: t("landing.betaSpotlights.spot3.summary"),
      result: t("landing.betaSpotlights.spot3.result"),
      quote: t("landing.betaSpotlights.spot3.quote"),
      videoTitle: t("landing.betaSpotlights.spot3.videoTitle"),
    },
  ];

  const testimonials = [
    {
      quote: t("landing.reviews.r1.quote"),
      name: t("landing.reviews.r1.name"),
      role: t("landing.reviews.r1.role"),
    },
    {
      quote: t("landing.reviews.r2.quote"),
      name: t("landing.reviews.r2.name"),
      role: t("landing.reviews.r2.role"),
    },
    {
      quote: t("landing.reviews.r3.quote"),
      name: t("landing.reviews.r3.name"),
      role: t("landing.reviews.r3.role"),
    },
  ];

  const pricingTiers = [
    {
      key: "annual",
      name: t("landing.pricing.annual.name"),
      price: t("landing.pricing.annual.price"),
      description: t("landing.pricing.annual.description"),
      cta: t("landing.pricing.annual.cta"),
      benefits: [
        t("landing.pricing.annual.benefits.b1"),
        t("landing.pricing.annual.benefits.b2"),
        t("landing.pricing.annual.benefits.b3"),
      ],
    },
    {
      key: "annual_99",
      name: t("landing.pricing.annual_99.name"),
      price: t("landing.pricing.annual_99.price"),
      description: t("landing.pricing.annual_99.description"),
      cta: t("landing.pricing.annual_99.cta"),
      benefits: [
        t("landing.pricing.annual_99.benefits.b1"),
        t("landing.pricing.annual_99.benefits.b2"),
        t("landing.pricing.annual_99.benefits.b3"),
      ],
      featured: true,
    },
    {
      key: "annual_149",
      name: t("landing.pricing.annual_149.name"),
      price: t("landing.pricing.annual_149.price"),
      description: t("landing.pricing.annual_149.description"),
      cta: t("landing.pricing.annual_149.cta"),
      benefits: [
        t("landing.pricing.annual_149.benefits.b1"),
        t("landing.pricing.annual_149.benefits.b2"),
        t("landing.pricing.annual_149.benefits.b3"),
      ],
      featured: true,
    },
    {
      key: "lifetime",
      name: "Lifetime Access",
      price: "$400 one-time",
      description: "Pay once and unlock IVContent forever.",
      cta: "Unlock lifetime access",
      benefits: [
        "Every current and future tool included",
        "Unlimited projects forever",
        "VIP feature requests and roadmap input",
        "Members-only founder community",
      ],
    },
  ];

  return (
    <div className="landing-page">
      <Seo
        title="IVContent – Repurpose your content fast"
        description="Turn videos, tweets, and notes into blogs, emails, and shorts in minutes. Multilingual. Built for creators."
        url="https://ivcontent.com/"
        image="https://ivcontent.com/og.jpg"
      />

       <nav className="landing-navbar">
        <Link to="/" className="landing-logo" aria-label="IVContent home">
          IV<span>Content</span>
        </Link>
        <div className="landing-nav-actions">
          <div className="landing-nav-links">
            <Link to="/quick-start">Quickstart</Link>
            <Link to="/faq">FAQ</Link>
            <Link
              to={
                isAuthed
                  ? "/app"
                  : {
                      pathname: "/login",
                      state: { from: "/app" },
                    }
              }
            >
              {t("nav.tool", "Tool")}
            </Link>
          </div>
          <LanguageSwitcher />
          <div className="landing-nav-auth">
            <Link to="/login" className="landing-nav-login">
              {t("nav.login", "Log in")}
            </Link>
            <Link to="/signup" className="landing-nav-signup">
              {t("nav.signup", "Sign up")}
            </Link>
          </div>
          </div>
      </nav>

      <main className="landing-main">
        <header className="landing-hero">
          <div className="landing-hero-content">
            <span className="hero-badge">{t("landing.heroHighlight")}</span>
            <h1>{t("landing.heroTitle")}</h1>
            <p className="hero-sub">{t("landing.heroSub")}</p>
            {heroBullets.length > 0 && (
              <ul className="hero-bullets">
                {heroBullets.map((bullet, index) => (
                  <li key={index}>
                    <span className="bullet-icon" aria-hidden="true">
                      •
                    </span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="hero-cta">
              <Link to="/signup" className="primary-button">
                {t("landing.cta")}
              </Link>
              <Link to="/signup" className="secondary-button">
                {t("landing.heroSecondaryCta")}
              </Link>
            </div>
            <p className="hero-trusted">{t("landing.trustedBy")}</p>
          </div>
         
          <div className="landing-hero-visual">
            <div className="floating-card">
              <div className="floating-card-header">
                {t("landing.heroCardTitle")}
              </div>
              <p className="floating-card-body">{t("landing.heroCardBody")}</p>
              <div className="floating-card-tags">
                {heroTags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="floating-metrics">
              {metrics.map(({ stat, label }) => (
                <div className="metric-pill" key={stat}>
                  <span className="metric-stat">{stat}</span>
                  <span className="metric-label">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="landing-section landing-features">
          <div className="section-headline">
            <span className="section-eyebrow">{t("landing.featuresLabel")}</span>
            <h2>{t("landing.featuresTitle")}</h2>
            <p>{t("landing.featuresSubtitle")}</p>
          </div>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <div className="landing-feature-card" key={feature.title}>
                <div className="feature-icon" aria-hidden="true">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
              ))}
              </div>
            </section>

            <section className="landing-section landing-spotlights">
          <div className="section-headline">
            <span className="section-eyebrow">{t("landing.betaSpotlightsLabel")}</span>
            <h2>{t("landing.betaSpotlightsTitle")}</h2>
            <p>{t("landing.betaSpotlightsSubtitle")}</p>
          </div>
          <div className="spotlight-grid">
            {spotlights.map((spotlight, index) => (
              <article className="spotlight-card" key={spotlight.name || index}>
                <div className="spotlight-video" aria-label={t("landing.betaVideoLabel")}>
                  <div className="video-badge">{t("landing.betaVideoLabel")}</div>
                  <div className="video-title">{spotlight.videoTitle}</div>
                  <div className="video-wave" aria-hidden="true" />
                </div>
                <div className="spotlight-body">
                  <h3>{spotlight.videoTitle}</h3>
                  <p className="spotlight-summary">{spotlight.summary}</p>
                  <p className="spotlight-result">{spotlight.result}</p>
                  <blockquote className="spotlight-quote">{spotlight.quote}</blockquote>
                  <div className="spotlight-meta">
                    <span className="spotlight-name">{spotlight.name}</span>
                    <span className="spotlight-role">{spotlight.role}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-testimonials">
          <div className="section-headline">
            <span className="section-eyebrow">{t("landing.testimonialsLabel")}</span>
            <h2>{t("landing.testimonialsTitle")}</h2>
            <p>{t("landing.testimonialsSubtitle")}</p>
          </div>
          <div className="testimonial-grid">
            {testimonials.map((testimonial, index) => (
              <figure className="testimonial-card" key={testimonial.name || index}>
                <blockquote>{testimonial.quote}</blockquote>
                <figcaption>
                  <span className="testimonial-name">{testimonial.name}</span>
                  <span className="testimonial-role">{testimonial.role}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="landing-section landing-pricing">
          <div className="section-headline">
            <span className="section-eyebrow">{t("landing.pricingLabel")}</span>
            <h2>{t("landing.pricingTitle")}</h2>
            <p>{t("landing.pricingSubtitle")}</p>
          </div>
          <div className="pricing-grid">
            {pricingTiers.map((tier) => (
              <article
                key={tier.key}
                className={`pricing-card${tier.featured ? " featured" : ""}`}
              >
                <div className="pricing-card-head">
                  <h3>{tier.name}</h3>
                  <p className="pricing-price">{tier.price}</p>
                  <p className="pricing-description">{tier.description}</p>
                </div>
                <ul className="pricing-benefits">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="pricing-cta"
                  onClick={() => navigate("/signup")}
                >
                  {tier.cta}
                </button>
                </article>
            ))}
          </div>
          <p className="pricing-disclaimer">{t("landing.pricingDisclaimer")}</p>
        </section>

        <section className="landing-cta">
        <div className="landing-cta-content">
            <h2>{t("landing.ctaFinalTitle")}</h2>
            <p>{t("landing.ctaFinalSubtitle")}</p>
            <div className="landing-cta-actions">
              <Link to="/signup" className="primary-button">
                {t("landing.ctaFinalButton")}
              </Link>
              <Link to="/signup" className="secondary-button">
                {t("landing.heroSecondaryCta")}
              </Link>
            </div>
          </div>
          </section>
          </main> 
          
          <Footer />
    </div>
  );
}