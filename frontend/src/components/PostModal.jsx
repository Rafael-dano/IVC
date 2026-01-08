import { useState } from "react";
import { apiUrl } from "../api/http";

export default function PostModal({
  open,
  onClose,
  defaultCaption = "",
}) {
  const [platform, setPlatform] = useState("linkedin");
  const [caption, setCaption] = useState(defaultCaption);
  const [scheduledFor, setScheduledFor] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/social/draft"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          platform,
          caption,
          scheduledFor: scheduledFor || null,
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error);

      alert("✅ Social post saved");
      onClose();
    } catch (e) {
      console.error(e);
      alert("❌ Failed to save post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 p-4 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-bold mb-3">📤 Post to Social</h3>

        <select
          className="repurpose-select mb-2"
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
        >
          <option value="linkedin">LinkedIn</option>
          <option value="instagram">Instagram</option>
          <option value="x">X (Twitter)</option>
        </select>

        <textarea
          className="repurpose-textarea mb-2"
          rows={6}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <input
          type="datetime-local"
          className="repurpose-input mb-3"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
        />

        <div className="flex justify-end gap-2">
          <button className="btn-neutral" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Post"}
          </button>
        </div>
      </div>
    </div>
  );
}
