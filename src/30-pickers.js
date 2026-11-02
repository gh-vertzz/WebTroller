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
  if(ipLayer>=0){const l=S.layers[ipLayer],pv=snap();if(l){l.i=g;recOp({t:"icon",at:ipLayer,i:g})}closeI();   /* an icon is not an edit of the buttons: Undo and Redo stay */swUI();if(lyrOpen())drawLayers();save();return}
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
const curK=()=>(S.curX&&S.curX[S.lo||"p"])||S.lo||"p";   /* the orientation of that saved layout: the other one when it was loaded from the other orientation's part of the list */
const lnk=()=>{const n=curName(),k=curK();return n&&S.slotsBy&&S.slotsBy[k]&&S.slotsBy[k][n]||null};   /* the saved layout in use, if it still exists */
function setCur(n,xo){S.curBy=S.curBy||{};S.curX=S.curX||{};const o=S.lo||"p";if(n){S.curBy[o]=n;if(xo&&xo!==o)S.curX[o]=xo;else delete S.curX[o]}else{delete S.curBy[o];delete S.curX[o]}}
const slots=()=>{S.slotsBy=S.slotsBy||{p:{},l:{}};const k=S.lo||layoutKey();return S.slotsBy[k]||(S.slotsBy[k]={})};   /* the saved layouts of this orientation */
/* every saved layout of both orientations in one list, this orientation first: {k:"p"|"l", n:name, x:layout} */
const allSlots=()=>{S.slotsBy=S.slotsBy||{p:{},l:{}};const c=S.lo||layoutKey(),o=c==="p"?"l":"p",sb=S.slotsBy,names=[];
  ["p","l"].forEach(k=>Object.keys(sb[k]||{}).forEach(n=>{if(!names.includes(n))names.push(n)}));
  const num=n=>{const m=/^Layout (\d+)$/.exec(n);return m?+m[1]:null};names.sort((a,b)=>{const x=num(a),y=num(b);return x!==null&&y!==null?x-y:0});
  return names.map(n=>{const own=(sb[c]||{})[n],oth=(sb[o]||{})[n];return{n,k:own?c:o,x:own||oth,has:{p:!!(sb.p||{})[n],l:!!(sb.l||{})[n]}}})};   /* ONE entry per name; a name holds a portrait layout and a landscape layout, each saved from what was edited in that orientation; k is the copy Load uses on this screen */
const kName=k=>k==="l"?"Landscape":"Portrait";
const oriName=()=>(S.lo||layoutKey())==="l"?"Landscape":"Portrait";
/* the title and the list always follow the orientation you are in (called when the panel opens and again when the device is rotated) */
function layUpdate(){
  const ed=mode==="edit";
  $("ltitle").textContent=ed?"Save Layout":"Load Layout";
  const n=allSlots().length;
  $("lsub").textContent=PSAVE?"Saving your "+kName(PSAVE.ko).toLowerCase()+" layout":"Portrait & Landscape \u00B7 "+n+" saved";
  $("lico").innerHTML=svgIcon(ed?"u-save":"u-folder");
  drawLay();
}
function openLay(){SWITCH_TO=null;
  const ed=mode==="edit";
  $("lsrow").style.display=ed?"flex":"none";
  const web=/^https?:/.test(location.href);
  $("lurow").style.display=ed&&web?"flex":"none";S.saveUrl=false;$("lusave").checked=false;   /* "Also save this page's address" is off every time the panel opens */$("lurl").textContent=web?shortUrl(location.href):"";
    $("lbdl").style.display=ed?"":"none";$("lbrs").style.display=ed?"none":"";   /* Save Layout: only Download Backup; Load Layout: only Restore Backup */
  $("lbtx").textContent=ed?"Saves every portrait and landscape layout into one file. Keep it somewhere safe: if the extension is ever removed, restore it from Load Layout and nothing is lost.":"Restores the layouts from a backup file you downloaded. Your current saved layouts are cleared and replaced by the backup.";
  $("laym").classList.add("open");layUpdate();
  /* pick up layouts another tab may have saved meanwhile, then redraw */
  try{chrome.storage.local.get("wt",r=>{try{const s=JSON.parse((r&&r.wt)||"null");if(s&&s.slotsBy){S.slotsBy=s.slotsBy;if($("laym").classList.contains("open"))drawLay()}}catch(e){}})}catch(e){}
}
const shortUrl=u=>u.length>70?u.slice(0,67)+"\u2026":u;
$("lusave").onchange=e=>{S.saveUrl=e.target.checked;save()};
/* the name box always holds the next free automatic name (Layout 1, Layout 2, ...); a name you typed yourself is left alone */
let AUTO_NAME="";
const nextName=()=>{let i=1;while(allSlots().some(e=>e.n==="Layout "+i))i++;return "Layout "+i};   /* start at Layout 1 and take the first number not used yet */
const suggestName=()=>{const c=S.lo||layoutKey(),o=c==="p"?"l":"p",sb=S.slotsBy||{},h=NAMEHINT||S.act||(S.curBy&&S.curBy[o]);   /* the layout in use has no copy for this orientation yet: save this one under the same name to make its other half */
  if(h&&sb[c]&&!sb[c][h]&&((sb.p&&sb.p[h])||(sb.l&&sb.l[h])))return h;return nextName()};
function fillName(){const el=$("lname");if(el.value===""||el.value===AUTO_NAME){AUTO_NAME=nextName();el.value=AUTO_NAME}}
function drawLay(){
  if(mode==="edit")fillName();
  const box=$("lays");box.innerHTML="";const cur0=S.lo||layoutKey(),all=allSlots();
  if(!all.length){box.innerHTML='<div class="lempty">'+svgIcon("u-folder")+'<b>No saved layouts yet</b><p>'+(mode==="edit"?"Type a name above and press Save.":"Save one from Edit layout first.")+"</p></div>";return}
  all.forEach(({k,n,x,has})=>{
    const r=document.createElement("div");r.className="lcard";const u=x.url,cur=curName()===n&&!!lnk(),mc=Array.isArray(x.layers)&&x.layers.length?x.layers.length:1;
    r.innerHTML=`<div class="lmain"><span class="lbadge">${svgIcon("u-save")}</span><div class="linfo"><b>${esc(n)}</b>${cur?'<em class="lnow">Current</em>':""}<small><span>${has.p&&has.l?"Portrait & Landscape":has.p?"Portrait only":"Landscape only"} \u00B7 ${mc} mode${mc===1?"":"s"}</span></small>${u?`<small>${svgIcon('u-link')}<span>${esc(shortUrl(u))}</span></small>`:""}</div></div><div class="lact"></div>`;
    const load=mkchip("Load",true,()=>{loadName(n);$("laym").classList.remove("open")});
    const del=mkchip("Delete",false,()=>askConfirm("Delete layout?","\u201c"+n+"\u201d will be removed from your saved layouts.","Delete",()=>{const was=curName()===n,ks=allSlots().map(e=>e.n),ix=ks.indexOf(n),cd=S.lo||layoutKey();["p","l"].forEach(o=>{if(S.curBy&&S.curBy[o]===n){delete S.curBy[o];if(S.curX)delete S.curX[o];if(o!==cd&&S.alt){delete S.alt[o];if(S.altC)delete S.altC[o]}}if(S.slotsBy&&S.slotsBy[o])delete S.slotsBy[o][n]});if(S.act===n)S.act=null;save();   /* the other orientation must not bring the deleted layout back when you rotate */toast("Deleted \u201c"+n+"\u201d");if(was)loadAfterDelete(ks,ix);layUpdate()}));del.classList.add("dng");
    /* a layout saved with a page address can also open that page (the layout is loaded first, so it is ready when the page appears) */
    const go=u&&mkchip("Open Page",false,()=>{
      if(!loadName(n))return;$("laym").classList.remove("open");
      if(u!==location.href){saveNow();setTimeout(()=>{location.href=u},250)}else toast("Already on this page")});
    if(go)go.insertAdjacentHTML("afterbegin",svgIcon("u-link"));
    /* Save As (Edit layout only): save the layout being edited under a new name */
    const sas=mkchip("Save As",false,()=>saveAsDlg(n,k));
    load.insertAdjacentHTML("afterbegin",svgIcon("u-folder"));sas.insertAdjacentHTML("afterbegin",svgIcon("u-save"));del.insertAdjacentHTML("afterbegin",svgIcon("u-trash"));
    sas.textContent="";sas.insertAdjacentHTML("afterbegin",svgIcon("u-save")+"Replace");
    r.querySelector(".lact").append(...(mode==="edit"?[sas,del]:(go?[load,go,del]:[load,del])));box.appendChild(r);
  });
}
/* the layout on screen was just deleted: load the next saved layout (or the previous one if it was the last); with none left, a random controller (never Default) */
function randPreset(){const ps=PRESETS.filter(p=>!p.blank);return ps[Math.floor(Math.random()*ps.length)]}
function loadAfterDelete(ks,ix){
  const c=S.lo||layoutKey(),rest=ks.filter((_,i)=>i!==ix),cand=rest.filter(n=>S.slotsBy[c]&&S.slotsBy[c][n]),pick=cand.length?cand[Math.min(ix,cand.length-1)]:null;
  if(!(pick&&loadName(pick))){const p=randPreset();applyPreset(p);if(!rest.length){S.rnd={o:S.lo||layoutKey(),n:p.name};save()}}   /* remember: the other orientation follows this when you rotate */
  if(mode==="edit"){EDIT0=MODE0=EDIT_START=snap();mkDraft()}   /* the editor starts clean on the layout that was loaded */
}
/* every saved layout of one orientation was deleted (a random controller was given there): when you rotate to the other orientation it loads the layout you last loaded there, or, with none saved, gets the same controller */
function rotAuto(){
  const r=S.rnd,k=S.lo||layoutKey();if(!r)return;if(r.o===k)return;   /* still in the orientation that was cleared */
  if(S.ctrl!==r.n){S.rnd=null;save();return}   /* another controller was picked since: keep it */
  S.rnd=null;
  if(Object.keys((S.slotsBy&&S.slotsBy[r.o])||{}).length)return;       /* a layout was saved there since: nothing to follow */
  const sl=slots(),ks=Object.keys(sl),cn=curName(),pick=cn&&sl[cn]?cn:(ks.length?ks[ks.length-1]:null);
  if(!(pick&&applyLayout(sl[pick],pick))){const p=PRESETS.find(x=>x.name===r.n);if(p)applyPreset(p)}
  if(mode==="edit"){EDIT0=MODE0=EDIT_START=snap();mkDraft()}
  save();
}
/* ---------- screen size: layouts, exports and backups remember the screen they were made on; a smaller screen gets an alert ---------- */
const scrOf=x=>x&&x.scr&&+x.scr.w>0&&+x.scr.h>0?{w:Math.round(+x.scr.w),h:Math.round(+x.scr.h)}:null;
const scrNorm=s=>[Math.min(s.w,s.h),Math.max(s.w,s.h)];   /* compared short side to short side, so rotating the device does not matter */
/* the TOTAL screen of the phone (not the browser viewport, which is smaller and differs between portrait and landscape because of the toolbar and nav bar) */
const scrFull=k=>{const a=Math.round(screen.width||innerWidth),b=Math.round(screen.height||innerHeight),s=Math.min(a,b),l=Math.max(a,b);return k==="l"?{w:l,h:s}:{w:s,h:l}};
const scrValid=s=>s&&+s.w>0&&+s.h>0?{w:Math.round(+s.w),h:Math.round(+s.h)}:null;
function scrSmaller(need){const f=scrFull("p"),[a,b]=scrNorm(need),[c,d]=scrNorm(f);return c+2<a||d+2<b}   /* same phone = same total screen = never smaller, in either orientation */
const scrTxt=s=>s.w+" \u00D7 "+s.h+" px";
function scrAlert(need,what,extra){
  const[w,h]=viewSize();
  dialog("Screen is smaller",what+" made for a screen of "+scrTxt(need)+". Your screen is "+scrTxt(scrFull(need.w>need.h?"l":"p"))+", so buttons may be cramped, overlap or sit closer to the edges."+(extra?" "+extra:"")+" Use Edit Layout to adjust them.",[{t:"OK",cls:"pri"}]);
}
/* a layout of the other orientation is fitted to this screen: buttons keep their corner or edge and their distance in px, and shrink only if they would no longer fit */
const ANC=(b,W0,H0)=>{const w=b.w,h=btnH(b),l=b.x/100*W0,t=b.y/100*H0,cx=l+w/2,cy=t+h/2,
  hx=Math.abs(cx-W0/2)<W0*.04?"c":cx<W0/2?"l":"r",vy=Math.abs(cy-H0/2)<H0*.05?"c":cy<H0/2?"t":"b";
  return{w,h,hx,vy,hd:hx==="l"?l:hx==="r"?W0-l-w:cx-W0/2,vd:vy==="t"?t:vy==="b"?H0-t-h:cy-H0/2}};
function adaptBtns(lists,W0,H0,W,H,keep){
  /* buttons that sit together (a D-pad, the face buttons, a stick with its label, shoulder buttons) move as ONE group:
     the group keeps its corner or edge and its distance in px, and its buttons keep their spacing, so nothing is torn apart */
  const GAP=12,groups=[];
  lists.forEach(l=>{
    const R=l.map(b=>({b,w:b.w,h:btnH(b),l:b.x/100*W0,t:b.y/100*H0})),par=R.map((_,i)=>i),fd=i=>par[i]===i?i:(par[i]=fd(par[i]));
    for(let i=0;i<R.length;i++)for(let j=i+1;j<R.length;j++){const a=R[i],c=R[j];
      if(a.l<c.l+c.w+GAP&&c.l<a.l+a.w+GAP&&a.t<c.t+c.h+GAP&&c.t<a.t+a.h+GAP)par[fd(i)]=fd(j)}
    const by={};R.forEach((r,i)=>{(by[fd(i)]=by[fd(i)]||[]).push(r)});
    Object.keys(by).forEach(k=>{const m=by[k];let L=1e9,T=1e9,RR=-1e9,BB=-1e9,mw=1e9;
      m.forEach(r=>{L=Math.min(L,r.l);T=Math.min(T,r.t);RR=Math.max(RR,r.l+r.w);BB=Math.max(BB,r.t+r.h);if(r.w>44)mw=Math.min(mw,r.w)});
      const w=RR-L,h=BB-T,cx=L+w/2,cy=T+h/2,
        hx=Math.abs(cx-W0/2)<W0*.04?"c":cx<W0/2?"l":"r",vy=cy<H0*.35?"t":"b";   /* the upper part of the screen stays at the top, everything else stays at the bottom where the thumbs are */
      groups.push({m,L,T,w,h,mw,hx,vy,hd:hx==="l"?L:hx==="r"?W0-L-w:cx-W0/2,vd:vy==="t"?T:vy==="b"?H0-T-h:cy-H0/2})})
  });
  let f=1;
  if(!keep){let lw=0,rw=0,cw=0,tp=0,bt=0,ch=0;
    groups.forEach(g=>{
      if(g.hx==="l")lw=Math.max(lw,g.hd+g.w);else if(g.hx==="r")rw=Math.max(rw,g.hd+g.w);else cw=Math.max(cw,2*(Math.abs(g.hd)+g.w/2));
      if(g.vy==="t")tp=Math.max(tp,g.vd+g.h);else if(g.vy==="b")bt=Math.max(bt,g.vd+g.h);else ch=Math.max(ch,2*(Math.abs(g.vd)+g.h/2))});
    const nw=Math.max(lw+rw,cw),nh=Math.max(tp+bt,ch);
    if(nw>0)f=Math.min(f,(W-8)/nw);if(nh>0)f=Math.min(f,(H-8)/nh);
    f=Math.max(.3,f)}
  groups.forEach(g=>{
    const fg=keep?1:Math.max(f,g.mw<1e9?Math.min(1,44/g.mw):0),gw=g.w*fg,gh=g.h*fg;   /* a button of the group never gets smaller than 44 px */
    let GL=g.hx==="l"?g.hd*fg:g.hx==="r"?W-g.hd*fg-gw:W/2+g.hd*fg-gw/2,GT=g.vy==="t"?g.vd*fg:g.vy==="b"?H-g.vd*fg-gh:H/2+g.vd*fg-gh/2;
    GL=Math.max(0,Math.min(W-gw,GL));GT=Math.max(0,Math.min(H-gh,GT));   /* the whole group stays on the screen */
    g.m.forEach(r=>{r.b.w=r.w<=44?r.w:Math.max(44,Math.round(r.w*fg));
      r.b.x=+((GL+(r.l-g.L)*fg)/W*100).toFixed(2);r.b.y=+((GT+(r.t-g.T)*fg)/H*100).toFixed(2)})});
  return f;
}
function adaptNew(r,sc){const[W,H]=viewSize(),z=sc?[sc.w,sc.h]:[H,W];adaptBtns([...new Set([r.btns].concat(Array.isArray(r.layers)?r.layers.map(l=>l.btns):[]))],z[0],z[1],W,H)}
/* the layout the user is using (loaded, saved, or the first one after a restore) is remembered by NAME in S.act:
   rotating opens that name's own saved layout for the orientation rotated to. Portrait and landscape layouts are separate: when the name has none for that
   orientation, nothing is opened, moved or fitted there, it keeps the layout it has */
function followPlan(act,k,had,pend){
  if(pend||!act)return null;
  const nat=S.slotsBy&&S.slotsBy[k]&&S.slotsBy[k][act];if(!nat)return null;
  if(had&&S.curBy&&S.curBy[k]===act&&!(S.curX&&S.curX[k]))return null;   /* already on it */
  return{x:nat,n:act}
}
/* a layout was saved for orientation c: the copy of it that had been fitted for the other orientation is out of date */
function dropFit(n,c){const o=c==="p"?"l":"p";if(S.curBy&&S.curBy[o]===n&&S.curX&&S.curX[o]===c){delete S.curBy[o];delete S.curX[o];if(S.alt)delete S.alt[o];if(S.altC)delete S.altC[o]}}
/* A saved layout is { portrait, landscape }: both halves are always saved together, whatever each orientation has at that moment (edited or not),
   and Load opens both: the half for the orientation the phone is in now, and the other half when you turn the phone. Nothing is ever fitted between them. */
function otherNow(o){   /* the layout the other orientation has right now (unsaved edits made before turning the phone included) */
  const pe=PEND[o],cn=ctrlPreset().name;let lay=null;
  if(pe&&pe.ed)lay=pe.ed;
  else if(S.alt&&S.alt[o]&&!(S.altC&&S.altC[o]!==undefined&&S.altC[o]!==cn))lay=S.alt[o];
  else{const f=followPlan(S.act,o,false,false);if(f)lay=f.x}
  const [W,H]=viewSize();
  if(!lay)lay={btns:buildPreset(ctrlPreset(),[H,W]),caps:1,border:1,def:1,dc:ctrlPreset().name};   /* untouched: stored as 'default of this controller', rebuilt for the real screen when opened */   /* never been on screen: the controller built for that orientation */
  const y=JSON.parse(JSON.stringify(lay));y.o=o;if(y.layers){y.li=0;y.btns=y.layers[0].btns}
  y.scr={w:Math.round(H),h:Math.round(W)};try{y.scrn=scrFull(o)}catch(e){}return y;
}
function saveBoth(n,ox){
  S.slotsBy=S.slotsBy||{p:{},l:{}};
  const c=S.lo||layoutKey(),o=c==="p"?"l":"p",A=S.slotsBy[c]||(S.slotsBy[c]={}),B=S.slotsBy[o]||(S.slotsBy[o]={});
  const x=ox||slotObj(),y=otherNow(o);
  if(!x.url&&A[n]&&A[n].url)x.url=A[n].url;if(B[n]&&B[n].url)y.url=B[n].url;
  A[n]=x;B[n]=y;setCur(n);S.curBy=S.curBy||{};S.curBy[o]=n;if(S.curX)delete S.curX[o];delete PEND[o];S.act=n;
}
/* Load: the layout of that name opens in this orientation and, when you turn the phone, in the other one */
function loadName(n){
  const c=S.lo||layoutKey(),o=c==="p"?"l":"p",sb=S.slotsBy||(S.slotsBy={p:{},l:{}}),A=sb[c]||(sb[c]={}),B=sb[o]||(sb[o]={});
  if(!A[n]&&!B[n])return false;
  if(!B[n])B[n]=otherNow(o);   /* older data with one half only: the missing half is what that orientation shows now, nothing is fitted */
  if(A[n]){if(!applyLayout(A[n],n))return false}
  else{A[n]=slotObj();setCur(n);toast("Loaded \u201c"+n+"\u201d")}
  S.curBy=S.curBy||{};delete S.curBy[o];if(S.curX)delete S.curX[o];if(S.alt)delete S.alt[o];if(S.altC)delete S.altC[o];delete PEND[o];   /* the other orientation opens its half of it when the phone is turned */
  S.act=n;save();layUpdate();return true;
}
function applyLayout(a,name,xo,quiet){
  const arr=Array.isArray(a)?a:a&&a.btns,ok=x=>Array.isArray(x)&&x.every(b=>b&&typeof b.x==="number"&&typeof b.y==="number"&&typeof b.w==="number");
  const lays=!Array.isArray(a)&&a&&a.layers;
  if(!ok(arr)||(lays&&!(Array.isArray(lays)&&lays.length&&lays.length<=LLOAD&&lays.every(l=>l&&ok(l.btns))))){toast("That is not a valid layout.");return false}
  const rid=x=>JSON.parse(JSON.stringify(x)).map((b,i)=>Object.assign(b,{id:Date.now()+i}));
  const clean=o=>{const r={btns:rid(o.btns),caps:o.caps===0?0:1,border:o.border===0?0:1};
    if(lays){r.layers=o.layers.map(l=>Object.assign({},l,{btns:rid(l.btns)}));r.li=0;r.btns=r.layers[0].btns;if(o.sw&&typeof o.sw==="object")r.sw=JSON.parse(JSON.stringify(o.sw))}   /* a loaded layout opens on its first layer */
    return r};
  const src=Array.isArray(a)?{btns:arr}:a,cur=S.lo||layoutKey();
  /* a layout belongs to the orientation it was exported from: portrait text only imports in portrait, landscape text only in landscape */
  if(!quiet&&src.o&&src.o!==cur&&!xo)return toast("This is a "+(src.o==="l"?"landscape":"portrait")+" layout. Rotate your device to "+(src.o==="l"?"landscape":"portrait")+" to import it.");
  const use=src;
  const pv=snap();
  const cross=!!xo&&xo!==cur,nl=clean(use);
  if(!Array.isArray(a)&&a&&a.def&&!lays){const dp=PRESETS.find(x=>x.name===a.dc)||ctrlPreset();nl.btns=rid(buildPreset(dp));nl.caps=1;nl.border=1}   /* an untouched controller layout is built fresh for this screen, never moved or fitted */
  else if(cross)adaptNew(nl,scrOf(src));   /* loaded from the other orientation: fitted to this screen */
  setLayout(nl);fitBtns();
  if(!quiet){histCommitWhole(pv);S.rnd=null;S.act=name||null}setCur(name,cross?xo:undefined);   /* a layout loaded from the other orientation's part of the list is the current one too, just like in its own orientation */
  if(!quiet){selectOnly(null);fill();render();save()}
  releaseAll();if(!quiet){swUI();toast(name?"Loaded \u201c"+name+"\u201d":"Layout imported")}
  /* the smaller-screen alert is only shown after restoring a backup (see restoreBackup), never when a layout is loaded or imported */
  return true;
}
$("lay").onclick=$("lay2").onclick=openLay;$("lx").onclick=()=>{SAVE_FIRST=false;SWITCH_TO=null;PSAVE=null;BOTHN=null;NAMEHINT=null;$("laym").classList.remove("open")};     /* closing the panel without saving stays in the editor */
function storeLayout(n){
  if(PSAVE){   /* the Save Layout panel was opened for the layout of the other orientation that Done asked about */
    const{ko,pe,next}=PSAVE;PSAVE=null;S.slotsBy=S.slotsBy||{p:{},l:{}};
    const dst=S.slotsBy[ko]||(S.slotsBy[ko]={}),o=JSON.parse(JSON.stringify(pe.ed));o.o=ko;if(o.layers){o.li=0;o.btns=o.layers[0].btns}
    if(S.saveUrl&&/^https?:/.test(location.href))o.url=location.href;
    dst[n]=o;S.curBy=S.curBy||{};S.curBy[ko]=n;delete PEND[ko];save();toast("Saved \u201c"+n+"\u201d");
    $("laym").classList.remove("open");next();return}
  const o=slotObj();if(S.saveUrl&&/^https?:/.test(location.href))o.url=location.href;
  saveBoth(n,o);SAVED_GONE=false;if(mode==="edit"){EDIT0=MODE0=snap();mkDraft()}   /* what is on screen is now saved, so Done will not ask again */
  save();drawLay();toast("Saved \u201c"+n+"\u201d"+(o.url?" with its page address":""));
  if(SAVE_FIRST){SAVE_FIRST=false;$("laym").classList.remove("open");leaveEdit()}
  else if(SWITCH_TO){const f=SWITCH_TO;SWITCH_TO=null;$("laym").classList.remove("open");f()}   /* it came from the unsaved changes warning: now do what was asked (open the mode, add the mode) */
}
$("lsave").onclick=()=>{
  let n=$("lname").value.trim().slice(0,20);   /* layout names are 20 characters at most */
  if(n&&allSlots().some(e=>e.n===n))return toast(n+" already exists");   /* never overwrite by name here */
  if(!n)n=nextName();
  storeLayout(n);$("lname").value="";fillName();
};
/* Save As: replaces the tapped saved layout with the layout being edited (asks first) */
function saveAsDlg(n,k){
  if(!slots()[n])return storeLayout(n);   /* this orientation has no layout under that name yet: it becomes the other half */
  askConfirm("Replace layout?","\u201c"+n+"\u201d will be replaced with your portrait and landscape layouts as they are now.","Replace",()=>{storeLayout(n)});   /* a layout of the other orientation becomes one of this orientation */
}
/* ---------- backup and restore of every saved layout (portrait and landscape), so nothing is lost if the extension is removed ---------- */
const cntSlots=()=>["p","l"].reduce((n,k)=>n+Object.keys((S.slotsBy&&S.slotsBy[k])||{}).length,0);
function backupText(){const[bw,bh]=viewSize();return JSON.stringify({app:"webtroller",type:"backup",v:1,date:new Date().toISOString(),scr:{w:Math.round(bw),h:Math.round(bh)},scrn:{p:scrFull("p"),l:scrFull("l")},slotsBy:{p:(S.slotsBy&&S.slotsBy.p)||{},l:(S.slotsBy&&S.slotsBy.l)||{}}},null,1)}
function restoreBackup(o){
  const sb=o&&o.slotsBy,ok=x=>x&&Array.isArray(x.btns)&&x.btns.every(b=>b&&typeof b.x==="number"&&typeof b.y==="number"&&typeof b.w==="number")&&(!x.layers||(Array.isArray(x.layers)&&x.layers.every(l=>l&&Array.isArray(l.btns))));
  if(!sb||typeof sb!=="object")return toast("That is not a WebTroller backup.");
  S.slotsBy={p:{},l:{}};S.curBy={};S.curX={};let add=0,skip=0,need=null;const addN=new Set(),bigN=new Set(),skipN=new Set();   /* Clear & Restore: wipe the saved layouts first. Layouts are counted by NAME: a name holds a portrait half and a landscape half, but it is ONE layout in the list */
  const bs=scrOf(o);   /* the screen the backup was made on */
  ["p","l"].forEach(k=>{const src=sb[k]||{},dst=S.slotsBy[k]||(S.slotsBy[k]={});
    Object.keys(src).forEach(n=>{const x=src[n];if(!ok(x)){skip++;skipN.add(n);return}
      const same=JSON.stringify(x);
      if(dst[n]&&JSON.stringify(dst[n])===same){skip++;skipN.add(n);return}           /* already here */
      let nm=n,i=2;while(dst[nm])nm=n+" ("+i++ +")";                      /* never overwrite a layout you already have */
      dst[nm]=JSON.parse(same);add++;addN.add(nm);
      const sc=scrValid(x.scrn)||scrValid(o.scrn&&o.scrn[k])||scrOf(x)||bs;if(sc&&scrSmaller(sc)){bigN.add(nm);if(!need||scrNorm(sc)[0]*scrNorm(sc)[1]>scrNorm(need)[0]*scrNorm(need)[1])need=sc}});
  });
  if(add){["p","l"].forEach(k=>{const dst=S.slotsBy[k],oth=S.slotsBy[k==="p"?"l":"p"];Object.keys(oth).forEach(n=>{if(!dst[n])dst[n]={btns:[],caps:1,border:1,o:k}})})}   /* a name saved in only one orientation (older backups): the other orientation gets an EMPTY layout under that name, nothing is copied or fitted */
  if(add){try{firstAfterRestore()}catch(e){try{const kk=S.lo||layoutKey(),f=Object.keys(S.slotsBy[kk]||{})[0];if(f){applyLayout(S.slotsBy[kk][f],f);S.act=f}}catch(x){}}}   /* the first layout of the list always opens, in portrait and in landscape, whether or not the screen alert follows */
  save();if($("laym").classList.contains("open"))layUpdate();
  toast(add?"Restored "+addN.size+" layout"+(addN.size===1?"":"s")+(skipN.size?" ("+skipN.size+" already here)":""):(skip?"Nothing new: all layouts are already here":"The backup has no layouts"));
  if(bigN.size&&need)scrAlert(need,bigN.size===1?"1 restored layout was":bigN.size+" restored layouts were",bigN.size>1?"(The largest one needs "+scrTxt(need)+".)":"")
}
/* after a backup is restored the first layout of each list is the current one: this orientation right now, the other one when you rotate to it */
function firstAfterRestore(){
  const cur=S.lo||layoutKey(),oth=cur==="p"?"l":"p",a0=allSlots()[0],fa=a0?a0.n:null,first=k=>{const e=allSlots().find(e=>e.has[k]);return e&&e.n},
    pickK=k=>(fa&&S.slotsBy&&S.slotsBy[k]&&S.slotsBy[k][fa])?fa:first(k);   /* the first layout of the list, in either orientation; an orientation without a copy of it uses its own first one */
  S.ops={p:[],l:[]};S.curBy=S.curBy||{};S.curX=S.curX||{};S.alt=S.alt||{};S.altC=S.altC||{};
  const fc=pickK(cur),fo=pickK(oth);
  /* the other orientation gets its own first layout; when the backup has none for it, nothing is moved there */
  if(fo){
    const own=!!fo,sk=own?oth:cur,sn=own?fo:fc,x=JSON.parse(JSON.stringify(S.slotsBy[sk][sn]));
    if(!own){const[W,H]=viewSize(),sc=scrOf(x),z=sc?[sc.w,sc.h]:[W,H];
      adaptBtns(x.layers?x.layers.map(l=>l.btns):[x.btns],z[0],z[1],H,W)}   /* the other orientation's screen is this one turned around */
    if(x.layers){x.li=0;x.btns=x.layers[0].btns}
    S.alt[oth]=x;S.altC[oth]=ctrlPreset().name;S.curBy[oth]=sn;   /* remember which controller it belongs to, so picking another controller later rebuilds it */if(own)delete S.curX[oth];else S.curX[oth]=sk;
  }
  if(fc)applyLayout(S.slotsBy[cur][fc],fc);
  S.act=fa;save();   /* the first layout is the one in use, so both orientations open it */
}
function askRestore(o){
  const sb=o.slotsBy;if(!sb||typeof sb!=="object")return toast("That is not a WebTroller backup.");
  const ok=x=>x&&Array.isArray(x.btns)&&x.btns.every(b=>b&&typeof b.x==="number"&&typeof b.y==="number"&&typeof b.w==="number")&&(!x.layers||(Array.isArray(x.layers)&&x.layers.every(l=>l&&Array.isArray(l.btns))));
  if(!["p","l"].some(k=>Object.keys(sb[k]||{}).some(n=>ok(sb[k][n]))))return toast("The backup has no layouts");
  askConfirm("Restore backup?","Your saved layouts will be cleared and replaced with the ones from this backup.","Clear & Restore",()=>restoreBackup(o));
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
  const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(o&&o.type==="backup")askRestore(o);else toast("That file is not a WebTroller backup.")}catch(x){toast("That file is not a WebTroller backup.")}};
  r.onerror=()=>toast("Could not read that file.");r.readAsText(f);
};
