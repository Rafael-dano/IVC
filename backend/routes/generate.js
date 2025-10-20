import express from "express";
import openai from "../api/openaiClient.js";

const router = express.Router();

router.post("/", async (req, res) => {
  console.log("🔥 /api/generate hit with body:", req.body);

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Missing prompt" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful content repurposer." },
        { role: "user", content: prompt },
      ],
    });

    const output =
      response.choices[0]?.message?.content || "⚠️ No output from OpenAI";

    res.json({ success: true, result: output, output });
  } catch (error) {
    console.error("❌ Error in /api/generate:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
