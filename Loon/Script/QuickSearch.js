// ==UserScript==
// @name         万能快捷搜索 Pro
// @namespace    https://tampermonkey.net/
// @version      2.3.0
// @description  全站快捷搜索；支持自定义搜索引擎、快捷键、默认搜索引擎与悬浮按钮
// @author       Moli-X
// @match        http://*/*
// @match        https://*/*
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-start
// @noframes
// @downloadURL https://update.greasyfork.org/scripts/591699/%E4%B8%87%E8%83%BD%E5%BF%AB%E6%8D%B7%E6%90%9C%E7%B4%A2%20Pro.user.js
// @updateURL https://update.greasyfork.org/scripts/591699/%E4%B8%87%E8%83%BD%E5%BF%AB%E6%8D%B7%E6%90%9C%E7%B4%A2%20Pro.meta.js
// ==/UserScript==

(function () {
    'use strict';

    /* =========================================================
     * 1. 配置
     * ========================================================= */

    const VERSION = '2.3.0';

    const KEYS = {
        ENGINES: 'qs_engines_v23',
        DEFAULT_ENGINE: 'qs_default_engine_v23',
        HOTKEY: 'qs_hotkey_v23',
        FLOATING_ENABLED: 'qs_floating_enabled_v23'
    };

    /* 默认快捷键：Alt + / */
    const DEFAULT_HOTKEY = {
        ctrl: false,
        shift: false,
        alt: true,
        meta: false,
        key: '/'
    };

    /* =========================================================
     * 默认搜索引擎
     * %s = 搜索内容
     * ========================================================= */

    const DEFAULT_ENGINES = [

        {
            name: 'Google',
            keyword: 'gg',
            url: 'https://www.google.com/search?q=%s'
        },

        {
            name: '百度',
            keyword: 'bd',
            url: 'https://www.baidu.com/s?ie=UTF-8&wd=%s'
        },

        {
            name: 'DuckDuckGo',
            keyword: 'dg',
            url: 'https://duckduckgo.com/?ia=web&origin=funnel_home_google&t=h_&q=%s&chip-select=search'
        },

        {
            name: '有道',
            keyword: 'yd',
            url: 'https://www.youdao.com/result?word=%s&lang=en'
        },

        {
            name: '台达下载中心',
            keyword: 'td',
            url: 'https://downloadcenter.delta-china.com.cn/DownloadCenter?v=1&q=%s&sort_expr=cdate&sort_dir=DESC'
        },

        {
            name: '谷歌翻译',
            keyword: 'fy',
            url: 'https://translate.google.com/?hl=zh-cn&sl=auto&tl=zh-CN&text=%s%0A&op=translate'
        },

        {
            name: 'GitHub',
            keyword: 'gh',
            url: 'https://github.com/search?q=%s&type=repositories'
        }

    ];

    let observer = null;

    /* =========================================================
     * 2. 数据
     * ========================================================= */

    function clone(obj) {
        return JSON.parse(
            JSON.stringify(obj)
        );
    }

    function getEngines() {

        const value =
            GM_getValue(
                KEYS.ENGINES,
                null
            );

        if (
            !Array.isArray(value) ||
            value.length === 0
        ) {

            const defaults =
                clone(DEFAULT_ENGINES);

            GM_setValue(
                KEYS.ENGINES,
                defaults
            );

            return defaults;
        }

        return value;
    }

    function saveEngines(engines) {

        GM_setValue(
            KEYS.ENGINES,
            engines
        );
    }

    function getDefaultKeyword() {

        return GM_getValue(
            KEYS.DEFAULT_ENGINE,
            'gg'
        );
    }

    function setDefaultKeyword(keyword) {

        GM_setValue(
            KEYS.DEFAULT_ENGINE,
            keyword
        );
    }

    function getHotkey() {

        const value =
            GM_getValue(
                KEYS.HOTKEY,
                null
            );

        if (
            !value ||
            !value.key
        ) {

            const defaultHotkey =
                clone(DEFAULT_HOTKEY);

            GM_setValue(
                KEYS.HOTKEY,
                defaultHotkey
            );

            return defaultHotkey;
        }

        return value;
    }

    function setHotkey(hotkey) {

        GM_setValue(
            KEYS.HOTKEY,
            hotkey
        );
    }

    function getFloatingEnabled() {

        return GM_getValue(
            KEYS.FLOATING_ENABLED,
            true
        );
    }

    function setFloatingEnabled(enabled) {

        GM_setValue(
            KEYS.FLOATING_ENABLED,
            Boolean(enabled)
        );
    }

    /* =========================================================
     * 3. DOM工具
     * ========================================================= */

    function qs(selector) {

        return document.querySelector(
            selector
        );
    }

    function removeEl(selector) {

        qs(selector)?.remove();
    }

    function applyImportant(
        element,
        styles
    ) {

        Object.entries(styles)
            .forEach(
                ([key, value]) => {

                    element.style.setProperty(
                        key,
                        value,
                        'important'
                    );

                }
            );
    }

    /* =========================================================
     * 4. UI CSS隔离
     *
     * 防止 ChatGPT / Google / 豆包 / B站 等网站CSS
     * 把我们的输入框、section、按钮撑高
     * ========================================================= */

    function injectUIResetStyle() {

        if (
            document.getElementById(
                'qs-ui-reset-v23'
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                'style'
            );

        style.id =
            'qs-ui-reset-v23';

        style.textContent = `

            /* ===============================================
             * 万能快捷搜索 Pro
             * UI CSS Reset
             * =============================================== */

            #qs-search-mask-v23,
            #qs-search-mask-v23 *,
            #qs-manager-mask-v23,
            #qs-manager-mask-v23 * {

                box-sizing:
                    border-box !important;

                text-indent:
                    0 !important;

                letter-spacing:
                    normal !important;

            }


            #qs-search-panel-v23,
            #qs-search-panel-v23 *,
            #qs-manager-panel-v23,
            #qs-manager-panel-v23 * {

                min-height:
                    0 !important;

            }


            #qs-search-panel-v23 section,
            #qs-manager-panel-v23 section {

                min-height:
                    0 !important;

                height:
                    auto !important;

                margin:
                    0 !important;

            }


            #qs-search-panel-v23 label,
            #qs-manager-panel-v23 label {

                min-height:
                    0 !important;

                height:
                    auto !important;

                line-height:
                    normal !important;

            }


            #qs-search-panel-v23 input,
            #qs-manager-panel-v23 input,
            #qs-search-panel-v23 select,
            #qs-manager-panel-v23 select {

                min-height:
                    0 !important;

                max-height:
                    none !important;

                line-height:
                    normal !important;

                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    "Microsoft YaHei",
                    Arial,
                    sans-serif !important;

            }


            #qs-search-panel-v23 button,
            #qs-manager-panel-v23 button {

                min-height:
                    0 !important;

                min-width:
                    0 !important;

                line-height:
                    normal !important;

                font-family:
                    -apple-system,
                    BlinkMacSystemFont,
                    "Segoe UI",
                    "Microsoft YaHei",
                    Arial,
                    sans-serif !important;

            }


            #qs-engine-list-v23 > div {

                height:
                    auto !important;

                min-height:
                    0 !important;

            }


            .qs-edit-v23,
            .qs-delete-v23 {

                height:
                    28px !important;

                min-height:
                    28px !important;

                padding:
                    0 6px !important;

                margin:
                    0 !important;

            }

        `;

        document.documentElement
            .appendChild(style);
    }

    /* =========================================================
     * 5. 悬浮按钮
     * ========================================================= */

    function ensureFloatingButton() {

        if (
            !document.documentElement
        ) {
            return;
        }

        /* 用户关闭悬浮按钮 */

        if (
            !getFloatingEnabled()
        ) {

            removeEl(
                '#qs-floating-btn-v23'
            );

            return;
        }

        let button =
            qs(
                '#qs-floating-btn-v23'
            );

        if (!button) {

            button =
                document.createElement(
                    'button'
                );

            button.id =
                'qs-floating-btn-v23';

            button.type =
                'button';

            button.textContent =
                '⌕';

            button.setAttribute(
                'aria-label',
                '万能快捷搜索'
            );

            applyImportant(
                button,
                {

                    position:
                        'fixed',

                    right:
                        '22px',

                    bottom:
                        '22px',

                    width:
                        '48px',

                    height:
                        '48px',

                    border:
                        'none',

                    'border-radius':
                        '15px',

                    background:
                        'rgba(20,103,219,.96)',

                    color:
                        '#ffffff',

                    'font-size':
                        '25px',

                    'font-family':
                        '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif',

                    'line-height':
                        '48px',

                    'text-align':
                        'center',

                    cursor:
                        'pointer',

                    'z-index':
                        '2147483647',

                    'box-shadow':
                        '0 8px 26px rgba(0,0,0,.18),0 2px 8px rgba(20,103,219,.22)',

                    opacity:
                        '1',

                    visibility:
                        'visible',

                    display:
                        'block',

                    padding:
                        '0',

                    margin:
                        '0',

                    transform:
                        'none',

                    'pointer-events':
                        'auto',

                    'user-select':
                        'none'

                }
            );

            button.addEventListener(
                'mouseenter',
                () => {

                    button.style
                        .setProperty(
                            'transform',
                            'translateY(-2px) scale(1.05)',
                            'important'
                        );
                }
            );

            button.addEventListener(
                'mouseleave',
                () => {

                    button.style
                        .setProperty(
                            'transform',
                            'none',
                            'important'
                        );
                }
            );

            button.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();

                    openSearchPanel();

                },
                true
            );

            document.documentElement
                .appendChild(button);
        }

        button.title =
            `万能快捷搜索（${formatHotkey(getHotkey())}）`;
    }

    /* =========================================================
     * 6. SPA按钮守护
     * ========================================================= */

    function startGuard() {

        if (
            !document.documentElement ||
            observer
        ) {
            return;
        }

        observer =
            new MutationObserver(
                () => {

                    ensureFloatingButton();

                }
            );

        observer.observe(
            document.documentElement,
            {

                childList:
                    true,

                subtree:
                    true

            }
        );

        /* 双保险 */

        setInterval(
            () => {

                ensureFloatingButton();

            },
            2000
        );
    }

    /* =========================================================
     * 7. 遮罩层
     * ========================================================= */

    function forceOverlayStyles(
        element
    ) {

        applyImportant(
            element,
            {

                position:
                    'fixed',

                inset:
                    '0',

                'z-index':
                    '2147483647',

                display:
                    'flex',

                'align-items':
                    'flex-start',

                'justify-content':
                    'center',

                background:
                    'rgba(15,23,42,.30)',

                'backdrop-filter':
                    'blur(5px)',

                '-webkit-backdrop-filter':
                    'blur(5px)',

                padding:
                    '8vh 16px 32px',

                'overflow-y':
                    'auto',

                'box-sizing':
                    'border-box',

                'pointer-events':
                    'auto',

                visibility:
                    'visible',

                opacity:
                    '1'

            }
        );
    }

    /* =========================================================
     * 8. 搜索
     * ========================================================= */

    function search(input) {

        input =
            String(input || '')
                .trim();

        if (!input) {
            return;
        }

        const engines =
            getEngines();

        const parts =
            input.split(/\s+/);

        const firstWord =
            parts[0]
                .toLowerCase();

        let engine =
            engines.find(
                item =>
                    String(
                        item.keyword
                    ).toLowerCase()
                    === firstWord
            );

        let query;

        /* 有快捷字词 */

        if (engine) {

            query =
                input
                    .substring(
                        parts[0].length
                    )
                    .trim();

            if (!query) {

                showToast(
                    `请输入 ${engine.name} 的搜索内容`
                );

                return;
            }

        }

        /* 没有快捷字词 */

        else {

            const defaultKeyword =
                getDefaultKeyword();

            engine =
                engines.find(
                    item =>
                        item.keyword ===
                        defaultKeyword
                )
                ||
                engines[0];

            query =
                input;
        }

        if (!engine) {

            showToast(
                '没有可用的搜索引擎'
            );

            return;
        }

        if (
            !String(
                engine.url
            ).includes('%s')
        ) {

            showToast(
                `${engine.name} 的网址格式不正确，必须包含 %s`
            );

            return;
        }

        const encodedQuery =
            encodeURIComponent(
                query
            );

        const url =
            engine.url.replace(
                '%s',
                encodedQuery
            );

        GM_openInTab(
            url,
            {

                active:
                    true,

                insert:
                    true

            }
        );

        closeSearchPanel();
    }

    /* =========================================================
     * 9. 创建弹窗容器
     * ========================================================= */

    function createPanelContainer(
        id,
        width
    ) {

        const panel =
            document.createElement(
                'div'
            );

        panel.id =
            id;

        applyImportant(
            panel,
            {

                width,

                background:
                    'rgba(255,255,255,.99)',

                border:
                    '1px solid rgba(15,23,42,.08)',

                'border-radius':
                    '18px',

                'box-shadow':
                    '0 28px 80px rgba(15,23,42,.22),0 4px 18px rgba(15,23,42,.10)',

                overflow:
                    'hidden',

                'font-family':
                    '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif',

                color:
                    '#1f2328',

                'box-sizing':
                    'border-box',

                'pointer-events':
                    'auto'

            }
        );

        return panel;
    }

    /* =========================================================
     * 10. 搜索窗口
     * ========================================================= */

    function openSearchPanel() {

        closeManager();

        closeSearchPanel();

        const mask =
            document.createElement(
                'div'
            );

        mask.id =
            'qs-search-mask-v23';

        forceOverlayStyles(mask);

        const panel =
            createPanelContainer(
                'qs-search-panel-v23',
                'min(680px,calc(100vw - 32px))'
            );

        const engines =
            getEngines();

        const hotkey =
            getHotkey();

        const defaultEngine =
            engines.find(
                engine =>
                    engine.keyword ===
                    getDefaultKeyword()
            )
            ||
            engines[0];

        let selectedText =
            '';

        try {

            selectedText =
                window
                    .getSelection?.()
                    .toString()
                    .trim()
                ||
                '';

        }

        catch (_) {}

        panel.innerHTML = `

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding:16px 18px 6px;
                "
            >

                <div>

                    <div
                        style="
                            font-size:18px;
                            font-weight:700;
                            color:#111827;
                        "
                    >
                        万能快捷搜索
                    </div>

                    <div
                        style="
                            margin-top:3px;
                            font-size:12px;
                            color:#8a94a3;
                        "
                    >
                        ${escapeHTML(formatHotkey(hotkey))} 呼出
                    </div>

                </div>


                <button
                    id="qs-search-close-v23"
                    style="
                        width:34px;
                        height:34px;
                        border:0;
                        border-radius:9px;
                        background:transparent;
                        color:#7b8491;
                        font-size:24px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <div
                style="
                    display:flex;
                    align-items:center;
                    gap:8px;
                    padding:10px 14px 12px;
                "
            >

                <input
                    id="qs-input-v23"
                    type="text"
                    autocomplete="off"
                    spellcheck="false"

                    placeholder="输入：gg EtherCAT、bd 台达、td C2000、fy hello"

                    style="
                        flex:1;
                        height:50px;
                        padding:0 15px;
                        border-radius:12px;
                        background:#f4f6f8;
                        border:1px solid #e8ebef;
                        outline:none;
                        color:#15191e;
                        font-size:16px;
                        font-family:inherit;
                    "
                >


                <button
                    id="qs-setting-v23"

                    title="快捷搜索设置"

                    style="
                        width:48px;
                        height:48px;
                        border:0;
                        border-radius:12px;
                        background:#f4f6f8;
                        color:#55606f;
                        font-size:19px;
                        cursor:pointer;
                    "
                >
                    ⚙
                </button>

            </div>


            <div
                id="qs-tags-v23"

                style="
                    display:flex;
                    flex-wrap:wrap;
                    gap:7px;
                    padding:0 14px 12px;
                "
            >
            </div>


            <div
                style="
                    padding:10px 14px 13px;
                    border-top:1px solid #f0f2f4;
                    color:#8a94a3;
                    font-size:12px;
                "
            >

                默认搜索：
                ${escapeHTML(defaultEngine?.name || '')}

            </div>

        `;

        mask.appendChild(panel);

        document.documentElement
            .appendChild(mask);

        const input =
            qs('#qs-input-v23');

        if (selectedText) {

            input.value =
                selectedText;
        }

        setTimeout(
            () => {

                input?.focus();

                if (selectedText) {
                    input?.select();
                }

            },
            0
        );

        input?.addEventListener(
            'keydown',
            event => {

                if (
                    event.key ===
                    'Enter'
                ) {

                    event.preventDefault();

                    search(
                        input.value
                    );
                }
            }
        );

        qs(
            '#qs-search-close-v23'
        )?.addEventListener(
            'click',
            closeSearchPanel
        );

        qs(
            '#qs-setting-v23'
        )?.addEventListener(
            'click',
            openManager
        );

        const tags =
            qs('#qs-tags-v23');

        engines.forEach(
            engine => {

                const tag =
                    document.createElement(
                        'button'
                    );

                tag.textContent =
                    `${engine.keyword} · ${engine.name}`;

                applyImportant(
                    tag,
                    {

                        padding:
                            '6px 9px',

                        border:
                            '1px solid #e2e6ea',

                        'border-radius':
                            '9px',

                        background:
                            '#ffffff',

                        color:
                            '#4c5664',

                        'font-size':
                            '12px',

                        cursor:
                            'pointer',

                        height:
                            '30px',

                        'font-family':
                            'inherit'

                    }
                );

                tag.addEventListener(
                    'click',
                    () => {

                        const current =
                            input.value
                                .trim();

                        input.value =
                            current
                                ?
                                `${engine.keyword} ${current}`
                                :
                                `${engine.keyword} `;

                        input.focus();

                        input.setSelectionRange(
                            input.value.length,
                            input.value.length
                        );
                    }
                );

                tags.appendChild(
                    tag
                );
            }
        );

        mask.addEventListener(
            'mousedown',
            event => {

                if (
                    event.target ===
                    mask
                ) {

                    closeSearchPanel();
                }
            }
        );
    }

    function closeSearchPanel() {

        removeEl(
            '#qs-search-mask-v23'
        );
    }

    /* =========================================================
     * 11. 设置窗口
     * ========================================================= */

    function openManager(
        editKeyword = null
    ) {

        closeSearchPanel();

        closeManager();

        const mask =
            document.createElement(
                'div'
            );

        mask.id =
            'qs-manager-mask-v23';

        forceOverlayStyles(mask);

        const panel =
            createPanelContainer(
                'qs-manager-panel-v23',
                'min(820px,calc(100vw - 32px))'
            );

        applyImportant(
            panel,
            {

                'max-height':
                    '84vh',

                'overflow-y':
                    'auto',

                padding:
                    '20px'

            }
        );

        mask.appendChild(
            panel
        );

        document.documentElement
            .appendChild(mask);

        renderManager(
            panel,
            editKeyword
        );

        mask.addEventListener(
            'mousedown',
            event => {

                if (
                    event.target ===
                    mask
                ) {

                    closeManager();
                }
            }
        );
    }

    function closeManager() {

        removeEl(
            '#qs-manager-mask-v23'
        );
    }

    /* =========================================================
     * 12. 设置UI
     * ========================================================= */

    function renderManager(
        panel,
        editKeyword = null
    ) {

        const engines =
            getEngines();

        const editing =
            editKeyword
                ?
                engines.find(
                    item =>
                        item.keyword ===
                        editKeyword
                )
                :
                null;

        const hotkey =
            getHotkey();

        panel.innerHTML = `

            <!-- 标题 -->

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    padding-bottom:14px;
                    border-bottom:1px solid #edf0f3;
                "
            >

                <div>

                    <div
                        style="
                            font-size:18px;
                            font-weight:700;
                            color:#111827;
                        "
                    >
                        快捷搜索设置
                    </div>

                    <div
                        style="
                            margin-top:3px;
                            color:#8a94a3;
                            font-size:12px;
                        "
                    >
                        万能快捷搜索 Pro v${VERSION}
                    </div>

                </div>


                <button
                    id="qs-manager-close-v23"

                    style="
                        width:34px;
                        height:34px;
                        border:0;
                        background:transparent;
                        color:#7b8491;
                        font-size:24px;
                        cursor:pointer;
                    "
                >
                    ×
                </button>

            </div>


            <!-- 界面 -->

            <section
                style="
                    padding:16px 0;
                    border-bottom:1px solid #edf0f3;
                "
            >

                <div
                    style="
                        margin-bottom:10px;
                        color:#18212f;
                        font-size:14px;
                        font-weight:700;
                    "
                >
                    界面
                </div>


                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        padding:13px 14px;
                        border:1px solid #e6e9ed;
                        border-radius:11px;
                        background:#fafbfc;
                    "
                >

                    <div>

                        <div
                            style="
                                font-size:13px;
                                font-weight:600;
                                color:#293241;
                            "
                        >
                            右下角悬浮按钮
                        </div>

                        <div
                            style="
                                margin-top:4px;
                                font-size:11px;
                                color:#8993a2;
                            "
                        >
                            关闭后仍可使用快捷键打开搜索
                        </div>

                    </div>


                    <label
                        style="
                            display:flex;
                            align-items:center;
                            gap:6px;
                            cursor:pointer;
                        "
                    >

                        <input
                            id="qs-floating-toggle-v23"
                            type="checkbox"

                            ${getFloatingEnabled() ? 'checked' : ''}

                            style="
                                width:17px;
                                height:17px;
                                margin:0;
                            "
                        >

                        <span
                            style="
                                font-size:12px;
                                color:#4b5563;
                            "
                        >
                            ${
                                getFloatingEnabled()
                                    ?
                                    '已开启'
                                    :
                                    '已关闭'
                            }
                        </span>

                    </label>

                </div>

            </section>


            <!-- 快捷键 -->

            <section
                style="
                    padding:16px 0;
                    border-bottom:1px solid #edf0f3;
                "
            >

                <div
                    style="
                        margin-bottom:10px;
                        color:#18212f;
                        font-size:14px;
                        font-weight:700;
                    "
                >
                    快捷键
                </div>


                <div
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:space-between;
                        padding:13px 14px;
                        border:1px solid #e6e9ed;
                        border-radius:11px;
                        background:#fafbfc;
                    "
                >

                    <div>

                        <div
                            style="
                                font-size:13px;
                                font-weight:600;
                                color:#293241;
                            "
                        >
                            呼出搜索框
                        </div>

                        <div
                            style="
                                margin-top:4px;
                                font-size:11px;
                                color:#8993a2;
                            "
                        >
                            默认 Alt + /
                        </div>

                    </div>


                    <div
                        style="
                            display:flex;
                            align-items:center;
                            gap:8px;
                        "
                    >

                        <div
                            id="qs-hotkey-display-v23"

                            style="
                                padding:7px 10px;
                                border-radius:7px;
                                background:#edf2f7;
                                font-size:12px;
                                font-weight:700;
                            "
                        >

                            ${escapeHTML(formatHotkey(hotkey))}

                        </div>


                        <button
                            id="qs-record-hotkey-v23"

                            style="
                                height:34px;
                                padding:0 12px;
                                border:1px solid #1467db;
                                border-radius:8px;
                                background:#1467db;
                                color:#fff;
                                font-size:12px;
                                cursor:pointer;
                            "
                        >
                            修改
                        </button>

                    </div>

                </div>


                <div
                    id="qs-record-box-v23"
                    tabindex="0"

                    style="
                        display:none;
                        margin-top:8px;
                        padding:13px;
                        border:1px dashed #7eb0f3;
                        border-radius:9px;
                        background:#f4f8ff;
                        text-align:center;
                        outline:none;
                    "
                >

                    <div
                        style="
                            font-size:12px;
                            color:#4f5d70;
                        "
                    >
                        请按新的快捷键
                    </div>

                    <div
                        id="qs-record-preview-v23"

                        style="
                            margin-top:6px;
                            color:#1467db;
                            font-size:17px;
                            font-weight:700;
                        "
                    >
                        等待输入
                    </div>

                </div>

            </section>


            <!-- 搜索引擎编辑 -->

            <section
                style="
                    padding:16px 0;
                    border-bottom:1px solid #edf0f3;
                "
            >

                <div
                    style="
                        margin-bottom:12px;
                        color:#18212f;
                        font-size:14px;
                        font-weight:700;
                    "
                >
                    ${
                        editing
                            ?
                            '修改搜索引擎'
                            :
                            '新增搜索引擎'
                    }
                </div>


                <div
                    style="
                        display:grid;
                        grid-template-columns:1fr 1fr;
                        gap:10px;
                    "
                >

                    <div>

                        <label
                            style="
                                display:block;
                                margin-bottom:5px;
                                color:#5a6573;
                                font-size:11px;
                            "
                        >
                            名称
                        </label>

                        <input
                            id="qs-engine-name-v23"

                            value="${
                                editing
                                    ?
                                    escapeHTML(editing.name)
                                    :
                                    ''
                            }"

                            placeholder="例如：有道"

                            style="
                                width:100%;
                                height:38px;
                                padding:0 10px;
                                border:1px solid #dfe4e9;
                                border-radius:8px;
                                outline:none;
                                background:#fff;
                                font-size:12px;
                            "
                        >

                    </div>


                    <div>

                        <label
                            style="
                                display:block;
                                margin-bottom:5px;
                                color:#5a6573;
                                font-size:11px;
                            "
                        >
                            快捷字词
                        </label>

                        <input
                            id="qs-engine-keyword-v23"

                            value="${
                                editing
                                    ?
                                    escapeHTML(editing.keyword)
                                    :
                                    ''
                            }"

                            placeholder="例如：yd"

                            style="
                                width:100%;
                                height:38px;
                                padding:0 10px;
                                border:1px solid #dfe4e9;
                                border-radius:8px;
                                outline:none;
                                background:#fff;
                                font-size:12px;
                            "
                        >

                    </div>

                </div>


                <div
                    style="
                        margin-top:10px;
                    "
                >

                    <label
                        style="
                            display:block;
                            margin-bottom:5px;
                            color:#5a6573;
                            font-size:11px;
                        "
                    >
                        网址格式（%s 代表搜索内容）
                    </label>

                    <input
                        id="qs-engine-url-v23"

                        value="${
                            editing
                                ?
                                escapeHTML(editing.url)
                                :
                                ''
                        }"

                        placeholder="https://example.com/search?q=%s"

                        style="
                            width:100%;
                            height:38px;
                            padding:0 10px;
                            border:1px solid #dfe4e9;
                            border-radius:8px;
                            outline:none;
                            background:#fff;
                            font-size:12px;
                        "
                    >

                </div>


                <div
                    style="
                        margin-top:10px;
                    "
                >

                    <label
                        style="
                            display:block;
                            margin-bottom:5px;
                            color:#5a6573;
                            font-size:11px;
                        "
                    >
                        默认搜索引擎
                    </label>


                    <select
                        id="qs-default-engine-v23"

                        style="
                            width:100%;
                            height:38px;
                            padding:0 10px;
                            border:1px solid #dfe4e9;
                            border-radius:8px;
                            background:#fff;
                            font-size:12px;
                        "
                    >

                        ${
                            engines
                                .map(
                                    engine => `

                                        <option

                                            value="${escapeHTML(engine.keyword)}"

                                            ${
                                                engine.keyword ===
                                                getDefaultKeyword()
                                                    ?
                                                    'selected'
                                                    :
                                                    ''
                                            }

                                        >

                                            ${escapeHTML(engine.name)}
                                            (${escapeHTML(engine.keyword)})

                                        </option>

                                    `
                                )
                                .join('')
                        }

                    </select>

                </div>


                <div
                    style="
                        display:flex;
                        justify-content:flex-end;
                        gap:8px;
                        margin-top:12px;
                    "
                >

                    ${
                        editing
                            ?
                            `

                            <button
                                id="qs-cancel-edit-v23"

                                style="
                                    height:34px;
                                    padding:0 12px;
                                    border:1px solid #dce1e6;
                                    border-radius:8px;
                                    background:#fff;
                                    font-size:12px;
                                    cursor:pointer;
                                "
                            >
                                取消
                            </button>

                            `
                            :
                            ''
                    }


                    <button
                        id="qs-save-engine-v23"

                        style="
                            height:34px;
                            padding:0 12px;
                            border:1px solid #1467db;
                            border-radius:8px;
                            background:#1467db;
                            color:#fff;
                            font-size:12px;
                            cursor:pointer;
                        "
                    >

                        ${
                            editing
                                ?
                                '保存修改'
                                :
                                '新增'
                        }

                    </button>

                </div>

            </section>


            <!-- 搜索引擎列表 -->

            <section
                style="
                    padding:16px 0;
                    border-bottom:1px solid #edf0f3;
                "
            >

                <div
                    style="
                        margin-bottom:10px;
                        color:#18212f;
                        font-size:14px;
                        font-weight:700;
                    "
                >
                    已有搜索引擎
                </div>


                <div
                    id="qs-engine-list-v23"

                    style="
                        display:flex;
                        flex-direction:column;
                        gap:6px;
                    "
                >
                </div>

            </section>


            <!-- 底部 -->

            <div
                style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding-top:14px;
                "
            >

                <button
                    id="qs-reset-v23"

                    style="
                        height:34px;
                        padding:0 12px;
                        border:1px solid #dce1e6;
                        border-radius:8px;
                        background:#fff;
                        color:#d73a49;
                        font-size:12px;
                        cursor:pointer;
                    "
                >
                    恢复默认配置
                </button>


                <div
                    style="
                        color:#9099a6;
                        font-size:10px;
                    "
                >
                    默认搜索：Google
                </div>

            </div>

        `;

        /* =====================================================
         * UI事件
         * ===================================================== */

        qs(
            '#qs-manager-close-v23'
        )?.addEventListener(
            'click',
            closeManager
        );


        qs(
            '#qs-cancel-edit-v23'
        )?.addEventListener(
            'click',
            () => {

                renderManager(
                    panel
                );
            }
        );


        /* 悬浮按钮 */

        qs(
            '#qs-floating-toggle-v23'
        )?.addEventListener(
            'change',
            event => {

                setFloatingEnabled(
                    event.target.checked
                );

                ensureFloatingButton();

                showToast(
                    event.target.checked
                        ?
                        '悬浮按钮已开启'
                        :
                        '悬浮按钮已关闭'
                );

                renderManager(
                    panel
                );
            }
        );


        /* 默认搜索 */

        qs(
            '#qs-default-engine-v23'
        )?.addEventListener(
            'change',
            event => {

                setDefaultKeyword(
                    event.target.value
                );

                showToast(
                    '默认搜索引擎已修改'
                );

                renderManager(
                    panel
                );
            }
        );


        /* 保存搜索引擎 */

        qs(
            '#qs-save-engine-v23'
        )?.addEventListener(
            'click',
            () => {

                const name =
                    qs(
                        '#qs-engine-name-v23'
                    )
                        .value
                        .trim();

                const keyword =
                    qs(
                        '#qs-engine-keyword-v23'
                    )
                        .value
                        .trim()
                        .toLowerCase();

                const url =
                    qs(
                        '#qs-engine-url-v23'
                    )
                        .value
                        .trim();


                if (!name) {

                    showToast(
                        '请输入名称'
                    );

                    return;
                }


                if (!keyword) {

                    showToast(
                        '请输入快捷字词'
                    );

                    return;
                }


                if (
                    /\s/.test(keyword)
                ) {

                    showToast(
                        '快捷字词不能包含空格'
                    );

                    return;
                }


                if (!url) {

                    showToast(
                        '请输入网址'
                    );

                    return;
                }


                if (
                    !url.includes('%s')
                ) {

                    showToast(
                        '网址必须包含 %s'
                    );

                    return;
                }


                let data =
                    getEngines();


                if (editing) {

                    const duplicate =
                        data.find(
                            item =>
                                item.keyword ===
                                keyword
                                &&
                                item.keyword !==
                                editing.keyword
                        );

                    if (duplicate) {

                        showToast(
                            '快捷字词已存在'
                        );

                        return;
                    }


                    const index =
                        data.findIndex(
                            item =>
                                item.keyword ===
                                editing.keyword
                        );


                    data[index] = {

                        name,
                        keyword,
                        url

                    };


                    if (
                        getDefaultKeyword()
                        === editing.keyword
                    ) {

                        setDefaultKeyword(
                            keyword
                        );
                    }

                }

                else {

                    if (
                        data.some(
                            item =>
                                item.keyword ===
                                keyword
                        )
                    ) {

                        showToast(
                            '快捷字词已存在'
                        );

                        return;
                    }


                    data.push(
                        {

                            name,
                            keyword,
                            url

                        }
                    );
                }


                saveEngines(
                    data
                );


                showToast(
                    editing
                        ?
                        '修改成功'
                        :
                        '新增成功'
                );


                renderManager(
                    panel
                );
            }
        );


        /* =====================================================
         * 搜索引擎列表
         * ===================================================== */

        const list =
            qs(
                '#qs-engine-list-v23'
            );


        engines.forEach(
            engine => {

                const item =
                    document.createElement(
                        'div'
                    );


                applyImportant(
                    item,
                    {

                        display:
                            'grid',

                        'grid-template-columns':
                            '1fr 60px 92px',

                        gap:
                            '8px',

                        'align-items':
                            'center',

                        padding:
                            '10px 11px',

                        border:
                            '1px solid #e9ecef',

                        'border-radius':
                            '9px',

                        background:
                            '#ffffff',

                        height:
                            'auto',

                        'min-height':
                            '58px'

                    }
                );


                item.innerHTML = `

                    <div
                        style="
                            min-width:0;
                        "
                    >

                        <div
                            style="
                                display:flex;
                                align-items:center;
                                gap:6px;
                                font-size:12px;
                                font-weight:700;
                                color:#293241;
                            "
                        >

                            ${escapeHTML(engine.name)}

                            ${
                                engine.keyword ===
                                getDefaultKeyword()

                                    ?

                                    `

                                    <span
                                        style="
                                            padding:2px 5px;
                                            background:#eaf3ff;
                                            color:#1467db;
                                            border-radius:4px;
                                            font-size:9px;
                                        "
                                    >
                                        默认
                                    </span>

                                    `

                                    :

                                    ''
                            }

                        </div>


                        <div
                            title="${escapeHTML(engine.url)}"

                            style="
                                margin-top:4px;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                                color:#8a94a3;
                                font-size:10px;
                            "
                        >

                            ${escapeHTML(engine.url)}

                        </div>

                    </div>


                    <div
                        style="
                            padding:4px 6px;
                            border-radius:6px;
                            background:#f1f3f5;
                            color:#3f4955;
                            font-size:11px;
                            font-weight:700;
                            text-align:center;
                        "
                    >

                        ${escapeHTML(engine.keyword)}

                    </div>


                    <div
                        style="
                            display:flex;
                            justify-content:flex-end;
                            gap:4px;
                        "
                    >

                        <button
                            class="qs-edit-v23"
                            data-keyword="${escapeHTML(engine.keyword)}"

                            style="
                                border:0;
                                background:transparent;
                                color:#1467db;
                                font-size:11px;
                                cursor:pointer;
                            "
                        >
                            修改
                        </button>


                        <button
                            class="qs-delete-v23"
                            data-keyword="${escapeHTML(engine.keyword)}"

                            style="
                                border:0;
                                background:transparent;
                                color:#d73a49;
                                font-size:11px;
                                cursor:pointer;
                            "
                        >
                            删除
                        </button>

                    </div>

                `;


                list.appendChild(
                    item
                );
            }
        );


        /* 修改 */

        document
            .querySelectorAll(
                '.qs-edit-v23'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () => {

                            renderManager(
                                panel,
                                button.dataset.keyword
                            );
                        }
                    );
                }
            );


        /* 删除 */

        document
            .querySelectorAll(
                '.qs-delete-v23'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () => {

                            const keyword =
                                button.dataset.keyword;

                            let data =
                                getEngines();


                            if (
                                data.length <= 1
                            ) {

                                showToast(
                                    '至少保留一个搜索引擎'
                                );

                                return;
                            }


                            const engine =
                                data.find(
                                    item =>
                                        item.keyword ===
                                        keyword
                                );


                            if (!engine) {
                                return;
                            }


                            if (
                                !confirm(
                                    `确定删除“${engine.name}”吗？`
                                )
                            ) {

                                return;
                            }


                            data =
                                data.filter(
                                    item =>
                                        item.keyword !==
                                        keyword
                                );


                            saveEngines(
                                data
                            );


                            if (
                                getDefaultKeyword()
                                === keyword
                            ) {

                                setDefaultKeyword(
                                    data[0].keyword
                                );
                            }


                            renderManager(
                                panel
                            );


                            showToast(
                                '已删除'
                            );
                        }
                    );
                }
            );


        /* 恢复默认 */

        qs(
            '#qs-reset-v23'
        )?.addEventListener(
            'click',
            () => {

                if (
                    !confirm(
                        '确定恢复默认配置吗？'
                    )
                ) {

                    return;
                }


                saveEngines(
                    clone(
                        DEFAULT_ENGINES
                    )
                );


                setDefaultKeyword(
                    'gg'
                );


                setHotkey(
                    clone(
                        DEFAULT_HOTKEY
                    )
                );


                setFloatingEnabled(
                    true
                );


                ensureFloatingButton();


                renderManager(
                    panel
                );


                showToast(
                    '已恢复默认配置'
                );
            }
        );


        bindHotkeyRecorder(
            panel
        );
    }

    /* =========================================================
     * 13. 快捷键录制
     * ========================================================= */

    function bindHotkeyRecorder(
        panel
    ) {

        const button =
            qs(
                '#qs-record-hotkey-v23'
            );

        const box =
            qs(
                '#qs-record-box-v23'
            );

        const preview =
            qs(
                '#qs-record-preview-v23'
            );

        const display =
            qs(
                '#qs-hotkey-display-v23'
            );


        button?.addEventListener(
            'click',
            () => {

                box.style
                    .setProperty(
                        'display',
                        'block',
                        'important'
                    );


                preview.textContent =
                    '等待输入';


                box.focus();
            }
        );


        box?.addEventListener(
            'keydown',
            event => {

                event.preventDefault();

                event.stopPropagation();


                if (
                    event.key ===
                    'Escape'
                ) {

                    box.style
                        .setProperty(
                            'display',
                            'none',
                            'important'
                        );

                    return;
                }


                if (
                    [
                        'Control',
                        'Shift',
                        'Alt',
                        'Meta'
                    ].includes(
                        event.key
                    )
                ) {

                    preview.textContent =
                        buildHotkeyTextFromEvent(
                            event
                        )
                        ||
                        '继续按一个按键';

                    return;
                }


                const hotkey =
                    hotkeyFromEvent(
                        event
                    );


                if (
                    !hotkey.ctrl
                    &&
                    !hotkey.shift
                    &&
                    !hotkey.alt
                    &&
                    !hotkey.meta
                ) {

                    preview.textContent =
                        '请至少包含 Ctrl / Alt / Shift';

                    return;
                }


                setHotkey(
                    hotkey
                );


                display.textContent =
                    formatHotkey(
                        hotkey
                    );


                preview.textContent =
                    `已保存：${formatHotkey(hotkey)}`;


                ensureFloatingButton();


                setTimeout(
                    () => {

                        box.style
                            .setProperty(
                                'display',
                                'none',
                                'important'
                            );

                    },
                    700
                );


                showToast(
                    `快捷键：${formatHotkey(hotkey)}`
                );
            }
        );
    }

    /* =========================================================
     * 14. 全局快捷键
     * ========================================================= */

    function handleGlobalKeydown(
        event
    ) {

        const recordBox =
            qs(
                '#qs-record-box-v23'
            );


        if (
            recordBox
            &&
            recordBox ===
            document.activeElement
        ) {

            return;
        }


        /* ESC关闭 */

        if (
            event.key ===
            'Escape'
        ) {

            if (
                qs(
                    '#qs-search-mask-v23'
                )
                ||
                qs(
                    '#qs-manager-mask-v23'
                )
            ) {

                event.preventDefault();

                event.stopPropagation();

                closeSearchPanel();

                closeManager();
            }

            return;
        }


        /* 自定义快捷键 */

        if (
            matchesHotkey(
                event,
                getHotkey()
            )
        ) {

            event.preventDefault();

            event.stopPropagation();

            event
                .stopImmediatePropagation?.();


            openSearchPanel();
        }
    }


    window.addEventListener(
        'keydown',
        handleGlobalKeydown,
        true
    );


    document.addEventListener(
        'keydown',
        handleGlobalKeydown,
        true
    );

    /* =========================================================
     * 15. Tampermonkey菜单
     * ========================================================= */

    GM_registerMenuCommand(
        '🔎 打开快捷搜索',
        openSearchPanel
    );


    GM_registerMenuCommand(
        '⚙ 快捷搜索设置',
        openManager
    );

    /* =========================================================
     * 16. 快捷键工具
     * ========================================================= */

    function matchesHotkey(
        event,
        hotkey
    ) {

        return (

            Boolean(event.ctrlKey)
            ===
            Boolean(hotkey.ctrl)

            &&

            Boolean(event.shiftKey)
            ===
            Boolean(hotkey.shift)

            &&

            Boolean(event.altKey)
            ===
            Boolean(hotkey.alt)

            &&

            Boolean(event.metaKey)
            ===
            Boolean(hotkey.meta)

            &&

            normalizeKey(
                event.key
            )
            ===
            normalizeKey(
                hotkey.key
            )

        );
    }


    function normalizeKey(key) {

        const value =
            String(
                key || ''
            )
                .toLowerCase();


        const aliases = {

            ' ':
                'space',

            spacebar:
                'space',

            esc:
                'escape'

        };


        return (
            aliases[value]
            ||
            value
        );
    }


    function hotkeyFromEvent(
        event
    ) {

        return {

            ctrl:
                event.ctrlKey,

            shift:
                event.shiftKey,

            alt:
                event.altKey,

            meta:
                event.metaKey,

            key:
                normalizeKey(
                    event.key
                )

        };
    }


    function buildHotkeyTextFromEvent(
        event
    ) {

        const parts =
            [];


        if (event.ctrlKey) {
            parts.push(
                'Ctrl'
            );
        }


        if (event.shiftKey) {
            parts.push(
                'Shift'
            );
        }


        if (event.altKey) {
            parts.push(
                'Alt'
            );
        }


        if (event.metaKey) {
            parts.push(
                'Meta'
            );
        }


        return parts.join(
            ' + '
        );
    }


    function formatHotkey(
        hotkey
    ) {

        const parts =
            [];


        if (hotkey.ctrl) {
            parts.push(
                'Ctrl'
            );
        }


        if (hotkey.shift) {
            parts.push(
                'Shift'
            );
        }


        if (hotkey.alt) {
            parts.push(
                'Alt'
            );
        }


        if (hotkey.meta) {
            parts.push(
                'Meta'
            );
        }


        const key =
            normalizeKey(
                hotkey.key
            );


        if (key) {

            parts.push(

                key.length === 1

                    ?

                    key.toUpperCase()

                    :

                    key

            );
        }


        return parts.join(
            ' + '
        );
    }

    /* =========================================================
     * 17. 消息提示
     * ========================================================= */

    function showToast(text) {

        removeEl(
            '#qs-toast-v23'
        );


        const toast =
            document.createElement(
                'div'
            );


        toast.id =
            'qs-toast-v23';


        toast.textContent =
            text;


        applyImportant(
            toast,
            {

                position:
                    'fixed',

                left:
                    '50%',

                bottom:
                    '78px',

                transform:
                    'translateX(-50%)',

                padding:
                    '9px 15px',

                'border-radius':
                    '8px',

                background:
                    'rgba(17,24,39,.92)',

                color:
                    '#fff',

                'font-size':
                    '12px',

                'z-index':
                    '2147483647',

                'pointer-events':
                    'none',

                'font-family':
                    '-apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",Arial,sans-serif'

            }
        );


        document.documentElement
            .appendChild(
                toast
            );


        setTimeout(
            () =>
                toast.remove(),
            1800
        );
    }

    /* =========================================================
     * 18. HTML转义
     * ========================================================= */

    function escapeHTML(text) {

        return String(
            text ?? ''
        )

            .replaceAll(
                '&',
                '&amp;'
            )

            .replaceAll(
                '<',
                '&lt;'
            )

            .replaceAll(
                '>',
                '&gt;'
            )

            .replaceAll(
                '"',
                '&quot;'
            )

            .replaceAll(
                "'",
                '&#039;'
            );
    }

    /* =========================================================
     * 19. 初始化
     * ========================================================= */

    function init() {

        if (
            !document.documentElement
        ) {

            requestAnimationFrame(
                init
            );

            return;
        }


        /*
         * 防止网站CSS污染
         */

        injectUIResetStyle();


        /*
         * 创建悬浮按钮
         */

        ensureFloatingButton();


        /*
         * SPA守护
         */

        startGuard();


        console.log(
            `[万能快捷搜索 Pro v${VERSION}] 已启动`
        );

        console.log(
            `[万能快捷搜索] 快捷键：${formatHotkey(getHotkey())}`
        );

        console.log(
            `[万能快捷搜索] 默认搜索：${getDefaultKeyword()}`
        );
    }


    init();

})();
