#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");
  let browser = $.getenv("browser");
  let chrome = Application(browser);
  let query = args[0];
  let [arg1, arg2] = query.split(",");
  let windowIndex = parseInt(arg1);
  let tabIndex = parseInt(arg2);

  chrome.windows[windowIndex].visible = true;
  chrome.windows[windowIndex].activeTabIndex = tabIndex + 1;
  chrome.windows[windowIndex].index = 1;
  chrome.activate();
}
