/* WebTroller (c) 2026 Vertzz - developed by Vertzz - https://t.me/vertzz_official
   Core: helpers, saved settings and shared state. Runs inside the overlay's shadow root. */
const $=id=>root.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
/* Title Case: every word starts with a capital letter */
const tc=s=>String(s).replace(/(^|[\s(\/+\u2014-])([a-z])/g,(m,a,c)=>a+c.toUpperCase());
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/* Desktop site mode: the browser makes the page ~980px wide and shrinks it to fit the screen, which would shrink the controller too.
   wtScale() is that shrink factor (1 normally). The overlay is sized to the real screen and scaled back up, so buttons keep
   the same size, position and spacing. Everything inside the overlay works in "screen" px; the page works in layout px. */
const wtScale=()=>{const v=window.visualViewport,s=v&&v.scale;return s&&Math.abs(s-1)>.02&&s>0?s:1};
/* The on-screen keyboard shrinks the page height. Buttons are placed as a percentage of the height, so they used to get squashed together while the keyboard was open.
   viewSize() therefore keeps the last full height (same width, height dropped by a keyboard-sized amount) and the button layer stays that tall; the keyboard just covers the bottom. */
let FULLW=0,FULLH=0;
const realSize=()=>{const s=wtScale(),d=document.documentElement;return[(d.clientWidth||innerWidth)*s,(d.clientHeight||innerHeight)*s]};
const viewSize=()=>{const[w,h]=realSize();
  if(!FULLW||Math.abs(w-FULLW)>2){FULLW=w;FULLH=h;return[w,h]}      /* first call or a real resize / rotation */
  if(h>=FULLH*.78){FULLH=h;return[w,h]}                              /* normal change (address bar showing or hiding) */
  return[w,FULLH]};                                                  /* keyboard: keep the full height */
/* a rectangle in overlay px (getBoundingClientRect gives page layout px) */
const BR=el=>{const r=el.getBoundingClientRect(),s=wtScale();return{left:r.left*s,top:r.top*s,right:r.right*s,bottom:r.bottom*s,width:r.width*s,height:r.height*s}};
function applyScale(){
  const s=wtScale(),[W,H]=viewSize(),h=host.style,sh=$("shell");
  if(s===1){h.right="0";h.bottom="0";h.width="";h.height="";h.transform="";h.transformOrigin="";h.removeProperty("--wvh");h.removeProperty("--wvw")}
  else{h.right="auto";h.bottom="auto";h.width=W+"px";h.height=H+"px";h.transformOrigin="0 0";h.transform="scale("+(1/s)+")";h.setProperty("--wvh",(H/100)+"px");h.setProperty("--wvw",(W/100)+"px")}
  const ovl=$("ov");if(ovl){const rh=realSize()[1];if(H>rh+2){ovl.style.bottom="auto";ovl.style.height=H+"px"}else{ovl.style.bottom="";ovl.style.height=""}}   /* keyboard open: the button layer keeps its full height */
  if(sh){if(W<=700)sh.setAttribute("data-narrow","");else sh.removeAttribute("data-narrow")}
}
applyScale();
const KF={ov:1.45,rc:.6};                       /* height / width for each button shape */
const btnH=b=>b.type==="analog"?b.w:Math.round(b.w*(KF[b.shape]||1));

/* saved settings: buttons of the active layout, saved layouts, widget positions */
let S={btns:[],snap:1,op:100,caps:1,slots:{}};
try{const s=JSON.parse(saved||"null");if(s)S=Object.assign(S,s)}catch(e){}
/* layers: one layout can hold several sets of buttons ("layers", for example walking, driving, swimming). S.btns is always the buttons of the layer on screen (S.layers[S.li]);
   the other layers wait in S.layers. syncLayer() copies S.btns back into its layer before anything is saved or copied. */
const LMAX=5;            /* how many modes (layers) you can add to one layout */
const LLOAD=16;          /* how many a saved or imported layout may already hold (layouts made before the limit was 5 keep all of theirs) */
const normLayer=(l,i)=>{const o={id:l&&l.id||Date.now()+i,n:String(l&&l.n||"").replace(/^(Layer|Mode) \d+$/,"").slice(0,24),i:l&&typeof l.i==="string"?l.i:"",btns:l&&Array.isArray(l.btns)?l.btns:[]};if(l&&l.hide)o.hide=1;return o};
const syncLayer=()=>{if(Array.isArray(S.layers)&&S.layers[S.li])S.layers[S.li].btns=S.btns};
(function(){
  if(Array.isArray(S.layers)&&S.layers.length){S.layers=S.layers.slice(0,LLOAD).map(normLayer);S.li=clamp(S.li|0,0,S.layers.length-1);S.btns=S.layers[S.li].btns}
  else{S.layers=[normLayer({btns:Array.isArray(S.btns)?S.btns:[]},0)];S.li=0;S.btns=S.layers[0].btns}
})();
delete S.hud;delete S.kb;delete S.hs;delete S.ds;delete S.ls;   /* the menu button always starts at the top centre, with the keyboard, Hide/Show, Lock and Modes buttons beside it; dragging them only lasts until the next start */
let LINE=(()=>{const d=["kb","hs","ds","ls"],o=Array.isArray(S.ord)?S.ord.filter((k,i,a)=>d.includes(k)&&a.indexOf(k)===i):[];return o.concat(d.filter(k=>!o.includes(k)))})();   /* order of the buttons beside the menu button: the one attached first is next to it; remembered between restarts */
const attach=k=>{delete S[k];LINE=LINE.filter(x=>x!==k);LINE.push(k);S.ord=LINE.slice();save()};
/* saving writes the whole settings text, so bursts (sliders, drags) are merged into one write; saveNow() writes at once */
const saveNow=()=>{clearTimeout(save.t);save.t=0;syncLayer();try{chrome.storage.local.set({wt:JSON.stringify(S)})}catch(e){}};
const save=()=>{clearTimeout(save.t);save.t=setTimeout(saveNow,300)};
addEventListener("pagehide",()=>{if(save.t)saveNow()});
document.addEventListener("visibilitychange",()=>{if(document.hidden&&save.t)saveNow()});

let mode="play",capturing=false,HIDDEN=false,multi=false,sel=null,EDIT0=null,MODE0=null,EDIT_START=null;
let SWITCH_TO=null;                             /* unsaved changes warning > Save on a layout with no name: the Save Layout panel is open, and this action (open a mode, add a mode) runs once the layout is saved */
let SAVED_GONE=false;                           /* the layout being edited was saved, then deleted from the saved list: it is no longer saved anywhere, so Done must ask to save it again */
let SAVE_FIRST=false;                           /* Done > Save on a layout that has no saved name: the Save Layout panel is open, and the editor closes as soon as the layout is saved */
const SELS=new Set();                           /* every selected button; "sel" is the one shown in the panel */
function selectOnly(b){SELS.clear();sel=b||null;if(b)SELS.add(b)}

const toast=m=>{const t=$("toast");t.textContent=m;t.classList.remove("show");void t.offsetWidth;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),4000)};
const MOUSE=[["left","Left Click"],["right","Right Click"],["middle","Middle Click"],["wheelup","Scroll Up"],["wheeldown","Scroll Down"],["wheelleft","Scroll Left"],["wheelright","Scroll Right"]];
const MLAB=Object.fromEntries(MOUSE);
const MODN={ctrl:"Ctrl",alt:"Alt",shift:"Shift",meta:"Win"};
const comboKey=k=>k===" "?"Space":k==="Delete"?"Del":k==="Escape"?"Esc":k.length===1?k.toUpperCase():k;
/* what a button sends, as text: "Z", "Space", "Right click", or a combination such as "Ctrl+Alt+Del" */
const kname=b=>b.mouse?MLAB[b.mouse]:(b.mods&&b.mods.length?[...b.mods.map(m=>MODN[m]),...(b.key?[comboKey(b.key)]:[])].join("+"):b.key===" "?"Space":/^Arrow/.test(b.key||"")?b.key.slice(5):(b.key||"None"));

/* ---------- lock: a button held for 0.5 s stays pressed; an analog stick held up, down, left or right (as chosen in Properties) for 0.5 s stays that way ---------- */
const LOCK_MS=500;
const LOCK=new Set();                      /* ids of buttons that are locked down */
const ALOCK=new Map();                     /* id of a locked analog stick -> function that lets it go */
const LKI='<svg class="lk" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1zm2 0h6V8a3 3 0 0 0-6 0v2z"/></svg>';
const buzz=()=>{try{navigator.vibrate&&navigator.vibrate(40)}catch(e){}};
