
import "./login.css";
import { useState, useEffect } from "react";
import LoadingPulse from "./components/LoadingPulse";
import { createSession } from "./api/client";

export default function LoginPage({ onSelect }) {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Use API_BASE from client.js
    import("./api/client").then(mod => {
      fetch(`${mod.API_BASE}/users`)
        .then(res => res.json())
        .then(data => setProfiles(Array.isArray(data) ? data : []))
        .catch(() => setProfiles([]));
    });
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    const profile = profiles.find(p => p.id === selected || p.id === selected.toString());

    let uuid = localStorage.getItem(`profile-uuid-${profile.id}`);
    if (!uuid) {
      const res = await createSession(null, `Profile: ${profile.name}`);
      uuid = res.user_id;
      if (uuid) localStorage.setItem(`profile-uuid-${profile.id}`, uuid);
    }
    setLoading(false);
    onSelect({ ...profile, uuid });
  };

  if (loading) {
    return <LoadingPulse />;
  }
  return (
    <div className="login-bg">
      <div className="login-card animate-fade-in">
        <h2 className="login-title">Select Your Profile</h2>
        <div className="profile-list">
          {profiles.length === 0 ? (
            <div className="profile-empty">No profiles found.</div>
          ) : (
            profiles.map(profile => (
              <div
                key={profile.id}
                className={`profile-item${selected === profile.id ? " selected glow" : ""}`}
                onClick={() => setSelected(profile.id)}
              >
                <div className="profile-name">{profile.name}</div>
                <div className="profile-occupation">{profile.occupation}</div>
              </div>
            ))
          )}
        </div>
        <button
          className={`login-btn ${selected ? "pulse" : ""}`}
          disabled={!selected}
          onClick={handleContinue}
        >
          Continue
        </button>
      </div>
    </div>
  );
}