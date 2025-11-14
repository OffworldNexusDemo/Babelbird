// Background service worker for handling commands
chrome.commands.onCommand.addListener((command) => {
    if (command === "translate-input") {
        // Send message to active tab's content script
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "translate-input" });
            }
        });
    }
});
