import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function Help() {
  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header />
      <main className="max-w-3xl mx-auto p-6 space-y-6">
        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-cyan-400 mb-2">Need Help Lets Getting Started</h2>
          <p>
            Check out our <a href="/quick-start" className="text-cyan-300 hover:underline"><strong>Quick Start Guide</strong></a> 
            to learn how to make the most of IVContent’s tools in just minutes.
          </p>
        </section>

        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-orange-500 mb-2">FAQs</h2>
          <p>
            Find answers to common questions in our <a href="/faq" className="text-cyan-300 hover:underline"><strong>Frequently Asked Questions</strong></a> section.
          </p>
        </section>

        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-purple-400 mb-2">Contact Us</h2>
          <p>
            If you still need help, send us an email at <a href="mailto:IVContent.com@gmail.com" className="text-cyan-300 hover:underline"><strong>IVContent.com@gmail.com</strong></a> and we’ll get back to you within 24 hours.
          </p>
        </section>
        <section className="bg-gray-800 p-5 rounded shadow">
          <h2 className="text-2xl font-semibold text-orange-500 mb-2">Settings</h2>
          <p>
            need to fix your face in <a href="/settings" className="text-cyan-300 hover:underline"><strong>Settings</strong></a> section.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

