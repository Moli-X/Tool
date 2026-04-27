let url = $request.url;
let body = $response.body || "";

// ==============================
// 1. 只处理文本类（防止二进制炸掉）
// ==============================
if (!body || body.length === 0) {
  body = "Empty response";
}

// 判断是否像二进制
const isBinary = /[\x00-\x08\x0E-\x1F]/.test(body);

if (isBinary) {
  body = "⚠️ Binary content detected, preview blocked";
}

// ==============================
// 2. HTML 转义
// ==============================
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ==============================
// 3. UI 页面
// ==============================
let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Plugin Preview</title>
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
URL: ${url}

----------------------------

${escapeHtml(body)}
</body>
</html>
`;

// ==============================
// 4. 返回 HTML（核心）
// ==============================
$done({
  response: {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    },
    body: html
  }
});
