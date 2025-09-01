# Chatbot Capstone

A production-ready full-stack AI chatbot with real-time streaming, session persistence, and multi-model provider support.

Tech Stack

Frontend: React (Vite) + TailwindCSS

Backend: Express.js (Node.js)

Styling: TailwindCSS + custom CSS

Features:

Real-time streaming responses (SSE)

Session management with persistent history

Multi-provider model switching (OpenAI, Anthropic, etc.)
Installation & Setup
Prerequisites

Node.js v18+

npm (comes with Node.js)

Git

Backend Setup
cd backend-express
npm install


Start backend:

npm run dev

Frontend Setup
cd frontend
npm install
npm run dev


Frontend will run on http://localhost:5173 and backend on http://localhost:8003.

# Environment Variables

Create a file named .env inside backend-express/ and configure it:

PORT=8003
OPENAI_API_KEY=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



# API Testing
Health Check
curl http://localhost:8003/health

Send Chat (SSE Example)
curl -N -X POST http://localhost:8003/chat/<SESSION_ID>/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello AI!"}'
# Screenshots
Login page
<img width="2560" height="1281" alt="image" src="https://github.com/user-attachments/assets/316c04be-03b4-41ed-afc1-47f1d484ef73" />

Chatbot Interface
<img width="2560" height="1281" alt="image" src="https://github.com/user-attachments/assets/083ef2ab-0c10-4f87-8065-9a88eb14ce2c" />
