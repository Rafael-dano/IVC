import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          IVContent — Repurpose Content. Multiply Impact.
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl mb-8">
          Instantly transform your blogs, videos, and social posts into multiple formats 
          with AI. Save hours, reach more people, and grow your audience.
        </p>
        <Link
          to="/signup"
          className="bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          Join the Beta
        </Link>
      </section>

      {/* Features */}
      <section className="bg-gray-800 py-16 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
          <div>
            <h3 className="text-xl font-bold mb-3">Multi-Platform Output</h3>
            <p className="text-gray-400">
              From blog posts to Twitter threads, LinkedIn carousels, Pinterest captions and more — all in seconds.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">AI-Powered Editing</h3>
            <p className="text-gray-400">
              Smart rewriting, tone adjustments, and format optimization to match your audience’s style.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">Time-Saving Workflow</h3>
            <p className="text-gray-400">
              Automate your content repurposing pipeline and focus on creating, not reformatting.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="bg-gray-900 py-16 px-6 text-center">
        <h2 className="text-2xl font-bold mb-6">What Early Testers Are Saying</h2>
        <p className="text-gray-400 italic mb-4">"Beta tester reviews coming soon..."</p>
        <p className="text-gray-400 italic">"This section will showcase real stories after launch."</p>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6">Be the First to Experience IVContent</h2>
        <Link
          to="/signup"
          className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold transition-colors hover:bg-gray-100"
        >
          Join the Beta
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 text-center py-6">
        <p>© {new Date().getFullYear()} IVContent — All rights reserved.</p>
      </footer>
    </div>
  );
}
