let body = $response.body;
let headers = $response.headers || {};

// 判断是否是二进制下载类型
let contentType = headers["Content-Type"] || headers["content-type"] || "";

let isDownload =
    contentType.includes("octet-stream") ||
    contentType.includes("application/x-msdownload") ||
    headers["Content-Disposition"]?.includes("attachment");

// 强制改成文本预览
$done({
    response: {
        status: 200,
        headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": "inline",
            "Cache-Control": "no-cache"
        },
        body: body
    }
});
