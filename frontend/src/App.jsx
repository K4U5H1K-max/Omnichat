import ChatPanel from "./components/ChatPanel";
import ModelSwitcher from "./components/ModelSwitcher";
import React, { useEffect, useRef, useState } from "react";
import LoginPage from "./LoginPage";
import Sidebar from "./components/Sidebar";
import LoadingPulse from "./components/LoadingPulse";
import { createSession, listSessions, getSession, saveSessionMessages } from "./api/client";

function App() {
  const [profile, setProfile] = useState(null);
  const userId = useRef(null);
  const [sessions, setSessions] = useState([]);
  const [current, setCurrent] = useState(null);
  const [history, setHistory] = useState([]);
  const [pm, setPM] = useState({ provider: "openai", model: "gpt-4o-mini" });
  const [loading, setLoading] = useState(false);

  // Removed auto-loading profile from localStorage so login always appears first

  // refresh sessions
  const refresh = async () => {
    if (!userId.current) return;
    try {
      const s = await listSessions(userId.current);
      setSessions(Array.isArray(s) ? s : []);
      if (Array.isArray(s) && s.length && !current) {
        await pick(s[0].id);
      }
    } catch (e) {
      console.error("Failed to refresh sessions:", e);
      setSessions([]);
    }
  };

  const pick = async (sid) => {
    setLoading(true);
    try {
      setCurrent(sid);
      const msgs = await getSession(sid);
      setHistory(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      setHistory([]);
      console.error("Failed to pick session:", e);
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  const addSession = async () => {
    setLoading(true);
    try {
      const res = await createSession(userId.current, "New Chat");
      if (res && res.session_id) {
        setSessions((s) => [
          {
            id: res.session_id,
            user_id: userId.current,
            title: "New Chat",
            created_at: new Date().toISOString(),
          },
          ...s,
        ]);
        setCurrent(res.session_id);
        setHistory([]);
      } else {
        throw new Error("No session_id returned");
      }
    } catch (e) {
      console.error("Failed to add session:", e);
    } finally {
      setTimeout(() => setLoading(false), 2000);
    }
  };

  // On mount, only set profile if localStorage has it (for refresh in chat area)
  useEffect(() => {
    const stored = localStorage.getItem("activeProfile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setProfile(parsed);
        userId.current = parsed.uuid || parsed.id;
      } catch (e) {
        console.error("Failed to parse stored profile:", e);
      }
    }
  }, []);

  // When profile changes, save to localStorage and reset chat state
  useEffect(() => {
    if (profile) {
      setLoading(true);
      userId.current = profile.uuid || profile.id;
      setSessions([]);
      setCurrent(null);
      setHistory([]);
      refresh();
      localStorage.setItem("activeProfile", JSON.stringify(profile));
      setTimeout(() => setLoading(false), 2000);
    }
  }, [profile]);

  const onUserSend = async (msg) => {
    const timestamp = new Date().toISOString();
    setHistory((h) => {
      const newHistory = [...h, { ...msg, timestamp }];
      if (current) saveSessionMessages(current, newHistory);
      return newHistory;
    });
  };

  const onAssistantDelta = (delta) => {
    const timestamp = new Date().toISOString();
    setHistory((h) => {
      if (pm.provider === "gemini") {
        const content = delta && delta.trim() ? delta : "No response from Gemini.";
        const newHistory = [
          ...h,
          { role: "assistant", content, provider: pm.provider, model: pm.model, timestamp },
        ];
        if (current) saveSessionMessages(current, newHistory);
        return newHistory;
      }

      const last = h[h.length - 1];
      let newHistory;
      if (!last || last.role !== "assistant") {
        newHistory = [
          ...h,
          { role: "assistant", content: delta, provider: pm.provider, model: pm.model, timestamp },
        ];
      } else {
        newHistory = [...h];
        newHistory[newHistory.length - 1] = {
          ...last,
          content: (last.content || "") + delta,
        };
      }
      if (current) saveSessionMessages(current, newHistory);
      return newHistory;
    });
  };

  const onAssistantDone = () => {};

  // logout clears storage
  const handleLogout = () => {
    setSessions([]);
    setCurrent(null);
    setHistory([]);
    userId.current = null;
    setProfile(null);
    localStorage.removeItem("activeProfile");
  };

  if (!profile) {
    return <LoginPage onSelect={setProfile} />;
  }
  if (loading) {
    return <LoadingPulse />;
  }

  return (
    <div className="layout">
      <Sidebar sessions={sessions} currentId={current} onNew={addSession} onPick={pick} />
      <main>
        <div className="toolbar flex items-center gap-2 p-2 border-b border-gray-200">
          <ModelSwitcher value={pm} onChange={setPM} />
          {/* Logout styled like other toolbar buttons */}
          <button
            onClick={handleLogout}
            className="logout-btn">
            ⬅ Back to Login
          </button>
        </div>
        {current ? (
          <ChatPanel
            sessionId={current}
            provider={pm.provider}
            model={pm.model}
            history={history}
            onUserSend={onUserSend}
            onAssistantDelta={onAssistantDelta}
            onAssistantDone={onAssistantDone}
          />
        ) : (
          <div className="empty">Create a new chat to begin.</div>
        )}
      </main>
    </div>
  );
}

export default App;
