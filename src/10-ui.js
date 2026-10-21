/* ---------- layout switching: portrait and landscape each keep their own layout ---------- */
const layoutKey=()=>{const[w,h]=viewSize();return w>h?"l":"p"};
let LW=null;
function syncLayout(){
  S.alt=S.alt||{};const k=layoutKey(),vw=viewSize()[0],same=LW!==null&&Math.abs(vw-LW)<2;LW=vw;
  if(!S.lo){S.lo=k;return}
  /* the on-screen keyboard only changes the height; a real rotation also changes the width */
  if(same||S.lo===k)return;
  /* the preset is the same in portrait and landscape: a stored layout from a different preset is rebuilt from the current one */
  S.altC=S.altC||{};const cn=ctrlPreset().name;
  releaseAll();const keepLi=S.li;S.alt[S.lo]=layoutObj();S.altC[S.lo]=cn;S.lo=k;
  const stale=S.alt[k]&&S.altC[k]!==undefined&&S.altC[k]!==cn;
  setLayout(S.alt[k]&&!stale?S.alt[k]:resetLayout());fitBtns();delete S.alt[k];delete S.altC[k];if(stale)setCur(null);
  if(keepLi>0&&keepLi<S.layers.length){S.li=keepLi;S.btns=S.layers[keepLi].btns}   /* rotating while on layer 3 lands on layer 3 of the other orientation, if it has one */   /* a different controller was chosen in the other orientation */
  selectOnly(null);histReset();
  if(mode==="edit"){EDIT0=MODE0=EDIT_START=snap();toast((k==="l"?"Landscape":"Portrait")+" layout loaded")}
  updUR();save();
}
function refreshNow(){applyScale();syncLayout();fill();render();swUI();placeAll();if($("laym").classList.contains("open"))layUpdate()}
let refRaf=0;function refresh(){if(refRaf)return;refRaf=requestAnimationFrame(()=>{refRaf=0;refreshNow()})}   /* many resize events in one frame = one rebuild */
addEventListener("resize",refresh);
if(window.visualViewport)visualViewport.addEventListener("resize",refresh);
addEventListener("orientationchange",()=>setTimeout(refresh,150));
/* the page can still change its width after it first appears (scrollbar, toolbar, late layout): centre the buttons again once it has settled */
addEventListener("load",()=>setTimeout(refresh,50));setTimeout(refresh,800);

/* ---------- editor bar: a drawer you pull with the tab at the top ---------- */
let ebHide=false,ebTimer=0;
function ebSet(h,anim){
  ebHide=h;const b=$("ebar"),t=$("etog");clearTimeout(ebTimer);b.classList.remove("show");
  t.classList.toggle("up",h);
  const lab=h?"Show the editor bar":"Hide the editor bar";t.title=lab;t.setAttribute("aria-label",lab);
  if(h)b.classList.add("hide");
  else{b.classList.remove("hide");if(anim){void b.offsetWidth;b.classList.add("show");ebTimer=setTimeout(()=>b.classList.remove("show"),1000)}}
}
$("etog").onclick=()=>{try{navigator.vibrate&&navigator.vibrate(8)}catch(e){}ebSet(!ebHide,true)};

/* ---------- modes ---------- */
function setMode(m){
  unlockAll();if(m==="play"&&mode==="edit")histReset();   /* leaving the layout editor (Done, Save or Discard) clears the Undo and Redo of every mode */
  mode=m;if(m==="edit"){ebSet(false,false);HIDDEN=false;multi=false;$("panel").classList.remove("min");}
  if(typeof tutClose==="function")tutClose();
  ["laym","lyrm","presm","ipicker","picker","confm","donm","infom"].forEach(i=>$(i).classList.remove("open"));
  SAVE_FIRST=false;$("shell").dataset.mode=m;capturing=false;
  if(m==="play"){selectOnly(null);$("hud").classList.remove("open")}
  if(m==="edit"&&typeof vkOpen!=="undefined"&&vkOpen)vkShow(false);
  hsUI();dsUI();statsUI();netUI();fill();render();swUI();if(typeof kbUI==="function")kbUI();
}
const L=e=>{const n=performance.now();if(!L.r||n-L.t>50){L.r=BR($("app"));L.t=n}const r=L.r,s=wtScale();return{x:e.clientX*s-r.left,y:e.clientY*s-r.top}};

/* ---------- drawing the buttons ---------- */
const tw=t=>Array.from(t).reduce((n,c)=>n+(c.charCodeAt(0)>127?1.1:.62),0);
function render(){
  const ov=$("ov");ov.innerHTML="";
  S.btns.forEach(b=>{
    if(HIDDEN&&mode==="play")return;
    const d=document.createElement("div"),an=b.type==="analog",cap=S.caps!==0&&!b.nocap,isSel=mode==="edit"&&SELS.has(b);
    const locked=an?ALOCK.has(b.id):LOCK.has(b.id);
    d.className="kb "+(an?"stick":b.shape)+(isSel?" sel":"")+(S.border===0||b.nob?" nb":"")+(b.lock?" lockon":"")+(locked?(an?" locked lkup":" down locked"):"");d.dataset.id=b.id;
    d.style.cssText=`--c:${(b.c||"#fff").toLowerCase()==="#f87171"?"#ff6b8e":(b.c||"#fff")};left:${b.x}%;top:${b.y}%;width:${b.w}px;height:${btnH(b)}px`;
    d.innerHTML=an?`<div class="knob">${LKI}</div>${cap?`<small>${esc(b.label)}</small>`:""}`:
      (b.img?`<img${b.inv?' class="inv"':""} src="${b.img}">`:(iconHtml(b.icon)?`<i class="gi">${iconHtml(b.icon)}</i>`:`<span style="--n:${Math.max(.6,tw(b.icon||b.label)).toFixed(2)}">${esc(b.icon||b.label)}</span>`))+(cap?`<small>${esc(kname(b))}</small>`:"")+LKI;
    if(an&&locked)d.querySelector(".knob").style.transform=`translate(0,${-b.w*.3}px)`;   /* a locked stick shows its knob pushed up */
    d.onpointerdown=e=>down(e,b,d);
    if(mode==="edit"&&b===sel){const z=document.createElement("div");z.className="rz";z.onpointerdown=e=>rsz(e,b);d.appendChild(z)}
    ov.appendChild(d);
  });
}
const elOf=b=>$("ov").querySelector(`[data-id="${b.id}"]`);

/* ---------- pressing, selecting, moving and resizing buttons ---------- */
let drag=null;
function down(e,b,d){
  e.preventDefault();
  if(mode!=="edit"){
    if(b.type==="analog")return stick(e,b,d);
    d.setPointerCapture(e.pointerId);
    if(b.lock&&LOCK.has(b.id)){                         /* touching a locked button lets it go */
      LOCK.delete(b.id);press(b,false,d);d.classList.remove("locked");buzz();
      d.onpointerup=d.onpointercancel=()=>{d.onpointerup=d.onpointercancel=null};
      return;
    }
    press(b,true,d);
    let lt=0,armed=false;
    if(b.lock){                                          /* hold it for 0.5 s (the lock icon shows, ready) and let go: it stays pressed. While your finger is still down nothing is locked yet */
      d.classList.add("holding");
      lt=setTimeout(()=>{armed=true;d.classList.remove("holding");d.classList.add("armed");buzz()},LOCK_MS);
    }
    d.onpointerup=d.onpointercancel=ev=>{
      clearTimeout(lt);d.classList.remove("holding","armed");
      if(armed&&!(ev&&ev.type==="pointercancel")){LOCK.add(b.id);d.classList.add("locked")}   /* let go while ready: now locked */
      else press(b,false,d);
      d.onpointerup=d.onpointercancel=null;
    };
    return;
  }
  const was=SELS.has(b);
  if(multi){SELS.add(b);sel=b}else if(!was||SELS.size>1)selectOnly(b);
  const p=L(e),items=[...SELS].map(x=>({b:x,x0:x.x,y0:x.y}));
  fill();render();
  drag={b,items,sx:p.x,sy:p.y,W:$("ov").offsetWidth,H:$("ov").offsetHeight,pv:snap(),moved:false,untoggle:multi&&was};
  const el=elOf(b);el.setPointerCapture(e.pointerId);el.onpointermove=mv;
  el.onpointerup=()=>{
    if(!drag)return;
    if(drag.moved)commit(drag.pv);
    else if(drag.untoggle){SELS.delete(b);sel=[...SELS].pop()||null;fill();render()}   /* tap a selected button again to deselect it */
    drag=null;save();
  };
}
function mv(e){
  if(!drag)return;const p=L(e);let dx=p.x-drag.sx,dy=p.y-drag.sy;
  if(!drag.moved){if(Math.hypot(dx,dy)<4)return;drag.moved=true}
  const{items,W,H}=drag;
  if(S.snap){const a=items.find(i=>i.b===drag.b),ax=a.x0*W/100,ay=a.y0*H/100;dx=Math.round((ax+dx)/20)*20-ax;dy=Math.round((ay+dy)/20)*20-ay}
  let x1=-1e9,x2=1e9,y1=-1e9,y2=1e9;                      /* keep the whole group on screen */
  items.forEach(i=>{const x=i.x0*W/100,y=i.y0*H/100;x1=Math.max(x1,-x);x2=Math.min(x2,W-x-i.b.w);y1=Math.max(y1,-y);y2=Math.min(y2,H-y-btnH(i.b))});
  dx=clamp(dx,x1,x2);dy=clamp(dy,y1,y2);
  items.forEach(i=>{i.b.x=+((i.x0*W/100+dx)/W*100).toFixed(2);i.b.y=+((i.y0*H/100+dy)/H*100).toFixed(2);const el=elOf(i.b);if(el){el.style.left=i.b.x+"%";el.style.top=i.b.y+"%"}});
}
/* the round handle resizes the primary button and scales every other selected button by the same amount */
function rsz(e,b){
  e.stopPropagation();e.preventDefault();
  const z=e.target,p0=L(e),pv=snap(),k=b.type==="analog"?1:(KF[b.shape]||1),w0=b.w,base=[...SELS].map(x=>({b:x,w0:x.w}));
  z.setPointerCapture(e.pointerId);
  z.onpointermove=ev=>{
    const p=L(ev),f=clamp(w0+Math.max(p.x-p0.x,(p.y-p0.y)/k),44,300)/w0;
    base.forEach(i=>{i.b.w=clamp(Math.round(i.w0*f),44,300);const el=elOf(i.b);if(el){el.style.width=i.b.w+"px";el.style.height=btnH(i.b)+"px"}});
    $("pz").value=b.w;$("pzv").textContent=b.w+" px";
  };
  z.onpointerup=()=>{z.onpointermove=z.onpointerup=null;commit(pv);render();save()};
}
/* one Hide/Show button hides every other button while playing */
/* let every locked button and stick go (switching to the editor, hiding the buttons, changing layout) */
function unlockAll(){
  [...LOCK].forEach(id=>{const b=S.btns.find(x=>x.id===id);if(b)press(b,false)});LOCK.clear();
  [...ALOCK.values()].forEach(f=>{try{f()}catch(e){}});ALOCK.clear();
}
function toggleAll(){
  unlockAll();HIDDEN=!HIDDEN;held.forEach(id=>{const b=S.btns.find(x=>x.id===id);if(b)press(b,false)});
  Object.keys(mt).forEach(k=>clearInterval(mt[k]));render();swUI();hsUI();statsUI();netUI();   /* the Performance and Network readouts hide (and stop) with the buttons */
}

/* ---------- small round buttons that can be dragged anywhere (menu and Hide/Show) ---------- */
function floater(btn,box,key,onTap,onDragStart,hold){
  let st=null,idle;
  const wake=()=>{box.classList.add("active");clearTimeout(idle);idle=setTimeout(()=>box.classList.remove("active"),2500)};
  btn.onpointerdown=e=>{e.preventDefault();btn.setPointerCapture(e.pointerId);const p=L(e);st={ox:p.x-box.offsetLeft,oy:p.y-box.offsetTop,sx:p.x,sy:p.y,m:false,h:false,ht:0};wake();
    if(hold){const me=st;me.ht=setTimeout(()=>{if(st===me&&!me.m){me.h=true;hold.start()}},hold.ms)}};   /* held still: hold-and-slide starts (Modes button) */
  btn.onpointermove=e=>{
    if(!st)return;const p=L(e);
    if(st.h){hold.move(e);wake();return}                       /* sliding to pick: the button itself stays where it is */
    if(!st.m){if(Math.hypot(p.x-st.sx,p.y-st.sy)<6)return;st.m=true;clearTimeout(st.ht);if(onDragStart)onDragStart()}
    const aw=$("app").offsetWidth,ah=$("app").offsetHeight,x=clamp(p.x-st.ox,0,aw-40),y=clamp(p.y-st.oy,0,ah-40);
    box.style.left=x+"px";box.style.top=y+"px";S[key]={x:+(x/(aw-40)).toFixed(4),y:+(y/(ah-40)).toFixed(4)};wake();placeFollowers();
  };
  btn.onpointerup=e=>{if(!st)return;clearTimeout(st.ht);if(st.h){hold.end(e);st=null;wake();return}if(st.m){if(key!=="hud")snapHome(key);placeFollowers();separate(key);placeFollowers();save()}else onTap();st=null;wake()};
  btn.onpointercancel=()=>{if(st){clearTimeout(st.ht);if(st.h)hold.end(null)}st=null};
}
function placeFloat(box,key,def){
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,f=S[key]||def;
  box.style.left=Math.round(f.x*(aw-40))+"px";box.style.top=Math.max(8,Math.round(f.y*(ah-40)))+"px";
}
/* The keyboard and Hide/Show buttons sit next to the menu button until you drag them somewhere else:
   menu, keyboard, hide/show from left to right, and they move together with the menu button. One that is shown takes the next free spot beside the menu,
   and one you moved (or turned off) leaves its spot to the other. Drop a moved button back near its old spot in the line and it joins the line again. */
function followers(){return LINE.map(k=>[k,$(k)]).filter(([k,b])=>!b.classList.contains("gone"))}
/* the spots beside the menu button if "key" were attached too (it would go last): [{x,y}, ...] in px */
function lineSlots(key){
  const aw=$("app").offsetWidth,h=$("hud"),n=followers().filter(([k])=>k!==key&&!S[k]).length+1;
  const def=!S.hud,half=(40+48*n)/2,hx=def?(aw/2-half):(parseFloat(h.style.left)||0),hy=def?8:(parseFloat(h.style.top)||0);
  const dir=def||hx+48*n+40<=aw||hx-48*n<0?1:-1,o=[];
  for(let i=0;i<n;i++)o.push({x:def?aw/2+48*(i+1)-half:clamp(hx+dir*48*(i+1),0,aw-40),y:hy});
  return o;
}
/* dropped close to a spot in the line beside the menu button: it is attached again, after the buttons that were attached before it */
function snapHome(key){
  const box=$(key);if(!S[key])return;
  if(lineSlots(key).some(t=>Math.hypot(box.offsetLeft-t.x,box.offsetTop-t.y)<44))attach(key);
}
function placeFollowers(){
  const aw=$("app").offsetWidth,h=$("hud");
  const list=followers().filter(([k])=>!S[k]),n=list.length;
  /* not moved by the user: the menu button and the buttons beside it are centred together at the top of the screen, on one line.
     This is done with CSS (50% of the screen width) instead of a pixel number, so it stays centred whatever width the page has at that moment. */
  const def=!S.hud,half=(40+48*n)/2;
  if(def){h.style.left="calc(50% - "+half+"px)";h.style.top="8px";placeMenu()}
  const hx=def?0:parseFloat(h.style.left)||0,hy=parseFloat(h.style.top)||0;
  const dir=def||hx+48*n+40<=aw||hx-48*n<0?1:-1;           /* beside the menu on its right; on its left when there is no room */
  list.forEach(([k,b],i)=>{
    b.style.left=def?"calc(50% + "+(48*(i+1)-half)+"px)":clamp(hx+dir*48*(i+1),0,aw-40)+"px";
    b.style.top=hy+"px";
  });
}
/* The menu (☰), keyboard and hide/show buttons never sit on top of each other.
   After one is dropped on another, the dropped one slides to the nearest free spot beside it. */
function floatBoxes(){const o=[["hud",$("hud")]];LINE.map(k=>[k,$(k)]).forEach(([k,b])=>{if(!b.classList.contains("gone")&&getComputedStyle(b).display!=="none")o.push([k,b])});return o}
function separate(pref){
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,bs=floatBoxes(),near=(x1,y1,x2,y2)=>Math.abs(x1-x2)<44&&Math.abs(y1-y2)<44;
  for(let n=0;n<4;n++){
    let moved=false;
    for(let i=0;i<bs.length&&!moved;i++)for(let j=i+1;j<bs.length&&!moved;j++){
      const[ka,a]=bs[i],[kb,b]=bs[j];if(!near(a.offsetLeft,a.offsetTop,b.offsetLeft,b.offsetTop))continue;
      /* move the one that was just dropped; otherwise the one you placed yourself (never one that simply follows the menu button) */
      const mv=pref===ka?[ka,a]:pref===kb?[kb,b]:(kb!=="hud"&&S[kb])?[kb,b]:(ka!=="hud"&&S[ka])?[ka,a]:null;
      if(!mv)continue;
      const [k,box]=mv,cx=box.offsetLeft,cy=box.offsetTop,c=[];
      bs.forEach(([,o])=>{if(o===box)return;[[48,0],[-48,0],[0,48],[0,-48],[48,48],[-48,48],[48,-48],[-48,-48],[96,0],[-96,0],[0,96]].forEach(([dx,dy])=>c.push([o.offsetLeft+dx,o.offsetTop+dy]))});
      const ok=c.filter(([x,y])=>x>=0&&y>=0&&x<=aw-40&&y<=ah-40&&bs.every(([,o])=>o===box||!near(o.offsetLeft,o.offsetTop,x,y))).sort((p,q)=>Math.hypot(p[0]-cx,p[1]-cy)-Math.hypot(q[0]-cx,q[1]-cy));
      if(!ok.length)continue;
      const [x,y]=ok[0];box.style.left=x+"px";box.style.top=y+"px";S[k]={x:+(x/(aw-40)).toFixed(4),y:+(y/(ah-40)).toFixed(4)};moved=true;
    }
    if(!moved)break;
  }
}
let menuGuard=0,menuPrev=null;
/* While the menu is open the round button may be moved out of the way to give the menu room (top of the screen in portrait, left/right edge in landscape).
   Where it was is remembered and it goes back there when the menu closes. */
function menuMove(nx,ny){
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,h=$("hud");
  if(!menuPrev)menuPrev={v:S.hud?{x:S.hud.x,y:S.hud.y}:null};
  h.style.left=nx+"px";h.style.top=ny+"px";
  S.hud={x:+(nx/(aw-40)).toFixed(4),y:+(ny/(ah-40)).toFixed(4)};placeFollowers();
}
function menuRestore(){
  if(!menuPrev)return;const p=menuPrev;menuPrev=null;
  if(p.v)S.hud=p.v;else delete S.hud;
  placeFloat($("hud"),"hud",{x:.5,y:0});placeFollowers();
}
new MutationObserver(()=>{const o=$("hud").classList.contains("open");$("shell").classList.toggle("menuopen",o);if(o)placeMenu();else menuRestore()}).observe($("hud"),{attributes:true,attributeFilter:["class"]});
function placeMenu(){
  const aw0=$("app").offsetWidth,ah0=$("app").offsetHeight,portrait=ah0>aw0;
  /* portrait: when the menu opens, the round button goes to the top of the screen so the menu has the whole screen below it */
  if(portrait&&$("hud").classList.contains("open")&&$("hud").offsetTop>8)menuMove($("hud").offsetLeft,8);
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,h=$("hud"),x=h.offsetLeft,y=h.offsetTop,m=$("menu"),mw=Math.min(560,aw-20);
  m.style.width=mw+"px";let lf=clamp((40-mw)/2,10-x,aw-10-mw-x);
  m.style.maxHeight=Math.max(120,portrait?ah-64:ah-16)+"px";   /* never taller than the screen: the menu scrolls inside instead (portrait: always fits below the button at the top) */
  const mh=Math.min(m.offsetHeight||200,Math.max(120,ah-16));let top=y+48;      /* below the button; else above it; else beside it */
  if(top+mh>ah-8){
    if(y-mh-8>=8)top=y-mh-8;
    else{
      /* no room above or below: put it beside the round button, never on top of it, so the finger that opened it is not over a menu row */
      let hx=x,rr=aw-10-(x+48),rl=x-8-10;
      if(Math.max(rr,rl)<mw){
        /* the full menu does not fit beside the button: while the menu is OPEN, slide the round button to the nearest side edge of the screen so the menu gets all the room it can */
        const nx=x+20<aw/2?4:aw-44;
        if(h.classList.contains("open")&&Math.abs(nx-x)>1){menuMove(nx,y);hx=nx}
        rr=aw-10-(hx+48);rl=hx-8-10;
      }
      const room=Math.max(rr,rl);
      if(room>=250){                                  /* beside the button, narrower only if it has to be */
        const w2=Math.min(mw,room);m.style.width=w2+"px";lf=rr>=rl?48:-8-w2;
        top=Math.max(8,Math.min(y,ah-8-Math.min(m.offsetHeight||mh,Math.max(120,ah-16))));
      }else top=Math.max(8,ah-8-mh);
    }
  }
  m.style.left=lf+"px";m.style.top=(top-y)+"px";m.style.transformOrigin=(20-lf)+"px "+(y+20-top)+"px";   /* grow out of the round button */
}
/* A tap on the round button opens the menu on the finger-up; some browsers then send the click of that same tap to whatever is under the finger,
   which could be a menu row (Edit Layout, Load Layout, Controllers, Buy Me A Coffee...). Clicks on the menu are ignored while it opens. */
addEventListener("click",e=>{if(performance.now()<menuGuard&&e.composedPath().includes($("menu"))){e.preventDefault();e.stopImmediatePropagation()}},true);
floater($("fab"),$("hud"),"hud",()=>{const o=$("hud").classList.toggle("open");placeMenu();if(o)menuGuard=performance.now()+500},()=>{$("hud").classList.remove("open");menuRestore()});
floater($("hsb"),$("hs"),"hs",()=>{if(mode==="play")toggleAll()});
/* every panel has a close button, and tapping outside it closes it too (menu, Save / Load layout, Controllers, Choose icon, Choose input, confirm dialogs).
   The tap still reaches whatever was tapped. While a confirm dialog is open, an outside tap only cancels that dialog. */
const OUTSIDE=[["infom","ix",["mi"]],["donm","dx",["donbtn"]],["laym","lx",["lay","lay2"]],["lyrm","lyx",["ipicker","lsw"]],["presm","px",["pre2"]],["ipicker","ipx",[]],["picker","pkx",[]]];
addEventListener("pointerdown",e=>{
  const p=e.composedPath(),inside=(...ids)=>ids.some(i=>p.includes($(i)));
  if($("hud").classList.contains("open")&&!inside("menu","fab"))$("hud").classList.remove("open");
  if($("confm").classList.contains("open")){if(!inside("confm"))$("cx").click();return}
  OUTSIDE.forEach(([id,x,trig])=>{if($(id).classList.contains("open")&&!inside(id,...trig))$(x).click()});
},true);
$("mx").onclick=()=>$("hud").classList.remove("open");
/* the (i) button beside the close button: a small popover that says why WebTroller helps with no physical keyboard */
const tipSet=on=>{$("mtip").classList.toggle("on",on);$("mi").classList.toggle("on",on);$("mi").setAttribute("aria-expanded",on)};
$("mi").onclick=()=>tipSet(!$("mtip").classList.contains("on"));
addEventListener("pointerdown",e=>{if($("mtip").classList.contains("on")){const p=e.composedPath();if(!p.includes($("mtip"))&&!p.includes($("mi")))tipSet(false)}},true);
new MutationObserver(()=>{if(!$("hud").classList.contains("open"))tipSet(false)}).observe($("hud"),{attributes:true,attributeFilter:["class"]});
$("ix").onclick=$("idone").onclick=()=>$("infom").classList.remove("open");
function hsUI(){
  $("hsb").innerHTML=svgIcon(HIDDEN?"u-eye-off":"eye");
  $("hs").classList.toggle("gone",S.hsOn!==true);$("hsOn").classList.toggle("pri",S.hsOn===true);   /* off until turned on in the menu */
  placeFollowers();separate();
}
$("hsOn").onclick=()=>{S.hsOn=!S.hsOn;if(S.hsOn)attach("hs");else if(HIDDEN)toggleAll();hsUI();save()};   /* turned on: back beside the menu button; turned off while the buttons are hidden: they are shown again, so they are never stuck hidden */

/* ---------- Enable / Disable Screen: while the screen is disabled the website cannot be touched (the controller buttons still work), so a stray touch next to a button does nothing.
   The menu item turns the round button on or off (like Hide/Show Buttons); the round button disables and enables the screen. Not remembered: it is always enabled when WebTroller starts. ---------- */
let SCREEN_OFF=false;
["pointerdown","pointerup","pointermove","pointercancel","mousedown","mouseup","mousemove","click","dblclick","auxclick","contextmenu","touchstart","touchmove","touchend","touchcancel","wheel"]
  .forEach(t=>$("blk").addEventListener(t,e=>{e.stopPropagation();if(e.cancelable)e.preventDefault()},{passive:false}));
function dsUI(){
  const on=S.dsOn===true;   /* off until the person turns Lock Screen on in the menu */
  if(!on||mode==="edit")SCREEN_OFF=false;                    /* never stay locked out: button off or Edit layout open means touch works again */
  $("ds").classList.toggle("gone",!on);$("dsOn").classList.toggle("pri",on);
  $("dsb").innerHTML=svgIcon("lock");$("dsb").classList.toggle("pri",SCREEN_OFF);
  $("dsb").title=SCREEN_OFF?"Screen locked - tap to unlock":"Screen unlocked - tap to lock";
  $("shell").classList.toggle("dsoff",SCREEN_OFF);
  placeFollowers();separate();
}
/* lock / unlock animation: a lock icon at the center and a border that grows from the center to the screen edge, gone after 2 seconds (replaces the toast) */
let LKT=0;
function lockFx(locked){
  let el=$("lkfx");
  if(!el){el=document.createElement("div");el.id="lkfx";$("shell").appendChild(el)}
  clearTimeout(LKT);el.className="";void el.offsetWidth;
  const shp='<path class="lksh" d="M8 11V8a4 4 0 0 1 8 0v3"/><rect x="5" y="11" width="14" height="10" rx="2.2"/><circle cx="12" cy="16" r="1.2" stroke="none"/>';
  el.innerHTML='<i class="lkb"></i><div class="lkc"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><defs><linearGradient id="lkgr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f60ff"/><stop offset=".52" stop-color="#7c5cf6"/><stop offset="1" stop-color="#b45cf0"/></linearGradient><linearGradient id="lkhl" gradientUnits="userSpaceOnUse" x1="-8" y1="0" x2="2" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/><animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="32 0" begin="0.25s" dur="0.7s" fill="freeze"/></linearGradient></defs><g stroke="url(#lkgr)" fill="none">'+shp.replace('r="1.2"','r="1.2" fill="url(#lkgr)"')+'</g><g stroke="url(#lkhl)" fill="none">'+shp.replace('r="1.2"','r="1.2" fill="url(#lkhl)"')+'</g></svg><b>'+(locked?"Screen Locked":"Screen Unlocked")+'</b></div>';
  el.className="on "+(locked?"lk":"ul");
  LKT=setTimeout(()=>{el.className=""},1000);
}
floater($("dsb"),$("ds"),"ds",()=>{if(mode==="play"){SCREEN_OFF=!SCREEN_OFF;dsUI();lockFx(SCREEN_OFF)}});
$("dsOn").onclick=()=>{S.dsOn=!S.dsOn;if(S.dsOn)attach("ds");dsUI();save()};   /* shown again: back beside the menu button */

/* ---------- performance stats: drag to move, round handle to resize, in play and edit mode ---------- */
/* The performance and network monitors only run while they are really on screen: switched on, in play mode, the overlay is up
   (not hidden or closed), the tab is in front, and the background has told us the overlay's state. Otherwise nothing runs. */
function monOK(){try{return pageKnown&&!pageHidden&&!document.hidden&&!HIDDEN}catch(e){return false}}      /* HIDDEN: the 👁 button has hidden everything */
function monSync(){
  const ok=monOK()&&mode==="play";
  if(S.stats&&ok)statsStart();else statsStop();
  if(S.net&&ok)netStart();else netStop();
}
document.addEventListener("visibilitychange",monSync);
const STAT={raf:0,last:0,ft:[],ts:[],next:0};
function statsUI(){
  const on=!!S.stats,show=on&&mode==="play"&&!HIDDEN;$("stats").classList.toggle("on",show);$("stbtn").classList.toggle("pri",on);
  placeStats();
  if(show&&monOK())statsStart();else statsStop();   /* the stats are not shown in the layout editor */
}
function statsStart(){
  if(STAT.raf)return;STAT.last=0;STAT.ft=[];STAT.ts=[];STAT.next=0;
  const tick=t=>{
    if(!S.stats||mode!=="play"||!monOK()){statsStop();return}      /* closed, hidden, editing or tab in the background: stop right away */
    if(STAT.last){const d=t-STAT.last;if(d<1000){STAT.ft.push(d);STAT.ts.push(t);if(STAT.ft.length>300){STAT.ft.shift();STAT.ts.shift()}}}
    STAT.last=t;if(t>=STAT.next){STAT.next=t+250;statsDraw(t)}
    STAT.raf=requestAnimationFrame(tick);
  };
  STAT.raf=requestAnimationFrame(tick);
}
function statsStop(){          /* switched off, hidden or not showing: stop the loop and throw everything away */
  if(STAT.raf)cancelAnimationFrame(STAT.raf);STAT.raf=0;STAT.ft=[];STAT.ts=[];STAT.last=0;STAT.next=0;
  try{$("stg").getContext("2d").clearRect(0,0,600,160);["stfps","stms","stlow","stmem"].forEach(i=>{$(i).textContent="--"})}catch(e){}
}
function statsGraph(ft){
  const c=$("stg"),x=c.getContext("2d"),W=150,H=40;x.setTransform(4,0,0,4,0,0);x.clearRect(0,0,W,H);
  const gy=H-16.7/50*H;x.strokeStyle="rgba(128,128,128,.45)";x.setLineDash([3,3]);x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke();x.setLineDash([]);
  const arr=ft.slice(-Math.floor(W/3));
  arr.forEach((d,i)=>{const v=Math.max(2,Math.min(d,50)/50*H);x.fillStyle=d<=18?"#4ade80":d<=34?"#facc15":"#ff6b8e";x.fillRect(W-(arr.length-i)*3,H-v,2,v)});
}
function statsText(fps,avg,low){
  const q=$("stfps");q.textContent=fps;q.dataset.q=fps>=55?"g":fps>=30?"a":"r";
  $("stms").textContent=avg.toFixed(1)+" ms";$("stlow").textContent=Math.round(low);
  const m=performance.memory;$("stmemrow").style.display=m?"":"none";if(m)$("stmem").textContent=Math.round(m.usedJSHeapSize/1048576)+" MB";
}
function statsDraw(t){
  const ft=STAT.ft;if(ft.length<3)return;
  const fps=STAT.ts.filter(x=>t-x<=1000).length,rec=ft.slice(-30),avg=rec.reduce((a,b)=>a+b,0)/rec.length;
  const worst=ft.slice().sort((a,b)=>b-a),k=Math.max(1,Math.ceil(worst.length*.01));
  statsText(fps,avg,1000/(worst.slice(0,k).reduce((a,b)=>a+b,0)/k));statsGraph(ft);
}
function placeStats(){
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,c=$("stc"),sc=(S.stsz||100)/100,f=S.sp;
  c.style.transform="scale("+sc+")";c.style.setProperty("--sc",sc);
  const bw=164*sc,bh=(c.offsetHeight||130)*sc,x=f?f.x*aw:12,y=f?f.y*ah:12+(mode==="edit"?56:0);   /* in the editor, sit below the editor bar until moved */
  $("stats").style.left=clamp(x,0,aw-bw)+"px";$("stats").style.top=clamp(y,0,ah-bh)+"px";
}
(()=>{
  const c=$("stc"),t=$("stats"),z=$("strz");let st=null;
  const dims=()=>{const sc=(S.stsz||100)/100;return{aw:$("app").offsetWidth,ah:$("app").offsetHeight,bw:164*sc,bh:(c.offsetHeight||130)*sc}};
  c.onpointerdown=e=>{if(e.target===z)return;e.preventDefault();c.classList.add("act");c.setPointerCapture(e.pointerId);const p=L(e);st={mv:true,ox:p.x-t.offsetLeft,oy:p.y-t.offsetTop}};
  z.onpointerdown=e=>{e.preventDefault();e.stopPropagation();c.classList.add("act");z.setPointerCapture(e.pointerId);const p=L(e),d=dims();st={mv:false,x0:p.x,y0:p.y,w0:d.bw,h0:d.bh}};
  const move=e=>{
    if(!st)return;const p=L(e),d=dims();
    if(st.mv){const x=clamp(p.x-st.ox,0,d.aw-d.bw),y=clamp(p.y-st.oy,0,d.ah-d.bh);t.style.left=x+"px";t.style.top=y+"px";S.sp={x:+(x/d.aw).toFixed(4),y:+(y/d.ah).toFixed(4)}}
    else{S.stsz=Math.round(clamp(st.w0+Math.max(p.x-st.x0,(p.y-st.y0)*st.w0/st.h0),90,520)/164*100);placeStats()}
  };
  c.onpointermove=z.onpointermove=move;
  c.onpointerup=z.onpointerup=()=>{c.classList.remove("act");if(st){st=null;save()}};
  c.onpointercancel=z.onpointercancel=()=>{c.classList.remove("act");st=null};
})();
$("stbtn").onclick=()=>{S.stats=!S.stats;if(S.stats){delete S.sp;delete S.stsz}statsUI();save()};   /* shown again: back at the default spot and size */


/* ---------- network monitor: same look and controls as the performance readout (drag to move, grip to resize) ---------- */
const NET={t:0,ping:[],fail:[],bytes:0,lastB:0,rate:0,obs:null,busy:false};
function netUI(){
  const on=!!S.net,show=on&&mode==="play"&&!HIDDEN;$("net").classList.toggle("on",show);$("nbtn").classList.toggle("pri",on);placeNet();
  if(show&&monOK())netStart();else netStop();            /* not shown in the layout editor */
}
function netStart(){
  if(NET.t)return;NET.ping=[];NET.fail=[];NET.bytes=0;NET.lastB=0;NET.rate=0;
  try{NET.obs=new PerformanceObserver(l=>{for(const e of l.getEntries())NET.bytes+=e.transferSize||e.encodedBodySize||0});NET.obs.observe({type:"resource"})}catch(e){NET.obs=null}
  const tick=()=>{if(!S.net||mode!=="play"||!monOK()){netStop();return}
    netProbe();NET.rate=Math.round((NET.bytes-NET.lastB)/2);NET.lastB=NET.bytes;netDraw()};
  NET.t=setInterval(tick,2000);tick();
}
function netStop(){            /* switched off, hidden or not showing: stop the timer, the observer and any waiting ping, and throw everything away */
  clearInterval(NET.t);NET.t=0;NET.gen=(NET.gen||0)+1;
  if(NET.busy)try{chrome.runtime.sendMessage({wt:"pingStop"})}catch(e){}      /* tell the background to cancel the waiting request */
  NET.busy=false;
  if(NET.obs){try{NET.obs.disconnect()}catch(e){}NET.obs=null}
  NET.ping=[];NET.fail=[];NET.bytes=NET.lastB=NET.rate=0;
  try{$("ntg").getContext("2d").clearRect(0,0,600,160);["nping","njit","nloss","nrate","ncon"].forEach(i=>{$(i).textContent="--"})}catch(e){}
}
/* latency: the background script times a small request to this site's server */
function netProbe(){
  if(NET.busy||!NET.t||!/^https?:/.test(location.origin))return;NET.busy=true;const g=NET.gen;
  try{chrome.runtime.sendMessage({wt:"ping",url:location.origin+"/"},r=>{
    void chrome.runtime.lastError;if(g!==NET.gen||!NET.t)return;NET.busy=false;      /* a late answer after the readout stopped is dropped */
    const ok=!!r&&typeof r.ms==="number";
    NET.fail.push(ok?0:1);NET.ping.push(ok?r.ms:-1);if(NET.fail.length>30)NET.fail.shift();if(NET.ping.length>300)NET.ping.shift();netDraw();
  })}catch(e){NET.busy=false}
}
function netGraph(){
  const c=$("ntg"),x=c.getContext("2d"),W=150,H=40;x.setTransform(4,0,0,4,0,0);x.clearRect(0,0,W,H);
  const gy=H-80/300*H;x.strokeStyle="rgba(128,128,128,.45)";x.setLineDash([3,3]);x.beginPath();x.moveTo(0,gy);x.lineTo(W,gy);x.stroke();x.setLineDash([]);
  const arr=NET.ping.slice(-Math.floor(W/3));
  arr.forEach((d,i)=>{const px=W-(arr.length-i)*3;
    if(d<0){x.fillStyle="rgba(248,113,113,.4)";x.fillRect(px,0,2,H);return}
    const v=Math.max(2,Math.min(d,300)/300*H);x.fillStyle=d<=80?"#4ade80":d<=150?"#facc15":"#ff6b8e";x.fillRect(px,H-v,2,v)});
}
function netDraw(){
  const q=$("nping"),ok=NET.ping.filter(v=>v>=0),last=[...NET.ping].reverse().find(v=>v>=0),lastFail=NET.ping.length&&NET.ping[NET.ping.length-1]<0;
  if(!navigator.onLine){q.textContent="Off";q.dataset.q="r"}
  else if(last===undefined){q.textContent="--";q.dataset.q="a"}
  else{q.textContent=Math.round(last);q.dataset.q=lastFail?"r":last<=80?"g":last<=150?"a":"r"}
  const r=NET.ping.slice(-20).filter(v=>v>=0);let j=0;for(let i=1;i<r.length;i++)j+=Math.abs(r[i]-r[i-1]);
  $("njit").textContent=r.length>1?(j/(r.length-1)).toFixed(1)+" ms":"--";
  $("nloss").textContent=NET.fail.length?Math.round(NET.fail.reduce((a,b)=>a+b,0)/NET.fail.length*100)+" %":"--";
  const b=NET.rate;$("nrate").textContent=b<1024?b+" B/s":b<1048576?(b/1024).toFixed(1)+" KB/s":(b/1048576).toFixed(2)+" MB/s";
  const cn=navigator.connection;$("nconrow").style.display=cn?"":"none";
  if(cn)$("ncon").textContent=(cn.effectiveType||"?")+(cn.downlink?" \u00b7 "+cn.downlink+" Mbps":"");
  netGraph();
}
function placeNet(){
  const aw=$("app").offsetWidth,ah=$("app").offsetHeight,c=$("ntc"),sc=(S.nsz||100)/100,f=S.np;
  c.style.transform="scale("+sc+")";c.style.setProperty("--sc",sc);
  const bw=164*sc,bh=(c.offsetHeight||150)*sc,x=f?f.x*aw:aw-bw-12,y=f?f.y*ah:12;   /* first time: top right */
  $("net").style.left=clamp(x,0,aw-bw)+"px";$("net").style.top=clamp(y,0,ah-bh)+"px";
}
(()=>{
  const c=$("ntc"),t=$("net"),z=$("nrz");let st=null;
  const dims=()=>{const sc=(S.nsz||100)/100;return{aw:$("app").offsetWidth,ah:$("app").offsetHeight,bw:164*sc,bh:(c.offsetHeight||150)*sc}};
  c.onpointerdown=e=>{if(e.target===z)return;e.preventDefault();c.classList.add("act");c.setPointerCapture(e.pointerId);const p=L(e);st={mv:true,ox:p.x-t.offsetLeft,oy:p.y-t.offsetTop}};
  z.onpointerdown=e=>{e.preventDefault();e.stopPropagation();c.classList.add("act");z.setPointerCapture(e.pointerId);const p=L(e),d=dims();st={mv:false,x0:p.x,y0:p.y,w0:d.bw,h0:d.bh}};
  const move=e=>{
    if(!st)return;const p=L(e),d=dims();
    if(st.mv){const x=clamp(p.x-st.ox,0,d.aw-d.bw),y=clamp(p.y-st.oy,0,d.ah-d.bh);t.style.left=x+"px";t.style.top=y+"px";S.np={x:+(x/d.aw).toFixed(4),y:+(y/d.ah).toFixed(4)}}
    else{S.nsz=Math.round(clamp(st.w0+Math.max(p.x-st.x0,(p.y-st.y0)*st.w0/st.h0),90,520)/164*100);placeNet()}
  };
  c.onpointermove=z.onpointermove=move;
  c.onpointerup=z.onpointerup=()=>{c.classList.remove("act");if(st){st=null;save()}};
  c.onpointercancel=z.onpointercancel=()=>{c.classList.remove("act");st=null};
})();
$("nbtn").onclick=()=>{S.net=!S.net;if(S.net){delete S.np;delete S.nsz}netUI();save()};   /* shown again: back at the default spot and size */

/* ---------- volume: the slider in the menu turns the page's sound up and down (volume.js does the work inside the page) ---------- */
const volSend=()=>{try{document.dispatchEvent(new CustomEvent("wt-vol",{detail:String(S.vol)}))}catch(e){}try{chrome.runtime.sendMessage({wtVol:S.vol})}catch(e){}};   /* the message reaches every frame of the tab */
function volUI(){const v=S.vol===undefined?100:S.vol;$("vol").value=v;$("volv").textContent=v+"%";fillRange($("vol"))}
let volRaf=0;
$("vol").oninput=e=>{S.vol=+e.target.value;$("volv").textContent=S.vol+"%";fillRange(e.target);if(!volRaf)volRaf=requestAnimationFrame(()=>{volRaf=0;volSend()});save()};

/* ---------- properties window: drag it by its header (double-tap the header to put it back) ---------- */
function placePanel(){
  const p=$("panel"),aw=$("app").offsetWidth,ah=$("app").offsetHeight,f=S.pp;
  if(!f){p.style.left=p.style.top=p.style.right=p.style.bottom=p.style.width="";return}
  const w=aw<=700?aw-16:304;p.style.width=w+"px";p.style.right="auto";p.style.bottom="auto";
  p.style.left=clamp(f.x*aw,0,aw-w)+"px";
  /* the whole window (not only its header) always stays on screen: opened (maximized) near the bottom it moves up to fit, and goes back down when it is folded again */
  const ph=p.offsetHeight;p.style.top=clamp(f.y*ah,0,Math.max(0,ah-(ph>0?ph+4:60)))+"px";
}
try{new ResizeObserver(()=>{if(S.pp)placePanel()}).observe($("panel"))}catch(e){}   /* folding, unfolding or selecting another button changes its height */
(()=>{
  const h=$("panel").querySelector("header");let st=null;
  h.onpointerdown=e=>{
    if(e.target.closest("button"))return;e.preventDefault();h.setPointerCapture(e.pointerId);
    const r=BR($("panel")),a=BR($("app")),p=L(e);st={ox:p.x-(r.left-a.left),oy:p.y-(r.top-a.top)};
  };
  h.onpointermove=e=>{if(!st)return;const p=L(e),aw=$("app").offsetWidth,ah=$("app").offsetHeight;S.pp={x:clamp(p.x-st.ox,0,aw)/aw,y:clamp(p.y-st.oy,0,ah)/ah};placePanel()};
  h.onpointerup=()=>{if(st){st=null;save()}};
  h.ondblclick=()=>{delete S.pp;placePanel();save()};
})();

function placeAll(){placeFloat($("hud"),"hud",{x:.5,y:0});["hs","kb","ds","ls"].forEach(k=>{if(S[k])placeFloat($(k),k)});placeFollowers();separate();placeFollowers();placeMenu();placeStats();placeNet();placePanel();try{placeSwitch()}catch(e){}try{kbDodge()}catch(e){}}
const fillRange=el=>{const mn=+el.min||0,mx=+el.max||100;el.style.setProperty("--p",((+el.value-mn)/(mx-mn)*100)+"%")};
function opUI(){const v=S.op===undefined?100:S.op;$("op").value=v;$("opv").textContent=v+"%";fillRange($("op"));$("ov").style.opacity=v/100;$("lsw").style.opacity=Math.max(.35,v/100)}
/* brightness: a see-through layer over the page that dims (below 100%) everything behind it; the controller itself is not affected */
function brUI(){const v=S.br===undefined?100:Math.min(100,S.br),b=$("bright");$("br").value=v;$("brv").textContent=v+"%";fillRange($("br"));
  b.style.display=v===100?"none":"block";b.style.background="rgba(0,0,0,"+(1-v/100).toFixed(3)+")"}   /* a plain black layer dims the same as brightness() but costs almost nothing to draw */
$("br").oninput=e=>{S.br=+e.target.value;brUI();save()};
$("op").oninput=e=>{S.op=+e.target.value;$("ov").style.opacity=S.op/100;$("opv").textContent=S.op+"%";fillRange(e.target);save()};
