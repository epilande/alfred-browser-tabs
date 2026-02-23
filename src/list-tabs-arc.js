#!/usr/bin/env osascript -l JavaScript

function run(args) {
  let browser = "Arc";
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
        "id": savedTabInfo[0],
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
  let allTabs = {};
  for (let widx = 0; widx < windowCount; widx++) {
    let spaceCount = chrome.windows[widx].spaces.length;
    for (let sidx = 0; sidx < spaceCount; sidx++) {
      for (let i = 0; i < chrome.windows[widx].spaces[sidx].tabs.length; i++) {
        let k = `${widx}-${sidx}-${i}`;
        let title = chrome.windows[widx].spaces[sidx].tabs[i].title();
        let id = chrome.windows[widx].spaces[sidx].tabs[i].id();
        allTabs[k] = { title, id };
      }
    }
  }

  let items = Object.keys(allTabs).reduce((acc, k) => {
    let [w, s, t] = k.split("-");
    let url = allTabs[k].url || "";
    let id = allTabs[k].id;
    let matchUrl = url.replace(/(^\w+:|^)\/\//, "");
    let title = allTabs[k].title || matchUrl;

    let o = {
      title,
      url,
      subtitle: url,
      windowIndex: w,
      tabIndex: t,
      spaceIndex: s,
      quicklookurl: url,
      arg: `${w},${s},${t},${url}`,
      match: `${title} ${decodeURIComponent(matchUrl).replace(/[^\w]/g, " ")}`,
      identfier: id,
      frequency: tabsSeenBefore.hasOwnProperty(id) ? tabsSeenBefore[id].frequency : 0.0,
      lastFocused: tabsSeenBefore.hasOwnProperty(id) ? tabsSeenBefore[id].lastFocused : Number.MAX_VALUE,
    };
    acc.push(o);
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
    delete obj.identfier;
    delete obj.frequency;
    delete obj.lastFocused;
  }
  return JSON.stringify({ items });
}
