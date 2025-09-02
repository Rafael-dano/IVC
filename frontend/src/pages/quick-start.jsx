import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export default function QuickStart() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">Quick Start Guide</h1>
        <p className="mb-6 text-gray-700">Learn how to use IVContent in minutes</p>

        <h2 className="text-2xl font-semibold mb-2">Video Walkthrough</h2>
        <div className="mb-6">
          <iframe
            className="w-full h-96 rounded-md"
            src="https://www.youtube.com/embed/VIDEO_ID"
            title="IVContent Quick Start"
          />
        </div>

        <h2 className="text-2xl font-semibold mb-2">Step-by-Step Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 mb-6">
          <li><strong>Sign Up or Log In</strong> – Create your IVContent account or log in to your existing one.</li>
          <li><strong>Enter Your Content</strong> – Paste your blog, video script, or text into the input box.</li>
          <li><strong>Select a Format</strong> – Choose what you want to create (e.g., Blog Summary, TikTok Script, Pinterest Caption).</li>
          <li><strong>Click 'Repurpose'</strong> – Let IVContent work its magic and instantly transform your content.</li>
          <li><strong>Review & Edit</strong> – Make any tweaks to your generated content in the output box.</li>
          <li><strong>Download or Copy</strong> – Save your new content as a file or copy it to your clipboard for immediate use.</li>
        </ol>

        <a
          href="/help"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        ><strong>
          ← Back to Help Page </strong>
        </a>
      </main>
      <Footer />
    </div>
  );
}
