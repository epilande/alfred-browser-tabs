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
        let url = chrome.windows[widx].spaces[sidx].tabs[i].url();
        allTabs[k] = { title, url };
      }
    }
  }
  let items = Object.keys(allTabs).reduce((acc, k) => {
    let [w, s, t] = k.split("-");
    let url = allTabs[k].url || "";
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
    };
    acc.push(o);
    return acc;
  }, []);

  return JSON.stringify({ items });
}
