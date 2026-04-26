// ==UserScript==
// @name         NetRewrit
// @match        *://*.kelee.one/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
    'use strict';

    // 阻止原页面加载
    document.documentElement.innerHTML = "Loading...";

    GM_xmlhttpRequest({
        method: "GET",
        url: window.location.href,
        headers: {
            "User-Agent": "Surge iOS/9527"
        },
        onload: function (res) {
            // 强制按纯文本显示
            document.open();
            document.write("<pre>" + escapeHtml(res.responseText) + "</pre>");
            document.close();
        }
    });

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }
})();
