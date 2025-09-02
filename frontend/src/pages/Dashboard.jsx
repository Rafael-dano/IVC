import { useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import RepurposeTool from '../components/RepurposeTool.jsx';

export default function Dashboard() {
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} font-sans`}>
      <Header darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold mb-6 text-center">Your Repurpose Tool</h2>
        <RepurposeTool />
      </main>
      <Footer />
    </div>
  );
}
