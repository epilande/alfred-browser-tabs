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
        arg: `${w},${url || title}`,
        match: `${title} ${decodeURIComponent(matchUrl).replace(
          /[^\w]/g,
          " ",
        )}`,
      };
    }
  }

  let items = Object.keys(tabsMap).reduce((acc, url) => {
    acc.push(tabsMap[url]);
    return acc;
  }, []);

  return JSON.stringify({ items });
}
