// ScriptHub 强制预览（最终强攻版）

let url = $request.url;

// ==============================
// 1. 提取真实链接（_start_ 和 _end_ 中间）
// ==============================
let match = url.match(/_start_\/(.*?)\/_end_/);
let target = match ? decodeURIComponent(match[1]) : url;

// ==============================
// 2. 直接二次请求真实内容
// ==============================
$httpClient.get(target, function (error, response, data) {

  // ============================
  // 失败兜底
  // ============================
  if (error || !data) {
    data = "⚠️ Fetch failed or empty response";
  }

  // ============================
  // 二进制判断（防乱码）
  // ============================
  const isBinary = /[\x00-\x08\x0E-\x1F]/.test(data);
  if (isBinary) {
    data = "⚠️ Binary content detected (preview forced)";
  }

  // ============================
  // HTML 转义
  // ============================
  function escapeHtml(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // ============================
  // 强制预览页面（核心）
  // ============================
  let html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>ScriptHub Force Preview</title>
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

🔗 Original URL:
${url}

📦 Target:
${target}

----------------------------

📄 Content:
${escapeHtml(data)}

</body>
</html>
`;

  // ============================
  // 强制返回 HTML（关键）
  // ============================
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
