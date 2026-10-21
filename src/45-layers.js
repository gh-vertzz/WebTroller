/* ---------- layers: one saved layout holds several sets of buttons (for example walking, driving, swimming) ----------
   A layer is a complete set of buttons. The switcher (a small bar of numbered or icon buttons) chooses which layer is on screen while you play.
   Layers belong to the layout of one orientation, so portrait and landscape each have their own. A saved layout keeps all of its layers. */
const layerName=i=>(S.layers[i]&&S.layers[i].n)||"Mode "+(i+1);
/* every mode has its own Undo and Redo (see HSTORE): switching modes keeps them, and an undo in one mode never changes another mode */
/* at least one mode always stays in the switcher: if every mode got hidden (an old layout, or the visible one was deleted) the mode on screen is shown again */
function ensureVisible(){
  if(!S.layers.length||S.layers.some(l=>!l.hide))return false;
  delete S.layers[Math.min(S.li,S.layers.length-1)].hide;return true;
}
const lyrOpen=()=>$("lyrm").classList.contains("open");
/* what a layer looks like in the switcher: its icon, or its number (the number counts every layer, so hiding layer 3 leaves 1, 2, 4, 5) */
const layerFace=(l,i)=>iconHtml(l.i)||'<span>'+(i+1)+'</span>';

/* let go of everything that is pressed (keys, mouse buttons, locked buttons, sticks) before the buttons on screen change,
   so a key never stays stuck down when the layer is switched while a finger is still on a button or stick */
function releaseAll(){
  unlockAll();
  if(mode==="play")[...$("ov").children].forEach(el=>{try{if(el.onpointerup)el.onpointerup()}catch(e){}});
  [...held].forEach(id=>{const b=S.btns.find(x=>x.id===id);if(b)press(b,false)});held.clear();
  Object.keys(mt).forEach(k=>clearInterval(mt[k]));
}

/* Switching to a mode, or adding one, never asks about unsaved changes: every change to every mode (buttons, icons, order, names) waits for Done,
   which asks Save or Discard once, and Discard puts every mode back the way it was. */
function tryLayer(i){gotoLayer(i)}

/* put another layer on screen */
function gotoLayer(i){
  if(!(i>=0&&i<S.layers.length)||i===S.li)return false;
  releaseAll();syncLayer();histSave();                                           /* the mode you leave keeps its Undo and Redo */
  S.li=i;S.btns=S.layers[i].btns;fitBtns();
  if(mode==="edit")MODE0=snap();histLoad();                                     /* the mode you switch to brings back its own Undo and Redo */
  selectOnly(null);fill();render();swUI();if(lyrOpen())drawLayers();save();updUR();
  return true;
}

/* ---------- the switcher ---------- */
function swUI(){
  const w=$("lsw"),sw=S.sw||{},ed=mode==="edit",see=S.layers.filter(l=>!l.hide).length;
  const show=ed;                                            /* while playing the round Layers button takes over (see lsUI) */
  /* editing: the switcher sits in its own row right under the editor bar; playing: it floats over the page where you put it */
  const row=$("ebw"),inRow=w.parentNode===row;
  if(ed&&!inRow)row.insertBefore(w,$("etog"));
  else if(!ed&&inRow)$("app").insertBefore(w,$("hud"));
  w.classList.toggle("gone",!show);lsUI();if(!show)return;
  w.dataset.dir=ed?"h":(sw.dir==="v"?"v":"h");w.style.setProperty("--lz",(ed?40:clamp(sw.sz||44,32,80))+"px");
  const box=$("lswb"),act=$("lswa");box.innerHTML="";act.innerHTML="";   /* modes in lswb; the + and settings buttons live in their own box (lswa) */
  S.layers.forEach((l,i)=>{
    if(l.hide&&!ed)return;                                    /* a layer left out of the switcher is only reachable from the editor */
    const b=document.createElement("button");b.className="lsc"+(i===S.li?" on":"")+(l.hide?" dim":"");
    b.title=layerName(i)+(l.hide?" (not in the switcher)":"")+(ed?" - tap the current mode, or hold any mode, to change its icon or delete it":"");b.setAttribute("aria-label",layerName(i));b.innerHTML=layerFace(l,i);
    /* it switches on tap (not on press) so the bar can be scrolled with a finger when there are more layers than fit on screen */
    let tm=0,longed=false,sx=0,sy=0;
    const stop=()=>{clearTimeout(tm);tm=0};
    b.onpointerdown=e=>{e.stopPropagation();longed=false;sx=e.clientX;sy=e.clientY;stop();
      if(ed)tm=setTimeout(()=>{tm=0;longed=true;layerMenu(i)},550)};          /* editing: hold a layer for its menu (icon, delete) */
    b.onpointermove=e=>{if(tm&&Math.hypot(e.clientX-sx,e.clientY-sy)>8)stop()};
    b.onpointerup=b.onpointercancel=b.onpointerleave=stop;
    b.oncontextmenu=e=>e.preventDefault();
    b.onclick=()=>{
      if(longed){longed=false;return}
      if(ed&&i===S.li)layerMenu(i);                                               /* editing: tap the layer you are on for its menu */
      else tryLayer(i);
    };
    box.appendChild(b);
  });
  if(ed&&S.layers.length<LMAX){                               /* quick add, only while editing */
    const a=document.createElement("button");a.className="lsc add";a.title="Add a mode (a copy of this one)";a.setAttribute("aria-label","Add a mode");a.innerHTML=svgIcon("u-add");
    a.onclick=()=>addLayer(true);act.appendChild(a);   /* no question: it copies the mode you are on */
  }
  if(ed){                                                     /* settings: opens the Modes window (add empty or copy, reorder, icons, delete) */
    const g=document.createElement("button");g.className="lsc cfg";g.title="Mode settings";g.setAttribute("aria-label","Mode settings");g.innerHTML=svgIcon("toggle")+"<span>Modes</span>";   /* same icon as the Modes window, with its name next to it */
    g.onclick=openLayers;act.appendChild(g);
  }
  placeSwitch();scrollToCur();
}
/* keep the layer on screen in view when the bar is longer than the screen */
function scrollToCur(){
  const box=$("lswb"),c=box.querySelector(".lsc.on");if(!c)return;
  if(box.scrollWidth>box.clientWidth+1)box.scrollLeft=c.offsetLeft-(box.clientWidth-c.offsetWidth)/2;
  if(box.scrollHeight>box.clientHeight+1)box.scrollTop=c.offsetTop-(box.clientHeight-c.offsetHeight)/2;
}
function placeSwitch(){
  const w=$("lsw");if(w.classList.contains("gone")||mode==="edit")return;   /* in the editor it is part of the editor header, nothing to place */
  const[W,H]=viewSize(),sw=S.sw||{},ow=w.offsetWidth,oh=w.offsetHeight;
  let x=sw.x===undefined?(W-ow)/2:sw.x/100*W,y=sw.y===undefined?(mode==="edit"?92:60):sw.y/100*H;   /* until you move it: centred, just under the top row of round buttons */
  x=clamp(x,4,Math.max(4,W-4-ow));y=clamp(y,4,Math.max(4,H-4-oh));
  w.style.left=x+"px";w.style.top=y+"px";
}
/* drag the switcher by its grip */
(()=>{
  const g=$("lswg"),w=$("lsw");let st=null;
  g.onpointerdown=e=>{e.preventDefault();e.stopPropagation();g.setPointerCapture(e.pointerId);const p=L(e);st={dx:p.x-w.offsetLeft,dy:p.y-w.offsetTop,pv:snap(),moved:false};w.classList.add("drag")};
  g.onpointermove=e=>{
    if(!st)return;const p=L(e),[W,H]=viewSize();
    const x=clamp(p.x-st.dx,4,Math.max(4,W-4-w.offsetWidth)),y=clamp(p.y-st.dy,4,Math.max(4,H-4-w.offsetHeight));
    w.style.left=x+"px";w.style.top=y+"px";S.sw=Object.assign({},S.sw,{x:+(x/W*100).toFixed(2),y:+(y/H*100).toFixed(2)});st.moved=true;
  };
  g.onpointerup=g.onpointercancel=()=>{if(!st)return;w.classList.remove("drag");if(st.moved){if(mode==="edit")commit(st.pv);save()}st=null};
})();

/* ---------- Mode changes: everything waits for Done ----------
   Adding, copying, deleting, renaming, moving a mode, changing its icon and turning "In switcher" on or off are NOT saved by themselves, in the Modes window and in the editor's mode row alike:
   Done asks Save or Discard, and Discard brings back deleted modes, old names, the old order, the old icons and the old In switcher settings. Switching modes never asks about them (only about button changes in the mode you leave). */
/* what happened to the modes since the layout was last saved (or Edit layout was opened): "" nothing, "added", "deleted" or "both" */
function modeChange(){
  if(mode!=="edit"||!EDIT0)return"";
  try{const old=(JSON.parse(EDIT0).ly||[]).map(l=>l.id),now=S.layers.map(l=>l.id),
    add=now.some(i=>!old.includes(i)),del=old.some(i=>!now.includes(i));
    return add&&del?"both":add?"added":del?"deleted":""}catch(e){return""}
}
function renamedModes(){                    /* a mode that was saved under another name */
  if(mode!=="edit"||!EDIT0)return false;
  try{const old={};(JSON.parse(EDIT0).ly||[]).forEach(l=>{old[l.id]=l.n});return S.layers.some(l=>old[l.id]!==undefined&&old[l.id]!==l.n)}catch(e){return false}
}
function modeLooks(){                 /* what happened to the icons, the order and "In switcher" of the modes that were already saved */
  if(mode!=="edit"||!EDIT0)return{icon:false,moved:false,sw:false};
  try{const old=JSON.parse(EDIT0).ly||[],ids=old.map(l=>l.id),keep=S.layers.filter(l=>ids.includes(l.id));
    const o={};old.forEach(l=>{o[l.id]=l});
    return{icon:keep.some(l=>(o[l.id].i||"")!==(l.i||"")),
      sw:keep.some(l=>!!o[l.id].hide!==!!l.hide),
      moved:keep.map(l=>l.id).join()!==ids.filter(i=>S.layers.some(l=>l.id===i)).join()}
  }catch(e){return{icon:false,moved:false,sw:false}}
}
function modeNote(){                        /* the first words of the Done question: what happened to the modes */
  const mc=modeChange(),lk=modeLooks(),w=[];
  if(mc==="added"||mc==="both")w.push("added a mode");
  if(mc==="deleted"||mc==="both")w.push("deleted a mode");
  if(renamedModes())w.push("renamed a mode");
  if(lk.icon)w.push("changed a mode icon");
  if(lk.moved)w.push("moved a mode");
  if(lk.sw)w.push("changed what is in the switcher");
  if(!w.length)return"";
  return"You "+(w.length===1?w[0]:w.slice(0,-1).join(", ")+" and "+w[w.length-1])+". ";
}
const newModes=()=>modeChange()!=="";           /* a mode was added or deleted and is waiting to be saved */
/* Nothing about the modes is saved to the saved layout by itself any more: moving, icons, In switcher, adding, deleting and renaming all wait for Done (Save or Discard). */

/* ---------- changing the layers (Edit layout only) ---------- */
function addLayer(copy,asked){
  if(S.layers.length>=LMAX)return toast("You can have up to "+LMAX+" modes");
  syncLayer();const pv=snap(),n=S.layers.length+1;
  S.layers.push(normLayer({id:Date.now(),n:"",btns:copy?JSON.parse(JSON.stringify(S.btns)):[]},n-1));
  gotoLayer(S.layers.length-1);
  toast("Mode added. Save the layout to keep it");          /* a new mode is not saved by itself: Done asks whether to save it */
}
function afterLayerChange(){ensureVisible();selectOnly(null);fill();render();swUI();if(lyrOpen())drawLayers();save();updUR()}
function delLayer(i){
  if(S.layers.length<2)return toast("A layout needs at least one mode");
  const l=S.layers[i],c=(i===S.li?S.btns:l.btns).length;
  askConfirm("Delete mode?","This mode and its "+c+" button"+(c===1?"":"s")+" will be removed from this layout. Nothing is saved until you tap Done and Save, and Discard there brings the mode back.","Delete",()=>{
    syncLayer();const wasOn=i===S.li;delete HSTORE[l.id];   /* a deleted mode takes its Undo and Redo with it */
    S.layers.splice(i,1);
    if(i<S.li)S.li--;else if(i===S.li)S.li=Math.min(i,S.layers.length-1);
    S.btns=S.layers[S.li].btns;if(wasOn)histLoad();   /* another mode is on screen now: it shows its own Undo and Redo; deleting a different mode leaves them alone */
    afterLayerChange();toast("Mode deleted. Save the layout to keep it");   /* like adding a mode, deleting one is not saved by itself: Done asks first */
  });
}
function moveLayer(i,d){
  const j=i+d;if(j<0||j>=S.layers.length)return;
  syncLayer();const pv=snap(),t=S.layers[i];S.layers[i]=S.layers[j];S.layers[j]=t;
  if(S.li===i)S.li=j;else if(S.li===j)S.li=i;
  afterLayerChange();
}
function hideLayer(i,hide){const pv=snap(),l=S.layers[i];
  if(hide&&S.layers.filter(x=>!x.hide).length<2){drawLayers();return toast("At least one mode must stay in the switcher")}if(hide)l.hide=1;else delete l.hide;swUI();if(lyrOpen())drawLayers();save()}   /* the list is redrawn so the last switch locks, and unlocks again as soon as two are on */
function openLayerIcon(i){ipLayer=i;openI()}
/* the menu of one layer in the switcher (Edit layout): change its icon or delete it */
function layerMenu(i){
  const l=S.layers[i];if(!l)return;
  const b=[];
  if(S.layers.length>1)b.push({t:"Delete",cls:"dng",fn:()=>delLayer(i)});   /* no Cancel: the ✕ closes it; two buttons side by side like the Reset Layout window */
  b.push({t:"Change Icon",cls:"pri",fn:()=>openLayerIcon(i)});
  dialog("Mode options",S.layers.length>1?"Change this mode's icon, or delete the mode and its buttons.":"Change this mode's icon. A layout needs at least one mode, so the last one cannot be deleted.",b);
}

/* ---------- the Layers window ---------- */
function drawLayers(){
  if(ensureVisible()){swUI();save()}
  const box=$("lylist");box.innerHTML="";const n=S.layers.length,vis=S.layers.filter(l=>!l.hide).length;
  $("lysub").textContent=oriName()+" \u00b7 "+n+(n===1?" mode":" modes");
  S.layers.forEach((l,i)=>{
    const r=document.createElement("div");r.className="lyr"+(i===S.li?" cur":"");
    const top=document.createElement("div");top.className="lyt";
    const ch=document.createElement("button");ch.className="lych";ch.title="Choose the icon for this mode";ch.setAttribute("aria-label","Choose the icon for "+layerName(i));ch.innerHTML=layerFace(l,i);ch.onclick=()=>openLayerIcon(i);
    const nm=document.createElement("input");nm.type="text";nm.value=l.n;nm.maxLength=24;nm.placeholder="Mode Name";nm.setAttribute("aria-label","Mode Name");
    let pv0=null;nm.onfocus=()=>{pv0=snap()};
    nm.oninput=()=>{l.n=nm.value;swUI()};
    nm.onchange=()=>{if(!l.n.trim()){l.n="";nm.value=""}pv0=null;fill();swUI();save()};   /* a rename is not saved by itself: Done asks (Save or Discard) */
    const go=document.createElement(i===S.li?"span":"button");go.className=i===S.li?"lyon":"lygo";
    go.textContent=i===S.li?"Editing":"Edit";if(i!==S.li)go.onclick=()=>tryLayer(i);
    top.append(ch,nm,go);
    const bot=document.createElement("div");bot.className="lyb";
    const tg=document.createElement("label");tg.className="lyin";
    tg.innerHTML='<span>In switcher</span><span class="sw2"><input type="checkbox"><i></i></span>';
    const cb=tg.querySelector("input");cb.checked=!l.hide;cb.onchange=()=>hideLayer(i,!cb.checked);
    if(!l.hide&&vis<2){cb.disabled=true;tg.style.opacity=".5";tg.style.pointerEvents="none"}     /* the last mode in the switcher cannot be turned off: at least one stays open */
    const act=document.createElement("div");act.className="lya";
    const ib=(ic,t,fn,dis,cls)=>{const b=document.createElement("button");b.innerHTML=svgIcon(ic);b.title=t;b.setAttribute("aria-label",t);b.disabled=!!dis;if(cls)b.className=cls;b.onclick=fn;return b};
    act.append(ib("chevron-up","Move up",()=>moveLayer(i,-1),i===0),ib("chevron-down","Move down",()=>moveLayer(i,1),i===n-1),ib("u-trash","Delete this mode",()=>delLayer(i),n<2,"dng"));
    bot.append(tg,act);r.append(top,bot);box.appendChild(r);
  });
  $("lyadd").disabled=$("lycopy").disabled=n>=LMAX;
}
function openLayers(){$("lyrm").classList.add("open");drawLayers()}
$("lyx").onclick=()=>$("lyrm").classList.remove("open");
$("lyadd").onclick=()=>addLayer(false);$("lycopy").onclick=()=>addLayer(true);

/* ---------- the round Layers button (playing): tap it and the list of layers opens under it ---------- */
const lsIsOpen=()=>$("ls").classList.contains("open");
/* the Modes button is on by default; turn it off in the menu (Modes) and it stays off */
const lsWanted=()=>S.lsOn===undefined?true:!!S.lsOn;
function lsUI(){
  const box=$("ls"),on=lsWanted();
  const show=on&&mode==="play";                                   /* shown even with a single mode: the list then holds just that one mode */
  box.classList.toggle("gone",!show);box.classList.remove("hid");   /* stays visible when the 👁 button hides the controller buttons, so you can still change mode */
  $("lsOn").classList.toggle("pri",on);
  if(!show)lsOpen(false);
  placeFollowers();separate();
}
/* after a mode is picked, the round Modes button shows that mode's icon (or number) for 1 second, then goes back to its normal icon */
const LS_DEFAULT=$("lsb").innerHTML;let lsFlashT=0;
function lsFlashStop(){clearTimeout(lsFlashT);lsFlashT=0;$("ls").classList.remove("flash");$("lsb").innerHTML=LS_DEFAULT}
function lsFlash(i){
  if(!S.layers[i])return;
  clearTimeout(lsFlashT);
  $("lsb").innerHTML='<i class="lsprev">'+layerFace(S.layers[i],i)+'</i>';$("ls").classList.add("flash");
  lsFlashT=setTimeout(lsFlashStop,1000);
}
function lsDraw(){
  ensureVisible();
  const l=$("lsl");l.innerHTML="";
  S.layers.forEach((ly,i)=>{
    if(ly.hide)return;
    const b=document.createElement("button");b.className="lsr"+(i===S.li?" on":"");b.setAttribute("role","menuitem");b.setAttribute("aria-label",layerName(i));b.dataset.i=i;
    b.classList.add("solo");                                                 /* the mode name is never shown: just the number or icon, centred in the row */
    b.innerHTML='<i class="lsf">'+layerFace(ly,i)+'</i>';
    b.onclick=()=>{lsOpen(false);gotoLayer(i);lsFlash(i)};
    l.appendChild(b);
  });
}
/* which of the 4 screen edges the round Modes button is nearest to decides how its list opens:
   nearest the left edge -> a horizontal list to the right of it, nearest the right edge -> a horizontal list to its left,
   nearest the top -> a vertical list below it, nearest the bottom -> a vertical list above it */
function lsSide(){
  const box=$("ls"),aw=$("app").offsetWidth,ah=$("app").offsetHeight,bx=box.offsetLeft,by=box.offsetTop;
  const d={top:by,bottom:ah-(by+40),left:bx,right:aw-(bx+40)};
  let best="top";["top","bottom","left","right"].forEach(k=>{if(d[k]<d[best])best=k});   /* a tie goes to top, bottom, then left, right */
  return best;
}
const lsHoriz=()=>{const s=$("ls").dataset.side;return s==="left"||s==="right"};
function lsOpen(o){
  const box=$("ls"),l=$("lsl");
  if(!o){box.classList.remove("open");return}
  if(box.classList.contains("gone"))return;
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,bx=box.offsetLeft,by=box.offsetTop;
  const side=lsSide();box.dataset.side=side;
  lsDraw();
  l.style.left=l.style.top="";l.style.maxWidth=l.style.maxHeight="";
  if(side==="left"||side==="right"){
    const room=side==="left"?aw-(bx+46)-6:bx-6-6;                       /* the space between the button and the far screen edge */
    l.style.maxWidth=Math.max(120,Math.min(room,aw-12))+"px";
  }else{
    const room=side==="top"?ah-(by+46)-6:by-6-6;
    l.style.maxHeight=Math.max(100,Math.min(room,Math.round(ah*.6)))+"px";
  }
  box.classList.add("open");
  const w=l.offsetWidth,h=l.offsetHeight;
  if(side==="left"||side==="right"){
    const y=clamp(by+20-h/2,6,Math.max(6,ah-6-h))-by;                   /* centred beside the button, kept inside the screen */
    l.style.top=y+"px";l.style.left=side==="left"?"46px":(-(w+6))+"px";
  }else{
    const x=clamp(bx+20-w/2,6,Math.max(6,aw-6-w))-bx;                   /* centred under / over the button, kept inside the screen */
    l.style.left=x+"px";l.style.top=side==="top"?"46px":(-(h+6))+"px";
  }
  const cur=l.querySelector(".lsr.on");
  if(cur){
    if(side==="left"||side==="right")l.scrollLeft=cur.offsetLeft-(l.clientWidth-cur.offsetWidth)/2;
    else l.scrollTop=cur.offsetTop-(l.clientHeight-cur.offsetHeight)/2;
  }
}
/* Hold the Modes button for a moment and the list opens under your finger: slide to a mode (its icon pops and the button shows it), lift your finger to pick it.
   Lifting outside the list after sliding cancels; lifting without sliding leaves the list open for a normal tap. */
const LSH={i:-1,slid:false,face:"",on:false};
function lsHoldAt(e){                                        /* the mode row under the finger (-1 for none) */
  const l=$("lsl"),lr=BR(l),p=L(e),pad=28,hz=lsHoriz();
  if(p.x<lr.left-pad||p.x>lr.right+pad||p.y<lr.top-pad||p.y>lr.bottom+pad)return-1;
  if(hz){if(p.x<lr.left+22)l.scrollLeft-=7;else if(p.x>lr.right-22)l.scrollLeft+=7}   /* a long list scrolls while the finger rests at its edge */
  else{if(p.y<lr.top+22)l.scrollTop-=7;else if(p.y>lr.bottom-22)l.scrollTop+=7}
  const q=hz?p.x:p.y;let hit=-1;
  [...l.querySelectorAll(".lsr")].forEach(r=>{const b=BR(r);if(hz?(q>=b.left-2&&q<=b.right+2):(q>=b.top-2&&q<=b.bottom+2))hit=+r.dataset.i});
  return hit;
}
function lsHoldShow(i){                                      /* mark the target row and show its face on the round button */
  const l=$("lsl"),b=$("lsb");
  l.querySelectorAll(".lsr.tgt").forEach(r=>r.classList.remove("tgt"));
  if(i>=0){const r=l.querySelector('.lsr[data-i="'+i+'"]');if(r)r.classList.add("tgt")}
  if(!LSH.face)LSH.face=b.innerHTML;
  b.innerHTML=i>=0?'<i class="lsprev">'+layerFace(S.layers[i],i)+'</i>':LSH.face;
}
floater($("lsb"),$("ls"),"ls",()=>{if(mode==="play")lsOpen(!lsIsOpen())},()=>lsOpen(false),{
  ms:350,
  start:()=>{if(mode!=="play")return;lsFlashStop();LSH.i=-1;LSH.slid=false;LSH.face="";LSH.on=true;lsOpen(true);$("ls").classList.add("sliding");buzz()},
  move:e=>{if(!LSH.on)return;const i=lsHoldAt(e);if(i===LSH.i)return;LSH.i=i;if(i>=0){LSH.slid=true;buzz()}lsHoldShow(i)},
  end:e=>{
    if(!LSH.on)return;LSH.on=false;
    const i=e?lsHoldAt(e):-1,pick=i>=0?i:-1;
    $("ls").classList.remove("sliding");lsHoldShow(-1);if(LSH.face){$("lsb").innerHTML=LSH.face;LSH.face=""}
    if(pick>=0){lsOpen(false);if(pick!==S.li)gotoLayer(pick);lsFlash(pick)}
    else if(LSH.slid||!e)lsOpen(false);                      /* slid and let go off the list: cancel */
    LSH.i=-1;LSH.slid=false;
  }
});
$("lsOn").onclick=()=>{S.lsOn=!lsWanted();if(S.lsOn)attach("ls");lsUI();save()};   /* shown again: back beside the menu button */
root.addEventListener("pointerdown",e=>{if(lsIsOpen()&&!e.composedPath().includes($("ls")))lsOpen(false)},true);   /* a tap anywhere else closes the list */
