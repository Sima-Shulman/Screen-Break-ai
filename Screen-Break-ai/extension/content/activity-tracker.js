console.log("CONTENT SCRIPT RUNNING");

const metrics = {
  clicks: 0,
  keystrokes: 0,
  scrollDistance: 0
};

let lastScrollY = window.scrollY;
let intervalId;

window.addEventListener("click", () => metrics.clicks++, true);
window.addEventListener("keydown", () => metrics.keystrokes++, true);

window.addEventListener("scroll", () => {
  const diff = Math.abs(window.scrollY - lastScrollY);
  metrics.scrollDistance += diff;
  lastScrollY = window.scrollY;
}, { passive: true });

intervalId = setInterval(async () => {
  // Check if extension is still valid
  if (!chrome?.runtime?.id) {
    clearInterval(intervalId);
    return;
  }

  const metricsToSave = { ...metrics };
  metrics.clicks = 0;
  metrics.keystrokes = 0;
  metrics.scrollDistance = 0;

  try {
    const result = await new Promise((resolve, reject) => {
      chrome.storage.local.get({ total_activity: {} }, (res) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(res);
        }
      });
    });

    const activity = result.total_activity;
    console.log("1. Activity Tracker Sending stats:", metricsToSave);
    console.log("Total activity so far:", activity);

    await new Promise((resolve, reject) => {
      chrome.storage.local.set({
        total_activity: {
          clicks: (activity.clicks || 0) + metricsToSave.clicks,
          keystrokes: (activity.keystrokes || 0) + metricsToSave.keystrokes,
          scrollDistance: (activity.scrollDistance || 0) + metricsToSave.scrollDistance,
          screenTime: (activity.screenTime || 0) + 5
        }
      }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    if (error.message?.includes("Extension context invalidated")) {
      console.log("Extension context invalidated, clearing interval");
      clearInterval(intervalId);
      return;
    }
    console.error("Activity tracker error:", error);
  }
}, 5000);
