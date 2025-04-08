// 脚本引用 https://raw.githubusercontent.com/xream/scripts/main/surge/modules/network-info/net-lsp-x.js
const NAME = 'network-info'
const $ = new Env(NAME)

let arg
if (typeof $argument != 'undefined') {
  arg = Object.fromEntries($argument.split('&').map(item => item.split('=')))
} else {
  arg = {}
}
$.log(`传入的 $argument: ${$.toStr(arg)}`)
// if (typeof $loon === 'string') {
//   // const build = $loon.match(/\(\s*?(\d+)\s*?\)\s*?$/)?.[1]
//   // $.log(`当前 Loon Build: ${build}`)
//   $.log(`当前版本: ${$loon}`)
// }

arg = { ...arg, ...$.getjson(NAME, {}) }

$.log(`从持久化存储读取参数后: ${$.toStr(arg)}`)

if (typeof $environment !== 'undefined' && $.lodash_get($environment, 'executor') === 'event-network') {
  $.log(`QX 事件脚本不能带参 修正运行环境`)
  $.lodash_set(arg, 'TYPE', 'EVENT')
}

if (!isInteraction() && !isRequest() && !isTile() && !isPanel()) {
  $.log(`参数为空 非可交互操作, 非请求, 非面板的情况下, 修正运行环境`)
  $.lodash_set(arg, 'TYPE', 'EVENT')
}

if (isRequest()) {
  // $.log($.toStr($request))
  arg = { ...arg, ...parseQueryString($request.url) }
  $.log(`从请求后读取参数后: ${$.toStr(arg)}`)
}

const keya = 'spe'
const keyb = 'ge'
const keyc = 'pin'
const keyd = 'gan'
const keye = 'pi'
const keyf = 'ob'
const keyg = 'qi'
const keyh = 'xin'
const bay = 'edtest'

let result = {}
let proxy_policy = ''
let title = ''
let content = ''
!(async () => {
  if ($.lodash_get(arg, 'TYPE') === 'EVENT') {
    const eventDelay = parseFloat($.lodash_get(arg, 'EVENT_DELAY') || 3)
    $.log(`网络变化, 等待 ${eventDelay} 秒后开始查询`)
    if (eventDelay) {
      await $.wait(1000 * eventDelay)
    }
  }
  if (isTile()) {
    await notify('入口落地查询', '面板', '开始查询')
  }

  let SSID = ''
  let LAN = ''
  let LAN_IPv4 = ''
  let LAN_IPv6 = ''
  if (typeof $network !== 'undefined') {
    $.log($.toStr($network))
    const v4 = $.lodash_get($network, 'v4.primaryAddress')
    const v6 = $.lodash_get($network, 'v6.primaryAddress')
    if ($.lodash_get(arg, 'SSID') == 1) {
      SSID = $.lodash_get($network, 'wifi.ssid')
    }
    if (v4 && $.lodash_get(arg, 'LAN') == 1) {
      LAN_IPv4 = v4
    }
    if (v6 && $.lodash_get(arg, 'LAN') == 1 && $.lodash_get(arg, 'IPv6') == 1) {
      LAN_IPv6 = v6
    }
  } else if (typeof $config !== 'undefined') {
    try {
      let conf = $config.getConfig()
      $.log(conf)
      conf = JSON.parse(conf)
      if ($.lodash_get(arg, 'SSID') == 1) {
        SSID = $.lodash_get(conf, 'ssid')
      }
    } catch (e) {}
  } else if (typeof $environment !== 'undefined') {
    try {
      $.log($.toStr($environment))
      const version = $.lodash_get($environment, 'version')
      const os = version?.split(' ')?.[0]
      // QX 上 macOS/iOS 不一致
      if (os !== 'macOS' && $.lodash_get(arg, 'SSID') == 1) {
        SSID = $.lodash_get($environment, 'ssid')
      } else if (os === 'macOS' && $.lodash_get(arg, 'LAN') == 1) {
        LAN_IPv4 = $.lodash_get($environment, 'ssid')
      }
    } catch (e) {}
  }
  if (LAN_IPv4 || LAN_IPv6) {
    LAN = ['LAN:', LAN_IPv4, maskIP(LAN_IPv6)].filter(i => i).join(' ')
  }
  if (LAN) {
    LAN = `${LAN}\n\n`
  }
  if (SSID) {
    SSID = `SSID: ${SSID}\n\n`
  } else {
    SSID = ''
  }
  let { PROXIES = [] } = await getProxies()
  let [
    { CN_IP = '', CN_INFO = '', CN_POLICY = '' } = {},
    { PROXY_IP = '', PROXY_INFO = '', PROXY_PRIVACY = '', PROXY_POLICY = '', ENTRANCE_IP = '' } = {},
    { CN_IPv6 = '' } = {},
    { PROXY_IPv6 = '' } = {},
  ] = await Promise.all(
    $.lodash_get(arg, 'IPv6') == 1
      ? [getDirectRequestInfo({ PROXIES }), getProxyRequestInfo({ PROXIES }), getDirectInfoIPv6(), getProxyInfoIPv6()]
      : [getDirectRequestInfo({ PROXIES }), getProxyRequestInfo({ PROXIES })]
  )
  let continueFlag = true
  if ($.lodash_get(arg, 'TYPE') === 'EVENT') {
    const lastNetworkInfoEvent = $.getjson('lastNetworkInfoEvent')
    if (
      CN_IP !== $.lodash_get(lastNetworkInfoEvent, 'CN_IP') ||
      CN_IPv6 !== $.lodash_get(lastNetworkInfoEvent, 'CN_IPv6') ||
      PROXY_IP !== $.lodash_get(lastNetworkInfoEvent, 'PROXY_IP') ||
      PROXY_IPv6 !== $.lodash_get(lastNetworkInfoEvent, 'PROXY_IPv6')
    ) {
      // 有任何一项不同 都继续
      $.setjson({ CN_IP, PROXY_IP, CN_IPv6, PROXY_IPv6 }, 'lastNetworkInfoEvent')
    } else {
      // 否则 直接结束
      $.log('入口落地查询未发生变化, 不继续')
      continueFlag = false
    }
  }
  if (continueFlag) {
    if ($.lodash_get(arg, 'PRIVACY') == '1' && PROXY_PRIVACY) {
      PROXY_PRIVACY = `\n${PROXY_PRIVACY}`
    }
    let ENTRANCE = ''
    if (ENTRANCE_IP) {
      const { IP: resolvedIP } = await resolveDomain(ENTRANCE_IP)
      if (resolvedIP) {
        $.log(`入口域名解析: ${ENTRANCE_IP} ➟ ${resolvedIP}`)
        ENTRANCE_IP = resolvedIP
      }
    }
    if (ENTRANCE_IP && ENTRANCE_IP !== PROXY_IP) {
      const entranceDelay = parseFloat($.lodash_get(arg, 'ENTRANCE_DELAY') || 0)
      $.log(`入口: ${ENTRANCE_IP} 与落地 IP: ${PROXY_IP} 不一致, 等待 ${entranceDelay} 秒后查询入口`)
      if (entranceDelay) {
        await $.wait(1000 * entranceDelay)
      }
      let [{ CN_INFO: ENTRANCE_INFO1 = '', isCN = false } = {}, { PROXY_INFO: ENTRANCE_INFO2 = '' } = {}] =
        await Promise.all([
          getDirectInfo(ENTRANCE_IP, $.lodash_get(arg, 'DOMESTIC_IPv4')),
          getProxyInfo(ENTRANCE_IP, $.lodash_get(arg, 'LANDING_IPv4')),
        ])
      // 国内接口的国外 IP 解析过于离谱 排除掉
      if (ENTRANCE_INFO1 && isCN) {
        ENTRANCE = `入口: ${maskIP(ENTRANCE_IP) || '-'}\n${maskAddr(ENTRANCE_INFO1)}`
      }
      if (ENTRANCE_INFO2) {
        if (ENTRANCE) {
          ENTRANCE = `${ENTRANCE.replace(/^(.*?):/gim, '$1¹:')}\n${maskAddr(
            ENTRANCE_INFO2.replace(/^(.*?):/gim, '$1²:')
          )}`
        } else {
          ENTRANCE = `入口: ${maskIP(ENTRANCE_IP) || '-'}\n${maskAddr(ENTRANCE_INFO2)}`
        }
      }
    }
    if (ENTRANCE) {
      ENTRANCE = `${ENTRANCE}\n\n`
    }

    if (CN_IPv6 && isIPv6(CN_IPv6) && $.lodash_get(arg, 'IPv6') == 1) {
      CN_IPv6 = `\n${maskIP(CN_IPv6)}`
    } else {
      CN_IPv6 = ''
    }
    if (PROXY_IPv6 && isIPv6(PROXY_IPv6) && $.lodash_get(arg, 'IPv6') == 1) {
      PROXY_IPv6 = `\n${maskIP(PROXY_IPv6)}`
    } else {
      PROXY_IPv6 = ''
    }
    if ($.isSurge() || $.isStash()) {
      if (CN_POLICY === 'DIRECT') {
        CN_POLICY = ``
      } else {
        CN_POLICY = `策略: ${maskAddr(CN_POLICY) || '-'}\n`
      }
    }

    if (CN_INFO) {
      CN_INFO = `\n${CN_INFO}`
    }
    const policy_prefix = $.isQuanX() || $.isLoon() ? '节点: ' : '代理策略: '
    if (PROXY_POLICY === 'DIRECT') {
      PROXY_POLICY = `${policy_prefix}直连`
    } else if (PROXY_POLICY) {
      PROXY_POLICY = `${policy_prefix}${maskAddr(PROXY_POLICY) || '-'}`
    } else {
      PROXY_POLICY = ''
    }
    if (PROXY_POLICY) {
      proxy_policy = PROXY_POLICY
    } else {
      proxy_policy = ''
    }

    if (PROXY_INFO) {
      PROXY_INFO = `\n${PROXY_INFO}`
    }
    title = `${PROXY_POLICY}`
    content = `${SSID}${LAN}${CN_POLICY}IP: ${maskIP(CN_IP) || '-'}${CN_IPv6}${maskAddr(
      CN_INFO
    )}\n\n${ENTRANCE}落地 IP: ${maskIP(PROXY_IP) || '-'}${PROXY_IPv6}${maskAddr(PROXY_INFO)}${PROXY_PRIVACY}`
    if (!isInteraction()) {
      content = `${content}\n执行时间: ${new Date().toTimeString().split(' ')[0]}`
    }

    title = title || '入口落地查询'
    if (isTile()) {
      await notify('入口落地查询', '面板', '查询完成')
    } else if (!isPanel()) {
      if ($.lodash_get(arg, 'TYPE') === 'EVENT') {
        await notify(
          `🄳 ${maskIP(CN_IP) || '-'} 🅿 ${maskIP(PROXY_IP) || '-'}`.replace(/\n+/g, '\n').replace(/\ +/g, ' ').trim(),
          `${maskAddr(CN_INFO.replace(/(位置|运营商).*?:/g, '').replace(/\n/g, ' '))}`
            .replace(/\n+/g, '\n')
            .replace(/\ +/g, ' ')
            .trim(),
          `${maskAddr(PROXY_INFO.replace(/(位置|运营商).*?:/g, '').replace(/\n/g, ' '))}${
            CN_IPv6 ? `\n🄳 ${CN_IPv6.replace(/\n+/g, '')}` : ''
          }${PROXY_IPv6 ? `\n🅿 ${PROXY_IPv6.replace(/\n+/g, '')}` : ''}${SSID ? `\n${SSID}` : '\n'}${LAN}`
            .replace(/\n+/g, '\n')
            .replace(/\ +/g, ' ')
            .trim()
        )
      } else {
        await notify('入口落地查询', title, content)
      }
    }
  }
})()
  .catch(async e => {
    $.logErr(e)
    $.logErr($.toStr(e))
    const msg = `${$.lodash_get(e, 'message') || $.lodash_get(e, 'error') || e}`
    title = `❌`
    content = msg
    await notify('入口落地查询', title, content)
  })
  .finally(async () => {
    if (isRequest()) {
      result = {
        response: {
          status: 200,
          body: JSON.stringify(
            {
              title,
              content,
            },
            null,
            2
          ),
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,OPTIONS,PUT,DELETE',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
          },
        },
      }
    } else {
      result = { title, content, ...arg }
    }
    $.log($.toStr(result))
    if (isInteraction()) {
      const html = `<div style="font-family: -apple-system; font-size: large">${`\n${content}${
        proxy_policy ? `\n\n${proxy_policy.replace(/^(.*?:\s*)(.*)$/, '$1<span style="color: #467fcf">$2</span>')}` : ''
      }`
        .replace(/^(.*?):/gim, '<span style="font-weight: bold">$1</span>:')
        .replace(/\n/g, '<br/>')}</div>`
      // $.log(html)
      $.done({
        title: '入口落地查询',
        htmlMessage: html,
      })
    } else {
      $.done(result)
    }
  })

async function getEntranceInfo() {
  let IP = ''
  let POLICY = ''
  if (isInteraction()) {
    try {
      if ($.isQuanX()) {
        const nodeName = $environment.params
        const { ret, error } = await $configuration.sendMessage({ action: 'get_server_description', content: nodeName })
        if (error) throw new Error(error)
        // $.log(JSON.stringify(ret, null, 2))
        const proxy = Object.values(ret)[0]
        // $.log(proxy)
        IP = proxy.match(/.+?\s*?=\s*?(.+?):\d+\s*?,.+/)[1]
        POLICY = nodeName
      } else if ($.isLoon()) {
        IP = $.lodash_get($environment, 'params.nodeInfo.address')
        POLICY = $.lodash_get($environment, 'params.node')
      }
    } catch (e) {
      $.logErr(`获取入口信息 发生错误: ${e.message || e}`)
      $.logErr(e)
      $.logErr($.toStr(e))
    }
  }
  return { IP, POLICY }
}
async function getDirectRequestInfo({ PROXIES = [] } = {}) {
  const { CN_IP, CN_INFO } = await getDirectInfo(undefined, $.lodash_get(arg, 'DOMESTIC_IPv4'))
  const { POLICY } = await getRequestInfo(
    new RegExp(
      `cip\\.cc|for${keyb}\\.${keya}${bay}\\.cn|rmb\\.${keyc}${keyd}\\.com\\.cn|api-v3\\.${keya}${bay}\\.cn|ipservice\\.ws\\.126\\.net|api\\.bilibili\\.com|api\\.live\\.bilibili\\.com|myip\\.ipip\\.net|ip\\.ip233\\.cn|ua${keye}\\.wo${keyf}x\\.cn|ip\\.im|ips\\.market\\.alicloudapi\\.com|api\\.ip\\.plus|appc\.${keyg}${keyh}\.com`
    ),
    PROXIES
  )
  return { CN_IP, CN_INFO, CN_POLICY: POLICY }
}
async function getProxyRequestInfo({ PROXIES = [] } = {}) {
  const { PROXY_IP, PROXY_INFO, PROXY_PRIVACY } = await getProxyInfo(undefined, $.lodash_get(arg, 'LANDING_IPv4'))
  let result
  if ($.isSurge() || $.isStash()) {
    result = await getRequestInfo(/ipinfo\.io|ip-score\.com|ipwhois\.app|ip-api\.com|api-ipv4\.ip\.sb/, PROXIES)
  } else if ($.isQuanX() || $.isLoon()) {
    result = await getEntranceInfo()
  }
  return {
    PROXY_IP,
    PROXY_INFO,
    PROXY_PRIVACY,
    PROXY_POLICY: $.lodash_get(result, 'POLICY'),
    ENTRANCE_IP: $.lodash_get(result, 'IP'),
  }
}
async function getRequestInfo(regexp, PROXIES = []) {
  let POLICY = ''
  let IP = ''

  try {
    if ($.isSurge()) {
      const { requests } = await httpAPI('/v1/requests/recent', 'GET')
      const request = requests.slice(0, 10).find(i => regexp.test(i.URL))
      // $.log('recent request', $.toStr(request))
      POLICY = request.policyName
      if (/\(Proxy\)/.test(request.remoteAddress)) {
        IP = request.remoteAddress.replace(/\s*\(Proxy\)\s*/, '')
      }
    } else if ($.isStash()) {
      const res = await $.http.get({
        url: `http://127.0.0.1:9090/connections`,
      })

      let body = String($.lodash_get(res, 'body') || $.lodash_get(res, 'rawBody'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      const connections = $.lodash_get(body, 'connections') || []

      const connection =
        connections.slice(0, 10).find(i => {
          const dest = $.lodash_get(i, 'metadata.host') || $.lodash_get(i, 'metadata.destinationIP')
          return regexp.test(dest)
        }) || {}
      const chain = $.lodash_get(connection, 'metadata.chain') || []
      const proxy = chain[0]
      POLICY = proxy // chain.reverse().join(' ➟ ')
      IP = PROXIES?.[proxy]?.match(/^(.*?):\d+$/)?.[1]
    }
  } catch (e) {
    $.logErr(`从最近请求中获取 ${regexp} 发生错误: ${e.message || e}`)
    $.logErr(e)
    $.logErr($.toStr(e))
  }

  return {
    POLICY,
    IP,
  }
}
async function getDirectInfo(ip, provider) {
  let CN_IP
  let CN_INFO
  let isCN
  const msg = `使用 ${provider || 'pingan'} 查询 ${ip ? ip : '分流'} 信息`
  if (provider == 'cip') {
    try {
      const res = await http({
        url: `http://cip.cc/${ip ? encodeURIComponent(ip) : ''}`,
        headers: { 'User-Agent': 'curl/7.16.3 (powerpc-apple-darwin9.0) libcurl/7.16.3' },
      })
      let body = String($.lodash_get(res, 'body'))
      const addr = body.match(/地址\s*(:|：)\s*(.*)/)[2]
      isCN = addr.includes('中国')
      CN_IP = ip || body.match(/IP\s*(:|：)\s*(.*?)\s/)[2]
      CN_INFO = [
        ['位置:', isCN ? getflag('CN') : undefined, addr.replace(/中国\s*/, '') || ''].filter(i => i).join(' '),
        ['运营商:', body.match(/运营商\s*(:|：)\s*(.*)/)[2].replace(/中国\s*/, '') || ''].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (!ip && provider == 'qixin') {
    try {
      const res = await http({
        url: `https://appc.${keyg}${keyh}.com/v4/general/getAreaByIP`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      const countryCode = $.lodash_get(body, 'data.code')
      isCN = countryCode === 'CN'
      CN_IP = $.lodash_get(body, 'data.clientIp')
      CN_INFO = [
        [
          '位置:',
          getflag(countryCode),
          $.lodash_get(body, 'data.provinceName'),
          $.lodash_get(body, 'data.cityName'),
          $.lodash_get(body, 'data.districtName'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.owner')].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (!ip && provider == 'ipip') {
    try {
      const res = await http({
        url: `https://myip.ipip.net/json`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      isCN = $.lodash_get(body, 'data.location.0') === '中国'
      CN_IP = $.lodash_get(body, 'data.ip')
      CN_INFO = [
        [
          '位置:',
          isCN ? getflag('CN') : undefined,
          $.lodash_get(body, 'data.location.0'),
          $.lodash_get(body, 'data.location.1'),
          $.lodash_get(body, 'data.location.2'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.location.4')].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (!ip && provider == 'bilibili') {
    try {
      const res = await http({
        url: `https://api.bilibili.com/x/web-interface/zone`,
        // url: `https://api.live.bilibili.com/ip_service/v1/ip_service/get_ip_addr`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      isCN = $.lodash_get(body, 'data.country') === '中国'
      CN_IP = $.lodash_get(body, 'data.addr')
      CN_INFO = [
        [
          '位置:',
          isCN ? getflag('CN') : undefined,
          $.lodash_get(body, 'data.country'),
          $.lodash_get(body, 'data.province'),
          $.lodash_get(body, 'data.city'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.isp')].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (!ip && provider == '126') {
    try {
      const res = await http({
        url: `https://ipservice.ws.126.net/locate/api/getLocByIp`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      const countryCode = $.lodash_get(body, 'result.countrySymbol')
      isCN = countryCode === 'CN'
      CN_IP = $.lodash_get(body, 'result.ip')
      CN_INFO = [
        [
          '位置:',
          getflag(countryCode),
          $.lodash_get(body, 'result.country'),
          $.lodash_get(body, 'result.province'),
          $.lodash_get(body, 'result.city'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'result.operator')].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (!ip && provider == 'ip233') {
    try {
      const res = await http({
        url: `https://ip.ip233.cn/ip`,
        headers: {
          Referer: 'https://ip233.cn/',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      const countryCode = $.lodash_get(body, 'country')
      isCN = countryCode === 'CN'
      CN_IP = $.lodash_get(body, 'ip')
      CN_INFO = CN_INFO = [
        ['位置:', getflag(countryCode), $.lodash_get(body, 'desc').replace(/中国\s*/, '')].filter(i => i).join(' '),
        $.lodash_get(arg, 'ORG') == 1
          ? ['组织:', $.lodash_get(body, 'org') || '-'].filter(i => i).join(' ')
          : undefined,
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'muhan') {
    try {
      const res = await http({
        url: `https://ua${keye}.wo${keyf}x.cn/app/ip-location`,
        params: { ip },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      const countryCode = $.lodash_get(body, 'data.showapi_res_body.en_name_short')
      isCN = countryCode === 'CN'
      CN_IP = ip || $.lodash_get(body, 'data.showapi_res_body.ip')
      CN_INFO = [
        [
          '位置:',
          getflag(countryCode),
          $.lodash_get(body, 'data.showapi_res_body.country').replace(/\s*中国\s*/, ''),
          $.lodash_get(body, 'data.showapi_res_body.region'),
          $.lodash_get(body, 'data.showapi_res_body.city'),
          $.lodash_get(body, 'data.showapi_res_body.county'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.showapi_res_body.isp') || '-'].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'ipim') {
    try {
      const res = await ipim(ip)
      isCN = $.lodash_get(res, 'isCN')
      CN_IP = $.lodash_get(res, 'IP')
      CN_INFO = $.lodash_get(res, 'INFO')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'ali') {
    try {
      let APPCODE = $.lodash_get(arg, 'DOMESTIC_IPv4_KEY')
      if (!APPCODE) throw new Error('请在 DOMESTIC_IPv4_KEY 填写阿里云 IP 接口的 APPCODE')
      APPCODE = APPCODE.split(/,|，/)
        .map(i => i.trim())
        .filter(i => i)
      APPCODE = APPCODE[Math.floor(Math.random() * APPCODE.length)]
      if (APPCODE.length > 1) {
        $.log(`随机使用阿里云 IP 接口的 APPCODE: ${APPCODE}`)
      }
      let ali_ip = ip
      if (!ali_ip) {
        $.log('阿里云接口需要 IP. 未提供 IP, 先使用默认 IP 查询')
        const res = await getDirectInfo()
        ali_ip = $.lodash_get(res, 'CN_IP')
        if (!ali_ip) throw new Error('阿里云接口需要 IP. 未提供 IP, 使用默认 IP 查询失败')
      }
      const res = await ali(ali_ip, APPCODE)
      isCN = $.lodash_get(res, 'isCN')
      CN_IP = $.lodash_get(res, 'IP')
      CN_INFO = $.lodash_get(res, 'INFO')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (ip && provider == 'spcn') {
    try {
      const res = await http({
        url: `https://api-v3.${keya}${bay}.cn/ip`,
        params: { ip },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      const countryCode = $.lodash_get(body, 'data.countryCode')
      isCN = countryCode === 'CN'
      CN_IP = ip || $.lodash_get(body, 'data.ip')
      CN_INFO = [
        [
          '位置:',
          getflag(countryCode),
          $.lodash_get(body, 'data.country').replace(/\s*中国\s*/, ''),
          $.lodash_get(body, 'data.province'),
          $.lodash_get(body, 'data.city'),
          $.lodash_get(body, 'data.district'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.operator') || $.lodash_get(body, 'data.isp') || '-']
          .filter(i => i)
          .join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else {
    try {
      const res = await http({
        url: `https://rmb.${keyc}${keyd}.com.cn/itam/mas/linden/ip/request`,
        params: { ip },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      const countryCode = $.lodash_get(body, 'data.countryIsoCode')
      isCN = countryCode === 'CN'
      CN_IP = ip || $.lodash_get(body, 'data.ip')
      CN_INFO = [
        [
          '位置:',
          getflag(countryCode),
          $.lodash_get(body, 'data.country').replace(/\s*中国\s*/, ''),
          $.lodash_get(body, 'data.region'),
          $.lodash_get(body, 'data.city'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', $.lodash_get(body, 'data.isp') || '-'].filter(i => i).join(' '),
        $.lodash_get(arg, 'ORG') == 1
          ? ['组织:', $.lodash_get(body, 'org') || '-'].filter(i => i).join(' ')
          : undefined,
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  }
  return { CN_IP, CN_INFO: simplifyAddr(CN_INFO), isCN }
}
async function getDirectInfoIPv6() {
  let CN_IPv6
  const msg = `使用 ${$.lodash_get(arg, 'DOMESTIC_IPv6') || 'ddnspod'} 查询 IPv6 分流信息`
  if ($.lodash_get(arg, 'DOMESTIC_IPv6') == 'neu6') {
    try {
      const res = await http({
        url: `https://speed.neu6.edu.cn/getIP.php`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      CN_IPv6 = body.trim()
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else {
    try {
      const res = await http({
        url: `https://ipv6.ddnspod.com`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36 Edg/109.0.1518.14',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      CN_IPv6 = body.trim()
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  }
  return { CN_IPv6 }
}
async function getProxyInfo(ip, provider) {
  let PROXY_IP
  let PROXY_INFO
  let PROXY_PRIVACY

  const msg = `使用 ${provider || 'ipapi'} 查询 ${ip ? ip : '分流'} 信息`

  if (provider == 'ipinfo') {
    try {
      const res = await http({
        ...(ip ? {} : getNodeOpt()),

        url: `https://ipinfo.io/widget/${ip ? encodeURIComponent(ip) : ''}`,
        headers: {
          Referer: 'https://ipinfo.io/',
          'User-Agent':
            'Mozilla/5.0 (iPhone CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/109.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      PROXY_IP = ip || $.lodash_get(body, 'ip')
      const companyType = $.lodash_get(body, 'company.type')
      const asnType = $.lodash_get(body, 'asn.type')
      PROXY_INFO = [
        ['位置:', getflag(body.country), body.country.replace(/\s*中国\s*/, ''), body.region, body.city]
          .filter(i => i)
          .join(' '),
        [
          '运营商:',
          $.lodash_get(body, 'company.name') || $.lodash_get(body, 'asn.name') || '-',
          companyType ? ` | ${companyType}` : '',
        ]
          .filter(i => i)
          .join(' '),
        $.lodash_get(arg, 'ORG') == 1
          ? [
              '组织:',
              $.lodash_get(body, 'asn.name') || $.lodash_get(body, 'org') || '-',
              asnType ? ` | ${asnType}` : '',
            ]
              .filter(i => i)
              .join(' ')
          : undefined,
        $.lodash_get(arg, 'ASN') == 1
          ? ['ASN:', $.lodash_get(body, 'asn.asn') || '-'].filter(i => i).join(' ')
          : undefined,
      ]
        .filter(i => i)
        .join('\n')
      if (!ip && $.lodash_get(arg, 'PRIVACY') == '1') {
        const privacyObj = $.lodash_get(body, 'privacy') || {}
        let privacy = []
        const privacyMap = {
          true: '✓',
          false: '✗',
          '': '-',
        }
        Object.keys(privacyObj).forEach(key => {
          privacy.push(`${key.toUpperCase()}: ${privacyMap[privacyObj[key]]}`)
        })
        if (privacy.length > 0) {
          PROXY_PRIVACY = `隐私安全:\n${privacy.join('\n')}`
        } else {
          PROXY_PRIVACY = `隐私安全: -`
        }
      }
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'ipscore') {
    try {
      const res = await http({
        ...(ip ? {} : getNodeOpt()),

        url: `https://ip-score.com/json`,
        params: { ip },
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/109.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      PROXY_IP = ip || $.lodash_get(body, 'ip')
      PROXY_INFO = [
        [
          '位置¹:',
          getflag($.lodash_get(body, 'geoip1.countrycode')),
          $.lodash_get(body, 'geoip1.country'),
          $.lodash_get(body, 'geoip1.region'),
          $.lodash_get(body, 'geoip1.city'),
        ]
          .filter(i => i)
          .join(' '),
        [
          '位置²:',
          getflag($.lodash_get(body, 'geoip2.countrycode')),
          $.lodash_get(body, 'geoip2.country'),
          $.lodash_get(body, 'geoip2.region'),
          $.lodash_get(body, 'geoip2.city'),
        ]
          .filter(i => i)
          .join(' '),
        ['运营商:', body.isp || body.org || body.asn].filter(i => i).join(' '),
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'ipsb') {
    try {
      const res = await http({
        ...(ip ? {} : getNodeOpt()),

        url: `https://api-ipv4.ip.sb/geoip${ip ? `/${encodeURIComponent(ip)}` : ''}`,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1 Edg/109.0.0.0',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}
      PROXY_IP = ip || $.lodash_get(body, 'ip')
      PROXY_INFO = [
        [
          '位置:',
          getflag($.lodash_get(body, 'country_code')),
          $.lodash_get(body, 'country'),
          $.lodash_get(body, 'region'),
          $.lodash_get(body, 'city'),
        ]
          .filter(i => i)
          .join(' '),

        ['运营商:', body.isp || body.organization].filter(i => i).join(' '),
        $.lodash_get(arg, 'ORG') == 1
          ? ['组织:', $.lodash_get(body, 'asn_organization') || '-'].filter(i => i).join(' ')
          : undefined,

        $.lodash_get(arg, 'ASN') == 1 ? ['ASN:', $.lodash_get(body, 'asn') || '-'].filter(i => i).join(' ') : undefined,
      ]
        .filter(i => i)
        .join('\n')
    } catch (e) {
      $.logErr(`${msg} 发生错误: ${e.message || e}`)
    }
  } else if (provider == 'ipwhois') {
    try {
      const res = await http({
        ...(ip ? {} : getNodeOpt()),

        url: `https://ipwhois.app/widget.php`,
        params: {
          lang: 'zh-CN',
          ip,
        },
        headers: {
          Host: 'ipwhois.app',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/116.0',
          Accept: '*/*',
          'Accept-Language': 'zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2',
          'Accept-Encoding': 'gzip, deflate, br',
          Origin: 'https://ipwhois.io',
          Connection: 'keep-alive',
          Referer: 'https://ipwhois.io/',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      })
      let body = String($.lodash_get(res, 'body'))
      try {
        body = JSON.parse(body)
      } catch (e) {}

      PROXY_IP = ip || $.lodash_get(body, 'ip')
      PROXY_INFO = [
        ['位置:', get