/**
 * Content Script - Wend Solver Extension
 * Minimal script that runs on LinkedIn pages
 * Main solving is done via popup UI
 */

console.log('[Wend Solver] Content script loaded on', window.location.hostname);

// Listen for messages from popup/background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'ping') {
    sendResponse({ status: 'content-script-active' });
  }
});
