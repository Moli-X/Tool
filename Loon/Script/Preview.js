// ScriptHub 强制预览版（稳定增强）

let body = $response.body;
let headers = $response.headers || {};

// ====== 1. 兜底处理（二进制 / 空内容）======
if (!body || body.length === 0) {
  body = "⚠️ Empty response";
}

// 有些 plugin/snippet 是乱码/二进制
if (body.length > 500000) {
  body = "⚠️ Binary file too large, preview blocked";
}

// ====== 2. HTML 转义 ======
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ====== 3. 构造网页 ======
let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ScriptHub Preview</title>
<style>
body {
  font-family: Menlo, monospace;
  white-space: pre-wrap;
  padding: 12px;
  background: #111;
  color: #00ff88;
}
</style>
</head>
<body>
${escapeHtml(body)}
</body>
</html>
`;

// ====== 4. 强制返回 HTML ======
$done({
  response: {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: html
  }
});
