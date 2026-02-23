#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let browser = args[0];
  if (!Application(browser).running()) {
    return JSON.stringify({
      items: [
        {
          title: `${browser} is not running`,
          subtitle: `Press enter to launch ${browser}`,
        },
      ],
    });
  }

  let app = Application.currentApplication();
  app.includeStandardAdditions = true;
  var tabsFilePath = `./tabs-${browser}.tsv`.toString();
  let tabsSeenBefore = {};
  try {
    var savedTabs = app.read(Path(tabsFilePath), { usingDelimiter: "\n" });
    for (let t = 0; t < savedTabs.length; t++ ) {
      let savedTabInfo = savedTabs[t].split("\t");
      tabsSeenBefore[savedTabInfo[0]] = {
        "url": savedTabInfo[0],
        "frequency": Number(savedTabInfo[1])/Number(savedTabInfo[2]),
        "lastFocused": Number(savedTabInfo[3])
      }
    }
  } catch(e) {
    console.log(e.toString());
  }

  let chrome = Application(browser);
  chrome.includeStandardAdditions = true;
  let windowCount = chrome.windows.length;
  let tabsTitle = chrome.windows.tabs.name();
  let tabsUrl = chrome.windows.tabs.url();
  let tabsMap = {};

  for (let w = 0; w < windowCount; w++) {
    for (let t = 0; t < tabsTitle[w].length; t++) {
      let url = tabsUrl[w][t] || "";
      let matchUrl = url.replace(/(^\w+:|^)\/\//, "");
      let title = tabsTitle[w][t] || matchUrl;

      tabsMap[url] = {
        title,
        url,
        subtitle: url,
        windowIndex: w,
        tabIndex: t,
        quicklookurl: url,
        arg: `${w},${t},${url || title}`,
        match: `${title} ${decodeURIComponent(matchUrl).replace(
          /[^\w]/g,
          " ",
        )}`,
        frequency: tabsSeenBefore.hasOwnProperty(url) ? tabsSeenBefore[url].frequency : 0.0,
        lastFocused: tabsSeenBefore.hasOwnProperty(url) ? tabsSeenBefore[url].lastFocused : Number.MAX_VALUE,
      };
    }
  }

  let items = Object.keys(tabsMap).reduce((acc, url) => {
    acc.push(tabsMap[url]);
    return acc;
  }, []);

  items = items.sort((a,b) => { 
    if (a.frequency - b.frequency === 0.0) {
      return b.lastFocused - a.lastFocused;
    } else {
      return b.frequency - a.frequency;
    }
  });

  for (const obj of items) {
    delete obj.frequency;
    delete obj.lastFocused;
  }
  return JSON.stringify({ items });
}
