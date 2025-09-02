import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function Beta() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 text-gray-900 font-sans">
      <Header />
      <main className="text-center p-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-4xl font-bold text-purple-700">IVContent Beta</h1>
          <p className="text-lg text-gray-700">Secure your spot to become a Beta Tester for IVContent. Help Build A Better Website!!</p>
        </header>

        <section className="flex justify-center">
          <iframe
            src="https://docs.google.com/forms/d/e/1FAIpQLSd7uBZXM_MGapqo9BKdXVc9ZtDRV_DzRnVHPNGOEcsQzCSu_g/viewform?embedded=true"
            width="640"
            height="2677"
            frameBorder="0"
            marginHeight="0"
            marginWidth="0"
            className="rounded-md shadow-lg"
            title="IVContent Beta Signup"
          >
            Loading…
          </iframe>
        </section>

        <section>
          <a
            href="/ltd"
            className="inline-block mt-4 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            ← Back to Lifetime Deals
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
