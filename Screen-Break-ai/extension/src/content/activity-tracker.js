
console.log("CONTENT SCRIPT RUNNING");

let metrics = {
    clicks: 0,
    keystrokes: 0,
    scrollDistance: 0
};

let lastScrollY = window.scrollY;          // 🆕 נוסף – למדידת תזוזת גלילה
let lastTickTime = Date.now();             // 🆕 נוסף – למדידת delta של זמן מסך


window.addEventListener("click", () => {
    metrics.clicks++;
},true);

document.addEventListener("keydown", () => {
    metrics.keystrokes++;
},true);

window.addEventListener(
    "scroll",
    () => {
        const diff = Math.abs(window.scrollY - lastScrollY); // ✏️ שונה – חישוב תזוזה
        metrics.scrollDistance += diff;                      // ✏️ שונה
        lastScrollY = window.scrollY;                        // 🆕 נוסף
    },
    { passive: true },
    true
);


const activityInterval = setInterval(() => {   // 🆕 נוסף – שמירת reference
    try {                                      // 🆕 נוסף – הגנה מקריסה

        // 🆕 נוסף – בדיקה שהקונטקסט עדיין קיים
        if (!chrome?.runtime?.id) {
            console.warn("Extension context lost – stopping tracker");
            clearInterval(activityInterval);   // 🆕 חובה
            return;
        }

        const now = Date.now();
        const screenTime = Math.floor((now - lastTickTime) / 1000); // ✏️ שונה

        chrome.runtime.sendMessage({
            type: "UPDATE_STATS",
            data: {
                clicks: metrics.clicks,
                keystrokes: metrics.keystrokes,
                scrollDistance: metrics.scrollDistance,
                screenTime: screenTime
            }
        });

       
        metrics.clicks = 0;             // 🆕 חובה – מונע ספירה כפולה
        metrics.keystrokes = 0;         // 🆕 חובה
        metrics.scrollDistance = 0;     // 🆕 חובה
        lastTickTime = now;             // 🆕 חובה

    } catch (e) {                        // 🆕 נוסף
        console.warn("Context invalidated, tracker stopped");
        clearInterval(activityInterval); // 🆕 חובה
    }
}, 10000);