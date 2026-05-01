let body = $response.body || "";
let headers = $response.headers || {};

// 判断是否下载流
let contentType = headers["Content-Type"] || headers["content-type"] || "";
let disposition = headers["Content-Disposition"] || headers["content-disposition"] || "";

// 强制转换为文本展示
$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store"
    },
    body: String(body)
  }
});
