#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");

  const browserName = $.getenv("browser");
  const { windowIndex, tabIndex } = getWindowAndTabIndex(args);

  const browser = Application(browserName);
  // Defining these at the same time here, before their ordering gets affected by `activateTab`
  const browserWindow = browser.windows[windowIndex];
  const systemWindow = getSystemWindow(browserName, windowIndex);

  activateTab(browser, browserWindow, systemWindow, tabIndex);
}

function getWindowAndTabIndex(args) {
  const query = args[0];
  const [windowIndex, tabIndex] = query.split(",").map((x) => parseInt(x));
  return { windowIndex, tabIndex };
}

function getSystemWindow(browserName, windowIndex) {
  const browserProcess = Application("System Events").processes[browserName];
  return browserProcess.windows[windowIndex];
}

function activateTab(browser, browserWindow, systemWindow, tabIndex) {
  browserWindow.activeTabIndex = tabIndex + 1;
  systemWindow.actions["AXRaise"].perform();
  browser.activate();
}
