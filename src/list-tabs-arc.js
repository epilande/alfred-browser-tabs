#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let browser = "Arc";
  if (!Application(browser).running()) {
    return JSON.stringify({
      items: [
        {
          title: `${browser} is not running`,
          subtitle: `Press enter to launch ${browser}`,
        },
      ],
    });
  }

  let chrome = Application(browser);
  chrome.includeStandardAdditions = true;

  let items = [];
  let seen = {};
  let windowCount = chrome.windows.length;

  for (let w = 0; w < windowCount; w++) {
    try {
      // Batch-fetch all tab properties in one IPC call per window.
      // Avoids the per-tab individual AppleScript round-trips that caused
      // the "stuck forever" hang (issue #58). Follows the same pattern used
      // by the official Raycast Arc extension.
      let tabProps = chrome.windows[w].tabs.properties();

      for (let t = 0; t < tabProps.length; t++) {
        let url = tabProps[t].url || "";
        let tabId = tabProps[t].id;

        // Skip duplicates and tabs without a URL (e.g. new tab pages)
        if (!url || seen[url]) continue;
        seen[url] = true;

        let matchUrl = url.replace(/(^\w+:|^)\/\//, "");
        let title = tabProps[t].title || matchUrl;

        items.push({
          title,
          subtitle: url,
          quicklookurl: url,
          // Pass tabId + url so Alfred can also copy the URL via modifier
          arg: `${tabId},${url}`,
          match: `${title} ${decodeURIComponent(matchUrl).replace(/[^\w]/g, " ")}`,
        });
      }
    } catch (_) {
      // Skip windows that don't support tab enumeration
      // (e.g. Little Arc popup windows, mini players)
    }
  }

  return JSON.stringify({ items });
}
