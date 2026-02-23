#!/usr/bin/env osascript -l JavaScript

function run(args) {
  ObjC.import("stdlib");
  let browser = $.getenv("browser");
  let chrome = Application(browser);
  let query = args[0];
  let [arg1, arg2, arg3, arg4] = query.split(",");

  let windowIndex = parseInt(arg1);
  let spaceIndex = parseInt(arg2);
  let tabIndex = parseInt(arg3);

  chrome.windows[windowIndex].spaces[spaceIndex].focus();
  chrome.windows[windowIndex].spaces[spaceIndex].tabs[tabIndex].select();
  chrome.activate();
  updateTabsFile(chrome, arg4, windowIndex, spaceIndex, tabIndex);
}

function updateTabsFile(browser, urlFocused, windowIndex, spaceIndex, tabIndex) {

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
  let chrome = browser;
  chrome.includeStandardAdditions = true;
  let windowCount = chrome.windows.length;
  let chosenId = "";
  tabsIds = [];
  for (let widx = 0; widx < windowCount; widx++) {
    let spaceCount = chrome.windows[widx].spaces.length;
    for (let sidx = 0; sidx < spaceCount; sidx++) {
      for (let i = 0; i < chrome.windows[widx].spaces[sidx].tabs.length; i++) {
        console.log(`${windowIndex},${spaceIndex},${tabIndex}`)
        tabsIds.push(chrome.windows[widx].spaces[sidx].tabs[i].id());
        if (widx === windowIndex && sidx === spaceIndex && i === tabIndex) {
          chosenId = chrome.windows[widx].spaces[sidx].tabs[i].id();
        }
      }
    }
  }

  let tabsInBrowser = {};
  for (let u = 0; u < tabsIds.length; u++) {
    let id = tabsIds[u];
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
  console.log(tsv);

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
