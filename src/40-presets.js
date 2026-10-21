/* presets */
const GR='#4ade80',RD='#ff6b8e',BL='#60a5fa',PK='#f472b6',YL='#facc15',WH='#e5e7eb',SH='#cbd5e1',GY='#a1a1aa';
function kd(k){
  const A={Up:38,Down:40,Left:37,Right:39};
  if(/^Arrow/.test(k))return{key:k,code:k,kc:A[k.slice(5)]};
  if(k==='Space')return{key:' ',code:'Space',kc:32};
  if(k==='Enter')return{key:'Enter',code:'Enter',kc:13};
  if(k==='Shift')return{key:'Shift',code:'ShiftLeft',kc:16};
  if(k==='Ctrl')return{key:'Control',code:'ControlLeft',kc:17};
  if(k==='Esc')return{key:'Escape',code:'Escape',kc:27};
  if(k==='Tab')return{key:'Tab',code:'Tab',kc:9};
  if(/^\d$/.test(k))return{key:k,code:'Digit'+k,kc:48+ +k};
  return{key:k.toLowerCase(),code:'Key'+k.toUpperCase(),kc:k.toUpperCase().charCodeAt(0)};
}
const bindOf=k=>k.startsWith('mouse:')?{mouse:k.slice(6),key:'',code:'',kc:0}:kd(k);
/* face button tuple: [label, icon, key, color, shape, dx, dy, size]  (dx, dy in button steps from the cluster centre) */
const dia=(t,b,l,r)=>[[...t,'ci',0,-1],[...b,'ci',0,1],[...l,'ci',-1,0],[...r,'ci',1,0]];
const row6=(top,bot)=>[...top.map((f,i)=>[...f,'ci',i-1,-.5]),...bot.map((f,i)=>[...f,'ci',i-1,.5])];
const pair=(a,b,c)=>[['B','','Z',c,'ci',-.6,.3,1.1],['A','','X',c,'ci',.6,-.3,1.1]];
const SHD=(l,r)=>({l,r});
const PICON=p=>p.blank?'u-add':/racing/i.test(p.name)?'car':/platformer/i.test(p.name)?'jump':/casual/i.test(p.name)?'u-tap':/navigation/i.test(p.name)?'compass':/neo geo|arcade|joystick|atari|stick/i.test(p.name)?'joystick':'gamepad';
const PRESETS=[
 {name:'Default',em:'\u2B1C',sub:'Empty layout with no buttons. Build your own from scratch.',blank:true},
 {name:'PlayStation',em:'\u{1F3AE}',sub:'PS1 \u00b7 PS2 \u00b7 PS3 \u00b7 PS4 \u00b7 PS5. D-pad, \u25b3\u25cb\u2715\u25a1, L1 L2 R1 R2, two sticks',dp:'arrows',faces:dia(['Triangle','@ps-triangle','S',GR],['Cross','@ps-cross','Z',BL],['Square','@ps-square','A',PK],['Circle','@ps-circle','X',RD]),sh:SHD([['L2','E'],['L1','Q']],[['R2','R'],['R1','W']]),mid:[['Select','V'],['Start','Space']],sl:'wasd',sr:'look'},
 {name:'PSP',em:'\u{1F4F1}',sub:'D-pad, \u25b3\u25cb\u2715\u25a1, L R, analog nub',dp:'arrows',faces:dia(['Triangle','@ps-triangle','S',GR],['Cross','@ps-cross','Z',BL],['Square','@ps-square','A',PK],['Circle','@ps-circle','X',RD]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']],sl:'wasd'},
 {name:'Xbox',em:'\u{1F7E9}',sub:'360 \u00b7 One \u00b7 Series. D-pad, A B X Y, LB LT RB RT, two sticks',dp:'arrows',faces:dia(['Y','','S',YL],['A','','Z',GR],['X','','A',BL],['B','','X',RD]),sh:SHD([['LT','E'],['LB','Q']],[['RT','R'],['RB','W']]),mid:[['Back','V'],['Start','Space']],sl:'wasd',sr:'look'},
 {name:'Nintendo Switch',em:'\u{1F534}',sub:'Pro Controller. D-pad, A B X Y, L R ZL ZR, two sticks',dp:'arrows',faces:dia(['X','','S',WH],['B','','Z',WH],['Y','','A',WH],['A','','X',WH]),sh:SHD([['ZL','E'],['L','Q']],[['ZR','R'],['R','W']]),mid:[['\u2212','V'],['+','Space']],sl:'wasd',sr:'look'},
 {name:'SNES',em:'\u{1F7EA}',sub:'Super Nintendo. D-pad, A B X Y, L R, Select, Start',dp:'arrows',faces:dia(['X','','S',BL],['B','','Z',YL],['Y','','A',GR],['A','','X',RD]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']]},
 {name:'NES',em:'\u2B1B',sub:'Famicom. D-pad, B A, Select, Start',dp:'arrows',faces:pair(0,0,RD),mid:[['Select','V'],['Start','Space']]},
 {name:'Game Boy / Color',em:'\u{1F7E2}',sub:'D-pad, B A, Select, Start',dp:'arrows',faces:pair(0,0,'#be185d'),mid:[['Select','V'],['Start','Space']]},
 {name:'Game Boy Advance',em:'\u{1F7E3}',sub:'D-pad, B A, L R, Select, Start',dp:'arrows',faces:pair(0,0,'#a78bfa'),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']]},
 {name:'Nintendo DS',em:'\u{1F4DF}',sub:'D-pad, A B X Y, L R, Select, Start',dp:'arrows',faces:dia(['X','','S',WH],['B','','Z',WH],['Y','','A',WH],['A','','X',WH]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']]},
 {name:'Nintendo 64',em:'\u{1F3AF}',sub:'D-pad, A B, C buttons, L R Z, analog stick',dp:'wasd',faces:[['C\u2191','','I',YL,'ci',.45,-1.75,.75],['C\u2193','','K',YL,'ci',.45,-.25,.75],['C\u2190','','J',YL,'ci',-.35,-1,.75],['C\u2192','','L',YL,'ci',1.25,-1,.75],['A','','Z',BL,'ci',-.55,.55,1.1],['B','','X',GR,'ci',.6,.75,1]],sh:SHD([['Z','E'],['L','Q']],[['R','W']]),mid:[['Start','Space']],sl:'arrows'},
 {name:'GameCube',em:'\u{1F9CA}',sub:'D-pad, A B X Y, L R Z, stick + C-stick',dp:'arrows',faces:[['A','','Z',GR,'ci',0,.3,1.3],['B','','X',RD,'ci',-1.05,.85,.8],['X','','A',WH,'ci',1.1,-.2,.85],['Y','','S',WH,'ci',-.1,-1.05,.85]],sh:SHD([['L','Q']],[['Z','E'],['R','W']]),mid:[['Start','Space']],sl:'wasd',sr:'look'},
 {name:'Sega Genesis',em:'\u{1F535}',sub:'Mega Drive 6-button. D-pad, A B C X Y Z, Mode, Start',dp:'arrows',faces:row6([['X','','A',WH],['Y','','S',WH],['Z','','D',WH]],[['A','','Z',WH],['B','','X',WH],['C','','C',WH]]),mid:[['Mode','V'],['Start','Space']]},
 {name:'Master System',em:'\u26AA',sub:'Game Gear too. D-pad, buttons 1 and 2, Start',dp:'arrows',faces:[['1','','Z',BL,'ci',-.6,.3,1.1],['2','','X',BL,'ci',.6,-.3,1.1]],mid:[['Start','Space']]},
 {name:'Dreamcast',em:'\u{1F300}',sub:'D-pad, A B X Y, L R triggers, analog stick',dp:'arrows',faces:dia(['Y','','S',GR],['A','','Z',RD],['X','','A',BL],['B','','X',YL]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Start','Space']],sl:'wasd'},
 {name:'Arcade',em:'\u{1F579}\uFE0F',sub:'Joystick, six attack buttons, Coin, Start',dp:null,faces:row6([['LP','','A',BL],['MP','','S',YL],['HP','','D',RD]],[['LK','','Z',BL],['MK','','X',YL],['HK','','C',RD]]),mid:[['Coin','5'],['Start','1']],sl:'arrows',sln:'Stick'},
 {name:'Atari 2600',em:'\u{1F47E}',sub:'Joystick, one fire button, Reset, Select',dp:null,faces:[['Fire','','Space',RD,'ci',0,0,1.6]],mid:[['Reset','R'],['Select','V']],sl:'arrows',sln:'Joystick'},
 {name:'PC (WASD + mouse)',em:'\u{1F4BB}',sub:'WASD, Space, Shift, Ctrl, mouse click and aim, mouse look stick',dp:'wasd',faces:dia(['Reload','','R',SH],['Jump','','Space',SH],['Aim','','mouse:right',SH],['Fire','','mouse:left',RD]),sh:SHD([['Sprint','Shift'],['Crouch','Ctrl']],[['Use','E'],['Map','Tab']]),mid:[['Esc','Esc'],['Inv','I']],sr:'look'},
 {name:'PS Vita',em:'📱',sub:'D-pad, △○✕□, L R, Select, Start, two sticks',dp:'arrows',faces:dia(['Triangle','△','S',GR],['Cross','✕','Z',BL],['Square','□','A',PK],['Circle','○','X',RD]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']],sl:'wasd',sr:'look'},
 {name:'Nintendo 3DS',em:'🔺',sub:'D-pad, A B X Y, L R, Select, Start, circle pad',dp:'arrows',faces:dia(['X','','S',WH],['B','','Z',WH],['Y','','A',WH],['A','','X',WH]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Select','V'],['Start','Space']],sl:'wasd'},
 {name:'Wii Classic',em:'⚪',sub:'D-pad, A B X Y, L R ZL ZR, minus, plus, two sticks',dp:'arrows',faces:dia(['X','','S',WH],['B','','Z',WH],['Y','','A',WH],['A','','X',WH]),sh:SHD([['ZL','E'],['L','Q']],[['ZR','R'],['R','W']]),mid:[['\u2212','V'],['+','Space']],sl:'wasd',sr:'look'},
 {name:'Sega Saturn',em:'🪐',sub:'D-pad, A B C X Y Z, L R, Start',dp:'arrows',faces:row6([['X','','A',WH],['Y','','S',WH],['Z','','D',WH]],[['A','','Z',WH],['B','','X',WH],['C','','C',WH]]),sh:SHD([['L','Q']],[['R','W']]),mid:[['Start','Space']]},
 {name:'Neo Geo',em:'🥋',sub:'Joystick, buttons A B C D, Coin, Start',dp:null,faces:[['A','','Z',RD,'ci',-1.4,0],['B','','X',YL,'ci',-.47,0],['C','','C',GR,'ci',.47,0],['D','','V',BL,'ci',1.4,0]],mid:[['Coin','5'],['Start','1']],sl:'arrows',sln:'Stick'},
 {name:'TurboGrafx-16',em:'🟠',sub:'D-pad, buttons I and II, Select, Run',dp:'arrows',faces:[['II','','Z',RD,'ci',-.6,.3,1.1],['I','','X',RD,'ci',.6,-.3,1.1]],mid:[['Select','V'],['Run','Space']]},
 {name:'Steam Deck',em:'🎛️',sub:'D-pad, A B X Y, bumpers and triggers, View, Menu, two sticks',dp:'arrows',faces:dia(['Y','','S',YL],['A','','Z',GR],['X','','A',BL],['B','','X',RD]),sh:SHD([['LT','E'],['LB','Q']],[['RT','R'],['RB','W']]),mid:[['View','V'],['Menu','Space']],sl:'wasd',sr:'look'},
 {name:'Racing',em:'🏎️',sub:'Arrow keys to steer and drive, Nitro, Handbrake, Pause',dp:'arrows',faces:[['Nitro','','Shift',YL,'ci',-.6,.3,1.1],['Handbrake','','Space',RD,'ci',.6,-.3,1.1]],mid:[['Look back','C'],['Pause','Esc']]},
 {name:'Platformer',em:'🍄',sub:'D-pad, Jump, Action, Pause, Start',dp:'arrows',faces:[['Action','','X',BL,'ci',-.6,.3,1.1],['Jump','','Z',GR,'ci',.6,-.3,1.1]],mid:[['Pause','Esc'],['Start','Enter']]},
 {name:'Casual (one tap)',em:'👆',sub:'One big Tap button and a Pause button for simple games',dp:null,faces:[['Tap','','Space',GR,'ci',0,0,2.2]],mid:[['Pause','Esc']]},
 {name:'Navigation',em:'🧭',sub:'Arrow keys, Enter, Esc, Tab, scroll buttons and a touch-style scroll stick',dp:'arrows',faces:dia(['Space','','Space',YL],['OK','','Enter',GR],['Tab','','Tab',BL],['Back','','Esc',RD]),sh:SHD([['Scroll Up','mouse:wheelup','@arrow-up'],['Scroll Left','mouse:wheelleft','@arrow-left']],[['Scroll Down','mouse:wheeldown','@arrow-down'],['Scroll Right','mouse:wheelright','@arrow-right']]),mid:[['Esc','Esc'],['Enter','Enter']],sl:'scroll',sln:'Scroll',sr:'look'}
];
function buildPreset(p){
  if(p.blank)return [];
  const [lw,lh]=viewSize(),W=Math.max(lw||800,320),H=Math.max(lh||600,320);
  const s=Math.max(46,Math.min(64,Math.round(Math.min(W,H)*.12))),st=Math.round(s*1.12),M=14,hs=s/2;
  const out=[];let id=0;
  const put=(o,x,y,w)=>{const h=Math.round(w*(KF[o.shape]||1));x=Math.max(4,Math.min(W-4-w,x));y=Math.max(4,Math.min(H-4-h,y));
    out.push(Object.assign({id:++id,img:'',icon:'',shape:'sq',w},o,{x:+(x/W*100).toFixed(2),y:+(y/H*100).toFixed(2)}))};
  const mw=Math.round(s*1.8),bw=Math.round(s*1.2),bh=Math.round(bw*.6),sw=Math.round(s*1.5),sh=Math.round(sw*.6);
  const stickY=H-M-mw,base=(p.sl||p.sr)?stickY-18:H-M-bh-18;
  let tx=p.dp?1.45:0,bx=tx;
  p.faces.forEach(f=>{const z=f[7]||1;tx=Math.max(tx,-f[6]+.45*z);bx=Math.max(bx,f[6]+.45*z)});
  const ex=Math.max(1.5,...p.faces.map(f=>Math.abs(f[5])+.45*(f[7]||1))),cy=base-bx*st,lx=M+1.5*st,rx=W-M-ex*st,topY=cy-tx*st;
  if(p.dp){const kk=p.dp==='wasd'?['W','S','A','D']:['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    [['Up','@tri-up',0,-1],['Down','@tri-down',0,1],['Left','@tri-left',-1,0],['Right','@tri-right',1,0]].forEach(([n,ic,dx,dy],i)=>put(Object.assign({label:n,icon:ic,c:WH},kd(kk[i])),lx+dx*st-hs,cy+dy*st-hs,s))}
  p.faces.forEach(f=>{const [l,ic,k,c,sp,dx,dy,z]=f,w=Math.round(s*(z||1));put(Object.assign({label:l,icon:ic,shape:sp,c},bindOf(k)),rx+dx*st-w/2,cy+dy*st-w/2,w)});
  const horiz=W>H*1.2,gap=8,SHs=p.sh||{l:[],r:[]};
  const place=(list,left)=>list.forEach(([l,k,ic],i)=>{const o=Object.assign({label:l,icon:ic||'',shape:'rc',c:SH},bindOf(k));
    if(horiz)put(o,left?M+i*(sw+gap):W-M-sw-i*(sw+gap),Math.max(8,topY-14-sh),sw);
    else put(o,left?M:W-M-sw,Math.max(8,topY-14-sh-(list.length-1-i)*(sh+gap)),sw)});
  place(SHs.l,true);place(SHs.r,false);
  const mn=p.mid.length;
  p.mid.forEach(([l,k],i)=>put(Object.assign({label:l,shape:'rc',c:GY},bindOf(k)),W/2-(mn*bw+(mn-1)*12)/2+i*(bw+12),H-M-bh,bw));
  if(p.sl)put(Object.assign({type:'analog',label:p.sln||(p.sl==='scroll'?'Scroll':'Move'),w:mw,c:'#93c5fd'},p.sl==='scroll'?{mode:'scroll',sens:12}:{mode:'keys',kmap:p.sl}),M,stickY,mw);
  if(p.sr)put({type:'analog',label:'Look',w:mw,sens:12,c:'#86efac'},W-M-mw,stickY,mw);
  return out;
}

/* ---------- choosing a console ---------- */
function drawPresets(){
  const g=$("cards");g.innerHTML="";
  PRESETS.forEach(p=>{
    const b=document.createElement("button");b.className="card";b.innerHTML=`<b>${svgIcon(PICON(p))} ${esc(tc(p.name))}</b><small>${esc(p.sub)}</small>`;
    b.onclick=()=>{
      $("presm").classList.remove("open");
      askConfirm(p.blank?"Start from an empty controller?":"Use the "+p.name+" controller?",
        (p.blank?"This removes every button in the current orientation so you can build your own. Undo and Redo only work inside one controller, so you cannot undo back past this.":"This replaces the buttons in the current orientation and sets the key mappings for you. Undo and Redo only work inside one controller, so you cannot undo back past this.")+(S.layers.length>1?" All your modes will be deleted (one mode is kept).":""),
        p.blank?"Clear Layout":"Apply",()=>applyPreset(p));
    };
    g.appendChild(b);
  });
}
/* the controller type picked last is what Reset (and a new orientation) goes back to */
const ctrlPreset=()=>PRESETS.find(x=>x.name===S.ctrl)||PRESETS.find(x=>x.name==="PlayStation");
const resetLayout=()=>buildPreset(ctrlPreset());
function applyPreset(p){
  /* a different controller deletes every mode: one mode is left, holding the new controller's buttons */
  const pv=snap();releaseAll();S.ctrl=p.name;
  const first=S.layers[0]||{};
  S.layers=[normLayer({id:first.id,btns:buildPreset(p)},0)];S.li=0;S.btns=S.layers[0].btns;S.caps=1;S.border=1;delete S.sw;
  histCommitWhole(pv);setCur(null);selectOnly(null);fill();render();swUI();if(lyrOpen())drawLayers();lsUI();save();toast(p.name+" controller applied");
}
/* ---------- Buy me a coffee ---------- */
const DONATE=[
  {c:"Bitcoin",s:"BTC",g:"\u20BF",n:"Bitcoin network",col:"#f7931a",a:"bc1quv8c3v24gehrvgw4f3qdlzw550hxwhe3kvgmyv"},
  {c:"Litecoin",s:"LTC",g:"\u0141",n:"Litecoin network",col:"#345d9d",a:"ltc1quv8c3v24gehrvgw4f3qdlzw550hxwhe3jsjluu"},
  {c:"Tron",s:"TRX",g:"T",n:"TRON network",col:"#e0392b",a:"TDZEdZJMWRWaH6kQPvca8R5gKirzG4Xm1U"},
  {c:"Dogecoin",s:"DOGE",g:"\u00D0",n:"Dogecoin network",col:"#c2a633",a:"DRqgY8353WaU9bhGYpx6oCh3pWPJxQXSEG"},
  {c:"Bitcoin Cash",s:"BCH",g:"B",n:"Bitcoin Cash network",col:"#0ac18e",a:"bitcoincash:qr3slz9324rxud3p64xyphuf6j37ue6lxyj2ztmr2m"},
  {c:"Pepe",s:"PEPE",g:"P",n:"Ethereum network (ERC20)",col:"#3d8b3d",a:"0x7D7e394c7Beb18b67f891F1B3adE4070245992F2"}
];
function copyText(t,done){
  const fb=()=>{try{const x=document.createElement("textarea");x.value=t;x.style.cssText="position:fixed;opacity:0;left:-999px";root.appendChild(x);x.select();x.setSelectionRange(0,t.length);const ok=document.execCommand("copy");x.remove();done(ok)}catch(e){done(false)}};
  try{navigator.clipboard.writeText(t).then(()=>done(true),fb)}catch(e){fb()}
}
function drawDonate(){
  const box=$("dons");box.innerHTML="";
  DONATE.forEach(d=>{
    const card=document.createElement("div");card.className="don";
    card.innerHTML='<div class="dh"><span class="dc" style="background:'+d.col+'">'+(d.g||d.s.charAt(0))+'</span><span class="dn"><b>'+d.c+' ('+d.s+')</b><small>'+d.n+'</small></span><button class="dcp pri">Copy</button></div><div class="da"></div>';
    const addr=card.querySelector(".da"),btn=card.querySelector(".dcp");addr.textContent=d.a;
    const go=()=>copyText(d.a,ok=>{
      if(!ok){const r=document.createRange();r.selectNodeContents(addr);const s=root.getSelection?root.getSelection():getSelection();if(s){s.removeAllRanges();s.addRange(r)}toast("Press and hold the address, then choose Copy");return}
      btn.textContent="\u2713 Copied";btn.classList.add("ok");toast(d.s+" address copied");
      clearTimeout(btn._t);btn._t=setTimeout(()=>{btn.textContent="Copy";btn.classList.remove("ok")},2200)});
    btn.onclick=go;addr.onclick=go;box.appendChild(card);
  });
}
$("donbtn").onclick=()=>{$("hud").classList.remove("open");$("donm").classList.add("open");drawDonate()};
$("dx").onclick=()=>$("donm").classList.remove("open");
$("pre2").onclick=()=>{$("presm").classList.add("open");drawPresets()};
$("px").onclick=()=>$("presm").classList.remove("open");
