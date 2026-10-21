/* ---------- the tab: stays open across reloads and pages until you hide it ---------- */
let pageHidden=false,pageKnown=false;   /* pageKnown: the background has said whether this tab's overlay is shown or hidden */
const tell=o=>{try{chrome.runtime.sendMessage(Object.assign({wt:"state"},o))}catch(e){}};   /* the background page remembers this per tab */
function setHidden(h,quiet){if(h&&typeof unlockAll==="function"){unlockAll();try{render()}catch(e){}}pageHidden=h;pageKnown=true;host.style.display=h?"none":"";delete S.hud;delete S.kb;delete S.hs;delete S.ds;delete S.ls;try{lsOpen(false)}catch(e){}SCREEN_OFF=false;try{dsUI()}catch(e){}$("hud").classList.remove("open");if(!h)placeAll();   /* hidden and shown again: the menu button is back at the top centre */
if(typeof nativeSync==="function")nativeSync();monSync();applyViewport();if(!quiet)tell({hidden:h})}
try{
  chrome.runtime.onMessage.addListener(m=>{if(m&&m.wt==="set")setHidden(!!m.hidden,true);else if(m&&m.wtFv!==undefined&&typeof vkFrameSet==="function")vkFrameSet(m.wtFv)});
  chrome.runtime.sendMessage({wt:"hello"},r=>{void chrome.runtime.lastError;if(r)setHidden(!!r.hidden,true);else{pageKnown=true;monSync();applyViewport()}});
}catch(e){pageKnown=true}
setTimeout(()=>{if(!pageKnown){pageKnown=true;monSync()}},1500);   /* no answer from the background: treat the overlay as shown */

/* ---------- fullscreen ---------- */
$("fs").onclick=()=>{
  try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen().catch(()=>toast("Fullscreen is not available on this page"))}
  catch(e){toast("Fullscreen is not available on this page")}
};
document.addEventListener("fullscreenchange",()=>{
  const on=!!document.fullscreenElement;$("fs").classList.toggle("pri",on);
  wtAttach();                                  /* a page element went fullscreen (a game, a player): only that element is drawn, so WebTroller moves into it; back out again afterwards */
});
/* WebTroller stays on screen: a page can remove it from itself (scripts that rebuild <html>, document.write, code that deletes unknown elements) or hide it behind a fullscreen element.
   It is put back where it belongs at once (a change in the page's top level), and checked once a second as a safety net. */
const WT_NOHOLD=/^(VIDEO|AUDIO|CANVAS|IFRAME|IMG|EMBED|OBJECT|INPUT|TEXTAREA|SELECT|BUTTON)$/;   /* elements that cannot draw children: WebTroller stays outside them */
function wtAttach(){
  try{
    const fe=document.fullscreenElement,de=document.documentElement;
    const want=fe&&fe!==de&&!WT_NOHOLD.test(fe.tagName)?fe:de;
    if(want&&(host.parentNode!==want||!host.isConnected)){want.appendChild(host);wtWatch()}
  }catch(e){}
}
let WTO=null,WTP=null;
function wtWatch(){                           /* watch the page's top level (the <html> element being replaced, or WebTroller being taken out of it) */
  try{
    if(typeof MutationObserver!=="function")return;
    if(!WTO)WTO=new MutationObserver(()=>{if(!host.isConnected||(!document.fullscreenElement&&host.parentNode!==document.documentElement))wtAttach()});
    WTO.disconnect();WTO.observe(document,{childList:true});if(document.documentElement)WTO.observe(document.documentElement,{childList:true});
  }catch(e){}
}
wtWatch();
if(!WTP)WTP=setInterval(()=>{if(!host.isConnected||(!document.fullscreenElement&&host.parentNode!==document.documentElement))wtAttach()},1000);
addEventListener("pageshow",wtAttach);

/* ---------- no pinch zoom while WebTroller is showing ---------- */
const VP={orig:undefined,created:false};
let zoomStyle=null;
function applyViewport(){
  let mv=document.querySelector('meta[name="viewport"]');
  if(VP.orig===undefined)VP.orig=mv?mv.getAttribute("content"):null;          /* remember the page's own setting once */
  const lock=!pageHidden;
  if(lock&&!zoomStyle){zoomStyle=document.createElement("style");zoomStyle.textContent="html,body{touch-action:pan-x pan-y !important}";(document.head||document.documentElement).appendChild(zoomStyle)}
  if(!lock&&zoomStyle){zoomStyle.remove();zoomStyle=null}
  if(!lock){
    if(VP.created&&mv)mv.remove();else if(mv&&VP.orig!==null)mv.setAttribute("content",VP.orig);
    VP.created=false;return;
  }
  if(!mv){mv=document.createElement("meta");mv.name="viewport";(document.head||document.documentElement).appendChild(mv);VP.created=true}
  const m={};(VP.orig||"width=device-width,initial-scale=1").split(",").forEach(p=>{const[k,v]=p.split("=").map(s=>s&&s.trim());if(k)m[k]=v});
  m["user-scalable"]="no";m["maximum-scale"]="1";m["minimum-scale"]="1";
  mv.setAttribute("content",Object.entries(m).map(([k,v])=>v===undefined?k:k+"="+v).join(","));
}
addEventListener("wheel",e=>{if(!pageHidden&&e.ctrlKey)e.preventDefault()},{passive:false,capture:true});            /* trackpad pinch and Ctrl + wheel */
addEventListener("touchmove",e=>{if(!pageHidden&&e.touches.length>1&&e.cancelable)e.preventDefault()},{passive:false,capture:true});
document.addEventListener("gesturestart",e=>{if(!pageHidden)e.preventDefault()});

/* ---------- WebTroller's own QWERTY keyboard (the device keyboard never opens) ---------- */
const isEditable=el=>!!el&&el!==host&&(el.isContentEditable||el.tagName==="TEXTAREA"||(el.tagName==="INPUT"&&!/^(button|checkbox|radio|submit|range|color|file|image|reset)$/i.test(el.type)));
let lastField=null,vkOpen=false,vkShift=0,vkSym=false;
const IMS=[];                                        /* fields whose own keyboard we switched off */
/* while the \u2328 Keyboard button is on (and WebTroller is showing, not editing) the phone keyboard is kept from opening in text fields */
function noNative(el){
  if(!nativeOff()||!isEditable(el)||el.__wtim!==undefined)return;   /* toggle off (or hidden / editing): never lock, even from a sweep that was queued earlier */el.__wtim=el.getAttribute("inputmode");el.setAttribute("inputmode","none");IMS.push(el);grdOn(el);
  try{const h=el.closest&&el.closest("[contenteditable]:not([contenteditable=false])");if(h&&h!==el&&h!==host)noNative(h)}catch(e){}      /* an editable area: the element that owns the editing (its host) is locked too */
  try{el.setAttribute("virtualkeyboardpolicy","manual")}catch(e){}      /* Chrome: this field never opens the phone keyboard by itself (also for contenteditable areas, which cannot be made read-only) */
  if(el===document.activeElement||(el.getRootNode&&el.getRootNode().activeElement===el)){roOn(el);try{el.blur();el.focus()}catch(e){}}      /* a field that already has focus keeps the phone keyboard until it is focused again */
}
/* Some pages undo the lock: they take readonly off when a field gets the focus (an old anti-autofill trick) or set their own inputmode again. A locked field is watched and put back
   at once (at most 40 times per field, so a page that keeps fighting back can never make this loop). */
let GRD=null;
function grdOn(el){
  try{
    if(!GRD&&typeof MutationObserver==="function")GRD=new MutationObserver(ms=>{
      if(!nativeOff())return;
      for(const m of ms){const e=m.target;if(!e||e.__wtim===undefined)continue;
        e.__wtg=(e.__wtg||0)+1;if(e.__wtg>40)continue;
        if(e.getAttribute("inputmode")!=="none")e.setAttribute("inputmode","none");
        if(e.__wtro!==undefined&&"readOnly" in e&&!e.readOnly)e.readOnly=true}
    });
    if(GRD)GRD.observe(el,{attributes:true,attributeFilter:["inputmode","readonly"]});
  }catch(e){}
}
/* inputmode="none" is only a hint and some browsers ignore it (email, number, tel, url, password, search fields...). A field that is read-only never opens the phone keyboard,
   so the field being tapped or focused is also made read-only; it is unlocked for a moment only while WebTroller's own keyboard types into it, and given back when it loses focus. */
const ROS=new Set();
function roOn(el){
  if(!nativeOff()||!el||!("readOnly" in el)||el.__wtro!==undefined||el===host)return;
  el.__wtro=el.readOnly;el.readOnly=true;ROS.add(el);
}
function roOff(el){if(!el||el.__wtro===undefined)return;try{el.readOnly=el.__wtro}catch(e){}delete el.__wtro;ROS.delete(el)}
function writable(a,fn){                      /* run fn with the field editable, then lock it again (all in one go, so the phone keyboard never gets a chance to open) */
  const w=!!a&&a.__wtro!==undefined&&a.readOnly;if(w)a.readOnly=false;
  try{return fn()}finally{if(w)a.readOnly=true}
}
const realTarget=e=>{try{const p=e.composedPath&&e.composedPath();if(p&&p[0]&&p[0].nodeType===1)return p[0]}catch(x){}return e.target};   /* the real element, also inside a page component's shadow DOM */
function restoreNative(){if(GRD){try{GRD.disconnect()}catch(e){}GRD=null}Array.from(ROS).forEach(roOff);IMS.splice(0).forEach(el=>{try{el.removeAttribute("virtualkeyboardpolicy")}catch(e){}if(el.__wtim===null)el.removeAttribute("inputmode");else el.setAttribute("inputmode",el.__wtim);delete el.__wtim})}
/* phone keyboard off <=> the \u2328 Keyboard toggle in the menu is on. Turn it off, hide WebTroller or open the editor and the phone keyboard is back */
const nativeOff=()=>S.kbOn!==false&&mode==="play"&&!pageHidden;   /* the Keyboard toggle in the menu: on = phone keyboard never opens in any input / text area; off = it opens as normal */
const EDSEL='input,textarea,[contenteditable]';
function nativeSweep(root){                      /* switch the phone keyboard off on every text field already on the page, before anyone taps it */
  try{(root||document).querySelectorAll(EDSEL).forEach(el=>{if(!el.closest("#webtroller-host"))noNative(el)})}catch(e){}
  if(root&&root.matches&&root.matches(EDSEL))noNative(root);
}
/* the frames of the page (also other sites' frames, which this script cannot reach) are told through the background script: frame.js keeps the phone keyboard off in them too */
let nkSent=null;
function nkTell(){const on=nativeOff();if(on===nkSent)return;nkSent=on;try{chrome.runtime.sendMessage({wt:"nk",on})}catch(e){}}
function nativeSync(){
  nkTell();
  if(!nativeOff()){restoreNative();nobsOff();pollOff();vkApi(false);return}      /* nothing is watched while the phone keyboard is allowed */
  nobsOn();pollOn();vkApi(true);nativeSweep(document);
  [document.activeElement,lastField].forEach(el=>{if(el&&el.isConnected)noNative(el)});
}
/* fields the page adds later are switched off too */
const NEWN=new Set();let newT=0,NOBS=null;
const nobsOn=()=>{
  if(NOBS||typeof MutationObserver!=="function")return;
  NOBS=new MutationObserver(ms=>{
    let fast=0;
    for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1&&n!==host&&NEWN.size<40){NEWN.add(n);
      if(fast<20&&nativeOff()){fast++;try{if(n.matches(EDSEL))noNative(n);else if(n.childElementCount<60)n.querySelectorAll(EDSEL).forEach(noNative)}catch(e){}}}   /* a new field is locked at once (a page may focus it right away); the rest of the page is swept a little later */
    /* busy pages add thousands of nodes: only look at a few */
    if(!newT&&NEWN.size)newT=setTimeout(()=>{newT=0;const l=Array.from(NEWN);NEWN.clear();if(!nativeOff())return;
      const run=()=>l.forEach(n=>{if(n.isConnected)nativeSweep(n)});
      window.requestIdleCallback?requestIdleCallback(run,{timeout:1500}):run()},400);
  });
  NOBS.observe(document.documentElement,{childList:true,subtree:true});
};
const nobsOff=()=>{if(NOBS){NOBS.disconnect();NOBS=null}NEWN.clear();clearTimeout(newT);newT=0};
/* a tap that is about to focus a field switches its phone keyboard off first */
["pointerdown","touchstart","mousedown","pointerup","touchend","mouseup","click"].forEach(t=>document.addEventListener(t,e=>{
  if(!nativeOff())return;const t=realTarget(e),el=t&&t.closest&&t.closest(EDSEL+",label");
  if(!el)return;const f=el.tagName==="LABEL"?el.control:el;if(!f)return;noNative(f);
  if(isEditable(f)){roOn(f);setTimeout(()=>{if(f.__wtro!==undefined&&!(document.activeElement===f||(f.getRootNode&&f.getRootNode().activeElement===f)))roOff(f)},700)}   /* tapped but never focused: give it back */
},true));
document.addEventListener("focusin",e=>{const t=realTarget(e);if(isEditable(t)){lastField=t;if(nativeOff()){noNative(t);roOn(t)}}},true);
document.addEventListener("focusout",e=>{const t=realTarget(e);if(t&&t.__wtro!==undefined)roOff(t)},true);

/* Auto detection. While the Keyboard toggle is on, WebTroller watches for any text field getting the focus (a tap, the page's own script, autofocus, a field inside a page component)
   and for the phone keyboard itself opening. A field that was not locked in time is locked at once, and a phone keyboard that did open is closed again.
   Three detectors work together: (1) the focused element is checked a few times a second, (2) the browser's own keyboard signal (navigator.virtualKeyboard, Chrome / Android),
   (3) the page area shrinking by a keyboard's height. Fields in other sites' frames are handled by frame.js, asked through the background script. */
function deepActive(){let a=document.activeElement;while(a&&a!==host&&a.shadowRoot&&a.shadowRoot.activeElement)a=a.shadowRoot.activeElement;return a===host?null:a}
function closePhoneKb(){                       /* lock the field that has the focus, close the phone keyboard, and give the field its focus back (now read-only, so no keyboard) */
  if(!nativeOff())return;
  try{navigator.virtualKeyboard&&navigator.virtualKeyboard.hide()}catch(e){}
  const a=deepActive();
  if(a&&a.tagName==="IFRAME"){try{chrome.runtime.sendMessage({wt:"nd"})}catch(e){}return}
  if(!isEditable(a))return;
  noNative(a);roOn(a);try{a.blur()}catch(e){}
  setTimeout(()=>{if(nativeOff()&&a.isConnected)try{roOn(a);a.focus({preventScroll:true})}catch(e){}},60);
}
let POLL=0;
function pollOn(){
  if(POLL)return;
  POLL=setInterval(()=>{
    if(!nativeOff()){pollOff();return}
    const a=deepActive();if(!a)return;
    if(a.tagName==="IFRAME"||!isEditable(a))return;
    if(a.__wtim===undefined||("readOnly" in a&&a.__wtro===undefined)){noNative(a);roOn(a);closePhoneKb()}   /* a text field has the focus and was not locked: lock it and close the keyboard if it opened */
  },250);
}
function pollOff(){if(POLL){clearInterval(POLL);POLL=0}}
const VKAPI=navigator.virtualKeyboard;let vkOv=null;
function vkApi(on){                            /* while the toggle is on, the browser reports the phone keyboard opening (and the page does not get pushed around by it) */
  if(!VKAPI)return;
  try{if(on){if(vkOv===null)vkOv=VKAPI.overlaysContent;VKAPI.overlaysContent=true}else if(vkOv!==null){VKAPI.overlaysContent=vkOv;vkOv=null}}catch(e){}
}
if(VKAPI)try{VKAPI.addEventListener("geometrychange",e=>{
  const r=e.target&&e.target.boundingRect;
  if(r&&r.height>0&&nativeOff()){closePhoneKb();setTimeout(closePhoneKb,300)}      /* a second time: a keyboard that is still up is closed again */
})}catch(e){}
{const vv=window.visualViewport;
 if(vv){let base=vv.height,t=0;
  addEventListener("orientationchange",()=>setTimeout(()=>{base=vv.height},500));
  vv.addEventListener("resize",()=>{clearTimeout(t);t=setTimeout(()=>{
    const cur=vv.height;if(vv.scale>1.05)return;if(cur>base)base=cur;
    if(!nativeOff()||base-cur<Math.max(120,base*.15))return;
    closePhoneKb();setTimeout(closePhoneKb,300);
  },120)});
 }}

const VK_NUM=["1","2","3","4","5","6","7","8","9","0"];
const VK_S=[["@","#","$","%","&","*","-","+","(",")"],["!",'"',"'",":",";","/","?","_","="],["~","`","|","\\","<",">","[","]","\u232B"]];
/* languages: r = the three letter rows (\u21E7 = shift, \u232B = backspace), x = extra characters shown on the ?123 page */
const LATIN=["q w e r t y u i o p","a s d f g h j k l","\u21E7 z x c v b n m \u232B"];
const VK_LANGS=[
 {id:"en",n:"English",t:"en",r:LATIN,x:""},
 {id:"es",n:"Espa\u00F1ol",t:"es",r:["q w e r t y u i o p","a s d f g h j k l \u00F1","\u21E7 z x c v b n m \u232B"],x:"\u00E1 \u00E9 \u00ED \u00F3 \u00FA \u00FC \u00BF \u00A1"},
 {id:"fr",n:"Fran\u00E7ais",t:"fr",r:["a z e r t y u i o p","q s d f g h j k l m","\u21E7 w x c v b n \u232B"],x:"\u00E9 \u00E8 \u00EA \u00E0 \u00E2 \u00E7 \u00F9 \u00FB \u00EE \u00EF \u00F4 \u0153"},
 {id:"de",n:"Deutsch",t:"de",r:["q w e r t z u i o p \u00FC","a s d f g h j k l \u00F6 \u00E4","\u21E7 y x c v b n m \u00DF \u232B"],x:""},
 {id:"pt",n:"Portugu\u00EAs",t:"pt",r:["q w e r t y u i o p","a s d f g h j k l \u00E7","\u21E7 z x c v b n m \u232B"],x:"\u00E1 \u00E0 \u00E2 \u00E3 \u00E9 \u00EA \u00ED \u00F3 \u00F4 \u00F5 \u00FA"},
 {id:"it",n:"Italiano",t:"it",r:LATIN,x:"\u00E0 \u00E8 \u00E9 \u00EC \u00F2 \u00F3 \u00F9"},
 {id:"tr",n:"T\u00FCrk\u00E7e",t:"tr",r:["q w e r t y u \u0131 o p \u011F \u00FC","a s d f g h j k l \u015F i","\u21E7 z x c v b n m \u00F6 \u00E7 \u232B"],x:""},
 {id:"ru",n:"\u0420\u0443\u0441\u0441\u043A\u0438\u0439",t:"ru",r:["\u0439 \u0446 \u0443 \u043A \u0435 \u043D \u0433 \u0448 \u0449 \u0437 \u0445 \u044A","\u0444 \u044B \u0432 \u0430 \u043F \u0440 \u043E \u043B \u0434 \u0436 \u044D","\u21E7 \u044F \u0447 \u0441 \u043C \u0438 \u0442 \u044C \u0431 \u044E \u232B"],x:"\u0451"},
 {id:"uk",n:"\u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430",t:"uk",r:["\u0439 \u0446 \u0443 \u043A \u0435 \u043D \u0433 \u0448 \u0449 \u0437 \u0445 \u0457","\u0444 \u0456 \u0432 \u0430 \u043F \u0440 \u043E \u043B \u0434 \u0436 \u0454","\u21E7 \u044F \u0447 \u0441 \u043C \u0438 \u0442 \u044C \u0431 \u044E \u232B"],x:"\u0491 \u0027"},
 {id:"ar",n:"\u0627\u0644\u0639\u0631\u0628\u064A\u0629",t:"ar",r:["\u0636 \u0635 \u062B \u0642 \u0641 \u063A \u0639 \u0647 \u062E \u062D \u062C \u062F","\u0634 \u0633 \u064A \u0628 \u0644 \u0627 \u062A \u0646 \u0645 \u0643 \u0637","\u0626 \u0621 \u0624 \u0631 \u0649 \u0629 \u0648 \u0632 \u0638 \u0630 \u232B"],x:"\u064E \u064F \u0650 \u0651 \u0652 \u064B \u064C \u064D \u060C \u061F \u061B"},
 {id:"el",n:"\u0395\u03BB\u03BB\u03B7\u03BD\u03B9\u03BA\u03AC",t:"el",r:["\u03C2 \u03B5 \u03C1 \u03C4 \u03C5 \u03B8 \u03B9 \u03BF \u03C0","\u03B1 \u03C3 \u03B4 \u03C6 \u03B3 \u03B7 \u03BE \u03BA \u03BB","\u21E7 \u03B6 \u03C7 \u03C8 \u03C9 \u03B2 \u03BD \u03BC \u232B"],x:"\u03AC \u03AD \u03AE \u03AF \u03CC \u03CD \u03CE \u03CA \u03CB"}
];
const vkLang=()=>VK_LANGS.find(l=>l.id===S.kbLang)||VK_LANGS[0];
const vkUp=c=>{const u=c.toLocaleUpperCase(vkLang().t);return u.length===1?u:c};
let vkPick=false;
let vkEmoji=false,vkEmCat=1,vkRedraw=false;
/* extra characters offered when a key is held (slide up onto one and let go to swap it in) */
const VK_ALT={
 f:"ƒ",h:"ħ ĥ",j:"ĵ",k:"ķ",m:"µ",r:"ŕ ř",w:"ŵ",p:"¶",a:"à á â ä ã å ā æ",c:"ç ć č",d:"ð",e:"è é ê ë ē ė ę",g:"ğ",i:"ì í î ï ī į ı",l:"ł",n:"ñ ń",o:"ò ó ô ö õ ø ō œ",s:"ß ś š ş",t:"þ",u:"ù ú û ü ū",y:"ý ÿ",z:"ž ź ż",
 "1":"¹ ½ ⅓ ¼","2":"² ⅔","3":"³ ¾","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","0":"⁰ ° ∅",
 ".":", … · •",",":"‚","?":"¿","!":"¡","-":"– — •","_":"‾",'"':"“ ” „ « »","'":"‘ ’ ‚ ‹ ›","$":"€ £ ¥ ¢ ₹ ₽ ₩","%":"‰","+":"±","=":"≠ ≈ ≡","<":"≤ « ‹",">":"≥ » ›","/":"÷ ⁄","*":"× † ‡ ★","#":"№ ♯","&":"§","@":"©","(":"[ { ⟨",")":"] } ⟩",":":"∶","~":"≈ ∼","`":"´ ˜","|":"¦ ‖",
 "е":"ё","и":"й ӣ","ь":"ъ","г":"ґ","α":"ά","ε":"έ","η":"ή","ι":"ί ϊ ΐ","ο":"ό","υ":"ύ ϋ ΰ","ω":"ώ","ا":"أ إ آ ء","ه":"ة","و":"ؤ","ي":"ى ئ"
};
function vkAlts(c){
  if(vkPick||vkEmoji||!VK_ALT[c])return null;
  const a=VK_ALT[c].split(" ");return !vkSym&&vkShift?a.map(vkUp):a;
}
function vkPop(b,alts){
  vkPopClose();const r=BR(b),ar=BR($("app")),p=document.createElement("div");
  p.id="vkpop";alts.forEach(c=>{const x=document.createElement("button");x.className="vk vkp";x.textContent=c;x.dataset.v=c;
    /* tap an extra character (after lifting your finger) to swap it in */
    x.onpointerdown=e=>{e.preventDefault();e.stopPropagation();x.classList.add("on")};
    x.onpointerup=e=>{e.preventDefault();e.stopPropagation();vkPopClose();vkReplace(c)};
    x.onpointercancel=()=>x.classList.remove("on");x.onclick=e=>e.preventDefault();x.oncontextmenu=e=>e.preventDefault();
    p.appendChild(x)});
  $("app").appendChild(p);
  const w=p.offsetWidth||alts.length*42;
  p.style.left=clamp(r.left-ar.left+r.width/2-w/2,4,Math.max(4,ar.width-w-4))+"px";p.style.bottom=(ar.bottom-r.top+8)+"px";
  return p;
}
/* the extra character under the finger once it has slid up above the key */
function vkPopPick(p,x,y,b){
  const r=b.getBoundingClientRect();let best=null,d=1e9;
  if(y<r.top-4)[...p.children].forEach(c=>{const q=c.getBoundingClientRect(),m=Math.abs(x-(q.left+q.width/2));if(m<d){d=m;best=c}});
  [...p.children].forEach(c=>c.classList.toggle("on",c===best));
  return best?best.dataset.v:null;
}
function vkPopClose(){const p=$("vkpop");if(p)p.remove()}
/* the extra-character bar stays open after you lift your finger; tapping anywhere else closes it */
$("app").addEventListener("pointerdown",e=>{if(!e.composedPath().some(n=>n&&n.id==="vkpop"))vkPopClose()},true);
function vkReplace(c){
  const a=vkTarget();
  if(a&&a.tagName==="IFRAME"){vkPress("\u232B");vkPress(c);return}
  if(isEditable(a)){delBack(a);insertText(a,c)}
}
/* emoji: the first tab is "recent", the rest are fixed lists */
const VK_EMO=[["\u{1F552}",""],
 ["\u{1F600}","😀 😃 😄 😁 😆 😅 🤣 😂 🙂 🙃 😉 😊 😇 🥰 😍 🤩 😘 😗 😚 😙 😋 😛 😜 🤪 😝 🤑 🤗 🤭 🤫 🤔 🤐 😐 😑 😶 😏 😒 🙄 😬 🤥 😌 😔 😪 🤤 😴 😷 🤒 🤕 🤢 🤮 🤧 🥵 🥶 🥴 😵 🤯 🤠 🥳 😎 🤓 🧐 😕 😟 🙁 😮 😯 😲 😳 🥺 😦 😧 😨 😰 😥 😢 😭 😱 😖 😣 😞 😓 😩 😫 🥱 😤 😡 😠 🤬 😈 👿 💀 💩 🤡 👹 👺 👻 👽 👾 🤖"],
 ["\u{1F44B}","👋 🤚 🖐️ ✋ 🖖 👌 🤌 🤏 ✌️ 🤞 🤟 🤘 🤙 👈 👉 👆 🖕 👇 ☝️ 👍 👎 ✊ 👊 🤛 🤜 👏 🙌 👐 🤲 🤝 🙏 ✍️ 💅 🤳 💪 🦾 👀 👁️ 👅 👄 🧠 👶 🧒 👦 👧 🧑 👨 👩 🧓 👴 👵"],
 ["\u{1F436}","🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🐤 🦆 🦅 🦉 🦇 🐺 🐗 🐴 🦄 🐝 🐛 🦋 🐌 🐞 🐜 🐢 🐍 🦎 🐙 🦑 🦀 🐠 🐟 🐬 🐳 🦈 🐊 🐘 🦒 🦓 🐕 🐈 🐉 🌵 🌲 🌳 🌴 🌱 🌿 🍀 🌸 🌹 🌻 🌼 🌞 🌙 ⭐ 🌈 ☁️ ⚡ 🔥 💧"],
 ["\u{1F354}","🍏 🍎 🍐 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥝 🍅 🥑 🥦 🥕 🌽 🌶️ 🥔 🍞 🥐 🧀 🍖 🍗 🥩 🥓 🍔 🍟 🍕 🌭 🥪 🌮 🌯 🍝 🍜 🍲 🍣 🍤 🍙 🍚 🍦 🍩 🍪 🎂 🍰 🧁 🍫 🍬 🍭 🍿 ☕ 🍵 🥤 🍺 🍻 🥂 🍷 🥃 🍸"],
 ["\u26BD","⚽ 🏀 🏈 ⚾ 🎾 🏐 🏉 🎱 🏓 🏸 🥊 🎯 🎮 🕹️ 🎲 🧩 ♟️ 🎰 🎳 🎤 🎧 🎸 🎹 🥁 🎬 🎨 🏆 🥇 🥈 🥉 🏅 🎖️"],
 ["\u{1F697}","🚗 🚕 🚙 🚌 🏎️ 🚓 🚑 🚒 🚚 🚲 🏍️ ✈️ 🚀 🛸 🚁 ⛵ 🚢 🚂 🏠 🏢 🏰 🗼 🗽 ⛰️ 🌋 🏖️ 🌅 🌃 🌍 🌎 🌏 🗺️"],
 ["\u{1F4A1}","💡 🔦 📱 💻 🖥️ ⌨️ 🖱️ 💾 📷 🎥 📺 📻 ⏰ ⌛ 🔋 🔌 💰 💎 🔑 🔒 🔓 🔨 ⚙️ 🧲 💣 🔫 🛡️ ⚔️ 🧪 💊 📌 📎 ✏️ 📝 📚 📦 🎁 🔔"],
 ["\u2764\uFE0F","❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💔 ❣️ 💕 💞 💓 💗 💖 💘 💯 ✅ ❌ ❓ ❗ ‼️ ✨ 💥 💫 💤 🔴 🟠 🟡 🟢 🔵 🟣 ⚫ ⚪ ▶️ ⏸️ ⏹️ 🔁 ➕ ➖ ✔️ ➡️ ⬅️ ⬆️ ⬇️ 🆗 🆒 🆕"]];
function vkEmo(c){
  const a=vkTarget();
  if(a&&a.tagName==="IFRAME")return toast("Emoji cannot be typed into this frame.");
  if(!isEditable(a))return toast("Tap a text field on the page first.");
  insertText(a,c);S.emR=[c,...(S.emR||[]).filter(x=>x!==c)].slice(0,24);save();
}
function vkDraw(){
  vkPopClose();const box=$("vkb");box.innerHTML="";const L=vkLang();
  $("vkem").classList.toggle("pri",!!vkEmoji);$("vklg").classList.toggle("pri",!!vkPick);
  const mk=cls=>{const d=document.createElement("div");d.className="vr"+(cls?" "+cls:"");box.appendChild(d);return d};
  const key=(d,label,v,cls,w)=>{
    const b=document.createElement("button");b.className="vk"+(cls?" "+cls:"");if(label&&label.length>1&&label[0]==="@"&&SVGI[label.slice(1)])b.innerHTML=svgIcon(label.slice(1));else b.textContent=label;b.dataset.v=v;if(w)b.style.flex=w;
    const alts=cls&&/\b(fn|sp|lg)\b/.test(cls)?null:vkAlts(v);       /* letters, digits and punctuation offer extra characters when held */
    let hold=null;
    b.onpointerdown=e=>{
      e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add("down");
      vkPress(v);
      if(v==="\u232B"||v==="\u25C0"||v==="\u25B6"||v==="\u25B2"||v==="\u25BC"){clearTimeout(vkPress.t);clearInterval(vkPress.i);vkPress.t=setTimeout(()=>{vkPress.i=setInterval(()=>vkPress(v),60)},380)}
      else if(alts){hold={pop:null,pick:null};hold.t=setTimeout(()=>{hold.pop=vkPop(b,alts)},380)}
    };
    b.onpointermove=e=>{if(hold&&hold.pop)hold.pick=vkPopPick(hold.pop,e.clientX,e.clientY,b)};
    b.onpointerup=b.onpointercancel=e=>{
      b.classList.remove("down");clearTimeout(vkPress.t);clearInterval(vkPress.i);
      if(hold){clearTimeout(hold.t);const h=hold;hold=null;
        if(h.pop&&h.pick&&e.type==="pointerup"){vkPopClose();vkReplace(h.pick)}   /* slid onto one and let go */
        else if(!(h.pop&&e.type==="pointerup"))vkPopClose();                      /* otherwise the bar stays so you can tap one */
      }
      if(vkRedraw){vkRedraw=false;const keep=$("vkpop");vkDraw();if(keep)$("app").appendChild(keep)}   /* a one-shot Shift redraws the keys; keep the extras bar open */
    };
    b.onclick=e=>e.preventDefault();b.oncontextmenu=e=>e.preventDefault();d.appendChild(b);return b;
  };
  if(vkPick){                                                   /* language list */
    const d=mk("vl");
    VK_LANGS.forEach(l=>{const b=document.createElement("button");b.className="vk lg"+(l.id===L.id?" on":"");b.textContent=l.n;
      b.onpointerdown=e=>{e.preventDefault();S.kbLang=l.id;vkPick=false;vkShift=0;save();vkDraw();vkSize()};b.onclick=e=>e.preventDefault();d.appendChild(b)});
    const x=document.createElement("button");x.className="vk fn lg";x.innerHTML=svgIcon("close");x.setAttribute("aria-label","Close");x.onpointerdown=e=>{e.preventDefault();vkPick=false;vkDraw();vkSize()};x.onclick=e=>e.preventDefault();d.appendChild(x);
    return;
  }
  if(vkEmoji){                                                  /* emoji page */
    const tabs=mk("em-tabs");
    VK_EMO.forEach((c,i)=>key(tabs,c[0],"EMOTAB"+i,"fn"+(i===vkEmCat?" on":"")));
    const g=mk("em-grid"),list=vkEmCat===0?(S.emR||[]):VK_EMO[vkEmCat][1].split(" ");
    if(!list.length)g.innerHTML='<p class="mut" style="margin:auto;font-size:13px">Emoji you use appear here</p>';
    list.forEach(c=>{
      const b=document.createElement("button");b.className="vk em";b.textContent=c;
      b.onpointerdown=e=>{e.preventDefault();b.classList.add("down")};           /* typed when the finger lifts, so scrolling never types */
      b.onpointerup=()=>{b.classList.remove("down");vkEmo(c)};b.onpointercancel=()=>b.classList.remove("down");b.onclick=e=>e.preventDefault();g.appendChild(b);
    });
    const d=mk("last");
    key(d,"ABC","EMOJI","fn",1.5);key(d,"@k-left","\u25C0","fn");key(d,"@k-up","\u25B2","fn");key(d,"@k-dn","\u25BC","fn");key(d,"@k-right","\u25B6","fn");key(d,"space"," ","sp",2.5);key(d,"@k-backspace","\u232B","fn",1.5);key(d,"@k-enter","\u21B5","fn pri",1.5);
    return;
  }
  const rows=vkSym?[VK_NUM,...VK_S,...(L.x?[L.x.split(" ")]:[])]:[VK_NUM,...L.r.map(r=>r.split(" "))];
  rows.forEach((r,i)=>{
    const d=mk();
    if(!vkSym&&i>1&&i<rows.length-1&&r.length<10)d.insertAdjacentHTML("afterbegin",'<i class="vs" style="flex:'+(10-r.length)/2+'"></i>');
    r.forEach(c=>{
      if(c==="\u21E7")return key(d,vkShift===2?"@k-shift-lock":"@k-shift",c,"fn"+(vkShift?" on":"")+(vkShift===2?" lock":""),1.5);
      if(c==="\u232B")return key(d,"@k-backspace",c,"fn",1.5);
      key(d,!vkSym&&vkShift?vkUp(c):c,c);
    });
    if(!vkSym&&i>1&&i<rows.length-1&&r.length<10)d.insertAdjacentHTML("beforeend",'<i class="vs" style="flex:'+(10-r.length)/2+'"></i>');
  });
  const d=mk("last");
  key(d,vkSym?"ABC":"?123","SYM","fn",2);key(d,"@k-left","\u25C0","fn");key(d,"@k-up","\u25B2","fn");key(d,"@k-dn","\u25BC","fn");key(d,"@k-right","\u25B6","fn");key(d,"space"," ","sp",4.5);key(d,".",".");key(d,"@k-enter","\u21B5","fn pri",1.5);
}
/* the floating keyboard button never hides under the open keyboard: it rests just above the text bar, and goes back to its own spot when the keyboard closes */
function kbDodge(){
  const k=$("kb");if(!k||k.classList.contains("gone"))return;
  if(!vkOpen){if(k.dataset.dodged){delete k.dataset.dodged;placeAll()}return}
  const ah=$("app").offsetHeight,top=ah-($("vkb").offsetHeight+6+($("vkw").offsetHeight||40)+6);
  if(k.offsetTop+40>top){k.style.top=Math.max(0,top-44)+"px";k.dataset.dodged=1}
}
const vkSize=()=>{document.documentElement.style.setProperty("--wt-vkh",vkOpen?$("vkb").offsetHeight+"px":"0px");$("vkw").style.bottom=($("vkb").offsetHeight+6)+"px";kbDodge()};
/* ---------- the text bar above the keyboard: shows what is being typed, with the caret ---------- */
let vkBuf="",vkBufEl=null;                                  /* what was typed into a game frame (its text cannot be read) */
function vkPrevTarget(){
  let a=document.activeElement;if(a===host)a=null;
  if(isEditable(a)||(a&&a.tagName==="IFRAME"))return a;
  return lastField&&lastField.isConnected?lastField:null;
}
function vkBufEdit(a,key){
  if(a!==vkBufEl){vkBufEl=a;vkBuf=""}
  if(key==="Backspace")vkBuf=vkBuf.slice(0,-1);else if(key==="Enter")vkBuf+="\n";else if(key.length===1)vkBuf+=key;
}
/* password fields: a small eye button after the text bar shows or hides the typed text (in the bar only, the page's own field is not changed) */
let vkReveal=false,vkEyeEl=null;
function vkEye(a){
  const fr=!!a&&a.tagName==="IFRAME";                    /* a field inside an embedded frame: the frame says if it is a password and if it is shown */
  const pw=fr?!!(vkFi&&vkFi.pw):!!a&&a.tagName==="INPUT"&&a.type==="password";
  if(!fr&&pw&&a!==vkEyeEl)vkReveal=false;                /* another password field: hidden again */
  vkEyeEl=pw&&!fr?a:null;
  const shown=fr?!!(vkFi&&vkFi.rv):vkReveal;
  const w=$("vkw"),b=$("vkeye");w.classList.toggle("pw",pw);
  b.innerHTML=svgIcon(shown?"eye-off":"eye");b.setAttribute("aria-label",shown?"Hide password":"Show password");b.title=b.getAttribute("aria-label");
  return pw;
}
{const b=$("vkeye");b.onpointerdown=e=>{e.preventDefault();e.stopPropagation()};b.onpointerup=e=>{e.preventDefault();e.stopPropagation();const a=vkPrevTarget();if(a&&a.tagName==="IFRAME"){try{chrome.runtime.sendMessage({wt:"pw",on:!(vkFi&&vkFi.rv)})}catch(x){}}else{vkReveal=!vkReveal;vkPrev()}vkSize()};b.onclick=e=>e.preventDefault()}
/* emoji and language buttons beside the text bar */
{const em=$("vkem"),lg=$("vklg");
 em.innerHTML=svgIcon("k-smile");lg.innerHTML=svgIcon("k-globe");$("vkhd").innerHTML=svgIcon("close");
 const wire=(b,fn)=>{b.onpointerdown=e=>{e.preventDefault();e.stopPropagation()};b.onpointerup=e=>{e.preventDefault();e.stopPropagation();fn();vkSize()};b.onclick=e=>e.preventDefault();b.oncontextmenu=e=>e.preventDefault()};
 wire(em,()=>{vkPick=false;vkEmoji=!vkEmoji;vkDraw()});                 /* emoji page on / off */
 wire(lg,()=>{vkEmoji=false;vkPick=!vkPick;vkDraw()});                  /* language list on / off */
 wire($("vkhd"),()=>vkShow(false))}                                      /* close the keyboard */
/* The text bar is a mirror of the field: the same width, font, spacing and line breaks, scaled to fit the bar, so every word and the caret sit on the same line and spot as in the field.
   Plain tags (div, p, li...) and <br> in editable page areas become line breaks the same way the field shows them. */
const VK_MINZ=.3;                              /* smallest zoom (text size) the text bar may use, portrait and landscape */
const VK_MP=["fontFamily","fontSize","fontWeight","fontStyle","fontVariant","fontStretch","letterSpacing","wordSpacing","textTransform","textIndent","tabSize","direction","lineHeight","wordBreak","overflowWrap","hyphens","whiteSpace"];
function vkDesc(a){                              /* how a field looks: what the bar copies */
  const d={};
  try{
    const cs=getComputedStyle(a);VK_MP.forEach(p=>{d[p]=cs[p]});
    d.ml=a.tagName!=="INPUT";                    /* text areas and editable areas have several lines, <input> one */
  }catch(e){}
  return d;
}
function vkApply(m,d){                           /* style the mirror like the field; returns the zoom that was used */
  const box=$("vkt"),avail=Math.max(80,box.clientWidth-28),fp=parseFloat(d.fontSize)||16;
  VK_MP.forEach(p=>{if(d[p])try{m.style[p]=d[p]}catch(e){}});
  let ws=d.ml?(d.whiteSpace||"pre-wrap"):"pre-wrap";   /* every field wraps inside the bar: there is no limit on characters per line */
  if(ws==="normal")ws="pre-line";else if(ws==="nowrap"||ws==="pre")ws="pre-wrap";
  m.style.whiteSpace=ws;m.style.overflowWrap="anywhere";
  const z=Math.max(VK_MINZ,16/fp),W=avail/z;      /* text drawn at the bar's own size; a line only breaks where the bar's full width ends (or at a real new line), never at the field's width */
  m.style.width=W+"px";
  m.style.zoom=z;
  return z;
}
/* A code editor's line numbers (CodeMirror, Ace, Monaco-style gutters...) sit inside the editable area but are not text the person typed: the bar and the caret mapping leave them out. */
const VK_GUT='.CodeMirror-gutters,.CodeMirror-gutter-wrapper,.CodeMirror-gutter-elt,.CodeMirror-linenumber,.cm-gutters,.cm-gutter,.cm-gutterElement,.cm-lineNumbers,.ace_gutter,.ace_gutter-cell,.line-numbers-rows,.line-number,.linenumber,.lineno,.gutter,[class*="line-number"]:not(pre):not(code),[class*="linenumber"]:not(pre):not(code),[class*="LineNumber"]:not(pre):not(code),[class*="gutter"]:not(pre):not(code)';
function vkGut(n){try{if(n.matches(VK_GUT))return true;return n.getAttribute("contenteditable")==="false"&&n.textContent.length<9&&/^\s*\d+\s*$/.test(n.textContent)}catch(e){return false}}
function ceScan(root,an,ao){                     /* text of an editable area with its line breaks, and where the caret is (an/ao) */
  let s="",pos=-1,nl=false;
  const need=()=>{if(nl){if(s&&s[s.length-1]!=="\n")s+="\n";nl=false}};
  const BLK=/^(DIV|P|H[1-6]|LI|UL|OL|BLOCKQUOTE|PRE|TR|TABLE|SECTION|ARTICLE|HEADER|FOOTER|FORM|HR)$/;
  const walk=n=>{
    if(n.nodeType===3){need();if(n===an)pos=s.length+Math.min(ao,n.data.length);s+=n.data;return}
    if(n.nodeType!==1)return;
    const t=n.tagName;if(t==="SCRIPT"||t==="STYLE"||t==="TEMPLATE")return;if(n!==root&&!(an&&n.contains(an))&&vkGut(n))return;
    if(t==="BR"){need();s+="\n";return}
    const b=n!==root&&BLK.test(t);
    if(b){need();if(s&&s[s.length-1]!=="\n")s+="\n"}
    const k=n.childNodes;
    for(let i=0;i<k.length;i++){if(n===an&&i===ao)pos=s.length;walk(k[i])}
    if(n===an&&ao>=k.length)pos=s.length;
    if(b)nl=true;
  };
  walk(root);
  return{s,pos};
}
/* what a field inside an embedded frame reported (frame.js sends it): {f:1,s,pos,ph,d} */
let vkFi=null;
function vkFrameSet(i){vkFi=i&&i.f?i:null;if(vkOpen)vkPrev()}
function vkSeen(box,c,d,z){                      /* scroll the bar so the caret line is in view */
  try{
    const br=box.getBoundingClientRect(),cr=c.getBoundingClientRect(),k=box.offsetHeight?br.height/box.offsetHeight:1;
    if(!k||!br.height)return;
    const fp=parseFloat(d&&d.fontSize)||16,lh=((d&&parseFloat(d.lineHeight))||fp*1.3)*z*k,pad=4*k,px=14*k;
    const top=cr.top-lh*.85,bot=cr.top+lh*.3;      /* the empty caret marker sits on the text baseline */
    if(top<br.top+pad)box.scrollTop-=(br.top+pad-top)/k;else if(bot>br.bottom-pad)box.scrollTop+=(bot-br.bottom+pad)/k;
    if(cr.left<br.left+px)box.scrollLeft-=(br.left+px-cr.left)/k;else if(cr.left>br.right-px)box.scrollLeft+=(cr.left-br.right+px)/k;
  }catch(e){}
}
function vkPrev(){
  const box=$("vkt");if(!vkOpen)return;
  const a=vkPrevTarget();let s="",pos=0,hint="",d=null;
  try{
    if(!a)hint="Tap a text field on the page, then type";
    else if(a.tagName==="IFRAME"){
      if(vkFi){s=vkFi.s||"";pos=Math.max(0,Math.min(vkFi.pos,s.length));d=vkFi.d;if(!s)hint=vkFi.ph||""}      /* the field in the frame told us its text and caret */
      else{if(a!==vkBufEl){vkBufEl=a;vkBuf=""}s=vkBuf;pos=s.length;if(!s)hint="Typing into the game frame"}
    }
    else if(typeof a.value==="string"){
      s=a.value;pos=typeof a.selectionStart==="number"?a.selectionStart:s.length;
      if(a.type==="password"&&!vkReveal)s="\u2022".repeat(s.length);
      if(!s)hint=a.placeholder||"";
      d=vkDesc(a);
    }else{
      const q=getSelection();let an=null,ao=0;
      if(q&&q.rangeCount&&a.contains(q.focusNode)){an=q.focusNode;ao=q.focusOffset}
      const r=ceScan(a,an,ao);s=r.s;pos=r.pos<0?s.length:Math.min(r.pos,s.length);
      d=vkDesc(a);
    }
  }catch(e){pos=s.length}
  vkEye(a);
  const st=box.scrollTop,sl=box.scrollLeft;
  box.textContent="";
  const m=document.createElement("div");m.className="vkm";box.appendChild(m);
  const z=d?vkApply(m,d):1;
  const c=document.createElement("i");c.className="cur";
  if(hint&&!s){
    if(a)m.appendChild(c);
    m.appendChild(Object.assign(document.createElement("span"),{className:"vkh",textContent:hint}));
  }else{
    m.appendChild(document.createTextNode(s.slice(0,pos)));
    m.appendChild(c);
    m.appendChild(document.createTextNode(s.slice(pos)));
  }
  box.scrollTop=st;box.scrollLeft=sl;
  vkSeen(box,c,d,z);
}
{let raf=0;const kick=()=>{if(!vkOpen||raf)return;raf=requestAnimationFrame(()=>{raf=0;vkPrev()})};
 ["input","keyup","selectionchange","focusin","focusout","pointerup","mouseup","touchend","compositionend"].forEach(t=>document.addEventListener(t,kick,true));   /* typing, moving the caret by tapping the field... */
 addEventListener("resize",kick)}
{let lw=0;if(typeof ResizeObserver==="function")new ResizeObserver(()=>{const w=$("vkt").clientWidth;if(w!==lw){lw=w;vkPrev()}}).observe($("vkt"))}   /* the bar got wider or narrower: line breaks are worked out again */
if(typeof ResizeObserver==="function")new ResizeObserver(()=>vkSize()).observe($("vkb"));   /* the keyboard changes height (symbols, emoji): keep the text bar right above it */
function vkInit(init){return Object.assign({bubbles:true,cancelable:true},init)}
function vkTarget(){
  let a=document.activeElement;if(a===host)a=null;
  if(isEditable(a)||(a&&a.tagName==="IFRAME"))return a;
  if(!a||a===document.body||a===document.documentElement){if(lastField&&lastField.isConnected){
    let rg=null;try{const q=getSelection();if(q&&q.rangeCount&&lastField.contains(q.anchorNode))rg=q.getRangeAt(0).cloneRange()}catch(e){}
    if(nativeOff()){noNative(lastField);roOn(lastField)}   /* locked first, or this focus() (inside a key press) would open the phone keyboard */
    lastField.focus();                                   /* focusing an editable area can throw its caret back to the start: put it back */
    if(rg){try{const q=getSelection();q.removeAllRanges();q.addRange(rg)}catch(e){}}
    return lastField}}
  return a||document.body;
}
function insertText(a,t){
  writable(a,()=>{
    try{if(document.execCommand("insertText",false,t))return}catch(e){}
    if(typeof a.value==="string"){try{const s=a.selectionStart,e=a.selectionEnd;if(a.maxLength>0&&a.value.length-(e-s)+t.length>a.maxLength)return;a.setRangeText(t,s,e,"end")}catch(x){a.value+=t}a.dispatchEvent(new InputEvent("input",{bubbles:true,data:t,inputType:"insertText"}))}
  });
}
function delBack(a){writable(a,()=>delBack0(a))}
function delBack0(a){
  try{if(document.execCommand("delete"))return}catch(e){}
  if(typeof a.value==="string"){try{let s=a.selectionStart,e=a.selectionEnd;if(s===e)s=Math.max(0,s-1);a.setRangeText("",s,e,"end")}catch(x){a.value=a.value.slice(0,-1)}a.dispatchEvent(new InputEvent("input",{bubbles:true,inputType:"deleteContentBackward"}))}
}
/* Cursor Left / Right keys. Text fields: a selection collapses to its edge first (like a real keyboard), otherwise the caret moves one character.
   Fields that cannot report a caret (email, number...) are switched to type=text for a moment so the caret can be placed. Editable page areas move with Selection.modify. */
const CARET=new WeakMap();                       /* last caret position we set in fields that cannot report one */
function moveCaret(a,d){
  if(!a)return;
  if(typeof a.value==="string"){
    let s=null,e=null;try{s=a.selectionStart;e=a.selectionEnd}catch(x){}
    const len=a.value.length;let p;
    if(typeof s==="number"&&typeof e==="number"){
      p=s!==e?(d<0?s:e):Math.max(0,Math.min(len,s+d));
      try{a.setSelectionRange(p,p);return}catch(x){}
    }
    p=Math.max(0,Math.min(len,(CARET.has(a)?CARET.get(a):len)+d));CARET.set(a,p);   /* email / number / ... */
    const t=a.type;
    try{a.type="text";a.setSelectionRange(p,p)}catch(x){}finally{try{a.type=t}catch(x){}}
    return;
  }
  const sel=getSelection();if(!sel)return;
  if(!sel.rangeCount||!a.contains(sel.anchorNode)){                    /* caret is not inside this area yet: start at its end */
    const r=document.createRange();r.selectNodeContents(a);r.collapse(false);sel.removeAllRanges();sel.addRange(r);
  }
  if(!sel.isCollapsed){try{d<0?sel.collapseToStart():sel.collapseToEnd()}catch(x){}return}
  if(sel.modify)sel.modify("move",d<0?"backward":"forward","character");
}
/* Cursor Up / Down keys. One-line fields: Up goes to the start, Down to the end (like a desktop browser). Text areas: the caret moves one visible line, keeping its column
   (measured on an invisible copy of the text with the same width and font, so wrapped lines count as lines). Editable page areas move with Selection.modify. */
function moveLine(a,d){
  if(!a)return;
  if(typeof a.value==="string"){
    const len=a.value.length;let s=null,e=null;try{s=a.selectionStart;e=a.selectionEnd}catch(x){}
    const setP=p=>{
      try{if(typeof s==="number"){a.setSelectionRange(p,p);return}}catch(x){}
      CARET.set(a,p);const t=a.type;try{a.type="text";a.setSelectionRange(p,p)}catch(x){}finally{try{a.type=t}catch(x){}}   /* email / number / ... */
    };
    if(a.tagName!=="TEXTAREA"){setP(d<0?0:len);return}
    const cur=typeof s==="number"?(s!==e?(d<0?s:e):s):len;
    const cs=getComputedStyle(a),m=document.createElement("div"),ms=m.style;
    ms.cssText="all:initial";
    ["paddingTop","paddingRight","paddingBottom","paddingLeft","fontFamily","fontSize","fontWeight","fontStyle","fontVariant","fontStretch","letterSpacing","wordSpacing","textTransform","textIndent","tabSize","direction","lineHeight","wordBreak","overflowWrap","textAlign","whiteSpace"].forEach(k=>{try{ms[k]=cs[k]}catch(x){}});
    ms.position="fixed";ms.left="-99999px";ms.top="0";ms.visibility="hidden";ms.boxSizing="content-box";ms.display="block";
    ms.width=Math.max(1,a.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight))+"px";
    const tn=document.createTextNode(a.value+"\u200b");m.appendChild(tn);(document.body||document.documentElement).appendChild(m);
    try{
      const rg=document.createRange(),memo={};
      const R=p=>{if(memo[p])return memo[p];rg.setStart(tn,p);rg.setEnd(tn,p+1);const r=rg.getClientRects()[0]||rg.getBoundingClientRect();return memo[p]=r};
      const Y=p=>{const r=R(p);return r.height||r.width?r.top:(p>0?Y(p-1):0)},X=p=>R(p).left;
      const lh=(R(0).height||parseFloat(cs.lineHeight)||16),eps=Math.max(3,lh*.5);
      const lower=t=>{let lo=0,hi=len+1;while(lo<hi){const mid=(lo+hi)>>1;if(Y(mid)>=t-eps)hi=mid;else lo=mid+1}return lo};   /* first position on the line at height t */
      const upper=t=>{let lo=0,hi=len+1;while(lo<hi){const mid=(lo+hi)>>1;if(Y(mid)>t+eps)hi=mid;else lo=mid+1}return lo};   /* first position below that line */
      const y0=Y(cur),x0=X(cur);let from,to;
      if(d<0){const f=lower(y0);if(f===0){setP(0);return}from=lower(Y(f-1));to=f-1}
      else{const n=upper(y0);if(n>len){setP(len);return}from=n;to=Math.min(len,upper(Y(n))-1)}
      let best=from,bd=1e9;for(let p=from;p<=to;p++){const dx=Math.abs(X(p)-x0);if(dx<bd){bd=dx;best=p}}
      setP(best);
      const cy=Y(best)-m.getBoundingClientRect().top;                 /* keep the caret line in view */
      if(cy<a.scrollTop)a.scrollTop=cy;else if(cy+lh>a.scrollTop+a.clientHeight)a.scrollTop=cy+lh-a.clientHeight+parseFloat(cs.paddingBottom||0);
    }finally{m.remove()}
    return;
  }
  const sel=getSelection();if(!sel)return;
  if(!sel.rangeCount||!a.contains(sel.anchorNode)){const r=document.createRange();r.selectNodeContents(a);r.collapse(false);sel.removeAllRanges();sel.addRange(r)}
  if(!sel.isCollapsed){try{d<0?sel.collapseToStart():sel.collapseToEnd()}catch(x){}}
  if(sel.modify)sel.modify("move",d<0?"backward":"forward","line");
}
document.addEventListener("input",e=>{const t=realTarget(e);if(t)CARET.delete(t)},true);   /* typing or deleting moves the caret: forget the remembered spot */

/* the text bar only shows the text: touching it never takes focus away from the field */
$("vkt").addEventListener("pointerdown",e=>e.preventDefault());
/* Some editors and frameworks change their text a moment after the key was typed, without any event the bar can hear. The bar looks again shortly after every key,
   and while the keyboard is open it quietly checks the field a few times a second and redraws only when the text or the caret changed. */
let vkLT=0;
function vkLater(){clearTimeout(vkLT);vkLT=setTimeout(()=>{if(vkOpen)vkPrev()},90)}
{let sig="";setInterval(()=>{
  if(!vkOpen)return;const a=vkPrevTarget();if(!a||a.tagName==="IFRAME")return;
  let n;try{
    if(typeof a.value==="string")n=a.value+"|"+a.selectionStart+"|"+a.selectionEnd;
    else{if(a.textContent.length>200000)return;const q=getSelection();n=a.textContent+"|"+(q&&q.focusNode&&a.contains(q.focusNode)?q.focusOffset:-1)}
  }catch(e){return}
  if(n!==sig){sig=n;vkPrev()}
},250)}
/* US keyboard: character -> [code, keyCode] for symbols, so typed symbols are not mistaken for arrow / navigation keys by pages and code editors */
const VK_SYM={};
[["Backquote",192,"`~"],["Minus",189,"-_"],["Equal",187,"=+"],["BracketLeft",219,"[{"],["BracketRight",221,"]}"],["Backslash",220,"\\|"],["Semicolon",186,";:"],["Quote",222,"'\""],["Comma",188,",<"],["Period",190,".>"],["Slash",191,"/?"],
 ["Digit1",49,"!"],["Digit2",50,"@"],["Digit3",51,"#"],["Digit4",52,"$"],["Digit5",53,"%"],["Digit6",54,"^"],["Digit7",55,"&"],["Digit8",56,"*"],["Digit9",57,"("],["Digit0",48,")"]
].forEach(r=>{for(const c of r[2])VK_SYM[c]=[r[0],r[1]]});
function vkPress(v){
  if(v==="EMOJI"){vkEmoji=!vkEmoji;vkPick=false;vkDraw();vkSize();return}
  if(v.indexOf("EMOTAB")===0){vkEmCat=+v.slice(6);vkDraw();return}
  if(v==="SYM"){vkSym=!vkSym;vkDraw();return}
  if(v==="HIDE")return vkShow(false);
  if(v==="\u21E7"){vkShift=vkShift===0?1:vkShift===1?2:0;vkDraw();return}
  const a=vkTarget();
  if(!isEditable(a)&&!(a&&a.tagName==="IFRAME")&&!document.activeElement)return toast("Tap a text field on the page first.");
  const name={"\u232B":"Backspace","\u21B5":"Enter","\u25C0":"ArrowLeft","\u25B6":"ArrowRight","\u25B2":"ArrowUp","\u25BC":"ArrowDown"," ":" "}[v];
  const ch=name?null:(!vkSym&&vkShift?vkUp(v):v);
  const key=name||ch;
  const sk=name?null:VK_SYM[ch];                                   /* punctuation / symbols: the real key (code + keyCode) of a US keyboard, never the character's ASCII number, which is the keyCode of an arrow, PageUp, Home... (' = 39 = ArrowRight, ! = 33 = PageUp) and made code editors swallow the key */
  const code=name&&name!==" "?name:name===" "?"Space":/^[a-z]$/i.test(ch)?"Key"+ch.toUpperCase():/^\d$/.test(ch)?"Digit"+ch:sk?sk[0]:"";
  const kc={Backspace:8,Enter:13,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40," ":32}[key]||(sk?sk[1]:/^[a-z0-9]$/i.test(ch)?ch.toUpperCase().charCodeAt(0):0);
  const init={key,code,keyCode:kc,which:kc};
  if(a&&a.tagName==="IFRAME"){fwd({kind:"key",type:"keydown",init:vkInit(init),vk:1,ch:ch||undefined});fwd({kind:"key",type:"keyup",init:vkInit(init)});vkBufEdit(a,key);vkPrev();return}
  const ok=a.dispatchEvent(new KeyboardEvent("keydown",vkInit(init)));
  if(ok&&isEditable(a)){
    if(key==="Backspace")delBack(a);
    else if(key==="ArrowLeft")moveCaret(a,-1);
    else if(key==="ArrowRight")moveCaret(a,1);
    else if(key==="ArrowUp")moveLine(a,-1);
    else if(key==="ArrowDown")moveLine(a,1);
    else if(key==="Enter"){
      if(a.tagName==="TEXTAREA"||(a.isContentEditable&&a.tagName!=="INPUT")){if(!writable(a,()=>document.execCommand("insertLineBreak")))insertText(a,"\n")}
      else if(a.form){a.form.requestSubmit?a.form.requestSubmit():a.form.submit()}
    }else{
      a.dispatchEvent(new KeyboardEvent("keypress",vkInit(Object.assign({charCode:key.charCodeAt(0)},init))));
      insertText(a,key);
    }
  }
  a.dispatchEvent(new KeyboardEvent("keyup",vkInit(init)));
  vkPrev();vkLater();
  if(ch&&vkShift===1&&!vkSym){vkShift=0;vkRedraw=true}
}
function vkShow(on){
  vkOpen=on;vkPick=false;vkEmoji=false;$("vkb").classList.toggle("open",on);$("vkw").classList.toggle("open",on);$("kbf").classList.toggle("pri",on);
  if(on){vkDraw();vkSize();vkPrev();noNative(document.activeElement);if(lastField&&lastField.isConnected)noNative(lastField);
    const t=vkPrevTarget();if(t&&t.tagName==="IFRAME"){try{chrome.runtime.sendMessage({wt:"fq"})}catch(e){}}   /* a field in a frame: ask it now, so the eye shows at once if it is a password */
    setTimeout(()=>{if(vkOpen)vkPrev()},150)}                                                                /* and look once more when the focus has settled */
  else nativeSync();                          /* closing WebTroller's keyboard does not bring the phone keyboard back while the toggle is on */
  document.documentElement.style.setProperty("--wt-vkh",on?$("vkb").offsetHeight+"px":"0px");
  if(!on){$("vkw").style.bottom="";kbDodge()}
}
function kbUI(){
  const on=S.kbOn!==false;$("kb").classList.toggle("gone",!on||mode==="edit");$("kbtn").classList.toggle("pri",on);
  placeFollowers();separate();
  if(!on&&vkOpen)vkShow(false);
  let act=document.activeElement;while(act&&act!==host&&act.shadowRoot&&act.shadowRoot.activeElement)act=act.shadowRoot.activeElement;
  const was=!on&&act&&act!==document.body&&isEditable(act)?act:(!on&&lastField&&lastField.isConnected&&lastField.getRootNode&&lastField.getRootNode().activeElement===lastField?lastField:null);
  nativeSync();                                /* button on: phone keyboard off; button off: phone keyboard back */
  if(was){try{was.blur();was.focus()}catch(e){}}   /* the field you were typing in gets the phone keyboard again right away */
}
floater($("kbf"),$("kb"),"kb",()=>vkShow(!vkOpen),()=>{});
$("kbf").addEventListener("pointerdown",()=>{});             /* floater() already stops it from taking focus */
$("kbtn").onclick=()=>{S.kbOn=S.kbOn===false;if(S.kbOn)attach("kb");kbUI();save()};   /* shown again: back beside the menu button */
$("vkb").addEventListener("pointerdown",e=>e.preventDefault());

/* Ad Blocker: on/off is saved with the settings (S.adb); it also switches on AdGuard DNS filtering (background.js and frame.js). The background script turns the network block list on or off for the whole browser,
   and frame.js hides the ad boxes that are left on the page, in every frame. It affects pages loaded afterwards. */
const adbUI=()=>$("adbOn").classList.toggle("pri",!!S.adb);
$("adbOn").onclick=()=>{S.adb=!S.adb;adbUI();saveNow();toast(S.adb?"Ad Blocker on":"Ad Blocker off")};
adbUI();
