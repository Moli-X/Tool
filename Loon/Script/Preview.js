// 强制预览 script.hub（绕过下载机制）

let url = $request.url;

// ======================
// 1. 提取真实目标（_end_ 后面一般是 plugin 链）
// ======================
let match = url.match(/_start_\/(.*?)\/_end_/);

let realUrl = null;

if (match && match[1]) {
  realUrl = decodeURIComponent(match[1]);
} else {
  realUrl = url;
}

// ======================
// 2. 重新请求真实内容（关键）
// ======================
$httpClient.get(realUrl, function(error, response, data) {

  if (error || !data) {
    $done({
      body: "❌ Fetch failed: " + error
    });
    return;
  }

  // ======================
  // 3. HTML 转义
  // ======================
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ======================
  // 4. 强制 HTML 展示
  // ======================
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ScriptHub 强制预览</title>
<style>
body {
  font-family: Menlo, monospace;
  white-space: pre-wrap;
  padding: 12px;
  background: #0f0f0f;
  color: #00ff88;
}
</style>
</head>
<body>

🔗 URL:
${url}

------------------------

📄 CONTENT:
${escapeHtml(data)}

</body>
</html>
`;

  $done({
    response: {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      },
      body: html
    }
  });

});
