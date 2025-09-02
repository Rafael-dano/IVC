import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import "../styles/legacy.css";

export default function FAQ() {
  return (
    <div className="page-faq">
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
        <p className="mb-6 text-gray-700">Answers to common questions about IVContent</p>

        <div className="space-y-4">
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">What is IVContent?</h3>
            <p>IVContent is a content repurposing tool that helps you transform one piece of content into multiple formats for different platforms — saving you time, boosting reach, and helping you stay consistent.</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">How do I start using it?</h3>
            <p>Simply sign up for an account, choose a tool from the dashboard (like Blog TL;DR or Pinterest Caption Generator), paste your content, and click “Repurpose.”</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">What does the Lifetime Deal include?</h3>
            <p>The LTD gives you unlimited access to all current tools and future features, forever — with no monthly fees.</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">Can I upgrade later?</h3>
            <p>Yes! If you start with a monthly plan, you can upgrade to yearly or lifetime at any time from your account settings.</p>
          </div>
          <div className="bg-white p-5 rounded shadow">
            <h3 className="text-xl font-semibold mb-1">Is my data safe?</h3>
            <p>Absolutely. We never sell your data and only store what's necessary to run the service securely.</p>
          </div>
        </div>

        <a
          href="/help"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        ><strong>
          ← Back to Help</strong>
        </a>
      </main>
      <Footer />
    </div>
  );
}

