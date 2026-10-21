/* ---------- choosing a key or mouse action for a button ---------- */
const KEYS=[["Letters","ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((c,i)=>[c,c.toLowerCase(),"Key"+c,65+i])],
 ["Numbers","0123456789".split("").map(n=>[n,n,"Digit"+n,48+ +n])],
 ["Arrows & Special",[["↑","ArrowUp","ArrowUp",38],["↓","ArrowDown","ArrowDown",40],["←","ArrowLeft","ArrowLeft",37],["→","ArrowRight","ArrowRight",39],["Space"," ","Space",32],["Enter","Enter","Enter",13],["Esc","Escape","Escape",27],["Tab","Tab","Tab",9],["Backspace","Backspace","Backspace",8],["Shift","Shift","ShiftLeft",16],["Ctrl","Control","ControlLeft",17],["Alt","Alt","AltLeft",18],["Del","Delete","Delete",46],["Ins","Insert","Insert",45],["Home","Home","Home",36],["End","End","End",35],["PgUp","PageUp","PageUp",33],["PgDn","PageDown","PageDown",34]]],
 ["Function",Array.from({length:12},(_,i)=>["F"+(i+1),"F"+(i+1),"F"+(i+1),112+i])]];
let ptab="k",pickMods=[];
function openPicker(){ptab=sel&&sel.mouse?"m":"k";pickMods=(sel&&sel.mods||[]).slice();$("picker").classList.add("open");drawPicker()}
function closePicker(){capturing=false;$("picker").classList.remove("open")}
function drawPicker(){
  root.querySelectorAll("#picker .tab").forEach(t=>t.classList.toggle("pri",t.dataset.t===ptab));
  const box=$("pkl");box.innerHTML="";
  const chip=(t,on,fn)=>{const b=document.createElement("button");b.textContent=t;if(on)b.className="pri";b.onclick=fn;return b};
  const grid=()=>{const g=document.createElement("div");g.className="chips";box.appendChild(g);return g};
  if(ptab==="m"){const g=grid();MOUSE.forEach(([m,l])=>g.appendChild(chip(l,sel.mouse===m,()=>setMouse(m))));
    const p=document.createElement("p");p.style.cssText="margin:0;color:var(--mut);font-size:12px";p.textContent="Clicks and scrolls happen at the center of the screen, where the analog stick aims from.";box.appendChild(p);return}
  /* a key together with Ctrl / Alt / Shift / Win becomes one button, for example Ctrl + K or Ctrl + Alt + Del */
  const mh=document.createElement("div");mh.className="grp";mh.textContent="Hold With The Key (Combination)";box.appendChild(mh);
  const mg=grid();
  [["ctrl","Ctrl"],["alt","Alt"],["shift","Shift"],["meta","Win / Cmd"]].forEach(([m,l])=>mg.appendChild(chip(l,pickMods.includes(m),()=>{pickMods=pickMods.includes(m)?pickMods.filter(x=>x!==m):[...pickMods,m];drawPicker()})));
  if(pickMods.length)mg.appendChild(chip("✔ Modifiers Only",false,()=>setKey({key:"",code:"",kc:0,mods:pickMods})));
  grid().appendChild(chip("⌨ Press A Key…",false,()=>{capturing=true;capMods=null;box.innerHTML='<p style="margin:0">Press a key, or a combination such as Ctrl + K, on your keyboard now…</p>'}));
  KEYS.forEach(([n,ks])=>{const h=document.createElement("div");h.className="grp";h.textContent=n;box.appendChild(h);const g=grid();
    ks.forEach(([l,k,c,kc])=>g.appendChild(chip(l,!sel.mouse&&sel.key===k,()=>setKey({key:k,code:c,kc,mods:pickMods}))))});
}
function setKey(o){if(!sel)return;const pv=snap();sel.key=o.key;sel.code=o.code;sel.kc=o.kc;delete sel.mouse;if(o.mods&&o.mods.length)sel.mods=[...o.mods];else delete sel.mods;commit(pv);closePicker();fill();render();save()}
function setMouse(m){const pv=snap();sel.mouse=m;sel.key="";sel.code="";sel.kc=0;delete sel.mods;commit(pv);closePicker();fill();render();save()}
root.querySelectorAll("#picker .tab").forEach(t=>t.onclick=()=>{ptab=t.dataset.t;capturing=false;drawPicker()});
$("pkx").onclick=closePicker;$("pkn").onclick=()=>setKey({key:"",code:"",kc:0});


/* icon picker */
const ICONS=SVGCATS.map(c=>[c,Object.keys(SVGI).filter(k=>SVGI[k][0]===c)]);   /* built-in SVG icons, grouped */
const icochip=(n,on,fn)=>{const b=document.createElement('button');b.className='ichip'+(on?' pri':'');b.title=SVGI[n][1];b.setAttribute('aria-label',SVGI[n][1]);b.innerHTML=svgIcon(n)+'<small>'+esc(SVGI[n][1])+'</small>';b.onclick=fn;return b};
const mkchip=(t,on,fn)=>{const b=document.createElement('button');b.textContent=t;if(on)b.className='pri';b.onclick=fn;return b};
let ipLayer=-1;                    /* the icon window is choosing the icon of a layer (its number) instead of a button's icon */
function openI(){$('ipicker').classList.add('open');drawI()}
function closeI(){$('ipicker').classList.remove('open');ipLayer=-1}
function setIcon(g){
  if(ipLayer>=0){const l=S.layers[ipLayer],pv=snap();if(l)l.i=g;closeI();   /* an icon is not an edit of the buttons: Undo and Redo stay */swUI();if(lyrOpen())drawLayers();save();return}
  const pv=snap();sel.icon=g;sel.img='';commit(pv);closeI();render();save();fill()}
function drawI(){
  const box=$('ibox');box.innerHTML='';
  const lay=ipLayer>=0,cu=lay?{icon:(S.layers[ipLayer]||{}).i,img:''}:sel;
  const top=document.createElement('div');top.className='chips';top.appendChild(mkchip(lay?'No Icon (Use The Number)':'No Icon (Use Label)',!cu.icon&&!cu.img,()=>setIcon('')));box.appendChild(top);
  ICONS.forEach(([n,gs])=>{const h=document.createElement('div');h.className='grp';h.textContent=n;box.appendChild(h);const g=document.createElement('div');g.className='chips icons';gs.forEach(x=>g.appendChild(icochip(x,svgName(cu.icon)===x&&!cu.img,()=>setIcon('@'+x))));box.appendChild(g)});
}
$('ipx').onclick=closeI;


/* ---------- saved layouts: save inside Edit layout, load from the menu ---------- */
const curName=()=>S.curBy&&S.curBy[S.lo||"p"]||null;      /* the saved layout the active layout came from */
function setCur(n){S.curBy=S.curBy||{};if(n)S.curBy[S.lo||"p"]=n;else delete S.curBy[S.lo||"p"]}
const slots=()=>{S.slotsBy=S.slotsBy||{p:{},l:{}};const k=S.lo||layoutKey();return S.slotsBy[k]||(S.slotsBy[k]={})};   /* the saved layouts of this orientation */
const oriName=()=>(S.lo||layoutKey())==="l"?"Landscape":"Portrait";
/* the title and the list always follow the orientation you are in (called when the panel opens and again when the device is rotated) */
function layUpdate(){
  const ed=mode==="edit";
  $("ltitle").textContent=ed?"Save Layout":"Load Layout";
  const n=Object.keys(slots()).length;
  $("lsub").textContent=oriName()+" \u00B7 "+n+" saved";
  $("lico").innerHTML=svgIcon(ed?"u-save":"u-folder");
  drawLay();
}
function openLay(){SWITCH_TO=null;
  const ed=mode==="edit";
  $("lsrow").style.display=ed?"flex":"none";
  const web=/^https?:/.test(location.href);
  $("lurow").style.display=ed&&web?"flex":"none";S.saveUrl=false;$("lusave").checked=false;   /* "Also save this page's address" is off every time the panel opens */$("lurl").textContent=web?shortUrl(location.href):"";
    $("lbdl").style.display=ed?"":"none";$("lbrs").style.display=ed?"none":"";   /* Save Layout: only Download Backup; Load Layout: only Restore Backup */
  $("lbtx").textContent=ed?"Saves every portrait and landscape layout into one file. Keep it somewhere safe: if the extension is ever removed, restore it from Load Layout and nothing is lost.":"Restores the layouts from a backup file you downloaded. Layouts you already have are never overwritten.";
  $("laym").classList.add("open");layUpdate();
  /* pick up layouts another tab may have saved meanwhile, then redraw */
  try{chrome.storage.local.get("wt",r=>{try{const s=JSON.parse((r&&r.wt)||"null");if(s&&s.slotsBy){S.slotsBy=s.slotsBy;if($("laym").classList.contains("open"))drawLay()}}catch(e){}})}catch(e){}
}
const shortUrl=u=>u.length>70?u.slice(0,67)+"\u2026":u;
$("lusave").onchange=e=>{S.saveUrl=e.target.checked;save()};
/* the name box always holds the next free automatic name (Layout 1, Layout 2, ...); a name you typed yourself is left alone */
let AUTO_NAME="";
const nextName=()=>{let i=1;while(slots()["Layout "+i])i++;return "Layout "+i};   /* start at Layout 1 and take the first number not used yet */
function fillName(){const el=$("lname");if(el.value===""||el.value===AUTO_NAME){AUTO_NAME=nextName();el.value=AUTO_NAME}}
function drawLay(){
  if(mode==="edit")fillName();
  const box=$("lays");box.innerHTML="";const names=Object.keys(slots());
  if(!names.length){box.innerHTML='<div class="lempty">'+svgIcon("u-folder")+'<b>No saved '+oriName().toLowerCase()+' layouts yet</b><p>'+(mode==="edit"?"Type a name above and press Save.":"Save one from Edit layout first.")+"</p></div>";return}
  names.forEach(n=>{
    const r=document.createElement("div");r.className="lcard";const u=slots()[n].url,cur=curName()===n,mc=Array.isArray(slots()[n].layers)&&slots()[n].layers.length?slots()[n].layers.length:1;
    r.innerHTML=`<div class="lmain"><span class="lbadge">${svgIcon("u-save")}</span><div class="linfo"><b>${esc(n)}</b>${cur?'<em class="lnow">Current</em>':""}<small><span>${mc} mode${mc===1?"":"s"}</span></small>${u?`<small>${svgIcon('u-link')}<span>${esc(shortUrl(u))}</span></small>`:""}</div></div><div class="lact"></div>`;
    const load=mkchip("Load",true,()=>{applyLayout(slots()[n],n);$("laym").classList.remove("open")});
    const del=mkchip("Delete",false,()=>askConfirm("Delete layout?","\u201c"+n+"\u201d will be removed from your saved "+oriName().toLowerCase()+" layouts.","Delete",()=>{const was=curName()===n,ks=Object.keys(slots()),ix=ks.indexOf(n);if(was)setCur(null);delete slots()[n];save();toast("Deleted \u201c"+n+"\u201d");if(was)loadAfterDelete(ks,ix);drawLay()}));del.classList.add("dng");
    /* a layout saved with a page address can also open that page (the layout is loaded first, so it is ready when the page appears) */
    const go=u&&mkchip("Open Page",false,()=>{
      if(!applyLayout(slots()[n],n))return;$("laym").classList.remove("open");
      if(u!==location.href){saveNow();setTimeout(()=>{location.href=u},250)}else toast("Already on this page")});
    if(go)go.insertAdjacentHTML("afterbegin",svgIcon("u-link"));
    /* Save As (Edit layout only): save the layout being edited under a new name */
    const sas=mkchip("Save As",false,()=>saveAsDlg(n));
    load.insertAdjacentHTML("afterbegin",svgIcon("u-folder"));sas.insertAdjacentHTML("afterbegin",svgIcon("u-save"));del.insertAdjacentHTML("afterbegin",svgIcon("u-trash"));
    sas.textContent="";sas.insertAdjacentHTML("afterbegin",svgIcon("u-save")+"Replace");
    r.querySelector(".lact").append(...(mode==="edit"?[sas,del]:(go?[load,go,del]:[load,del])));box.appendChild(r);
  });
}
/* the layout on screen was just deleted: load the next saved layout (or the previous one if it was the last); with none left, a random controller (never Default) */
function randPreset(){const ps=PRESETS.filter(p=>!p.blank);return ps[Math.floor(Math.random()*ps.length)]}
function loadAfterDelete(ks,ix){
  const rest=ks.filter((_,i)=>i!==ix),pick=rest.length?rest[Math.min(ix,rest.length-1)]:null;
  if(!(pick&&applyLayout(slots()[pick],pick)))applyPreset(randPreset());
  if(mode==="edit")EDIT0=MODE0=EDIT_START=snap();   /* the editor starts clean on the layout that was loaded */
}
/* ---------- screen size: layouts, exports and backups remember the screen they were made on; a smaller screen gets an alert ---------- */
const scrOf=x=>x&&x.scr&&+x.scr.w>0&&+x.scr.h>0?{w:Math.round(+x.scr.w),h:Math.round(+x.scr.h)}:null;
const scrNorm=s=>[Math.min(s.w,s.h),Math.max(s.w,s.h)];   /* compared short side to short side, so rotating the device does not matter */
function scrSmaller(need){const[w,h]=viewSize(),[a,b]=scrNorm(need),[c,d]=scrNorm({w:Math.round(w),h:Math.round(h)});return c<a||d<b}
const scrTxt=s=>s.w+" \u00D7 "+s.h+" px";
function scrAlert(need,what,extra){
  const[w,h]=viewSize();
  dialog("Screen is smaller",what+" made for a screen of "+scrTxt(need)+". Your screen is "+scrTxt({w:Math.round(w),h:Math.round(h)})+", so buttons may be cramped, overlap or sit closer to the edges."+(extra?" "+extra:"")+" Use Edit Layout to adjust them.",[{t:"OK",cls:"pri"}]);
}
function applyLayout(a,name){
  const arr=Array.isArray(a)?a:a&&a.btns,ok=x=>Array.isArray(x)&&x.every(b=>b&&typeof b.x==="number"&&typeof b.y==="number"&&typeof b.w==="number");
  const lays=!Array.isArray(a)&&a&&a.layers;
  if(!ok(arr)||(lays&&!(Array.isArray(lays)&&lays.length&&lays.length<=LLOAD&&lays.every(l=>l&&ok(l.btns))))){toast("That is not a valid layout.");return false}
  const rid=x=>JSON.parse(JSON.stringify(x)).map((b,i)=>Object.assign(b,{id:Date.now()+i}));
  const clean=o=>{const r={btns:rid(o.btns),caps:o.caps===0?0:1,border:o.border===0?0:1};
    if(lays){r.layers=o.layers.map(l=>Object.assign({},l,{btns:rid(l.btns)}));r.li=0;r.btns=r.layers[0].btns;if(o.sw&&typeof o.sw==="object")r.sw=JSON.parse(JSON.stringify(o.sw))}   /* a loaded layout opens on its first layer */
    return r};
  const src=Array.isArray(a)?{btns:arr}:a,cur=S.lo||layoutKey();
  /* a layout belongs to the orientation it was exported from: portrait text only imports in portrait, landscape text only in landscape */
  if(src.o&&src.o!==cur)return toast("This is a "+(src.o==="l"?"landscape":"portrait")+" layout. Rotate your device to "+(src.o==="l"?"landscape":"portrait")+" to import it.");
  const use=src;
  const pv=snap();
  setLayout(clean(use));fitBtns();
  histCommitWhole(pv);setCur(name);selectOnly(null);fill();render();save();
  releaseAll();swUI();toast(name?"Loaded \u201c"+name+"\u201d":"Layout imported");
  {const need=scrOf(src);if(need&&scrSmaller(need))scrAlert(need,"This layout was")}   /* imported or loaded on a smaller screen */
  return true;
}
$("lay").onclick=$("lay2").onclick=openLay;$("lx").onclick=()=>{SAVE_FIRST=false;SWITCH_TO=null;$("laym").classList.remove("open")};     /* closing the panel without saving stays in the editor */
function storeLayout(n){
  const o=slotObj();if(S.saveUrl&&/^https?:/.test(location.href))o.url=location.href;
  slots()[n]=o;setCur(n);SAVED_GONE=false;if(mode==="edit")EDIT0=MODE0=snap();   /* what is on screen is now saved, so Done will not ask again */
  save();drawLay();toast("Saved \u201c"+n+"\u201d"+(o.url?" with its page address":""));
  if(SAVE_FIRST){SAVE_FIRST=false;$("laym").classList.remove("open");leaveEdit()}
  else if(SWITCH_TO){const f=SWITCH_TO;SWITCH_TO=null;$("laym").classList.remove("open");f()}   /* it came from the unsaved changes warning: now do what was asked (open the mode, add the mode) */
}
$("lsave").onclick=()=>{
  let n=$("lname").value.trim().slice(0,20);   /* layout names are 20 characters at most */
  if(n&&slots()[n])return toast(n+" already exists");   /* never overwrite by name here */
  if(!n)n=nextName();
  storeLayout(n);$("lname").value="";fillName();
};
/* Save As: replaces the tapped saved layout with the layout being edited (asks first) */
function saveAsDlg(n){
  askConfirm("Replace layout?","\u201c"+n+"\u201d will be replaced with the layout you are editing now.","Replace",()=>storeLayout(n));
}
/* ---------- backup and restore of every saved layout (portrait and landscape), so nothing is lost if the extension is removed ---------- */
const cntSlots=()=>["p","l"].reduce((n,k)=>n+Object.keys((S.slotsBy&&S.slotsBy[k])||{}).length,0);
function backupText(){const[bw,bh]=viewSize();return JSON.stringify({app:"webtroller",type:"backup",v:1,date:new Date().toISOString(),scr:{w:Math.round(bw),h:Math.round(bh)},slotsBy:{p:(S.slotsBy&&S.slotsBy.p)||{},l:(S.slotsBy&&S.slotsBy.l)||{}}},null,1)}
function restoreBackup(o){
  const sb=o&&o.slotsBy,ok=x=>x&&Array.isArray(x.btns)&&x.btns.every(b=>b&&typeof b.x==="number"&&typeof b.y==="number"&&typeof b.w==="number")&&(!x.layers||(Array.isArray(x.layers)&&x.layers.every(l=>l&&Array.isArray(l.btns))));
  if(!sb||typeof sb!=="object")return toast("That is not a WebTroller backup.");
  S.slotsBy=S.slotsBy||{p:{},l:{}};let add=0,skip=0,big=0,need=null;
  const bs=scrOf(o);   /* the screen the backup was made on */
  ["p","l"].forEach(k=>{const src=sb[k]||{},dst=S.slotsBy[k]||(S.slotsBy[k]={});
    Object.keys(src).forEach(n=>{const x=src[n];if(!ok(x)){skip++;return}
      const same=JSON.stringify(x);
      if(dst[n]&&JSON.stringify(dst[n])===same){skip++;return}           /* already here */
      let nm=n,i=2;while(dst[nm])nm=n+" ("+i++ +")";                      /* never overwrite a layout you already have */
      dst[nm]=JSON.parse(same);add++;
      const sc=scrOf(x)||bs;if(sc&&scrSmaller(sc)){big++;if(!need||scrNorm(sc)[0]*scrNorm(sc)[1]>scrNorm(need)[0]*scrNorm(need)[1])need=sc}});
  });
  save();if($("laym").classList.contains("open"))layUpdate();
  toast(add?"Restored "+add+" layout"+(add===1?"":"s")+(skip?" ("+skip+" already here)":""):(skip?"Nothing new: all layouts are already here":"The backup has no layouts"));
  if(big&&need)scrAlert(need,big===1?"1 restored layout was":big+" restored layouts were",big>1?"(The largest one needs "+scrTxt(need)+".)":"")
}
$("lbdl").onclick=()=>{
  if(!cntSlots())return toast("No saved layouts to back up yet");
  try{const blob=new Blob([backupText()],{type:"application/json"}),a=document.createElement("a"),d=new Date(),pad=n=>String(n).padStart(2,"0");
    a.href=URL.createObjectURL(blob);a.download="webtroller-backup-"+d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate())+".json";
    root.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(a.href)},1500);toast("Backup saved to your downloads")}
  catch(e){toast("Could not download. Use Copy Backup instead.")}
};
$("lbrs").onclick=()=>{$("lbfile").value="";$("lbfile").click()};
$("lbfile").onchange=e=>{
  const f=e.target.files&&e.target.files[0];if(!f)return;
  const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(o&&o.type==="backup")restoreBackup(o);else toast("That file is not a WebTroller backup.")}catch(x){toast("That file is not a WebTroller backup.")}};
  r.onerror=()=>toast("Could not read that file.");r.readAsText(f);
};
