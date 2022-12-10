#!/usr/bin/env osascript -l JavaScript

ObjC.import("stdlib")

function getBookmarks() {
    bookmarks = [];
    var bookmarksStr = $.NSString.alloc.initWithContentsOfFileEncodingError(
        $.NSString.stringWithUTF8String("./bookmarks.json"),
        $.NSUTF8StringEncoding,
        null
    ).cStringUsingEncoding($.NSUTF8StringEncoding)
    if (bookmarksStr) {
        bookmarks = JSON.parse(bookmarksStr)
    }

    return bookmarks
}

function run(args) {
    let browser = args[0];
    if (!Application(browser).running()) {
        return JSON.stringify({
            items: [{
                title: `${browser} is not running`,
                subtitle: `Press enter to launch ${browser}`,
            }, ],
        });
    }

    let chrome = Application(browser);
    chrome.includeStandardAdditions = true;
    let windowCount = chrome.windows.length;
    let tabsTitle = chrome.windows.tabs.name();
    let tabsUrl = chrome.windows.tabs.url();
    let tabsMap = {};

    bookmarks = getBookmarks()
    for (let w = 0; w < windowCount; w++) {
        for (let t = 0; t < tabsTitle[w].length; t++) {
            let url = tabsUrl[w][t] || "";
            let matchUrl = url.replace(/(^\w+:|^)\/\//, "");
            let title = tabsTitle[w][t] || matchUrl;
            var isBookmark = bookmarks.some((bookmark) => bookmark.url === url);
            let displayTitle = isBookmark ? "★·" + title : title;

            tabsMap[url] = {
                title: displayTitle,
                url,
                subtitle: url,
                windowIndex: w,
                tabIndex: t,
                quicklookurl: url,
                arg: `${w},${t},${title},${url},tab,${isBookmark}`,
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

    if (bookmarks) {
        bookmarks.reverse().forEach((bookmark) => {
            if (!items.some((item) => item.url === bookmark.url)) {
                items.unshift({
                    title: "★·" + bookmark.title,
                    url: bookmark.url,
                    subtitle: bookmark.url,
                    quicklookurl: bookmark.url,
                    arg: `0,0,${bookmark.title},${bookmark.url},url,true`,
                    match: `${bookmark.title} ${decodeURIComponent(bookmark.url).replace( 
                        /[^\w]/g,
                        " ",
                    )}`,
                });
            }
        });
    }


    return JSON.stringify({ items });
}