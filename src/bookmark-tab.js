#!/usr/bin/env osascript -l JavaScript

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
    ObjC.import("stdlib");
    let browser = $.getenv("browser");
    let chrome = Application(browser);
    let query = args[0];
    let [arg1, arg2, title, url, type, isBookmark] = query.split(",");
    let item = {
        "title": title,
        "url": url,
    }
    var bookmarks = getBookmarks()
    if (isBookmark === "true") {
        bookmarks = bookmarks.filter((bookmark) => bookmark.url !== url)
    } else {
        bookmarks.push(item)
    }
    bookmarksStr = JSON.stringify(bookmarks)
    console.log(bookmarksStr)
    var file = $.NSString.stringWithUTF8String(bookmarksStr);
    file.writeToFileAtomicallyEncodingError('./bookmarks.json', true, $.NSUTF8StringEncoding, null);
}