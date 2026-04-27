// 强制转文本预览
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
body { font-family: monospace; white-space: pre-wrap; padding: 10px; }
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
