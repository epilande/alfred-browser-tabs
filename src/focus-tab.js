#!/usr/bin/env osascript -l JavaScript
function run(args) {
  ObjC.import("stdlib");

  const { windowIndex, tabIndex } = getWindowAndTabIndex(args);
  const { browser, browserWindow, maybeSystemWindow } =
    getBrowserAndWindows(windowIndex);

  activateTab(browser, browserWindow, maybeSystemWindow, tabIndex);
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
 * Returns the browser application object, along with the specific browser window, and the system
 * window object (if found), for the given window index.
 */
function getBrowserAndWindows(windowIndex) {
  const browserName = $.getenv("browser");
  const browser = Application(browserName);
  const browserWindow = browser.windows[windowIndex];
  const maybeSystemWindow = getSystemWindow(
    browserName,
    windowIndex,
    browserWindow.title(),
  );
  return { browser, browserWindow, maybeSystemWindow };
}

/**
 * Returns the system window matching the browser window title, if found. Else returns undefined.
 *
 * In most cases, the system window at the same index should match the browser window, and we can
 * return that. However, things like alerts or dialogs can cause the system windows and browser
 * windows to differ in order and/or count, in which case we manually search for the system window
 * with the expected title prefix.
 */
function getSystemWindow(browserName, windowIndex, browserWindowTitle) {
  const browserProcess = Application("System Events").processes[browserName];
  const expectedTitlePrefix = `${browserWindowTitle} - `;
  const systemWindowByIndex = getSystemWindowByIndex(
    browserProcess,
    windowIndex,
    expectedTitlePrefix,
  );
  if (!systemWindowByIndex) {
    return getSystemWindowByTitle(browserProcess, expectedTitlePrefix);
  }
  return systemWindowByIndex;
}

/**
 * Returns the system window at the given index if it has the expected title prefix, else returns
 * undefined.
 */
function getSystemWindowByIndex(
  browserProcess,
  windowIndex,
  expectedTitlePrefix,
) {
  const systemWindow = browserProcess.windows[windowIndex];
  if (!systemWindow || !hasExpectedTitle(systemWindow, expectedTitlePrefix)) {
    return undefined;
  }
  return systemWindow;
}

/**
 * Returns the first system window with the expected title prefix, or undefined if not found.
 */
function getSystemWindowByTitle(browserProcess, expectedTitlePrefix) {
  const systemWindows = browserProcess.windows();
  return systemWindows.find((systemWindow) =>
    hasExpectedTitle(systemWindow, expectedTitlePrefix),
  );
}

function hasExpectedTitle(systemWindow, expectedTitlePrefix) {
  return systemWindow.title().startsWith(expectedTitlePrefix);
}

/**
 * Activates the tab at the given index in the browser window, focuses the window, and activates the
 * browser application.
 */
function activateTab(browser, browserWindow, maybeSystemWindow, tabIndex) {
  browserWindow.activeTabIndex = tabIndex + 1;
  maybeSystemWindow?.actions["AXRaise"].perform();
  browser.activate();
}
