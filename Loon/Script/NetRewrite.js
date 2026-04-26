// ==UserScript==
// @name         NetRewrit
// @description  跳过Cloudflare私有仓库限制
// @license      GPL License
// @match        *://*.kelee.one/*
// @match        *://loon.103516.xyz/*
// @version      1.0
// @namespace    http://tampermonkey.net/
// @include      *://*.cloudflare.com/*
// @grant        GM_xmlhttpRequest
// @downloadURL https://update.greasyfork.org/scripts/575499/NetRewrit.user.js
// @updateURL https://update.greasyfork.org/scripts/575499/NetRewrit.meta.js
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
