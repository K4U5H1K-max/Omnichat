import React from "react";
import "../login.css";

export default function LoadingPulse() {
  return (
    <div className="loading-overlay">
      <div className="robot-loader">
        <div className="robot-antenna" />
        <div className="robot-head">
          <div className="robot-eye left" />
          <div className="robot-eye right" />
          <div className="robot-mouth" />
        </div>
      </div>
      <div className="pulse-text">Loading...</div>
    </div>
  );
}
