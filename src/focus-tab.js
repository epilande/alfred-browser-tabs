#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");

  const { windowIndex, tabIndex } = getWindowAndTabIndex(args);
  const url = args[0].split(",")[2];
  const { browser, browserWindow, maybeSystemWindow } =
    getBrowserAndWindows(windowIndex);

  activateTab(browser, browserWindow, maybeSystemWindow, tabIndex);
  updateTabsFile(browser, url, windowIndex, tabIndex);
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

function updateTabsFile(browser, urlFocused, windowIndex, tabIndex) {

  //Read the original file into tabsSeenBefore
  let app = Application.currentApplication();
  app.includeStandardAdditions = true;
  var tabsFilePath = `./tabs-${$.getenv("browser")}.tsv`.toString();
  let tabsSeenBefore = {};
  try {
    var savedTabs = app.read(Path(tabsFilePath), { usingDelimiter: "\n" });
    for (let t = 0; t < savedTabs.length; t++ ) {
      let savedTabInfo = savedTabs[t].split("\t");
      tabsSeenBefore[savedTabInfo[0]] = {
        "id": savedTabInfo[0],
        "timesFocused": Number(savedTabInfo[1]),
        "timesSeen": Number(savedTabInfo[2]),
        "lastFocused": Number(savedTabInfo[3])
      }
    }
  }
  catch(e) {
    console.log(e.toString());
  }

  /**
   * This block does a few things:
   * Find all open tabs
   * Increment the times they were seen by one
   * Increments the chosen tab's times focused by one
   * Removes tabs that have been deleted
   * Adds tabs that have not been seen before
  */
  let windowCount = browser.windows.length;
  let chosenId = null;
  let tabsTitle =
    $.getenv("browser") === "Safari"
      ? browser.windows.tabs.name()
      : browser.windows.tabs.title();
  let tabIds = browser.windows.tabs.id();
  let ids = [];
  for (let w = 0; w < windowCount; w++) {
    for (let t = 0; t < tabsTitle[w].length; t++) {
      ids.push(tabIds[w][t] || "");
      if (w == windowIndex && t == tabIndex) {
        chosenId = tabIds[w][t] || "";
      }
    }
  }
  let tabsInBrowser = {};
  for (let u = 0; u < ids.length; u++) {
    let id = ids[u];
    tabsInBrowser[id] = tabsSeenBefore.hasOwnProperty(id) ?
                          {
                            "id": id,
                            "timesFocused": tabsSeenBefore[id].timesFocused,
                            "timesSeen": tabsSeenBefore[id].timesSeen + 1,
                            "lastFocused": tabsSeenBefore[id].lastFocused
                          }
                          : 
                          {
                            "id": id,
                            "timesFocused": 0,
                            "timesSeen": 1,
                            "lastFocused": Number.MAX_VALUE
                          };
  }

  if (tabsInBrowser.hasOwnProperty(chosenId)) {
    tabsInBrowser[chosenId] = {
                            "id": chosenId,
                            "timesFocused": tabsInBrowser[chosenId].timesFocused + 1,
                            "timesSeen": tabsInBrowser[chosenId].timesSeen,
                            "lastFocused": Date.now()
                          };
  }
  
  //Convert to csv
  let tsvList = []
  for (tab in tabsInBrowser) {
    tsvList.push(`${tabsInBrowser[tab].id}\t${tabsInBrowser[tab].timesFocused}\t${tabsInBrowser[tab].timesSeen}\t${tabsInBrowser[tab].lastFocused}`);
  }
  let tsv = tsvList.join("\n").toString();

  //Write to file
  try {
    var openedFile = app.openForAccess(Path(tabsFilePath), { writePermission: true });
    app.setEof(openedFile, { to: 0 });
    app.write(tsv, { to: openedFile, startingAt: app.getEof(openedFile) });
    app.closeAccess(openedFile);
  } catch(error) {
    app.closeAccess(openedFile);
  }

}
