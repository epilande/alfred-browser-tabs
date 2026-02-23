#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");
  let browser = $.getenv("browser");
  let app = Application(browser);
  let query = args[0];
  let [windowIndex, url] = query.split(",");
  let windows = app.windows;

  function getTab(window) {
    if (!window) return null;
    for (let index in window.tabs) {
      let tab = window.tabs[index];
      let tabURL = tab.url() || tab.name();
      if (tabURL && tabURL.startsWith(url)) {
        return tab;
      }
    }
    return null;
  }

  let targetWindow = null;
  let targetTab = null;

  // Look for the target tab in any window
  for (let i = 0; i < windows.length; i++) {
    let win = windows[i];
    let tab = getTab(win);
    if (tab) {
      targetWindow = win;
      targetTab = tab;
      break;
    }
  }

  // If tab is found, switch to it without toggling visibility
  if (targetTab) {
    targetWindow.currentTab = targetTab;
    app.activate(); // Bring the browser to the front
  } else {
    // Open new tab if the target tab doesn't exist
    let newWindow = windows[windowIndex]();
    newWindow.tabs.push({ url: url });
    newWindow.currentTab = newWindow.tabs[newWindow.tabs.length - 1];
    app.activate();
  }
}
