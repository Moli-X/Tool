let body = $response.body || "";

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": "inline"
    },
    body: `<pre style="white-space:pre-wrap;">${body}</pre>`
  }
});
