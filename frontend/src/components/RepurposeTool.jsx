import { useState, useEffect, useRef } from 'react';
import { generateContent } from '../api/textGeneration.js';
import { supabase } from '../api/supabaseClient.js';
import { apiUrl } from "../api/http.js";
import { jsPDF } from "jspdf";
import "./Repurpose.css";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";
import LANGS from "../i18nLangs";
import { listVaultItems } from "../api/vault.js";

export default function RepurposeTool() {
  const { t } = useTranslation();
  const [inputText, setInputText] = useState('');
  const [repurposedText, setRepurposedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [format, setFormat] = useState('blog-post');
  const [saveToVault, setSaveToVault] = useState(true);
  const [vaultTitle, setVaultTitle] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [darkMode] = useState(true);
  const [isCarousel, setIsCarousel] = useState(false);
  const outputRef = useRef(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [mbOpen, setMbOpen] = useState(false);
  const [mbLoading, setMbLoading] = useState(false);
  const [mbItems, setMbItems] = useState([]);
  const [mbError, setMbError] = useState("");

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
      en: "English",
      es: "Spanish",
      hi: "Hindi",
      ar: "Arabic",
      zh: "Chinese",
      ko: "Korean",
      pt: "Portuguese",
      fr: "French",
      de: "German",
      it: "Italian",
      nl: "Dutch",
      ja: "Japanese"
    };
    const code = i18n.language || "en";
    return map[code] || "English";
  }  

  async function handleRepurpose() {
    setLoading(true);
    setSavedNotice("");
    setRepurposedText("");
    setIsCarousel(false);
  
    try {
      if (COMING_SOON.has(format)) {
        setRepurposedText("🚧 This feature is coming soon. Stay tuned!");
        return;
      }
  
      // Determine flow types
      const isVideoFlow = (format === "video-summary" || format === "video-shorts-script");
      const isCarouselFlow = (format === "carousel-generator");
      const requiresText =
        !NO_INPUT_REQUIRED.includes(format) &&
        !isVideoFlow;
  
      // Basic text requirement for text-only flows
      if (requiresText && !inputText.trim()) {
        setRepurposedText(t("repurpose.needInput"));
        return;
      }
  
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRepurposedText(t("repurpose.needLogin"));
        return;
      }
  
      // A) VIDEO FLOWS (require a file)
      if (isVideoFlow) {
        if (!videoFile) {
          setRepurposedText("⚠️ Please choose a video file first (.mp4 recommended).");
          return;
        }
  
        setUploading(true);
        setUploadPct(0);
  
        let transcript = "";
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const resp = await uploadVideoWithProgress({
            file: videoFile,
            lang: transcriptLang,
            token: session?.access_token,
            onProgress: (pct) => setUploadPct(pct),
          });
          transcript = resp?.text || "";
        } catch (e) {
          console.error(e);
          const status = e?.status;
          const msg = e?.json?.error || e.message || "Upload failed.";
          if (status === 402) {
            alert(e?.json?.detail || "You’ve hit your monthly transcription limit.");
          } else if (status === 415) {
            alert("Unsupported file. Try mp4/m4a/mp3/wav/ogg/webm — MOV is auto-converted.");
          } else {
            alert(msg);
          }
          return;
        } finally {
          setUploading(false);
        }
  
        if (!transcript.trim()) {
          setRepurposedText("⚠️ Transcription returned empty text.");
          return;
        }
  
        // Build prompts for each video flow
        let prompt;
        if (format === "video-summary") {
          prompt = `
                    You are a precise assistant. Using the video transcript below, produce:
                    1) 5–7 key takeaways (bullets)
                    2) One short paragraph summary (3–5 sentences)
                    3) Action items as checkboxes when applicable
                    4) Materials/tools list when applicable
                    Respond in ${languageHint()}.
  
                    Transcript:
                    ${transcript}`.trim();
          } else {
            prompt = `
                    You are a creator coach. Using the transcript, write a 45–60 second vertical video script:
                    - Hook in first line
                    - 3–4 punchy points
                    - Clear CTA in the last line
                    - Conversational, energetic tone
                    Respond in ${languageHint()}.
  
                    Transcript:
                  ${transcript}`.trim();
                }
  
                const resp = await generateContent(user.id, prompt, format, {
                  saveToVault,
                  title: vaultTitle || null,
                  projectId: null,
                  meta: { ui_lang: i18n.language || "en" }
                });
                
                const aiText = resp.result || resp.output || "";
                setRepurposedText(aiText);
                
                if (saveToVault && resp.contentItemId) {
                  setSavedNotice(`Saved ✅ (Vault ID: ${resp.contentItemId})`);
                  await refreshMemoryBank();
                } else if (saveToVault) {
                  setSavedNotice("Saved toggle was on, but it did not save (check backend logs).");
                } else {
                  setSavedNotice("");
                }                
        return;
      }
  
      // B) TEXT-ONLY / CAROUSEL FLOWS (no file)
      if (isCarouselFlow) {
        const topic = inputText?.trim() || "any engaging topic";
        const prompt = [
          `You are a social media strategist. Create an engaging LinkedIn carousel with exactly 5 slides about "${topic}".`,
          "Return ONLY valid JSON (no markdown fences) representing an array of 5 objects.",
          "Each object must have a short \"title\" (max 8 words) and a persuasive \"content\" string with 2-3 short sentences separated by new lines.",
          `Write the copy in ${languageHint()}.`
        ].join(" ");

        const resp = await generateContent(user.id, prompt, format, {
          saveToVault,
          title: vaultTitle || null,
          projectId: null,
          meta: { ui_lang: i18n.language || "en", type: "carousel" }
        });
        
        const aiResponse = resp.result || resp.output || "";
        const slides = parseCarouselResponse(aiResponse);
        
        if (saveToVault && resp.contentItemId) {
          setSavedNotice(`Saved ✅ (Vault ID: ${resp.contentItemId})`);
          await refreshMemoryBank();
        } else if (saveToVault) {
          setSavedNotice("Saved toggle was on, but it did not save (check backend logs).");
        } else {
          setSavedNotice("");
        }
        
        const hasContent = slides.some(slide => (slide.content || "").trim().length > 0);

        if (!slides.length || !hasContent) {
          setRepurposedText([
            {
              title: "Slide 1",
              content: (aiResponse || "").trim() || "⚠️ No content generated.",
            }
          ]);
        } else {
          setRepurposedText(slides);
        }
        setIsCarousel(true);
        return;
      }
  
      // Other text formats
      let prompt = "";
      if (format === "blog-to-email") {
        prompt = `Repurpose the following text into an email. Respond in ${languageHint()}.\n\n${inputText}`;
      } else if (format === "pinterest-caption") {
        prompt = `Repurpose the following text into a Pinterest caption. Respond in ${languageHint()}.\n\n${inputText}`;
      } else if (format === "thread-expander") {
        prompt = `Expand the following tweet/thread into a short blog-style post. Respond in ${languageHint()}.\n\n${inputText}`;
      } else {
        // generic
        prompt = `Repurpose this text into ${format} format. Respond in ${languageHint()}.\n\n${inputText}`;
      }
  
      const resp = await generateContent(user.id, prompt, format, {
        saveToVault,
        title: vaultTitle || null,
        projectId: null,
        meta: { ui_lang: i18n.language || "en" }
      });
      
      const aiText = resp.result || resp.output || "";
      setRepurposedText(aiText);
      
      if (saveToVault && resp.contentItemId) {
        setSavedNotice(`Saved ✅ (Vault ID: ${resp.contentItemId})`);
        await refreshMemoryBank();
      } else if (saveToVault) {
        setSavedNotice("Saved toggle was on, but it did not save (check backend logs).");
      } else {
        setSavedNotice("");
      }
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

  function normalizeSlides(slides) {
    return slides
      .map((slide, idx) => {
        const rawTitle = typeof slide?.title === "string" ? slide.title.trim() : "";
        const rawContent = typeof slide?.content === "string" ? slide.content.trim() : "";
        return {
          title: rawTitle || `Slide ${idx + 1}`,
          content: rawContent,
        };
      })
      .filter(slide => slide.title || slide.content)
      .slice(0, 5);
  }

  function parseCarouselResponse(raw) {
    if (!raw) return [];
    const trimmed = String(raw).trim();

    const tryParseJson = (text) => {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return normalizeSlides(parsed);
        }
      } catch {
        // ignore JSON parse failures
      }
      return [];
    };

    let slides = tryParseJson(trimmed);
    if (slides.length) return slides;

    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch) {
      slides = tryParseJson(fencedMatch[1]);
      if (slides.length) return slides;
    }

    const blockMatches = trimmed.match(/Slide\s*\d+\s*[:\-–]?.*?(?=Slide\s*\d+\s*[:\-–]?|$)/gis);
    if (blockMatches && blockMatches.length) {
      slides = blockMatches.map((chunk) => {
        const cleaned = chunk.trim();
        const lines = cleaned.split(/\n+/);
        const firstLine = lines.shift() || "";
        const titleMatch = firstLine.match(/^Slide\s*\d+\s*[:\-–]?\s*(.*)$/i);
        const title = titleMatch ? titleMatch[1].trim() : firstLine.trim();
        const content = lines.join("\n").trim() || cleaned.replace(/^Slide\s*\d+\s*[:\-–]?\s*/i, "").trim();
        return { title, content };
      });
      slides = normalizeSlides(slides);
      if (slides.length) return slides;
    }

    let sections = trimmed.split(/\n\s*\n+/).map(chunk => chunk.trim()).filter(Boolean);
    if (sections.length <= 1) {
      sections = trimmed.split(/(?=\bSlide\s*\d+\b)/i).map(chunk => chunk.trim()).filter(Boolean);
    }
    if (!sections.length) return [];

    slides = sections.map((chunk, idx) => {
      const lines = chunk.split(/\n+/);
      let title = lines[0]?.replace(/^[-•*]\s*/, "").trim() || `Slide ${idx + 1}`;
      let content = lines.slice(1).join("\n").trim();

      const labelMatch = chunk.match(/^Slide\s*\d+\s*[:\-–]?\s*(.*)$/i);
      if (labelMatch) {
        title = labelMatch[1].trim() || title;
        content = chunk.replace(/^Slide\s*\d+\s*[:\-–]?\s*/i, "").trim();
      }

      return { title, content };
    });

    return normalizeSlides(slides);
  }

  // Progress-aware upload helper (uses XMLHttpRequest so we get onprogress)
async function uploadVideoWithProgress({ file, lang = "en", token, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("lang", lang);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", apiUrl("/api/video/transcribe"), true);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && typeof onProgress === "function") {
        const pct = Math.min(100, Math.round((e.loaded / e.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      try {
        const ok = xhr.status >= 200 && xhr.status < 300;
        const json = JSON.parse(xhr.responseText || "{}");
        if (ok) resolve(json);
        else reject(Object.assign(new Error(json.error || "Upload failed"), { status: xhr.status, json }));
      } catch (err) {
        reject(err);
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(form);
  });
}

async function refreshMemoryBank() {
  try {
    setMbError("");
    setMbLoading(true);
    const resp = await listVaultItems(20);
    setMbItems(resp.items || []);
  } catch (e) {
    console.error(e);
    setMbError("Could not load Memory Bank.");
  } finally {
    setMbLoading(false);
  }
}

function loadMemoryItem(item) {
  // Load input + format
  setInputText(item.input_text || "");
  setFormat(item.format || "blog-post");
  setVaultTitle(item.title || "");
  setSavedNotice(`Loaded ✅ (${item.id})`);

  // If this was a carousel, show it as carousel UI
  const isCarouselSaved =
    item?.meta?.type === "carousel" || item?.format === "carousel-generator";

  if (isCarouselSaved) {
    const slides = parseCarouselResponse(item.output_text || "");
    setRepurposedText(slides.length ? slides : (item.output_text || ""));
    setIsCarousel(Array.isArray(slides) && slides.length > 0);
  } else {
    setIsCarousel(false);
    setRepurposedText(item.output_text || "");
  }

  // close dropdown
  setMbOpen(false);

  // jump to output
  setTimeout(() => {
    outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 50);
}

useEffect(() => {
  refreshMemoryBank();
}, []);


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
                    {LANGS.map(l => (
                      <option key={l.code} value={l.code}>
                        {l.label} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>

                {uploading && (
                  <div className="text-sm opacity-80">
                    ⏳ Uploading & transcribing…
                  </div>
                )}
              </div>
            )}
            {uploading && (
  <div className="mt-3">
    <div className="flex items-center justify-between text-xs opacity-80 mb-1">
      <span>Uploading…</span>
      <span>{uploadPct}%</span>
    </div>
    <div className="h-2 w-full rounded bg-white/15 overflow-hidden">
      <div
        className="h-2 bg-cyan-400"
        style={{ width: `${uploadPct}%` }}
      />
    </div>
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

            <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:items-center">
              <label className="flex items-center gap-2 text-sm opacity-90">
                <input
                  type="checkbox"
                  checked={saveToVault}
                  onChange={(e) => setSaveToVault(e.target.checked)}
                />
                Save to Vault
              </label>

              <input
                type="text"
                value={vaultTitle}
                onChange={(e) => setVaultTitle(e.target.value)}
                placeholder="Optional title (e.g., 'Pinterest Caption')"
                className="repurpose-textarea !h-auto !min-h-0 !py-2"
                style={{ maxWidth: 420 }}
              />
            </div>

            {savedNotice && (
              <div className="mt-2 text-sm opacity-90">
                {savedNotice}
              </div>
            )}

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
                  setSavedNotice("");
                  setVaultTitle("");
                }}
              >
                {t("repurpose.btnClear")}
              </button>
            </div>
          </div>


          {/* Output Section */}
          <div className="w-full lg:w-1/2" ref={outputRef}>
          <div className="mb-3">
  <button
    className="btn-secondary w-full flex items-center justify-between"
    onClick={async () => {
      const next = !mbOpen;
      setMbOpen(next);
      if (next) await refreshMemoryBank();
    }}    
  >
    <span>🧠 Memory Bank</span>
    <span>{mbOpen ? "▲" : "▼"}</span>
  </button>

  {mbOpen && (
    <div className="mt-2 rounded-lg border border-white/10 bg-black/20 p-2 max-h-80 overflow-auto">
      {mbLoading && <div className="text-sm opacity-80">Loading…</div>}
      {mbError && <div className="text-sm text-red-300">{mbError}</div>}

      {!mbLoading && !mbError && mbItems.length === 0 && (
        <div className="text-sm opacity-80">No saved items yet.</div>
      )}

      {!mbLoading && !mbError && mbItems.map((item) => (
        <button
          key={item.id}
          onClick={() => loadMemoryItem(item)}
          className="w-full text-left p-2 rounded hover:bg-white/10"
        >
          <div className="text-sm font-semibold">
            {item.title || item.format || "Untitled"}
          </div>
          <div className="text-xs opacity-70">
            {new Date(item.created_at).toLocaleString()}
          </div>
          <div className="text-xs opacity-70 truncate">
            {(item.input_text || "").slice(0, 80)}
          </div>
        </button>
      ))}
    </div>
  )}
</div>
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
