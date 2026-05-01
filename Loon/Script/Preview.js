let body = $response.body;

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline",
      "Cache-Control": "no-store"
    },
    body: String(body)
  }
});
