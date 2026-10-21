/* WebTroller (c) 2026 Vertzz - developed by Vertzz - https://t.me/vertzz_official
   Background: opens WebTroller on a tab, keeps it open across reloads and page changes,
   remembers hide/show for each tab, and hands input to game frames. */
const api = typeof browser !== "undefined" ? browser : chrome;
const KEY = "wtTabs";
const pings = new Map();                       /* tab id -> the network ping request that is waiting */

const getTabs = async () => (await api.storage.session.get(KEY))[KEY] || {};
async function patch(id, p) {
  const t = await getTabs();
  if (p === null) delete t[id]; else t[id] = Object.assign(t[id] || {}, p);
  await api.storage.session.set({ [KEY]: t });
}
async function inject(id) {
  try { await api.scripting.executeScript({ target: { tabId: id }, files: ["content.js"] }); } catch (e) {}
}

/* icon click or shortcut: open on this tab, afterwards show / hide */
async function toggle(tab) {
  if (!tab || tab.id == null) return;
  const state = (await getTabs())[tab.id];
  if (!state) { await patch(tab.id, { hidden: false }); await inject(tab.id); return; }
  const hidden = !state.hidden;
  await patch(tab.id, { hidden });
  await inject(tab.id);
  try { await api.tabs.sendMessage(tab.id, { wt: "set", hidden }); } catch (e) {}
}
api.action.onClicked.addListener(toggle);
api.commands.onCommand.addListener(async (c) => {
  if (c !== "toggle-webtroller") return;
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  toggle(tab);
});

/* a tab that has WebTroller open gets it again after every page load */
api.tabs.onUpdated.addListener(async (id, info) => {
  if (info.status === "complete" && (await getTabs())[id]) inject(id);
});
api.tabs.onRemoved.addListener((id) => { const c = pings.get(id); if (c) c.abort(); pings.delete(id); patch(id, null); });

api.runtime.onMessage.addListener((m, sender, reply) => {
  const id = sender.tab && sender.tab.id;
  if (!m || id == null) return;
  if (m.wt === "pingStop") {                   /* the network readout was switched off or hidden: cancel the request that is still waiting */
    const c = pings.get(id); if (c) { c.abort(); pings.delete(id); }
    return;
  }
  if (m.wt === "adg") { adgHosts(m.hosts); return; }   /* AdGuard DNS: third-party host names seen by a page (frame.js) */
  if (m.wt === "ping") {                       /* network monitor: time a small request to the page's server */
    const old = pings.get(id); if (old) old.abort();
    const t0 = performance.now(), ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4000);
    pings.set(id, ctl);
    fetch(m.url, { method: "HEAD", cache: "no-store", credentials: "omit", redirect: "manual", signal: ctl.signal })
      .then(() => reply({ ms: performance.now() - t0 })).catch(() => reply({}))
      .finally(() => { clearTimeout(to); if (pings.get(id) === ctl) pings.delete(id); });
    return true;
  }
  if (m.wt === "nk") {                         /* the overlay says whether the phone keyboard must stay off: remembered for the tab and passed to every frame (frame.js) */
    getTabs().then((t) => { if (t[id]) patch(id, { nk: !!m.on }); });
    Promise.resolve(api.tabs.sendMessage(id, { wtNk: !!m.on })).catch(() => {});
    return;
  }
  if (m.wt === "nkq") { getTabs().then((t) => reply({ nk: !!(t[id] && t[id].nk) })); return true; }   /* a frame that just loaded asks */
  if (m.wt === "nd") { Promise.resolve(api.tabs.sendMessage(id, { wtNd: 1 })).catch(() => {}); return; }   /* the phone keyboard opened anyway: the frame with the focus closes it */
  if (m.wt === "fq") { Promise.resolve(api.tabs.sendMessage(id, { wtFq: 1 })).catch(() => {}); return; }   /* keyboard opened: the frame with the focus reports its field again */
  if (m.wt === "pw") { Promise.resolve(api.tabs.sendMessage(id, { wtPw: !!m.on })).catch(() => {}); return; }   /* the eye button: every frame of the tab hears it, the one with the focus answers */
  if (m.wt === "fv") { Promise.resolve(api.tabs.sendMessage(id, { wtFv: m.v }, { frameId: 0 })).catch(() => {}); return; }   /* a text field in a frame reports its text and caret to the overlay */
  if (m.wtVol !== undefined) { Promise.resolve(api.tabs.sendMessage(id, { wtVol: m.wtVol })).catch(() => {}); return; }   /* volume: every frame of the tab */
  if (m.wt === "hello") { getTabs().then((t) => reply(t[id] || { hidden: false })); return true; }
  if (m.wt === "state") {
    const p = {};
    if (m.hidden !== undefined) p.hidden = m.hidden;
    patch(id, p);
  } else if (m.emu) {
    Promise.resolve(api.tabs.sendMessage(id, m)).catch(() => {});   /* game frames listen in frame.js */
  }
});

/* Ad Blocker: the menu's Ad Blocker button saves "adb" in the settings; here it turns the network block list (rules/ads.json) on or off for every tab */
const adbSync = async (on) => {
  try { await api.declarativeNetRequest.updateEnabledRulesets(on ? { enableRulesetIds: ["ads"] } : { disableRulesetIds: ["ads"] }); } catch (e) {}
};
const adbOf = (txt) => { try { return !!JSON.parse(txt || "null").adb; } catch (e) { return false; } };
api.storage.local.get("wt").then((r) => adbSync(adbOf(r && r.wt)));
api.storage.onChanged.addListener((c, area) => { if (area === "local" && c.wt) adbSync(adbOf(c.wt.newValue)); });

/* AdGuard DNS: while it is on, frame.js reports the third-party host names a page loads things from. Each new name is looked up once
   on AdGuard DNS (DNS over HTTPS, RFC 8484). AdGuard DNS answers REFUSED or 0.0.0.0 for ad and tracker servers; those names are added to one
   dynamic block rule, so every later request to them is stopped in every tab. The list is kept between sessions. Only host names are sent. */
const ADG = { servers: ["https://dns.adguard-dns.com/dns-query", "https://dns.adguard.com/dns-query"], rule: 100, max: 20000 };
let adgOn = false, adgBlocked = new Set(), adgSeen = new Set(), adgBusy = 0, adgTimer = 0;
const adgQ = [];
const adgInit = (async () => {
  try { adgBlocked = new Set(((await api.storage.local.get("adgBlocked")).adgBlocked) || []); } catch (e) {}
  try { adgSeen = new Set(((await api.storage.session.get("adgSeen")).adgSeen) || []); } catch (e) {}
})();

const b64url = (u) => btoa(String.fromCharCode.apply(null, u)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
function dnsQuery(host) {                       /* a plain "A record" question for host */
  const o = [0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0];
  for (const l of host.split(".")) { o.push(l.length); for (let i = 0; i < l.length; i++) o.push(l.charCodeAt(i)); }
  o.push(0, 0, 1, 0, 1);
  return new Uint8Array(o);
}
function dnsBlocked(u) {                        /* REFUSED, or only 0.0.0.0 / :: answers, means AdGuard DNS blocks the name */
  if (u.length < 12) return false;
  const rcode = u[3] & 15, an = (u[6] << 8) | u[7];
  if (rcode === 5) return true;
  let p = 12;
  const skip = () => { while (p < u.length) { const c = u[p]; if (c === 0) { p++; return; } if ((c & 0xC0) === 0xC0) { p += 2; return; } p += c + 1; } };
  skip(); p += 4;
  let n = 0, zero = 0;
  for (let i = 0; i < an && p + 10 <= u.length; i++) {
    skip();
    const t = (u[p] << 8) | u[p + 1], rl = (u[p + 8] << 8) | u[p + 9];
    p += 10;
    if (t === 1 || t === 28) { n++; if (Array.prototype.every.call(u.subarray(p, p + rl), (x) => x === 0)) zero++; }
    p += rl;
  }
  return n > 0 && n === zero;
}
async function adgAsk(host) {                   /* true: blocked, false: allowed, null: could not ask */
  const q = b64url(dnsQuery(host));
  for (const s of ADG.servers) {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 4000);
    try {
      const r = await fetch(s + "?dns=" + q, { headers: { accept: "application/dns-message" }, cache: "no-store", credentials: "omit", signal: ctl.signal });
      if (r.ok) return dnsBlocked(new Uint8Array(await r.arrayBuffer()));
    } catch (e) {} finally { clearTimeout(to); }
  }
  return null;
}
async function adgRule() {                      /* one block rule for every learned name, for third-party requests only */
  const list = adgOn ? Array.from(adgBlocked) : [];
  try {
    await api.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ADG.rule],
      addRules: list.length ? [{ id: ADG.rule, priority: 1, action: { type: "block" }, condition: { requestDomains: list, domainType: "thirdParty" } }] : []
    });
  } catch (e) {}
}
function adgSave() {
  clearTimeout(adgTimer);
  adgTimer = setTimeout(async () => {
    try { await api.storage.local.set({ adgBlocked: Array.from(adgBlocked) }); } catch (e) {}
    try { await api.storage.session.set({ adgSeen: Array.from(adgSeen) }); } catch (e) {}
    adgRule();
  }, 1200);
}
function adgPump() {
  while (adgBusy < 4 && adgQ.length) {
    const h = adgQ.shift();
    adgBusy++;
    adgAsk(h).then((res) => {
      if (res === null) adgSeen.delete(h);      /* DNS server not reachable: ask again next time the name shows up */
      else if (res && adgBlocked.size < ADG.max) adgBlocked.add(h);
    }).finally(() => { adgBusy--; if (!adgQ.length && !adgBusy) adgSave(); adgPump(); });
  }
}
async function adgHosts(list) {
  await adgInit;
  if (!adgOn || !Array.isArray(list)) return;
  for (const h of list.slice(0, 60)) {
    if (typeof h !== "string" || h.length > 253 || !/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(h) || /(^|\.)-|-(\.|$)/.test(h) || h.split(".").some((l) => l.length > 63)) continue;
    if (adgSeen.has(h) || adgBlocked.has(h) || adgQ.length > 400) continue;
    if (adgSeen.size > 8000) adgSeen.clear();
    adgSeen.add(h); adgQ.push(h);
  }
  adgPump();
}
const adgOf = (txt) => { try { return !!JSON.parse(txt || "null").adb; } catch (e) { return false; } };
const adgSync = async (on) => { await adgInit; adgOn = on; await adgRule(); };
api.storage.local.get("wt").then((r) => adgSync(adgOf(r && r.wt)));
api.storage.onChanged.addListener((c, area) => { if (area === "local" && c.wt) adgSync(adgOf(c.wt.newValue)); });
