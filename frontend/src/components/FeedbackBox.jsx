import { useState } from "react";
import { httpJson } from "../api/http.js";
import { supabase } from "../api/supabaseClient";
import "./FeedbackBox.css";

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

      await httpJson("/api/feedback", {
        method: "POST",
        headers: {
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

  const disabled = status.loading || message.trim().length < 5;
  const statusClass = status.msg
    ? status.msg.trim().startsWith("✅")
      ? "status-success"
      : "status-error"
    : "";

  return (
    <section className="surface-card surface-card--subtle feedback-card">
      <header className="feedback-card__header">
        <h3 className="feedback-card__title">Share Feedback</h3>
        <p className="feedback-card__subtitle">
          Tell us what’s working, what’s missing, or what to build next.
        </p>
      </header>

      <div className="feedback-card__controls">
        <select
          className="select-control feedback-card__select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="idea">Idea</option>
          <option value="bug">Bug</option>
          <option value="praise">Praise</option>
          <option value="other">Other</option>
        </select>
        <select
          className="select-control feedback-card__select"
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>
      </div>

      <textarea
        className="textarea-control"
        rows={4}
        placeholder="Tell us what’s working or what you want next…"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      
      <div className="feedback-card__actions">
        <button
          type="button"
          onClick={submit}
          disabled={disabled}
          className={`button-primary feedback-card__submit ${status.loading ? "is-loading" : ""}`}
        >
          {status.loading ? "Sending…" : "Send feedback"}
        </button>
        {status.msg && <span className={`feedback-card__status ${statusClass}`}>{status.msg}</span>}
      </div>
    </section>
  );
}