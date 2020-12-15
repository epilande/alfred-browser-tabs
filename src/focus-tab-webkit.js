#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let safari = Application("Safari");
  let query = args[0];
  let [windowIndex, url] = query.split(",");

  function getTab() {
    let result;
    let window = safari.windows[windowIndex];
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
  safari.windows[windowIndex].currentTab = tab;
}
