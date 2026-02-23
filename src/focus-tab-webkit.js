#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");
  let browser = $.getenv("browser");
  let app = Application(browser);
  let query = args[0];
  let [windowIndex, tabIndex, url] = query.split(",");
  let window = app.windows[windowIndex]();

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
  app.activate();
  window.currentTab = tab;
  // Force tab window to front
  window.visible = false;
  window.visible = true;
  updateTabsFile(app, url, windowIndex, tabIndex);
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
        "url": savedTabInfo[0],
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
  let chrome = browser;
  chrome.includeStandardAdditions = true;
  let windowCount = chrome.windows.length;
  let tabsTitle = chrome.windows.tabs.name();
  let tabsUrl = chrome.windows.tabs.url();
  let chosenUrl = "";
  tabsUrls = [];
  for (let w = 0; w < windowCount; w++) {
    for (let t = 0; t < tabsTitle[w].length; t++) {
      tabsUrls.push(tabsUrl[w][t] || "");
      if (w == windowIndex && t == tabIndex) {
        chosenUrl = tabsUrl[w][t] || "";
      }
    }
  }
  const uniqueUrls = [...new Set(tabsUrls)];
  let tabsInBrowser = {};
  for (let u = 0; u < uniqueUrls.length; u++) {
    let url = uniqueUrls[u];
    tabsInBrowser[url] = tabsSeenBefore.hasOwnProperty(url) ?
                          {
                            "url": url,
                            "timesFocused": tabsSeenBefore[url].timesFocused,
                            "timesSeen": tabsSeenBefore[url].timesSeen + 1,
                            "lastFocused": tabsSeenBefore[url].lastFocused
                          }
                          : 
                          {
                            "url": url,
                            "timesFocused": 0,
                            "timesSeen": 1,
                            "lastFocused": Number.MAX_VALUE
                          };
  }

  if (tabsInBrowser.hasOwnProperty(chosenUrl)) {
    tabsInBrowser[chosenUrl] = {
                            "url": chosenUrl,
                            "timesFocused": tabsInBrowser[chosenUrl].timesFocused + 1,
                            "timesSeen": tabsInBrowser[chosenUrl].timesSeen,
                            "lastFocused": Date.now()
                          };
  }
  
  //Convert to csv
  let tsvList = []
  for (tab in tabsInBrowser) {
    tsvList.push(`${tabsInBrowser[tab].url}\t${tabsInBrowser[tab].timesFocused}\t${tabsInBrowser[tab].timesSeen}\t${tabsInBrowser[tab].lastFocused}`);
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
