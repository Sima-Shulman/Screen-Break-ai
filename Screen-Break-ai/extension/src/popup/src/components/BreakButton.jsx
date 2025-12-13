import React from "react";

export default function BreakButton() {
  const sendBreakNotification = () => {
    if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: "TRIGGER_BREAK",
        data: { message: "It's time for a break!" },
      });
    } else {
      alert("Demo: It's time for a break!");
    }
  };

  return (
    <button className="break-btn" onClick={sendBreakNotification}>
      🔔 Take a Break
    </button>
  );
}
