// import { useState } from "react";
// import { createSession } from "./api/client";

// // Dummy profiles for UI demo
// const profiles = [
//   { id: 1, name: "Alice Smith", occupation: "AI Researcher" },
//   { id: 2, name: "Bob Lee", occupation: "Product Manager" },
//   { id: 3, name: "Carol Jones", occupation: "UX Designer" },
// ];

// export default function LoginPage({ onSelect }) {
//   const [selected, setSelected] = useState(null);
//   const [loading, setLoading] = useState(false);

//   const handleContinue = async () => {
//     if (!selected) return;
//     setLoading(true);
//     const profile = profiles.find(p => p.id === selected);
//     // Try to get UUID from localStorage
//     let uuid = localStorage.getItem(`profile-uuid-${profile.id}`);
//     if (!uuid) {
//       // Create a new session to get UUID from backend
//       const res = await createSession(null, `Profile: ${profile.name}`);
//       uuid = res.user_id;
//       if (uuid) localStorage.setItem(`profile-uuid-${profile.id}`, uuid);
//     }
//     setLoading(false);
//     onSelect({ ...profile, id: uuid });
//   };

//   return (
//     <div className="login-bg">
//       <div className="login-card">
//         <h2>Select Your Profile</h2>
//         <div className="profile-list">
//           {profiles.map(profile => (
//             <div
//               key={profile.id}
//               className={`profile-item${selected === profile.id ? " selected" : ""}`}
//               onClick={() => setSelected(profile.id)}
//             >
//               <div className="profile-name">{profile.name}</div>
//               <div className="profile-occupation">{profile.occupation}</div>
//             </div>
//           ))}
//         </div>
//         <button
//           className="login-btn"
//           disabled={!selected || loading}
//           onClick={handleContinue}
//         >
//           {loading ? "Loading..." : "Continue"}
//         </button>
//       </div>
//     </div>
//   );
// }
import "./login.css";
import { useState } from "react";
import { createSession } from "./api/client";

const profiles = [
  { id: 1, name: "Alice Smith", occupation: "AI Researcher" },
  { id: 2, name: "Bob Lee", occupation: "Product Manager" },
  { id: 3, name: "Carol Jones", occupation: "UX Designer" },
];

export default function LoginPage({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    const profile = profiles.find(p => p.id === selected);

    let uuid = localStorage.getItem(`profile-uuid-${profile.id}`);
    if (!uuid) {
      const res = await createSession(null, `Profile: ${profile.name}`);
      uuid = res.user_id;
      if (uuid) localStorage.setItem(`profile-uuid-${profile.id}`, uuid);
    }
    setLoading(false);
    onSelect({ ...profile, id: uuid });
  };

  return (
    <div className="login-bg">
      <div className="login-card animate-fade-in">
        <h2 className="login-title">Select Your Profile</h2>
        <div className="profile-list">
          {profiles.map(profile => (
            <div
              key={profile.id}
              className={`profile-item${
                selected === profile.id ? " selected glow" : ""
              }`}
              onClick={() => setSelected(profile.id)}
            >
              <div className="profile-name">{profile.name}</div>
              <div className="profile-occupation">{profile.occupation}</div>
            </div>
          ))}
        </div>
        <button
          className={`login-btn ${selected && !loading ? "pulse" : ""}`}
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? "Loading..." : "Continue"}
        </button>
      </div>
    </div>
  );
}