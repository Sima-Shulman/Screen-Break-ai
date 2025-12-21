console.log("CONTENT SCRIPT RUNNING");

const metrics = {
  clicks: 0,
  keystrokes: 0,
  scrollDistance: 0
};

let lastScrollY = window.scrollY;

window.addEventListener("click", () => metrics.clicks++, true);
window.addEventListener("keydown", () => metrics.keystrokes++, true);

window.addEventListener("scroll", () => {
  const diff = Math.abs(window.scrollY - lastScrollY);
  metrics.scrollDistance += diff;
  lastScrollY = window.scrollY;
}, { passive: true });

setInterval(async () => {

  const metricsToSave = { ...metrics };
  metrics.clicks = 0;
  metrics.keystrokes = 0;
  metrics.scrollDistance = 0;


  chrome.storage.local.get({ total_activity: {} }, res => {
    const activity = res.total_activity;

    console.log("1. Activity Tracker Sending stats:", metricsToSave);
    console.log("Total activity so far:", activity);

    chrome.storage.local.set({
      total_activity: {
        clicks: (activity.clicks || 0) + metricsToSave.clicks,
        keystrokes: (activity.keystrokes || 0) + metricsToSave.keystrokes,
        scrollDistance: (activity.scrollDistance || 0) + metricsToSave.scrollDistance,
        screenTime: (activity.screenTime || 0) + 5
      }
    });
  });

}, 5000);
