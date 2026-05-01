let body = $response.body;

// 强制转文本显示（防下载）
$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline"
    },
    body: body
  }
});
