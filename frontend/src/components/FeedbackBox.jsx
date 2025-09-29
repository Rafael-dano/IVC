import { useState } from "react";
import { httpJson } from "../api/http.js";
import { supabase } from "../api/supabaseClient";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5051";

export default function FeedbackBox() {
  const [category, setCategory] = useState("idea");
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({ loading: false, msg: "" });

  async function submit() {
    setStatus({ loading: true, msg: "" });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Please sign in first.");

      await httpJson(`${API_BASE}/api/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ category, rating, message }),
      });
      setMessage("");
      setStatus({ loading: false, msg: "✅ Thanks! We received your feedback." });
    } catch (e) {
      setStatus({ loading: false, msg: e.message || "Something went wrong." });
    }
  }

  return (
    <section className="bg-white rounded-xl shadow p-6 space-y-4">
      <h3 className="text-lg font-semibold">Share Feedback</h3>
      <div className="flex gap-3">
        <select className="border rounded px-2 py-1" value={category} onChange={(e)=>setCategory(e.target.value)}>
          <option value="idea">Idea</option>
          <option value="bug">Bug</option>
          <option value="praise">Praise</option>
          <option value="other">Other</option>
        </select>
        <select className="border rounded px-2 py-1" value={rating} onChange={(e)=>setRating(Number(e.target.value))}>
          {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}★</option>)}
        </select>
      </div>
      <textarea
        className="w-full border rounded p-2"
        rows={4}
        placeholder="Tell us what’s working or what you want next…"
        value={message}
        onChange={(e)=>setMessage(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={status.loading || message.trim().length < 5}
          className={`px-4 py-2 rounded text-white ${status.loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
        >
          {status.loading ? "Sending…" : "Send feedback"}
        </button>
        {status.msg && <span className="text-sm">{status.msg}</span>}
      </div>
    </section>
  );
}
