// 2025-09-18 04:07:34

(() => {
    if (!$response?.body) return $done({});

    const { url } = $request;
    const bodyStr = $response.body;

    if (!url.includes("/api/topmenu/getfeeds?")) {
        return $done({});
    }

    let data;
    try {
        data = JSON.parse(bodyStr);
    } catch (e) {
        return $done({});
    }

    if (!data?.data?.list || !Array.isArray(data.data.list)) {
        return $done({});
    }

    let modified = false;
    const list = data.data.list;

    const removeBanners = $argument.removeBanners;
    const removePinnedArticles = $argument.removePinnedArticles;

    if (removeBanners || removePinnedArticles) {
        const originalLength = list.length;
        list.filter(item => {
            const ft = item.feedType;
            if ((removeBanners && ft === 10002) || (removePinnedArticles && ft === 10003)) {
                return false;
            }
            return true;
        });
        modified ||= (list.length !== originalLength);
    }

    for (let i = 0; i < list.length; i++) {
        const item = list[i];

        if (item.feedContent?.flag === 2) {
            list.splice(i, 1);
            i--;
            modified = true;
            continue;
        }

        const focusNews = item.feedContent?.focusNewsData;
        if (Array.isArray(focusNews)) {
            let removedCount = 0;
            for (let j = focusNews.length - 1; j >= 0; j--) {
                if (focusNews[j].isAd === true) {
                    focusNews.splice(j, 1);
                    removedCount++;
                }
            }
            if (removedCount > 0) {
                modified = true;
            }
        }
    }

    $done(modified ? {
        body: JSON.stringify(data),
    } : {});
})();