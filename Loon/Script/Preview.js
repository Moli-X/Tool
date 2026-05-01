let body = $response.body;

// 尝试解析是否是 plugin/snippet
try {
    // 如果是文本直接返回
    if (typeof body === "string") {
        body = body;
    }

    // 防止被当成下载
    $done({
        response: {
            status: 200,
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Content-Disposition": "inline"
            },
            body: body
        }
    });

} catch (e) {
    $done({
        response: {
            status: 200,
            body: "parse error: " + e
        }
    });
}
