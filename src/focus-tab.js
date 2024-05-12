#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");

  const { windowIndex, tabIndex } = getWindowAndTabIndex(args);
  const { browser, browserWindow, systemWindow } =
    getBrowserAndWindows(windowIndex);

  activateTab(browser, browserWindow, systemWindow, tabIndex);
}

/**
 * Parses the window index and tab index (both 0-indexed) from the query string.
 */
function getWindowAndTabIndex(args) {
  const query = args[0];
  const [windowIndex, tabIndex] = query.split(",").map((x) => parseInt(x));
  console.log(`windowIndex: ${windowIndex}, tabIndex: ${tabIndex}`);
  return { windowIndex, tabIndex };
}

/**
 * Returns the browser application object, along with the specific browser window and the system
 * window object for the given window index.
 *
 * We define `browserWindow` and `systemWindow` here at the same time, before the window ordering
 * gets affected by `activateTab` and `windowIndex` is no longer accurate.
 */
function getBrowserAndWindows(windowIndex) {
  const browserName = $.getenv("browser");
  const browser = Application(browserName);
  const browserWindow = browser.windows[windowIndex];
  const systemWindow = getSystemWindow(browserName, windowIndex);
  return { browser, browserWindow, systemWindow };
}

function getSystemWindow(browserName, windowIndex) {
  const browserProcess = Application("System Events").processes[browserName];
  return browserProcess.windows[windowIndex];
}

/**
 * Activates the tab at the given index in the browser window, focuses the window, and activates the
 * browser application.
 */
function activateTab(browser, browserWindow, systemWindow, tabIndex) {
  browserWindow.activeTabIndex = tabIndex + 1;
  systemWindow.actions["AXRaise"].perform();
  browser.activate();
}
