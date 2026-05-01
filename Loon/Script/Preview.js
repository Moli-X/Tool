let body = $response.body || "";

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline; filename=preview.txt",
      "X-Content-Type-Options": "nosniff"
    },
    body: body
  }
});
