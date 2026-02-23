#!/usr/bin/env osascript -l JavaScript
function run(args) {
  ObjC.import("stdlib");

  const { windowIndex, tabIndex } = getWindowAndTabIndex(args);
  const browserName = $.getenv("browser");
  const browser = Application(browserName);
  const browserWindow = browser.windows[windowIndex];

  activateTab(browser, browserWindow, tabIndex);
}

/**
 * Parses the window index and tab index (both 0-indexed) from the query string.
 */
function getWindowAndTabIndex(args) {
  const query = args[0];
  const [windowIndex, tabIndex] = query.split(",").map((x) => parseInt(x));
  return { windowIndex, tabIndex };
}

/**
 * Activates the tab at the given index in the browser window, focuses the window, and activates the
 * browser application.
 */
function activateTab(browser, browserWindow, tabIndex) {
  browserWindow.activeTabIndex = tabIndex + 1;
  browserWindow.index = 1;
  browser.activate();
}
