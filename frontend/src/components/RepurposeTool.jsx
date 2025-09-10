import { useState, useEffect, useRef } from 'react';
import { generateContent } from '../api/textGeneration.js';
import { supabase } from '../api/supabaseClient.js';
import { jsPDF } from "jspdf";
import "./Repurpose.css";
import { useTranslation } from "react-i18next";
import i18n from "i18next";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export default function RepurposeTool() {
  const { t } = useTranslation();

  const [inputText, setInputText] = useState('');
  const [repurposedText, setRepurposedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [format, setFormat] = useState('blog-post');
  const [darkMode] = useState(true);
  const [isCarousel, setIsCarousel] = useState(false);
  const outputRef = useRef(null);

  // transcript language (for local video transcription). Default to UI language.
  const [transcriptLang, setTranscriptLang] = useState(i18n.language || "en");

  // Formats that do not require input text (either they use a file or generate content)
  const NO_INPUT_REQUIRED = ['carousel-generator', 'video-summary', 'video-shorts-script'];

  // Formats that are not implemented yet
  const COMING_SOON = new Set(['idea-generator', 'calendar-generator', 'script-to-vocal']);

  // Pretty label for the chip
  const FORMAT_LABEL = {
    'blog-post': '📝 Blog Post',
    'social-post': '💬 Social Post',
    'summary': '📚 Summary',
    'tweet-to-linkedin': '🐦→💼 Tweet to LinkedIn',
    'blog-to-caption': '📝→📸 Blog to Instagram Caption',
    'video-to-email': '📹→✉️ Video to Email',

    // NEW local video flows
    'video-summary': '🎥 Local Video → Summary',
    'video-shorts-script': '🎬 Local Video → Shorts Script',

    // (YouTube formats removed for now)
    'pinterest-caption': '📌 Pinterest Caption',
    'blog-tldr': '🧠 Blog TL;DR',
    'thread-expander': '🧵 Tweet → Blog Expansion',
    'blog-to-email': '✉️ Blog → Email Expander',
    'carousel-generator': '🖼️ Carousel Generator',
    'idea-generator': '💡 Idea Generator (Coming Soon)',
    'calendar-generator': '📅 Content Calendar (Coming Soon)',
    'script-to-vocal': '🎤 AI Vocals (Coming Soon)',
  };
  const chipText = FORMAT_LABEL[format] || '⚙️ Custom';

  // keep transcriptLang in sync with UI language if user hasn’t changed it
  useEffect(() => {
    setTranscriptLang(prev => prev || i18n.language || "en");
  }, [i18n.language]);

  function languageHint() {
    const map = {
      en: "English", es: "Spanish", fr: "French", de: "German",
      pt: "Portuguese", it: "Italian", nl: "Dutch",
      ja: "Japanese", ko: "Korean", hi: "Hindi"
    };
    const code = i18n.language || "en";
    return map[code] || "English";
  }

  async function transcribeLocalVideo(file, lang = "en") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("lang", lang);

    // Attach Supabase auth token for requireUser middleware
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;

    const resp = await fetch(`${API_BASE}/api/video/transcribe`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error || "Upload/transcription failed");
    }
    return resp.json(); // { ok, text, ... }
  }

  async function handleRepurpose() {
    setLoading(true);
    setRepurposedText("");
    setIsCarousel(false);

    try {
      if (COMING_SOON.has(format)) {
        setRepurposedText('🚧 This feature is coming soon. Stay tuned!');
        return;
      }

      // Special case: local video formats use file instead of textarea
      const requiresText =
        !NO_INPUT_REQUIRED.includes(format) &&
        !(format === 'video-summary' || format === 'video-shorts-script');

      if (requiresText && !inputText.trim()) {
        setRepurposedText(t("repurpose.needInput"));
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRepurposedText(t("repurpose.needLogin"));
        return;
      }

      // ---- Local video formats ----
      if (format === "video-summary" || format === "video-shorts-script") {
        if (!videoFile) {
          setRepurposedText("⚠️ Please choose a video file first (.mp4 recommended).");
          return;
        }

        setUploading(true);
        const { text: transcript } = await transcribeLocalVideo(videoFile, transcriptLang)
          .finally(() => setUploading(false));

        if (!transcript || !transcript.trim()) {
          setRepurposedText("⚠️ Transcription returned empty text.");
          return;
        }

        let prompt;
        if (format === "video-summary") {
          prompt = `
You are a precise assistant. Using the video transcript below, produce:

1) Key takeaways — 5–7 concise bullets.
2) Short summary — one crisp paragraph (3–5 sentences).
3) Action items / To-do — if the speaker mentions tasks or steps, list them clearly as checkboxes.
4) Items / ingredients / tools — if the speaker mentions materials (e.g., groceries, parts, gear), list them as bullets.

Respond in ${languageHint()}.

Transcript:
${transcript}
          `.trim();
        } else {
          prompt = `
You are a creator coach. Using the video transcript below, write a 45–60 second vertical video script:
- Hook in first line
- 3–4 punchy points (short sentences)
- Clear CTA in the last line
- Keep it conversational and energetic
- If the person lists steps or tools, weave them in naturally

Respond in ${languageHint()}.

Transcript:
${transcript}
          `.trim();
        }

        const aiResponse = await generateContent(user.id, prompt);
        setRepurposedText(aiResponse);
        return;
      }

      // ---- Carousel branch ----
      if (format === "carousel-generator") {
        const prompt = `Create a carousel with 5 slides about: ${inputText || "any engaging topic"}. Respond in ${languageHint()}.`;
        const aiResponse = await generateContent(user.id, prompt);
        const slides = aiResponse.split("\n\n").map((chunk, i) => ({
          title: `Slide ${i + 1}`,
          content: chunk.trim(),
        }));
        setRepurposedText(slides);
        setIsCarousel(true);
        return;
      }

      // ---- Other text-based formats ----
      let prompt = "";
      if (format === "blog-to-email") {
        prompt = `Repurpose the following text into an email. Respond in ${languageHint()}.\n\n${inputText}`;
      } else if (format === "pinterest-caption") {
        prompt = `Repurpose the following text into a Pinterest caption. Respond in ${languageHint()}.\n\n${inputText}`;
      } else {
        prompt = `Repurpose this text into ${format} format. Respond in ${languageHint()}.\n\n${inputText}`;
      }

      const aiResponse = await generateContent(user.id, prompt);
      setRepurposedText(aiResponse);
    } catch (err) {
      console.error(err);
      if (String(err.message || "").includes("Usage limit")) {
        setRepurposedText("⚠️ You’ve reached your free-tier limit. Please upgrade to continue.");
      } else {
        setRepurposedText("❌ Error generating content.");
      }
    } finally {
      setLoading(false);
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // Load saved state
  useEffect(() => {
    setInputText(localStorage.getItem('repurpose-input') || '');
    setRepurposedText(localStorage.getItem('repurpose-output') || '');
    setFormat(localStorage.getItem('repurpose-format') || 'blog-post');
  }, []);
  useEffect(() => { localStorage.setItem('repurpose-input', inputText); }, [inputText]);
  useEffect(() => {
    if (typeof repurposedText === "string") localStorage.setItem('repurpose-output', repurposedText);
    else localStorage.removeItem('repurpose-output');
  }, [repurposedText]);
  useEffect(() => { localStorage.setItem('repurpose-format', format); }, [format]);

  function copyToClipboard() {
    if (typeof repurposedText === "string") {
      navigator.clipboard.writeText(repurposedText).then(() => alert("✅ Copied to clipboard!"));
    } else {
      const textVersion = repurposedText.map(s => `${s.title}\n${s.content}`).join("\n\n");
      navigator.clipboard.writeText(textVersion).then(() => alert("✅ Carousel copied to clipboard!"));
    }
  }

  function downloadTxtInline(text, filename = "repurposed.txt") {
    try {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename.endsWith(".txt") ? filename : `${filename}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("Couldn’t start the .txt download.");
      console.error(e);
    }
  }

  function downloadPdfFromText(text, filename = "repurposed.pdf") {
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const contentWidth = pageWidth - margin * 2;

      const lines = doc.splitTextToSize(text, contentWidth);
      const lineHeight = 16;
      let y = margin;

      lines.forEach((line) => {
        if (y > pageHeight - margin) { doc.addPage(); y = margin; }
        doc.text(line, margin, y);
        y += lineHeight;
      });

      doc.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
    } catch (e) {
      alert("Couldn’t create the PDF.");
      console.error(e);
    }
  }

  return (
    <div className={`repurpose-page min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'} font-sans`}>
      <header className="w-full px-6 py-4 flex items-center justify-between bg-gray-800 text-white shadow-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span className="text-3xl">♻️</span> IV <span className="text-cyan-400">Content</span>
        </h1>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="repurpose-hero">
          <h2 className="repurpose-title text-3xl sm:text-4xl font-bold mb-2">
            {t("repurpose.heroTitle")}
          </h2>
          <p className="repurpose-sub text-lg">{t("repurpose.heroSub")}</p>
        </section>

        <div className="repurpose-panel p-4 md:p-6 flex flex-col lg:flex-row gap-6">
          <div className="mb-2 text-sm format-chip">{chipText}</div>

          {/* Input Section */}
          <div className="w-full lg:w-1/2">
            <textarea
              className="repurpose-textarea"
              placeholder={
                (format === "video-summary" || format === "video-shorts-script")
                  ? "Optional notes or context (video transcript will be used)"
                  : t("repurpose.textareaPlaceholder")
              }
              value={inputText}
              onChange={e => setInputText(e.target.value)}
            />

            {(format === "video-summary" || format === "video-shorts-script") && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm opacity-80">
                  Upload .mp4 (recommended). .mov may work, but .mp4 is most reliable.
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,audio/*"
                  onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm"
                />

                <div className="flex items-center gap-2">
                  <label className="text-sm opacity-80">{t("repurpose.transcriptLang")}:</label>
                  <select
                    className="repurpose-select"
                    value={transcriptLang}
                    onChange={e => setTranscriptLang(e.target.value)}
                  >
                    <option value="en">English (en)</option>
                    <option value="es">Spanish (es)</option>
                    <option value="fr">French (fr)</option>
                    <option value="de">German (de)</option>
                    <option value="pt">Portuguese (pt)</option>
                    <option value="it">Italian (it)</option>
                    <option value="nl">Dutch (nl)</option>
                    <option value="ja">Japanese (ja)</option>
                    <option value="ko">Korean (ko)</option>
                    <option value="hi">Hindi (hi)</option>
                  </select>
                </div>

                {uploading && (
                  <div className="text-sm opacity-80">
                    ⏳ Uploading & transcribing…
                  </div>
                )}
              </div>
            )}

            <select
              className="repurpose-select mt-3"
              value={format}
              onChange={e => setFormat(e.target.value)}
            >
              <option value="blog-post">Blog Post</option>
              <option value="social-post">Social Post</option>
              <option value="summary">Summary</option>
              <option value="tweet-to-linkedin">Tweet → LinkedIn</option>
              <option value="blog-to-caption">Blog → Instagram Caption</option>
              <option value="video-to-email">Video → Email Summary</option>

              {/* NEW local video formats */}
              <option value="video-summary">Local Video → Summary</option>
              <option value="video-shorts-script">Local Video → Shorts Script</option>

              {/* YouTube formats intentionally removed for now */}
              <option value="pinterest-caption">Pinterest Caption</option>
              <option value="blog-tldr">Blog → TL;DR</option>
              <option value="thread-expander">Tweet → Blog Style Expansion</option>
              <option value="blog-to-email">Blog → Email Expander</option>
              <option value="carousel-generator">Carousel Generator</option>
              <option value="idea-generator">Idea Generator (Coming Soon)</option>
              <option value="calendar-generator">Content Calendar (Coming Soon)</option>
              <option value="script-to-vocal">AI Vocals (Coming Soon)</option>
            </select>

            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <button
                className="btn-primary btn-block md:btn-block-md"
                onClick={handleRepurpose}
                disabled={
                  loading ||
                  uploading ||
                  (format === "video-summary" && !videoFile) ||
                  (format === "video-shorts-script" && !videoFile) ||
                  (!inputText.trim() && !NO_INPUT_REQUIRED.includes(format)) ||
                  COMING_SOON.has(format)
                }
                title={COMING_SOON.has(format) ? "Coming soon" : undefined}
              >
                {COMING_SOON.has(format) ? "Coming Soon" : t("repurpose.btnRepurpose")}
              </button>

              <button
                className="btn-secondary btn-block md:btn-block-md"
                onClick={() => {
                  setInputText('');
                  setRepurposedText('');
                  setIsCarousel(false);
                  setVideoFile(null);
                }}
              >
                {t("repurpose.btnClear")}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="w-full lg:w-1/2" ref={outputRef}>
            {(loading || uploading) && (
              <p className="status-line text-xl font-semibold animate-pulse">
                {uploading ? "Uploading & transcribing…" : "Repurposing your content..."}
              </p>
            )}

            {!loading && !uploading && repurposedText && (
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
                          const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
                          const name = `ivcontent-${ts}.txt`;
                          downloadTxtInline(repurposedText, name);
                        }}
                      >
                        📄 {t("repurpose.btnDownloadTxt")}
                      </button>

                      <button
                        className="btn-green"
                        onClick={() => {
                          const ts = new Date().toISOString().slice(0,19).replace(/[:T]/g, "-");
                          const name = `ivcontent-${ts}.pdf`;
                          downloadPdfFromText(repurposedText, name);
                        }}
                      >
                        🧾 {t("repurpose.btnDownloadPdf")}
                      </button>

                      <button onClick={copyToClipboard} className="btn-neutral">
                        📋 {t("repurpose.btnCopy")}
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
