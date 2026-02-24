#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let query = args[0];

  // Arg format: "<tabId>,<url>" — tabId is everything before the first comma
  let commaIdx = query.indexOf(",");
  let tabId = commaIdx !== -1 ? query.substring(0, commaIdx) : query;

  let chrome = Application("Arc");
  let windowCount = chrome.windows.length;

  for (let w = 0; w < windowCount; w++) {
    try {
      // Batch-fetch IDs for all tabs in this window, then select by ID.
      // Avoids space-index-based selection which breaks when spaces API
      // changes across Arc versions.
      let tabProps = chrome.windows[w].tabs.properties();

      for (let t = 0; t < tabProps.length; t++) {
        if (String(tabProps[t].id) === String(tabId)) {
          chrome.windows[w].tabs[t].select();
          chrome.activate();
          return;
        }
      }
    } catch (_) {
      // Skip windows that don't support tab enumeration
    }
  }
}
