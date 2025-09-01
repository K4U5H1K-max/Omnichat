// server.js - ExpressJS Backend Alternative
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { OpenAI } from "openai";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.get("/models", (req,res)=>res.json({
  openai: ["gpt-4o-mini"], anthropic: [], gemini: ["gemini-pro", "gemini-2.5-flash-lite"]
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


// In-memory session storage
const sessions = {};
const messages = {};

// Create a new chat session
app.post("/sessions", (req, res) => {
  const { user_id, title } = req.body;
  const session_id = crypto.randomUUID();
  sessions[session_id] = { id: session_id, user_id, title, created_at: new Date().toISOString() };
  messages[session_id] = [];
  res.json({ session_id });
});

// List sessions for a user
app.get("/sessions", (req, res) => {
  const { user_id } = req.query;
  const userSessions = Object.values(sessions)
    .filter(s => s.user_id === user_id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(userSessions);
});


// Get messages for a session
app.get("/sessions/:session_id", (req, res) => {
  const { session_id } = req.params;
  res.json(messages[session_id] || []);
});

// Save messages for a session
app.post("/sessions/:session_id/messages", (req, res) => {
  const { session_id } = req.params;
  const { messages: msgs } = req.body;
  if (!Array.isArray(msgs)) return res.status(400).json({ error: "messages must be an array" });
  messages[session_id] = msgs;
  res.json({ success: true });
});

app.listen(8003, ()=>console.log("Server on :8003"));
