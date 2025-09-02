import { useState, useEffect, useRef } from 'react';
import { generateContent } from '../api/textGeneration.js';
import { supabase } from '../api/supabaseClient.js';
import "./Repurpose.css";

export default function RepurposeTool() {
  const [inputText, setInputText] = useState('');
  const [repurposedText, setRepurposedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState('blog-post');
  const [darkMode, setDarkMode] = useState(true);
  const [isCarousel, setIsCarousel] = useState(false);
  const outputRef = useRef(null);

  const NO_INPUT_REQUIRED = ['carousel-generator'];

  async function handleRepurpose() {
    setLoading(true);
    setRepurposedText("");
    setIsCarousel(false);
  
    try {
      // Check for required input
      if (!inputText.trim() && !NO_INPUT_REQUIRED.includes(format)) {
        setRepurposedText('⚠️ Please enter some content first.');
        return;// finally will turn loading off
      }
  
      // ✅ Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRepurposedText('⚠️ You must be logged in to use this feature.');
        return;
      }
  
      let prompt = "";
  
      // Build prompt based on format
      if (format === 'carousel-generator') {
        prompt = `Create a carousel with 5 slides about: ${inputText || 'any engaging topic'}`;
        const aiResponse = await generateContent(user.id, prompt);
        const slides = aiResponse.split("\n\n").map((chunk, i) => ({
          title: `Slide ${i + 1}`,
          content: chunk.trim()
        }));
        setRepurposedText(slides);
        setIsCarousel(true);
        return;
      }
  
      if (format === 'blog-to-email') {
        prompt = `Repurpose the following text into an email:\n\n${inputText}`;
      } else if (format === 'pinterest-caption') {
        prompt = `Repurpose the following text into a Pinterest caption:\n\n${inputText}`;
      } else {
        // Default generic transformation
        prompt = `Repurpose this text into ${format} format:\n\n${inputText}`;
      }
  
      // ✅ Call your text generation function
      const aiResponse = await generateContent(user.id, prompt);
      setRepurposedText(aiResponse);
  
    } catch (err) {
      console.error(err);
      if (err.message.includes("Usage limit reached")) {
        setRepurposedText("⚠️ You’ve reached your free-tier limit. Please upgrade to continue.");
      } else {
        setRepurposedText('❌ Error generating content.');
      }
    } finally {
      setLoading(false);
      outputRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }  

  // ✅ Load saved state from localStorage
  useEffect(() => {
    setInputText(localStorage.getItem('repurpose-input') || '');
    setRepurposedText(localStorage.getItem('repurpose-output') || '');
    setFormat(localStorage.getItem('repurpose-format') || 'blog-post');
  }, []);

  useEffect(() => {
    localStorage.setItem('repurpose-input', inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem('repurpose-output', repurposedText);
  }, [repurposedText]);

  useEffect(() => {
    localStorage.setItem('repurpose-format', format);
  }, [format]);

  function copyToClipboard() {
    if (typeof repurposedText === "string") {
      navigator.clipboard.writeText(repurposedText).then(() => {
        alert("✅ Copied to clipboard!");
      });
    } else {
      // If carousel mode (array of slides)
      const textVersion = repurposedText.map(slide => `${slide.title}\n${slide.content}`).join("\n\n");
      navigator.clipboard.writeText(textVersion).then(() => {
        alert("✅ Carousel copied to clipboard!");
      });
    }
  }  

  // ✅ Header Component
  const Header = () => (
    <header className="w-full px-6 py-4 flex items-center justify-between bg-gray-800 text-white shadow-md">
      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
        <span className="text-3xl">♻️</span> IV <span className="text-cyan-400">Content</span>
      </h1>
    </header>
  );

  return (
    <div className={`repurpose-page min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} font-sans`}>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-12">
      <section className="repurpose-hero">
        <h2 className="repurpose-title text-3xl sm:text-4xl font-bold mb-2">
          Repurpose Smarter, Faster, Everywhere.
        </h2>
        <p className="repurpose-sub text-lg">Turn your content into summaries, scripts, captions and more — all in one place.</p>
      </section>

        <div className="repurpose-panel p-4 md:p-6 flex flex-col lg:flex-row gap-6">
        {/* Format Label */}
        <div className="mb-2 text-sm format-chip">
            {format === 'blog-post' && '📝 Blog Post'}
            {format === 'social-post' && '💬 Social Post'}
            {format === 'summary' && '📚 Summary'}
            {format === 'tweet-to-linkedin' && '🐦→💼 Tweet to LinkedIn'}
            {format === 'blog-to-caption' && '📝→📸 Blog to Instagram Caption'}
            {format === 'video-to-email' && '📹→✉️ Video to Email'}
            {format === 'youtube-summary' && '🎥 YouTube Summary'}
            {format === 'shorts-script' && '🎬 Shorts Script'}
            {format === 'pinterest-caption' && '📌 Pinterest Caption'}
            {format === 'blog-tldr' && '🧠 Blog TL;DR'}
            {format === 'thread-expander' && '🧵 Tweet → Blog Style Expansion'}
            {format === 'carousel-generator' && '🖼️ Carousel Generator'}
            {format === 'Text' && '🧠Idea Generator'}
            {format === 'content' && '📅 Content Calendar'}
            {format === 'Script' && '🎤AI Vocals'}
          </div>

          {/* Input Section */}
          <div className="w-full lg:w-1/2">
          <textarea
            className={`repurpose-textarea`}
            // keep your existing props
            placeholder="Paste or write your content here..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
            <select
              className="repurpose-select"
              value={format}
              onChange={e => setFormat(e.target.value)}
            >
              <option value="blog-post">Blog Post</option>
              <option value="social-post">Social Post</option>
              <option value="summary">Summary</option>
              <option value="tweet-to-linkedin">Tweet → LinkedIn</option>
              <option value="blog-to-caption">Blog → Instagram Caption</option>
              <option value="video-to-email">Video → Email Summary</option>
              <option value="youtube-summary">YouTube → Summary</option>
              <option value="shorts-script">YouTube → Shorts Script</option>
              <option value="pinterest-caption">Pinterest Caption</option>
              <option value="blog-tldr">Blog → TL;DR</option>
              <option value="thread-expander">Tweet → Blog Style Expansion</option>
              <option value="blog-to-email">Blog → Email Expander</option>
              <option value="carousel-generator">Carousel Generator "Coming Soon"</option>
              <option value="idea-generator">Idea Generator "Coming Soon" </option>
              <option value="calendar-generator">Content Calendar "Coming Soon"</option>
              <option value="script-to-vocal">AI Vocals "Coming Soon"</option>
            </select>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              className="btn-primary btn-block md:btn-block-md"
              onClick={handleRepurpose}
              disabled={loading || (!inputText.trim() && !NO_INPUT_REQUIRED.includes(format))}
            >
              Repurpose Content
            </button>

            <button
              className="btn-secondary btn-block md:btn-block-md"
              onClick={() => {
                setInputText('');
                setRepurposedText('');
                setIsCarousel(false);
              }}
            >
              Clear
            </button>
          </div>
        </div>

          {/* Output Section */}
        <div className="w-full lg:w-1/2" ref={outputRef}>
          {loading && (
            <p className="status-line text-xl font-semibold animate-pulse">
              Repurposing your content...
            </p>
          )}

          {!loading && repurposedText && (
            <>
              {isCarousel ? (
                <>
                  <div className="carousel-row">
                    {repurposedText.map((slide, index) => (
                      <div key={index} className="carousel-card">
                        <h3>{slide.title}</h3>
                        <p>{slide.content}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3 justify-end">
                    <button
                      className="btn-green"
                      onClick={() => alert('Mock download started — images would be generated here!')}
                    >
                      📥 Download Carousel as Images
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <pre className="repurpose-output">{repurposedText}</pre>
                  <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-end">
                    <button
                      className="btn-primary"
                      onClick={() => {
                        const blob = new Blob([repurposedText], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'repurposed.txt';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download .txt
                    </button>
                    <button
                      onClick={copyToClipboard}
                      className="btn-neutral"
                    >
                      📋 Copy to Clipboard
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <div className="h-12" />
    </main>
  </div>
);
}


