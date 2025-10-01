import { useEffect } from "react";

export default function Seo({
  title,
  description,
  url = "https://ivcontent.com/",
  image = "https://ivcontent.com/og.jpg",
  type = "website",
}) {
  useEffect(() => {
    const set = (selector, create, setAttrs) => {
      let el = document.head.querySelector(selector);
      if (!el) {
        el = document.createElement(create);
        document.head.appendChild(el);
      }
      setAttrs(el);
    };

    if (title) document.title = title;
    if (description) {
      set(`meta[name="description"]`, "meta", el => {
        el.setAttribute("name", "description");
        el.setAttribute("content", description);
      });
    }

    // Open Graph
    set(`meta[property="og:type"]`, "meta", el => {
      el.setAttribute("property", "og:type");
      el.setAttribute("content", type);
    });
    set(`meta[property="og:url"]`, "meta", el => {
      el.setAttribute("property", "og:url");
      el.setAttribute("content", url);
    });
    if (title) {
      set(`meta[property="og:title"]`, "meta", el => {
        el.setAttribute("property", "og:title");
        el.setAttribute("content", title);
      });
    }
    if (description) {
      set(`meta[property="og:description"]`, "meta", el => {
        el.setAttribute("property", "og:description");
        el.setAttribute("content", description);
      });
    }
    if (image) {
      set(`meta[property="og:image"]`, "meta", el => {
        el.setAttribute("property", "og:image");
        el.setAttribute("content", image);
      });
    }

    // Twitter
    set(`meta[name="twitter:card"]`, "meta", el => {
      el.setAttribute("name", "twitter:card");
      el.setAttribute("content", "summary_large_image");
    });
    if (title) {
      set(`meta[name="twitter:title"]`, "meta", el => {
        el.setAttribute("name", "twitter:title");
        el.setAttribute("content", title);
      });
    }
    if (description) {
      set(`meta[name="twitter:description"]`, "meta", el => {
        el.setAttribute("name", "twitter:description");
        el.setAttribute("content", description);
      });
    }
    if (image) {
      set(`meta[name="twitter:image"]`, "meta", el => {
        el.setAttribute("name", "twitter:image");
        el.setAttribute("content", image);
      });
    }
    // canonical
    set(`link[rel="canonical"]`, "link", el => {
      el.setAttribute("rel", "canonical");
      el.setAttribute("href", url);
    });
  }, [title, description, url, image, type]);

  return null;
}
