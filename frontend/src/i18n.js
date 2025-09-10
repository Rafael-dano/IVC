// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const saved = localStorage.getItem("ui-lang") || "en";

i18n
  .use(initReactI18next)
  .init({
    lng: saved,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    resources: {
      en: {
        translation: {
          appName: "IV Content",
          nav: {
            home: "Home",
            tools: "Tools",
            settings: "Settings",
          },
          repurpose: {
            heroTitle: "Repurpose Smarter, Faster, Everywhere.",
            heroSub: "Turn your content into summaries, scripts, captions and more — all in one place.",
            textareaPlaceholder: "Paste or write your content here...",
            formatLabel: "Format",
            transcriptLang: "Transcript language",
            btnRepurpose: "Repurpose Content",
            btnClear: "Clear",
            btnDownloadTxt: "Download .txt",
            btnDownloadPdf: "Download .pdf",
            btnCopy: "Copy to Clipboard",
            needLogin: "You must be logged in to use this feature.",
            needInput: "Please enter some content first.",
            needYT: "Enter a YouTube URL or the 11-char video ID.",
            transcriptNA: "Transcript not available for this video/language.",
          }
        }
      },
      es: {
        translation: {
          appName: "IV Contenido",
          nav: {
            home: "Inicio",
            tools: "Herramientas",
            settings: "Ajustes",
          },
          repurpose: {
            heroTitle: "Reutiliza más inteligente, más rápido, en todas partes.",
            heroSub: "Convierte tu contenido en resúmenes, guiones, subtítulos y más — todo en un solo lugar.",
            textareaPlaceholder: "Pega o escribe tu contenido aquí...",
            formatLabel: "Formato",
            transcriptLang: "Idioma del transcript",
            btnRepurpose: "Reutilizar contenido",
            btnClear: "Limpiar",
            btnDownloadTxt: "Descargar .txt",
            btnDownloadPdf: "Descargar .pdf",
            btnCopy: "Copiar al portapapeles",
            needLogin: "Debes iniciar sesión para usar esta función.",
            needInput: "Por favor introduce contenido primero.",
            needYT: "Introduce una URL de YouTube o el ID de 11 caracteres.",
            transcriptNA: "Transcript no disponible para este video/idioma.",
          }
        }
      }
    }
  });

export default i18n;
