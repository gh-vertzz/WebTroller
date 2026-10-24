/* ---------- undo / redo and dialogs ---------- */
const HIST={u:[],r:[],t:0,last:null};
/* every mode keeps its own Undo and Redo: HIST is the history of the mode on screen, HSTORE holds the history of the modes you left (by mode id).
   WHOLE marks the steps that changed all modes at once (loading a layout, choosing a controller): undoing or redoing those goes back for every mode. */
const HSTORE={},WHOLE=new Set();
const curId=()=>S.layers[S.li]&&S.layers[S.li].id;
function histSave(){const id=curId();if(id!==undefined)HSTORE[id]={u:HIST.u,r:HIST.r}}
function histLoad(){const h=HSTORE[curId()];HIST.u=h?h.u:[];HIST.r=h?h.r:[];HIST.t=0;HIST.last=null;updUR()}
function histReset(){Object.keys(HSTORE).forEach(k=>delete HSTORE[k]);HIST.u=[];HIST.r=[];HIST.t=0;HIST.last=null;updUR()}
function histCommitWhole(prev){if(snap()===prev)return;WHOLE.add(prev);commit(prev)}
/* every history step remembers which preset it belongs to (p); undo and redo never cross into another preset */
const snap=()=>JSON.stringify({b:S.btns,c:S.caps,o:S.border,p:S.ctrl||"",li:S.li,w:S.sw,ly:S.layers.map((l,i)=>i===S.li?{id:l.id,n:l.n,i:l.i,hide:l.hide}:l)});
/* Done asks about every change: the buttons, captions, borders, controller, the switcher, which modes exist, what they are called,
   their order, their icons and their "In switcher" setting. None of them is saved to the layout until you tap Done and Save. */
const modeSig=t=>{try{const p=JSON.parse(t),ly=Array.isArray(p.ly)?p.ly:[{id:0,btns:p.b}],
  L=ly.map((l,i)=>({id:l.id,n:l.n,i:l.i||"",h:l.hide?1:0,b:i===p.li?p.b:l.btns}));   /* the order of the list, each icon and each "In switcher" setting count too */
  return JSON.stringify({c:p.c,o:p.o,p:p.p,w:p.w,L})}catch(e){return t}};
const sameEdit=(a,b)=>a===b||modeSig(a)===modeSig(b);
const snapP=t=>{try{return JSON.parse(t).p||""}catch(e){return""}};
const curP=()=>S.ctrl||"";
/* a layout with one layer is saved exactly as before (btns, caps, border); with several layers it also carries layers, li (the layer on screen) and sw (the switcher).
   btns always holds the buttons of the layer on screen, so older versions can still read the file. */
const layoutObj=()=>{syncLayer();const o={btns:S.btns,caps:S.caps===0?0:1,border:S.border===0?0:1};
  if(S.layers.length>1||S.layers[0].i||S.layers[0].hide||S.layers[0].n){o.layers=S.layers;o.li=S.li;if(S.sw)o.sw=S.sw}   /* one mode with its own icon is saved the same way, so the icon is not lost */
  return JSON.parse(JSON.stringify(o))};
/* a saved layout belongs to the orientation it was saved in: portrait and landscape each have their own list */
function slotObj(){const o=layoutObj();o.o=S.lo||layoutKey();{const[sw,sh]=viewSize();o.scr={w:Math.round(sw),h:Math.round(sh)}}   /* the screen size (px) it was made on, so a smaller screen can be warned on import / restore */
 if(o.layers){o.li=0;o.btns=o.layers[0].btns}return o}   /* a saved layout always opens on its first layer */
/* keep every button fully on screen (positions are % of the screen, sizes are px) */
function fitBtns(){
  const[W,H]=viewSize();
  syncLayer();S.layers.reduce((a,l)=>a.concat(l.btns),[]).forEach(b=>{
    const k=b.type==="analog"?1:(KF[b.shape]||1),m=Math.max(44,Math.min(W,H)-8);
    if(b.w>m)b.w=Math.round(m);if(b.w*k>H-8)b.w=Math.max(44,Math.floor((H-8)/k));
    const w=b.w,h=btnH(b);
    b.x=+(clamp(b.x/100*W,4,Math.max(4,W-4-w))/W*100).toFixed(2);
    b.y=+(clamp(b.y/100*H,4,Math.max(4,H-4-h))/H*100).toFixed(2);
  });
}
function setLayout(a){
  Object.keys(HSTORE).forEach(k=>delete HSTORE[k]);   /* every mode is replaced: the stored history of the other modes no longer fits */
  const o=Array.isArray(a)?{btns:a}:a;S.caps=o.caps===0?0:1;S.border=o.border===0?0:1;
  if(Array.isArray(o.layers)&&o.layers.length){
    S.layers=o.layers.slice(0,LLOAD).map(normLayer);S.li=clamp(o.li|0,0,S.layers.length-1);S.btns=S.layers[S.li].btns;
    if(o.sw&&typeof o.sw==="object")S.sw=o.sw;else delete S.sw;
  }else{S.layers=[normLayer({btns:o.btns},0)];S.li=0;S.btns=S.layers[0].btns;delete S.sw}
}
/* replace only the buttons of the layer on screen (Reset and Controllers): the other layers stay as they are */
function setBtns(arr){S.btns=arr;S.caps=1;S.border=1;syncLayer()}
function commit(prev){if(snap()===prev)return;HIST.u.push(prev);if(HIST.u.length>80)HIST.u.shift();HIST.r=[];HIST.t=0;updUR()}
function restore(t,full,whole){
  const p=JSON.parse(t),ids=new Set([...SELS].map(b=>b.id)),sid=sel&&sel.id;
  S.caps=p.c;S.border=p.o;if(p.p!==undefined)S.ctrl=p.p||undefined;
  /* Undo and Redo: only the buttons go back; icons, names, order and the mode on screen stay as they are now. Discard (full) brings back everything, icons and order included */
  /* Undo and Redo also work after another mode was deleted (modes that are gone are not brought back); only Discard (full) rebuilds the modes from the snapshot */
  const cid=S.layers[S.li]&&S.layers[S.li].id,
    same=!full&&Array.isArray(p.ly)&&((p.ly.length===S.layers.length&&p.ly.every(l=>S.layers.some(x=>x.id===l.id)))||(!full&&p.ly.some(l=>l.id===cid)));
  if(same){
    const bm={};p.ly.forEach((l,i)=>{bm[l.id]=i===p.li?p.b:l.btns});
    S.layers.forEach(l=>{if((whole||full||l.id===cid)&&Array.isArray(bm[l.id]))l.btns=bm[l.id]});S.btns=S.layers[S.li].btns;   /* Undo and Redo: only the buttons of the mode on screen go back, the other modes are never touched */
    if(full)S.layers.forEach(l=>{const x=p.ly.find(y=>y.id===l.id);if(x&&typeof x.n==="string")l.n=x.n});   /* Discard: renamed modes get their old names back */
    if(p.w)S.sw=p.w;else delete S.sw;
  }else{
    S.btns=p.b;
    if(Array.isArray(p.ly)){S.layers=p.ly.map((l,i)=>i===p.li?Object.assign({},l,{btns:p.b}):l);S.li=clamp(p.li|0,0,S.layers.length-1);if(p.w)S.sw=p.w;else delete S.sw}
    if(full&&cid!==undefined){const k=S.layers.findIndex(l=>l.id===cid);if(k>=0){S.li=k;S.btns=S.layers[k].btns}}   /* Discard: the mode you are on stays on screen (if it still exists) */
  }
  SELS.clear();S.btns.forEach(b=>{if(ids.has(b.id))SELS.add(b)});
  sel=S.btns.find(b=>b.id===sid)||[...SELS][0]||null;HIST.t=0;fill();render();swUI();if(lyrOpen())drawLayers();save();updUR();
}
const canU=()=>HIST.u.length>0&&snapP(HIST.u[HIST.u.length-1])===curP();
const canR=()=>HIST.r.length>0&&snapP(HIST.r[HIST.r.length-1])===curP();
function undo(){if(!canU())return;const t=HIST.u.pop(),w=WHOLE.has(t),cur=snap();if(w)WHOLE.add(cur);HIST.r.push(cur);restore(t,false,w)}
function redo(){if(!canR())return;const t=HIST.r.pop(),w=WHOLE.has(t),cur=snap();if(w)WHOLE.add(cur);HIST.u.push(cur);restore(t,false,w)}
function updUR(){$("undo").disabled=!canU();$("redo").disabled=!canR()}
$("undo").onclick=undo;$("redo").onclick=redo;
addEventListener("keydown",e=>{
  if(mode!=="edit"||capturing||!(e.ctrlKey||e.metaKey)||/INPUT|SELECT|TEXTAREA/.test((root.activeElement||document.body).tagName))return;
  const k=e.key.toLowerCase();
  if(k==="z"){e.preventDefault();e.shiftKey?redo():undo()}else if(k==="y"){e.preventDefault();redo()}
});
function dialog(title,msg,buttons){
  $("ctitle").textContent=tc(title);$("cmsg").textContent=msg;const row=$("cbtns");row.innerHTML="";row.classList.toggle("stack",buttons.length>2);
  buttons.forEach(b=>{const x=document.createElement("button");x.textContent=b.t;if(b.cls)x.className=b.cls;x.onclick=()=>{$("confm").classList.remove("open");if(b.fn)b.fn()};row.appendChild(x)});
  $("confm").classList.add("open");
}
const askConfirm=(t,m,ok,fn)=>dialog(t,m,[{t:"Cancel"},{t:ok,cls:"pri",fn}]);
$("cx").onclick=()=>$("confm").classList.remove("open");

/* ---------- properties window ---------- */
const SWC=["#7dd3fc","#4ade80","#ff6b8e","#f472b6","#facc15","#a78bfa","#e5e7eb","#fb923c"];
SWC.forEach(c=>{const b=document.createElement("button");b.style.background=c;b.dataset.c=c;b.title=c;$("pswatch").insertBefore(b,$("pcl"))});
const onOff=(id,on)=>$(id).classList.toggle("pri",on);
function fill(){
  const n=SELS.size,has=mode==="edit"&&n>0,many=has&&n>1;
  /* the Properties window only shows while something is selected (the tutorial can still show it) */
  $("panel").classList.toggle("nosel",!has&&!tutPanel);
  $("fields").style.display="flex";$("fields").classList.toggle("off",!has);$("empty").style.display=has?"none":"flex";
  $("empty").querySelector("p").textContent=S.btns.length
    ?"Tap a button on the canvas to change how it looks and what it does. Drag to move it, use its round handle to resize, or turn on Multi-Select to work with several at once."
    :"Your layout is empty. Use + Button or + Analog Stick in the bar above to add your first control.";
  onOff("snap",!!S.snap);onOff("caps",S.caps!==0);onOff("bord",S.border!==0);onOff("multi",multi);
  /* Select All only appears once Multi-Select is on (the tutorial still shows it so the tour can point at it) */
  $("selall").style.display=(multi||tutOn)?"":"none";
  $("shell").dataset.grid=S.snap?1:0;$("olab").textContent=((S.lo||layoutKey())==="l"?"Landscape layout":"Portrait layout");
  const pv=$("pprev");
  if(!has){
    $("ptitle").textContent="Properties";$("psub").textContent="Select a button to edit it";pv.style.display="none";
    $("fl-icon").style.display="";$("kr").style.display="contents";$("rk").style.display="";$("rsm").style.display="none";$("rse").style.display="none";
    $("fl-name").style.display="";$("sec-ctl").style.display="";
    $("pl").value="";$("pic").innerHTML='<span style="font-size:18px">Aa</span><span class="mut">Choose An Icon</span>';
    ["pshape","pmode","pswatch"].forEach(i=>$(i).querySelectorAll("button").forEach(b=>b.classList.remove("on")));
    $("pcl").value="#ffffff";$("pz").value=90;$("pzv").textContent="";$("plk").checked=false;
    $("pk").innerHTML='<span class="mut">Select A Button First</span>';return;
  }
  const an=sel.type==="analog",k=an?(sel.mode==="keys"?(sel.kmap==="arrows"?"Arrow keys":"W A S D keys"):sel.mode==="scroll"?"Touch scroll":"Mouse look"):kname(sel);
  pv.style.display="flex";pv.style.setProperty("--c",(sel.c||"#fff").toLowerCase()==="#f87171"?"#ff6b8e":(sel.c||"#fff"));
  $("fl-name").style.display=many?"none":"";$("fl-icon").style.display=many?"none":"";$("sec-ctl").style.display=many?"none":"";
  if(many){
    pv.textContent=n;$("ptitle").textContent=n+" Buttons Selected";$("psub").textContent="Drag one to move them all \u00b7 drag the handle to resize";
  }else{
    pv.innerHTML=an?svgIcon("joystick"):(sel.img?`<img src="${sel.img}"${sel.inv?' class="inv"':""}>`:(iconHtml(sel.icon)||esc((sel.icon||sel.label||"").slice(0,4))));
    $("ptitle").textContent=sel.label||(an?"Analog Stick":"Button");
    $("psub").textContent=an?"Analog stick \u00b7 "+k:(sel.mouse||sel.key||(sel.mods&&sel.mods.length)?"Button \u00b7 presses "+k:"Button \u00b7 no key set");
    $("kr").style.display=an?"none":"contents";$("rk").style.display=an?"none":"";$("rsm").style.display=an?"":"none";$("rse").style.display=an&&sel.mode!=="keys"?"":"none";
    $("pl").value=sel.label||"";
    $("pic").innerHTML=(sel.img?`<img src="${sel.img}"${sel.inv?' class="inv"':""} style="height:22px;max-width:40px;object-fit:contain">`:(iconHtml(sel.icon)?`<i class="ico big">${iconHtml(sel.icon)}</i>`:`<span style="font-size:18px">${esc(sel.icon||"Aa")}</span>`))+`<span class="mut">${sel.img||sel.icon?"Change Icon":"Choose An Icon"}</span>`;
    $("pmode").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===(sel.mode==="keys"?(sel.kmap||"wasd"):sel.mode==="scroll"?"scroll":"look")));
    $("pse").value=sel.sens||12;$("psev").textContent=sel.sens||12;
    $("rlkt").textContent=an?"Hold the stick in a lock direction for 0.5 sec, then let go to lock it":"Hold 0.5 sec to lock the button";$("plk").checked=!!sel.lock;
    $("rlkd").style.display=an&&sel.lock?"":"none";const lkd=sel.lkd===undefined?"u":sel.lkd;$("plkd").querySelectorAll("button").forEach(x=>x.classList.toggle("on",lkd.includes(x.dataset.v)));
    $("pk").innerHTML=sel.mouse||sel.key||(sel.mods&&sel.mods.length)?`<kbd>${esc(kname(sel))}</kbd><span class="mut">Change\u2026</span>`:'<span class="mut">Not Set. Tap To Choose A Key Or Mouse Action</span>';
  }
  $("pshape").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.v===(sel.shape||"sq")));
  $("pswatch").querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.c===(sel.c||"")));
  $("pcl").value=/^#[0-9a-f]{6}$/i.test(sel.c||"")?sel.c:"#ffffff";
  $("pz").value=sel.w;$("pzv").textContent=sel.w+" px";
}
/* apply a change to every selected button; quick bursts of changes become one undo step */
const upd=f=>{
  if(!SELS.size)return;const pv=snap(),id=sel&&sel.id;[...SELS].forEach(f);const now=Date.now();
  if(HIST.t&&now-HIST.t<800&&HIST.last===id){HIST.t=now;HIST.r=[];updUR()}else{commit(pv);HIST.t=now;HIST.last=id}
  render();save();
};
const seg=(id,fn)=>{$(id).onclick=e=>{const b=e.target.closest("button");if(b&&sel){fn(b.dataset.v);fill()}}};
$("pl").oninput=e=>{if(SELS.size!==1)return;upd(b=>b.label=e.target.value);$("ptitle").textContent=e.target.value||"Button"};
$("pic").onclick=()=>{if(SELS.size===1)openI()};
$("pk").onclick=()=>{if(SELS.size===1)openPicker()};
seg("pshape",v=>upd(b=>{if(b.type!=="analog")b.shape=v}));
seg("pmode",v=>upd(b=>{delete b.kmap;if(v==="look")delete b.mode;else if(v==="scroll")b.mode="scroll";else{b.mode="keys";b.kmap=v}}));
$("pswatch").onclick=e=>{const b=e.target.closest("button");if(b&&sel){upd(x=>x.c=b.dataset.c);fill()}};
$("pcl").oninput=e=>{upd(b=>b.c=e.target.value);$("pswatch").querySelectorAll("button").forEach(x=>x.classList.remove("on"))};
$("pz").oninput=e=>{upd(b=>b.w=+e.target.value);$("pzv").textContent=e.target.value+" px"};
$("pse").oninput=e=>{upd(b=>b.sens=+e.target.value);$("psev").textContent=e.target.value};
$("plk").onchange=e=>{upd(b=>{if(e.target.checked)b.lock=1;else delete b.lock});fill()};
/* which directions a stick can lock to: up unless you choose others (any of up, left, right, down) */
$("plkd").onclick=e=>{const x=e.target.closest("button");if(!x||!sel)return;const v=x.dataset.v;
  upd(b=>{let c=b.lkd===undefined?"u":b.lkd;c=c.includes(v)?c.replace(v,""):c+v;if(!c)c="u";if(c==="u")delete b.lkd;else b.lkd=c});fill()};
function panelFold(min){
  const p=$("panel"),b=$("pbody");$("pcol").classList.toggle("up",!!min);
  if(b._a){b._a.cancel();b._a=null}
  const calm=!b.animate||matchMedia("(prefers-reduced-motion:reduce)").matches;
  if(min){
    if(calm||p.classList.contains("min")){p.classList.add("min");return}
    const h=b.offsetHeight;b.style.overflow="hidden";
    const a=b._a=b.animate([{height:h+"px",opacity:1,transform:"none"},{height:"0px",opacity:0,transform:"translateY(-10px)"}],{duration:320,easing:"cubic-bezier(.65,0,.35,1)",fill:"forwards"});
    a.onfinish=()=>{p.classList.add("min");a.cancel();b.style.overflow="";b._a=null};
  }else{
    p.classList.remove("min");if(calm)return;
    const h=b.offsetHeight;b.style.overflow="hidden";
    const a=b._a=b.animate([{height:"0px",opacity:0,transform:"translateY(-10px)"},{height:h+"px",opacity:1,transform:"none"}],{duration:480,easing:"cubic-bezier(.22,1,.36,1)"});
    a.onfinish=a.oncancel=()=>{b.style.overflow="";b._a=null};
  }
}
$("pcol").onclick=()=>panelFold(!$("panel").classList.contains("min"));

/* ---------- editor bar ---------- */
$("pd").onclick=()=>{const pv=snap(),gone=new Set(SELS);S.btns=S.btns.filter(b=>!gone.has(b));commit(pv);selectOnly(null);fill();render();save()};
function dupSel(){
  if(!SELS.size)return;const pv=snap(),copies=[...SELS].map((b,i)=>Object.assign({},b,{id:Date.now()+i,x:Math.min(90,b.x+4),y:Math.min(90,b.y+4)}));
  S.btns.push(...copies);commit(pv);SELS.clear();copies.forEach(b=>SELS.add(b));sel=copies[copies.length-1];fill();render();save();
}
$("pdup").onclick=dupSel;
const addB=o=>{const pv=snap(),b=Object.assign({id:Date.now(),x:40,y:40,w:90,c:"#fde68a"},o);S.btns.push(b);commit(pv);selectOnly(b);$("panel").classList.remove("min");fill();render();save()};
$("add").onclick=()=>addB({label:"New",icon:"",img:"",key:"",code:"",kc:0,shape:"sq"});
$("addA").onclick=()=>addB({type:"analog",label:"Analog",w:120,sens:12,c:"#86efac"});
$("multi").onclick=()=>{multi=!multi;if(!multi&&sel)selectOnly(sel);fill();render()};
$("selall").onclick=()=>{multi=true;SELS.clear();S.btns.forEach(b=>SELS.add(b));sel=S.btns[S.btns.length-1]||null;fill();render()};
$("snap").onclick=()=>{S.snap=S.snap?0:1;fill();save()};
$("bord").onclick=()=>{const pv=snap();S.border=S.border===0?1:0;commit(pv);fill();render();save()};
$("caps").onclick=()=>{const pv=snap();S.caps=S.caps===0?1:0;commit(pv);fill();render();save()};
/* Reset only asks when it would really change something: a layout that already is the default (same buttons, positions, keys, captions and borders) is left alone */
const canon=v=>JSON.stringify(v,(k,x)=>x&&typeof x==="object"&&!Array.isArray(x)?Object.keys(x).sort().reduce((o,i)=>(o[i]=x[i],o),{}):x);
const isDefaultLayout=()=>{try{return S.caps!==0&&S.border!==0&&canon(S.btns)===canon(resetLayout())}catch(e){return false}};
$("reset").onclick=()=>isDefaultLayout()?toast("Already the default layout"):askConfirm("Reset layout?",
  (ctrlPreset().blank?"This removes every button in the current orientation so you can build your own. You can undo it afterwards.":"This restores the default "+ctrlPreset().name+" layout (button positions and key mappings) for the current orientation. You can undo it afterwards.")+(S.layers.length>1?" Only the mode you are editing is reset. Your other modes stay as they are.":""),
  "Reset",()=>{const pv=snap();setBtns(resetLayout());commit(pv);selectOnly(null);fill();render();save()});   /* Reset is an edit: the layout you are editing stays the current one, so Save and Done still know where to save */
$("ov").onpointerdown=e=>{if(mode==="edit"&&e.target===$("ov")){selectOnly(null);fill();render()}};

/* ---------- Edit layout / Done: ask before keeping changes ---------- */
$("edit").onclick=()=>{fitBtns();EDIT0=MODE0=EDIT_START=snap();   /* the buttons of every mode are fitted to the screen BEFORE the starting point is taken, so visiting modes later never looks like a change */
  SAVED_GONE=false;setMode("edit");tutAuto()};
/* leaving the editor always lands on the first mode that is switched on in the switcher (modes switched off are skipped) */
function firstModeOn(){const i=S.layers.findIndex(l=>!l.hide);if(i<0||i===S.li)return;releaseAll();syncLayer();S.li=i;S.btns=S.layers[i].btns;fitBtns()}
function leaveEdit(){SAVED_GONE=false;firstModeOn();save();setMode("play")}
$("done").onclick=()=>{
  const changed=!sameEdit(snap(),EDIT0)||SAVED_GONE,name=curName(),exists=!!(name&&slots()[name]);
  if(exists&&!changed)return leaveEdit();   /* a layout that is already saved and has no changes: nothing to ask, as before */
  const nm=modeNote();
  const msg=SAVED_GONE?"This layout was deleted from your saved layouts, so it is not saved anymore. Save it again under a name?"
    :exists?"Save these changes to your current layout \u201c"+name+"\u201d?"
    :"This layout is not in your saved layouts yet. Save it under a name?";
  const btns=[];
  /* Discard: always for a saved layout with changes (as before); for a layout whose name is not in Load Layout only when something changed */
  if(changed)btns.push({t:"Discard",cls:"dng",fn:()=>{restore(SAVED_GONE&&EDIT_START?EDIT_START:EDIT0,true);histReset();leaveEdit();toast("Changes discarded")}});   /* the saved copy was deleted, so EDIT0 (what was saved) is just what is on screen: go back to how it was when editing began */
  btns.push({t:"Save",cls:"pri",fn:()=>{
    if(!exists){SAVE_FIRST=true;openLay();return}     /* never saved under a name: open the Save Layout panel so it can be named and saved */
    {const o=slotObj(),u=slots()[name].url;if(u)o.url=u;slots()[name]=o}   /* keeps the page address it was saved with */
    leaveEdit();toast("Saved to \u201c"+name+"\u201d")}});
  dialog(changed?"Save your changes?":"Save your layout?",nm+msg,btns);
};

/* ---------- start ---------- */
delete S.url;delete S.orient;delete S.flip;
opUI();
$("bicon").src=chrome.runtime.getURL("icons/icon128.png");
/* saved layouts used to be one list: split it into a portrait list and a landscape list */
if(!S.slotsBy){
  S.slotsBy={p:{},l:{}};
  const strip=x=>({btns:x.btns,caps:x.caps===0?0:1,border:x.border===0?0:1}),old=S.slots||{};
  Object.keys(old).forEach(n=>{const x=old[n];if(!x||!Array.isArray(x.btns))return;
    if(x.o==="p"||x.o==="l")S.slotsBy[x.o][n]=strip(x);else{S.slotsBy.p[n]=strip(x);S.slotsBy.l[n]=strip(x)}   /* no orientation recorded: keep it in both lists */
    if(x.alt)["p","l"].forEach(k=>{if(x.alt[k]&&Array.isArray(x.alt[k].btns))S.slotsBy[k][n]=strip(x.alt[k])});
  });
}
delete S.slots;
const fresh=S.lo===undefined;
refresh();updUR();statsUI();netUI();hsUI();dsUI();kbUI();volUI();brUI();swUI();
if(fresh){const p=randPreset();S.ctrl=p.name;setLayout(buildPreset(p));save();render();swUI()}   /* first launch: a random controller, never Default */
