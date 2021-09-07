#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let safari = Application("Safari");
  let query = args[0];
  let [windowIndex, url] = query.split(",");
  let window = safari.windows[windowIndex]();

  function getTab() {
    let result;
    if (window) {
      for (let index in window.tabs) {
        let tab = window.tabs[index];
        let tabURL = tab.url() || tab.name();
        if (tabURL && tabURL.startsWith(url)) {
          result = tab;
          break;
        }
      }
      return result;
    }
  }

  let tab = getTab();
  safari.activate();
  window.currentTab = tab;
  // Force tab window to front
  window.visible = false;
  window.visible = true;
}
