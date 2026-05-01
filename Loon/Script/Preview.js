let body = $response.body || "";
let headers = $response.headers || {};

$done({
  response: {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": "inline"
    },
    body: body.toString()
  }
});
