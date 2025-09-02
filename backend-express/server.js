
import pkg from "pg";
const { Pool } = pkg;

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});
const app = express();
app.use(cors());
app.use(bodyParser.json());

// List all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users ORDER BY created_at ASC");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/models", (req,res)=>res.json({
  openai: ["gpt-4o-mini"], anthropic: [], gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.5-flash-lite"]
}));

app.post("/chat/:session_id/stream", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const { messages, model = "gpt-4o-mini", provider = "openai" } = req.body;
    if (provider === "gemini" || model.startsWith("gemini")) {
      // Gemini REST API call
      const geminiModel = model && model !== ":generateContent" ? model : "gemini-pro";
      const prompt = messages.map(m => m.content).join("\n");
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        }
      );
      const data = await geminiResp.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  // Always send a delta, even if empty, so frontend can display response
  res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
  res.write("data: [DONE]\n\n");
    } else {
      // OpenAI streaming
      const stream = await openai.chat.completions.create({
        model, messages, stream: true, max_tokens: Number(process.env.MAX_OUTPUT_TOKENS || 1024)
      });
      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content || "";
        if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
      }
      res.write("data: [DONE]\n\n");
    }
  } catch (e) {
    res.write(`data: ${JSON.stringify({ error: e.message })}\n\n`);
  } finally {
    res.end();
  }
});



// Create a new chat session
app.post("/sessions", async (req, res) => {
  const { user_id, title } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO sessions (user_id, title) VALUES ($1, $2) RETURNING id",
      [user_id, title]
    );
    res.json({ session_id: result.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List sessions for a user
app.get("/sessions", async (req, res) => {
  const { user_id } = req.query;
  try {
    const result = await pool.query(
      "SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC",
      [user_id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get messages for a session
app.get("/sessions/:session_id", async (req, res) => {
  const { session_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM messages WHERE session_id = $1 ORDER BY timestamp ASC",
      [session_id]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save messages for a session
app.post("/sessions/:session_id/messages", async (req, res) => {
  const { session_id } = req.params;
  const { messages: msgs } = req.body;
  if (!Array.isArray(msgs)) return res.status(400).json({ error: "messages must be an array" });

  try {
    // Delete old messages for this session
    await pool.query("DELETE FROM messages WHERE session_id = $1", [session_id]);
    // Insert new messages
    for (const msg of msgs) {
      await pool.query(
        "INSERT INTO messages (session_id, role, content, provider, model, timestamp) VALUES ($1, $2, $3, $4, $5, $6)",
        [session_id, msg.role, msg.content, msg.provider, msg.model, msg.timestamp || new Date()]
      );
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(8003, ()=>console.log("Server on :8003"));
