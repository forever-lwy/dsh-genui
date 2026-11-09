/**
 * The document behind a ```dsh-html fence (fork: forever-lwy).
 *
 * The model's HTML runs in an `<iframe sandbox srcdoc>` WITHOUT
 * `allow-same-origin`: the frame has an opaque origin, so it cannot read the
 * DSH page, its cookies, storage or the session token, and the browser
 * treats every request it makes as cross-site. A meta CSP written before the
 * model's markup closes the network (`connect-src 'none'`, no frames, no form
 * targets) and, unless remote resources are enabled, every external fetch.
 *
 * A small bootstrap script (always allowed: it carries the nonce when the
 * model's scripts are disabled) reports the content height, receives live
 * theme variables and exposes `dsh.action(name, data)`, which the parent only
 * honours right after a user gesture.
 * @module @forever-lwy/dsh-genui/client/html-frame
 */

export interface HtmlFrameTheme {
  /** CSS custom properties (`--dsh-fg`, …) to set on the frame's :root. */
  vars: Record<string, string>
  scheme: 'light' | 'dark'
}

export interface HtmlFrameOptions {
  /** Unique id carried by every message, so a frame only answers to its parent. */
  frameId: string
  scripts: boolean
  remote: boolean
  theme: HtmlFrameTheme
}

/** Message tag on everything the bootstrap posts and accepts. */
export const FRAME_MESSAGE_TAG = '__dshHtml'

/** Random token for the CSP nonce and frame ids. */
export function randomToken(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/gu, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!)
}

/** `--name: value;` lines for the frame's :root (values come from computed host styles). */
function varsCss(vars: Record<string, string>): string {
  return Object.entries(vars)
    .filter(([name, value]) => /^--[a-z0-9-]+$/u.test(name) && !/[;{}<>]/u.test(value))
    .map(([name, value]) => `${name}:${value};`)
    .join('')
}

export function frameCsp(options: Pick<HtmlFrameOptions, 'scripts' | 'remote'>, nonce: string): string {
  const remote = options.remote ? ' https:' : ''
  const script = options.scripts
    // 'unsafe-inline' is ignored once a nonce is listed, so the nonce is only
    // used when the model's own scripts must stay blocked.
    ? `'unsafe-inline' 'unsafe-eval' blob:${remote}`
    : `'nonce-${nonce}'`
  return [
    "default-src 'none'",
    `script-src ${script}`,
    `style-src 'unsafe-inline'${remote}`,
    `img-src data: blob:${remote}`,
    `font-src data:${remote}`,
    `media-src data: blob:${remote}`,
    options.scripts ? 'worker-src blob:' : "worker-src 'none'",
    "connect-src 'none'",
    "frame-src 'none'",
    "object-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
  ].join('; ')
}

/** The bootstrap: size reports, theme updates, `dsh.action`, error reports. */
function bootstrapScript(frameId: string): string {
  return `(function(){
var ID=${JSON.stringify(frameId)},TAG=${JSON.stringify(FRAME_MESSAGE_TAG)};
function post(m){m[TAG]=ID;try{parent.postMessage(m,'*')}catch(e){}}
var last=-1,queued=false;
function measure(){queued=false;var b=document.body,d=document.documentElement;if(!b)return;
var h=Math.ceil(b.getBoundingClientRect().height);
if(d.scrollHeight>d.clientHeight+1)h=Math.max(h,d.scrollHeight);
if(h!==last){last=h;post({type:'size',height:h})}}
function schedule(){if(!queued){queued=true;requestAnimationFrame(measure)}}
var ro=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
function watch(){if(ro&&document.body)ro.observe(document.body);schedule()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
addEventListener('load',schedule);
addEventListener('message',function(e){if(e.source!==parent)return;var m=e.data;if(!m||m[TAG]!==ID)return;
if(m.type==='theme'){var r=document.documentElement;for(var k in m.vars){if(/^--[a-z0-9-]+$/.test(k))r.style.setProperty(k,String(m.vars[k]))}
r.setAttribute('data-theme',m.scheme==='dark'?'dark':'light');r.style.colorScheme=m.scheme==='dark'?'dark':'light';schedule()}});
var sent=0;
function action(name,data){var now=Date.now();if(now-sent<800)return false;sent=now;var payload={};
try{payload=data===undefined?{}:JSON.parse(JSON.stringify(data))}catch(e){payload={}}
if(payload===null||typeof payload!=='object'||Array.isArray(payload))payload={value:payload};
post({type:'action',name:String(name).slice(0,80),data:payload});return true}
try{Object.defineProperty(window,'dsh',{value:Object.freeze({action:action}),configurable:false,writable:false})}catch(e){}
addEventListener('error',function(e){post({type:'error',message:String(e.message||'script error').slice(0,300)})});
})();`
}

/** Drop a leading doctype: ours opens the document so the frame never runs in quirks mode. */
function stripDoctype(html: string): string {
  return html.replace(/^\s*<!doctype[^>]*>/iu, '')
}

/**
 * Build the frame's `srcdoc`.
 *
 * The model's markup goes inside `<body>` as is: the HTML parser folds a
 * stray `<html>`/`<head>`/`<body>` from a full document into ours, while the
 * CSP meta, base styles and bootstrap above it are already in force.
 */
export function buildHtmlFrameDocument(html: string, options: HtmlFrameOptions): string {
  const nonce = randomToken()
  const csp = frameCsp(options, nonce)
  const scheme = options.theme.scheme
  return `<!doctype html>
<html data-theme="${scheme}" style="color-scheme:${scheme}">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${escapeAttr(csp)}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="referrer" content="no-referrer">
<base target="_blank">
<style>
:root{${varsCss(options.theme.vars)}}
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;padding:0;background:transparent;overflow-x:hidden}
body{display:flow-root;color:var(--dsh-fg);font-family:var(--dsh-font);font-size:var(--dsh-font-size,15px);line-height:1.6;overflow-wrap:anywhere}
img,svg,video,canvas{max-width:100%}
a{color:var(--dsh-accent)}
</style>
<script nonce="${nonce}">${bootstrapScript(options.frameId)}</script>
</head>
<body>
${stripDoctype(html)}
</body>
</html>`
}

/** Sandbox flags: scripts for the bootstrap (CSP decides about the model's), popups for links. */
export const FRAME_SANDBOX = 'allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-pointer-lock'
