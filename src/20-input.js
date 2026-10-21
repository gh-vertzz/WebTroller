/* ---------- sending keys and mouse actions to the page (or to a game frame on the page) ---------- */
const held=new Set(),mt={},cur={x:0,y:0,on:false};
const fwd=m=>{try{chrome.runtime.sendMessage(Object.assign({emu:1},m))}catch(e){}};   /* hand input to the focused frame */
const MODK={ctrl:{key:"Control",code:"ControlLeft",kc:17,flag:"ctrlKey"},alt:{key:"Alt",code:"AltLeft",kc:18,flag:"altKey"},shift:{key:"Shift",code:"ShiftLeft",kc:16,flag:"shiftKey"},meta:{key:"Meta",code:"MetaLeft",kc:91,flag:"metaKey"}};
function press(b,isDown,el){
  el=el||elOf(b);if(el)el.classList.toggle("down",isDown);
  if(b.mouse)return mpress(b,isDown);
  const mods=(b.mods||[]).filter(m=>MODK[m]);
  if(!b.key&&!mods.length)return;
  isDown?held.add(b.id):held.delete(b.id);
  if(mods.length)combo(b,mods,isDown);else send(b,isDown?"keydown":"keyup");
}
/* a key together with Ctrl / Alt / Shift / Win: the modifiers go down first and come up last, like on a real keyboard */
function combo(b,mods,down){
  const all={};mods.forEach(m=>all[MODK[m].flag]=true);
  if(down){
    const on={};mods.forEach(m=>{on[MODK[m].flag]=true;send(MODK[m],"keydown",Object.assign({},on))});
    if(b.key)send(b,"keydown",Object.assign({},all));
  }else{
    if(b.key)send(b,"keyup",Object.assign({},all));
    const left=Object.assign({},all);
    for(let i=mods.length-1;i>=0;i--){delete left[MODK[mods[i]].flag];send(MODK[mods[i]],"keyup",Object.assign({},left))}
  }
}
function pageTarget(x,y){
  let el=document.elementFromPoint(x,y);                 /* one hit test; the whole stack is only needed when the overlay itself is on top */
  if(!el||el===host)el=document.elementsFromPoint(x,y).filter(e=>e!==host)[0]||document.body;
  return el.tagName==="IFRAME"?{ifr:el}:{el};
}
function send(b,type,flags){
  const init=Object.assign({key:b.key,code:b.code,keyCode:b.kc,which:b.kc,bubbles:true,cancelable:true},flags||{});
  let a=document.activeElement;if(a===host)a=null;
  if(a&&a.tagName==="IFRAME")return fwd({kind:"key",type,init});
  (a||document.body).dispatchEvent(new KeyboardEvent(type,init));
}
/* while choosing a key for a button, take the next key press (with any Ctrl / Alt / Shift / Win held) before the page sees it */
const modsOf=e=>["ctrl","alt","shift","meta"].filter(m=>e[MODK[m].flag]);
const isModKey=k=>k==="Control"||k==="Alt"||k==="Shift"||k==="Meta"||k==="AltGraph";
let capMods=null;
addEventListener("keydown",e=>{
  if(!capturing)return;e.preventDefault();e.stopImmediatePropagation();
  if(isModKey(e.key)){capMods=modsOf(e);return}                 /* keep waiting for the main key */
  capMods=null;setKey({key:e.key,code:e.code,kc:e.keyCode,mods:modsOf(e)});
},true);
addEventListener("keyup",e=>{
  if(!capturing||!isModKey(e.key)||!capMods||!capMods.length)return;e.preventDefault();e.stopImmediatePropagation();
  const m=capMods;capMods=null;setKey({key:"",code:"",kc:0,mods:m});     /* a modifier pressed and released on its own */
},true);
/* typing inside the overlay (names, layout text) must not trigger the page's own shortcuts */
["keydown","keyup","keypress"].forEach(t=>$("shell").addEventListener(t,e=>e.stopPropagation()));

/* ---------- mouse ---------- */
function ensureCur(){if(!cur.on){cur.x=$("app").offsetWidth/2;cur.y=$("app").offsetHeight/2;cur.on=true}}
function mouse(type,dx,dy,bt){
  bt=bt||0;ensureCur();const fx=1/wtScale(),x=cur.x*fx,y=cur.y*fx,t=pageTarget(x,y);
  const o={clientX:x,clientY:y,screenX:x,screenY:y,movementX:dx||0,movementY:dy||0,bubbles:true,cancelable:true,button:bt,buttons:type==="mousedown"?[1,4,2][bt]:0};
  if(t.ifr){if(document.activeElement!==t.ifr)t.ifr.focus();const r=t.ifr.getBoundingClientRect();return fwd({kind:"mouse",type,x:x-r.left,y:y-r.top,o})}
  if(type==="mousedown"&&t.el.focus)t.el.focus();
  t.el.dispatchEvent(new MouseEvent(type,o));
}
function moveCur(dx,dy){
  ensureCur();const w=$("app").offsetWidth,h=$("app").offsetHeight;cur.x+=dx;cur.y+=dy;
  if(cur.x<w*.1||cur.x>w*.9||cur.y<h*.1||cur.y>h*.9){cur.x=w/2;cur.y=h/2}   /* keep re-centering so movement never runs out */
  mouse("mousemove",dx,dy);
}
/* the nearest scrollable box under a point, so scrolling behaves like dragging a finger there */
function scrollBox(el){
  for(let n=el;n&&n!==document.body&&n!==document.documentElement;n=n.parentElement){
    const cs=getComputedStyle(n);
    if(/(auto|scroll)/.test(cs.overflowY+cs.overflowX)&&(n.scrollHeight>n.clientHeight+1||n.scrollWidth>n.clientWidth+1))return n;
  }
  return null;
}
function wheel(dy,dx){
  dx=dx||0;ensureCur();const t=pageTarget(cur.x,cur.y);
  if(t.ifr){const r=t.ifr.getBoundingClientRect();return fwd({kind:"wheel",x:cur.x/wtScale()-r.left,y:cur.y/wtScale()-r.top,dy,dx})}
  const ok=t.el.dispatchEvent(new WheelEvent("wheel",{clientX:cur.x/wtScale(),clientY:cur.y/wtScale(),deltaX:dx,deltaY:dy,bubbles:true,cancelable:true}));
  if(ok){const n=scrollBox(t.el);if(n)n.scrollBy(dx,dy);else scrollBy(dx,dy)}   /* the page handled the wheel itself if it cancelled the event */
}
function mpress(b,dn){
  ensureCur();const m=b.mouse;clearInterval(mt[b.id]);
  if(m.startsWith("wheel")){
    if(dn){const dy=m==="wheelup"?-100:m==="wheeldown"?100:0,dx=m==="wheelleft"?-100:m==="wheelright"?100:0;wheel(dy,dx);mt[b.id]=setInterval(()=>wheel(dy,dx),70)}
    return;
  }
  const bt={left:0,middle:1,right:2}[m];
  if(dn)mouse("mousedown",0,0,bt);else{mouse("mouseup",0,0,bt);mouse(bt===1?"auxclick":bt===2?"contextmenu":"click",0,0,bt)}
}

/* ---------- analog sticks: mouse look, W A S D / arrow keys, or touch-style scrolling ---------- */
/* which way the knob points for the lock: "u", "d", "l" or "r" when it is pushed most of the way and points (nearly) straight that way, otherwise "" */
const stickDir=(dx,dy,max)=>{
  const ax=Math.abs(dx),ay=Math.abs(dy);
  if(ay>max*.7&&ax<=ay*.6)return dy<0?"u":"d";
  if(ax>max*.7&&ay<=ax*.6)return dx<0?"l":"r";
  return "";
};
const STICKV={u:[0,-1],d:[0,1],l:[-1,0],r:[1,0]};
/* Lock (only when the stick has "Lock" turned on): hold the knob straight up, down, left or right. The lock icon blinks in the knob for 0.5 s, then turns solid (ready).
   Nothing is locked while your finger is still down, you can still move the stick freely. Let go while the icon is solid and the stick stays that way.
   Touch the stick again to let it go. Moving off that direction before letting go cancels it. */
function lockWatch(b,d,dir,lk){
  if(!b.lock||lk.done)return;
  if(dir&&!(b.lkd===undefined?"u":b.lkd).includes(dir))dir="";          /* only the directions chosen in Properties lock (up unless set otherwise) */
  if(dir===lk.dir)return;
  clearTimeout(lk.t);lk.t=0;lk.armed="";lk.dir=dir;d.classList.remove("lkup","holding","armed");
  if(dir){d.classList.add("lkup","holding");lk.t=setTimeout(()=>{lk.t=0;lk.armed=dir;d.classList.remove("holding");d.classList.add("armed");buzz()},LOCK_MS)}
}
/* a locked stick shows no lock or moved knob any more (looked up again, because the buttons may have been redrawn meanwhile) */
function stickFree(b){const el=elOf(b);if(!el)return;el.classList.remove("locked","lkup","holding","armed");const k=el.querySelector(".knob");if(k)k.style.transform=""}
function lockClear(d,lk){clearTimeout(lk.t);lk.t=0;lk.armed="";lk.dir="";if(!lk.done)d.classList.remove("lkup","holding","armed")}
/* the finger lifted while the lock was ready: the stick is now locked that way. Returns the direction, or "" when nothing was locked */
function lockNow(d,lk,ev){
  if(lk.done)return lk.dir;
  const dir=lk.armed;clearTimeout(lk.t);lk.t=0;
  if(!dir||(ev&&ev.type==="pointercancel"))return "";
  lk.done=true;lk.dir=dir;d.classList.remove("holding","armed");d.classList.add("locked","lkup");buzz();
  return dir;
}
function stick(e,b,d){
  if(b.mode==="keys")return keyStick(e,b,d);
  const r=BR(d),R=r.width/2,cx=r.left+R,cy=r.top+R,t0=performance.now(),scroll=b.mode==="scroll";
  ensureCur();
  const was=ALOCK.has(b.id);if(was){ALOCK.get(b.id)();ALOCK.delete(b.id)}      /* touching a locked stick lets it go */
  const knob=d.querySelector(".knob"),lk={t:0,done:false,armed:"",dir:""},MX=R*.6;let vx=0,vy=0,moved=0,raf;d.setPointerCapture(e.pointerId);
  const set=ev=>{
    if(lk.done)return;
    let dx=ev.clientX*wtScale()-cx,dy=ev.clientY*wtScale()-cy;const m=Math.hypot(dx,dy),max=R*.6;if(m>max){dx*=max/m;dy*=max/m}
    vx=dx/max;vy=dy/max;moved=Math.max(moved,Math.hypot(dx,dy));knob.style.transform=`translate(${dx}px,${dy}px)`;
    lockWatch(b,d,stickDir(dx,dy,max),lk);
  };
  const tick=()=>{if(Math.abs(vx)>.08||Math.abs(vy)>.08){const s=b.sens||12;if(scroll)wheel(vy*s,vx*s);else moveCur(vx*s,vy*s)}raf=requestAnimationFrame(tick)};
  set(e);moved=0;tick();d.onpointermove=set;
  d.onpointerup=d.onpointercancel=ev=>{
    d.onpointermove=d.onpointerup=d.onpointercancel=null;
    const dir=lockNow(d,lk,ev);
    if(dir){                                           /* locked: keep pushing that way until the stick is touched again */
      const v=STICKV[dir];vx=v[0];vy=v[1];knob.style.transform=`translate(${v[0]*MX}px,${v[1]*MX}px)`;
      ALOCK.set(b.id,()=>{cancelAnimationFrame(raf);stickFree(b)});return;
    }
    lockClear(d,lk);d.classList.remove("lkup");
    cancelAnimationFrame(raf);knob.style.transform="";
    if(!scroll&&!was&&moved<6&&performance.now()-t0<300){mouse("mousedown");mouse("mouseup");mouse("click")}   /* a quick tap clicks (not the tap that unlocks) */
  };
}
function keyStick(e,b,d){
  const r=BR(d),R=r.width/2,cx=r.left+R,cy=r.top+R,knob=d.querySelector(".knob"),on={},lk={t:0,done:false,armed:"",dir:""},MX=R*.6,
   M=b.kmap==="arrows"?{u:kd("ArrowUp"),d:kd("ArrowDown"),l:kd("ArrowLeft"),r:kd("ArrowRight")}:{u:kd("W"),d:kd("S"),l:kd("A"),r:kd("D")};
  d.setPointerCapture(e.pointerId);
  const was=ALOCK.has(b.id);if(was){ALOCK.get(b.id)();ALOCK.delete(b.id)}      /* touching a locked stick lets it go */
  const set=ev=>{
    if(lk.done)return;
    let dx=ev.clientX*wtScale()-cx,dy=ev.clientY*wtScale()-cy;const m=Math.hypot(dx,dy),max=R*.6;if(m>max){dx*=max/m;dy*=max/m}
    knob.style.transform=`translate(${dx}px,${dy}px)`;
    const v={u:dy<-max*.35,d:dy>max*.35,l:dx<-max*.35,r:dx>max*.35};
    for(const k in v)if(v[k]!==!!on[k]){on[k]=v[k];send(M[k],v[k]?"keydown":"keyup")}
    lockWatch(b,d,stickDir(dx,dy,max),lk);
  };
  set(e);d.onpointermove=set;
  d.onpointerup=d.onpointercancel=ev=>{
    d.onpointermove=d.onpointerup=d.onpointercancel=null;
    const dir=lockNow(d,lk,ev);
    if(dir){                                           /* locked: only that direction's key stays pressed, the knob sits at that side */
      for(const k in on)if(k!==dir&&on[k]){on[k]=false;send(M[k],"keyup")}
      if(!on[dir]){on[dir]=true;send(M[dir],"keydown")}
      const v=STICKV[dir];knob.style.transform=`translate(${v[0]*MX}px,${v[1]*MX}px)`;
      ALOCK.set(b.id,()=>{send(M[dir],"keyup");stickFree(b)});return;
    }
    lockClear(d,lk);d.classList.remove("lkup");
    for(const k in on)if(on[k])send(M[k],"keyup");knob.style.transform="";
  };
}
/* long-pressing or dragging on the overlay must never select text or open the browser's Copy / Share bar */
["selectstart","contextmenu"].forEach(t=>root.addEventListener(t,e=>{const n=e.composedPath()[0];if(!(n&&/^(INPUT|TEXTAREA)$/.test(n.tagName)))e.preventDefault()}));
