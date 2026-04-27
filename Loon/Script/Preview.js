// 强制文本预览（100%有效）
let body = $response.body;

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

let html = `
<html>
<head>
<meta charset="utf-8">
<title>Preview</title>
<style>
body {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 12px;
  background: #111;
  color: #0f0;
}
</style>
</head>
<body>
${escapeHtml(body)}
</body>
</html>
`;

$done({
  headers: {
    "Content-Type": "text/html; charset=utf-8"
  },
  body: html
});
