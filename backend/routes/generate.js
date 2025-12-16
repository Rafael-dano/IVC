import express from "express";
import openai from "../api/openaiClient.js";
import { supabaseAdmin } from "../api/supabaseClient.js";
import { requireUser, enforceLimits } from "../middleware/authAndLimits.js";

const router = express.Router();

/**
 * POST /api/generate
 * Body:
 *  - prompt: string (required)
 *  - saveToVault: boolean (optional)
 *  - title: string (optional)
 *  - projectId: uuid (optional)
 *  - format: string (optional)  // e.g. "shorts-script", "pinterest-caption"
 *  - meta: object (optional)    // anything extra you want stored
 */
router.post("/", requireUser, enforceLimits, async (req, res) => {
  console.log("🔥 /api/generate hit with body:", req.body);

  try {
    const {
      prompt,
      saveToVault = false,
      title = null,
      projectId = null,
      format = "unknown",
      meta = {},
    } = req.body;

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

    // ✅ Save to Vault (optional)
    let contentItemId = null;

    if (saveToVault) {
      const userId = req.user?.id;

      // Store some helpful metadata by default
      const mergedMeta = {
        ...meta,
        plan: req.plan,
        month_tokens_used: req.month_tokens_used,
        month_tokens_limit: req.month_tokens_limit,
        created_from: "api_generate",
      };

      const { data, error } = await supabaseAdmin
        .from("content_items")
        .insert([
          {
            user_id: userId,
            project_id: projectId,
            title,
            input_text: prompt,
            output_text: output,
            format,
            model: "gpt-4o-mini",
            meta: mergedMeta,
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("❌ Vault save failed:", error);
        // Don't fail the request—generation succeeded.
      } else {
        contentItemId = data.id;
      }
    }

    // ✅ This is the JSON where you add contentItemId
    res.json({
      success: true,
      result: output,
      output,
      contentItemId, // <--- RIGHT HERE
    });
  } catch (error) {
    console.error("❌ Error in /api/generate:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
