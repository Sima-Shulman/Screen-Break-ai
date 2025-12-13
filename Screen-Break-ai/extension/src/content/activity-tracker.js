// (() => {
//   const activity = {
//     clicks: 0,
//     scrolls: 0,
//     keypresses: 0,
//     mouseMoves: 0,
//     lastReset: Date.now()
//   };

//   document.addEventListener("click", () => {
//     activity.clicks++;
//   });

//   document.addEventListener("scroll", () => {
//     activity.scrolls++;
//   });

//   document.addEventListener("keydown", () => {
//     activity.keypresses++;
//   });

//   document.addEventListener("mousemove", () => {
//     activity.mouseMoves++;
//   });

//   // כל דקה – שמירה ל־storage
//   setInterval(() => {
//     chrome.storage.local.get(["activityData"], (result) => {
//       const stored = result.activityData || {
//         clicks: 0,
//         scrolls: 0,
//         keypresses: 0,
//         mouseMoves: 0,
//         startTime: Date.now()
//       };

//       const updated = {
//         clicks: stored.clicks + activity.clicks,
//         scrolls: stored.scrolls + activity.scrolls,
//         keypresses: stored.keypresses + activity.keypresses,
//         mouseMoves: stored.mouseMoves + activity.mouseMoves,
//         startTime: stored.startTime
//       };

//       chrome.storage.local.set({ activityData: updated });

//       // reset counters
//       activity.clicks = 0;
//       activity.scrolls = 0;
//       activity.keypresses = 0;
//       activity.mouseMoves = 0;
//     });
//   }, 60_000);
// })();
console.log("!!! CONTENT SCRIPT IS RUNNING !!!");
let metrics = {
    clicks: 0,
    keystrokes: 0,
    scrollDistance: 0
};

// האזנה לקליקים
window.addEventListener('click', () => {
    metrics.clicks++;
});

// האזנה להקלדה
window.addEventListener('keydown', () => {
    metrics.keystrokes++;
});

// האזנה לגלילה
window.addEventListener('scroll', () => {
    metrics.scrollDistance += Math.abs(window.scrollY);
}, { passive: true });

// שליחת הנתונים ל-Background script כל 10 שניות
setInterval(() => {
    if (metrics.clicks > 0 || metrics.keystrokes > 0) {
        chrome.runtime.sendMessage({
            type: "UPDATE_STATS",
            data: { ...metrics }
        });
        // איפוס מונים מקומיים אחרי שליחה
        metrics.clicks = 0;
        metrics.keystrokes = 0;
        metrics.scrollDistance = 0;
    }
}, 10000);