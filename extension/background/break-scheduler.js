chrome.alarms.create("checkBreak", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async () => {
  const { activity } = await chrome.storage.local.get("activity");

  if (shouldSuggestBreak(activity)) {
    chrome.notifications.create({
      type: "basic",
      title: "Time for a break",
      message: "You've been working hard. Take 5 minutes!",
      iconUrl: "icon.png"
    });
  }
});

function shouldSuggestBreak(activity) {
  const minutes =
    (Date.now() - activity.startTime) / 60000;
  return minutes >= 20;
}
