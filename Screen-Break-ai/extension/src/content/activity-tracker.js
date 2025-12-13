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
