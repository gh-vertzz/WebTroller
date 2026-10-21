/* ---------- tutorial: shown the first time Edit layout is opened, and again from the ? Help button ---------- */
var tutOn=false,tutI=0,tutPicked=false,tutT=0,tutPanel=false;
const TSTEPS=[
 {t:"Welcome to the Layout Editor",ids:[],b:()=>`<p>This is where you design your controller. This short tour shows what every part does. It takes about a minute.</p><p><em>Nothing you do during the tour changes your layout.</em></p>`},
 {t:"Move and resize buttons",el:()=>S.btns.length?elOf(S.btns[0]):null,b:()=>S.btns.length
   ?`<p><b>Tap</b> a button to select it. <b>Drag</b> it to move it.</p><p>When it is selected, drag the <b>round handle</b> in its corner to make it bigger or smaller.</p>`
   :`<p>Your layout is empty. Add a button with <b>+ Button</b> and it appears here.</p><p><b>Tap</b> a button to select it, <b>drag</b> it to move it, and drag the round handle in its corner to resize it.</p>`},
 {t:"Portrait and landscape",ids:["olab"],b:()=>`<p>This tag shows which layout you are editing. <b>Portrait</b> and <b>landscape</b> each keep their own buttons.</p><p>Rotate your device to edit the other one. It loads automatically.</p>`},
 {t:"Undo and redo",ids:["undo","redo"],b:()=>`<p>Step back or forward through your changes. <kbd>Ctrl</kbd>+<kbd>Z</kbd> and <kbd>Ctrl</kbd>+<kbd>Y</kbd> work on a keyboard.</p><p><em>Every mode has its own history. Switch to another mode and back and its Undo and Redo are still there, and undoing in one mode never changes another. History also belongs to the controller you picked, so undo never jumps into another controller's layout.</em></p>`},
 {t:"Add buttons and sticks",ids:["add","addA"],b:()=>`<p><b>+ Button</b> adds a new button. Set what it presses in the Properties window.</p><p><b>+ Analog Stick</b> adds a joystick that can aim the mouse, press W A S D or the arrow keys, or scroll the page.</p>`},
 {t:"Select several at once",ids:["multi","selall"],b:()=>`<p><b>Multi-Select</b> lets you tap several buttons. Tap a selected one again to deselect it.</p><p>Then drag one to move them all, or drag the handle to resize them all together. <b>Select All</b> picks every button.</p>`},
 {t:"Grid, captions and borders",ids:["snap","caps","bord"],b:()=>`<p><b>Grid</b> snaps buttons to a neat grid while you drag.</p><p><b>Captions</b> shows or hides the small text under each button, and <b>Borders</b> shows or hides their outlines.</p><p><em>Captions and borders are saved with the layout.</em></p>`},
 {t:"The Properties window",ids:["panel"],pick:true,b:()=>`<p>Select a button to edit it here:</p><p><b>Appearance</b>: name, icon (from the icon list), shape, color, size, border and caption.</p><p><b>Controls</b>: the key or mouse action it sends. For a stick, choose Mouse Look, W A S D, Arrows or Scroll.</p><p><b>Lock</b>: turn it on and a button stays pressed after you hold it for 0.5 seconds (touch it again to let go). A stick locks the same way when you hold it pushed to a side you picked under <b>Lock directions</b> (Up, Left, Right or Down, in any mix), handy for walking or driving forward.</p><p>Use <b>Duplicate</b> or <b>Delete</b> at the bottom. Drag the header to move the window, tap the arrow to minimize it, and double-tap the header to put it back.</p>`},
 {t:"Save your layout",ids:["lay"],b:()=>`<p>Give your layout a name and save it. Saved layouts keep both portrait and landscape buttons.</p><p>Load saved layouts later from <b>Load Layout</b> in the main menu.</p>`},
 {t:"Modes",ids:["lsw"],b:()=>`<p>One saved layout can hold <b>several sets of buttons</b>, called modes. For example one for walking, one for driving and one for swimming.</p><p>In the mode bar, tap the <b>+</b> to add a mode (it copies the one you are on). Tap the <b>Modes</b> button right beside the + to open the Modes window, where you can add an empty mode, copy, rename, reorder or delete modes, give each an icon (a person, a car) and choose which ones appear in the <b>switcher</b>. You can also tap the mode you are on, or hold any mode, to change its icon or delete it. While you play, tap the switcher to change mode.</p>`},
 {t:"Reset",ids:["reset"],b:()=>`<p>Puts back the default buttons of the controller you picked last, for this orientation only.</p><p><em>You can undo a reset.</em></p>`},
 {t:"Hide the editor bar",ids:["etog"],b:()=>`<p>Pull this tab to hide the bar and get more room for your buttons. Pull it again to bring the bar back.</p>`},
 {t:"Finish with Done",ids:["done"],b:()=>`<p>When you are happy, tap <b>Done</b>. It asks what to do with your changes:</p><p><b>Save</b> keeps them (a layout with no name yet opens the Save Layout panel so you can name it), <b>Discard</b> goes back to how it was, and the <b>✕</b> in the corner returns to the editor.</p>`},
 {t:"You are ready",ids:["help"],b:()=>`<p>That is everything. Tap <b>? Help</b> in the bar whenever you want to see this tour again.</p>`}
];
function tutRects(st){
  const els=st.el?[st.el()]:(st.ids||[]).map($);
  const bar=$("ebar"),br=BR(bar);
  els.forEach(e=>{if(e&&bar.contains(e)&&e!==bar){const r=BR(e);
    if(r.width&&(r.left<br.left+4||r.right>br.right-4))bar.scrollLeft+=(r.left+r.width/2)-(br.left+br.width/2)}});
  const a=BR($("app"));let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
  els.forEach(e=>{if(!e)return;const r=BR(e);if(!r.width||!r.height)return;
    x1=Math.min(x1,r.left-a.left);y1=Math.min(y1,r.top-a.top);x2=Math.max(x2,r.right-a.left);y2=Math.max(y2,r.bottom-a.top)});
  return x2>x1?{x:x1,y:y1,w:x2-x1,h:y2-y1}:null;
}
function tutPlace(){
  if(!tutOn)return;
  const st=TSTEPS[tutI],r=tutRects(st),ring=$("tring"),card=$("tut"),aw=$("app").offsetWidth,ah=$("app").offsetHeight;
  let box=null;
  if(r){const P=6,x=Math.max(2,r.x-P),y=Math.max(2,r.y-P);box={x,y,w:Math.min(aw-2,r.x+r.w+P)-x,h:Math.min(ah-2,r.y+r.h+P)-y}}
  ring.classList.toggle("open",!!box);$("tblock").classList.toggle("dim",!box);
  if(box){ring.style.left=box.x+"px";ring.style.top=box.y+"px";ring.style.width=box.w+"px";ring.style.height=box.h+"px"}
  /* put the card where it does not cover what it is pointing at */
  card.style.maxHeight="";card.style.width="";const M=10;let cw=card.offsetWidth,ch=card.offsetHeight;
  const place=(x,y)=>{card.style.left=clamp(x,0,Math.max(0,aw-cw))+"px";card.style.top=clamp(y,0,Math.max(0,ah-ch))+"px"};
  const spots=()=>{const right=aw-cw-M,bot=ah-ch-M,cx=(aw-cw)/2,cy=(ah-ch)/2;return box?[[cx,bot],[cx,M],[M,bot],[right,bot],[M,M],[right,M],[cx,cy]]:[[cx,cy]]};
  const hit=c=>box&&c[0]<box.x+box.w+10&&c[0]+cw>box.x-10&&c[1]<box.y+box.h+10&&c[1]+ch>box.y-10;
  let c=spots().find(c=>!hit(c));
  if(!c&&box){            /* nowhere clear at full height (a tall highlight on a small screen, e.g. a phone in landscape): use the biggest free band (above, below, left or right of the highlight), make the card fit it and let the text scroll */
    const A=box.y-10-M,B=ah-(box.y+box.h)-10-M,Lw=box.x-10-M,Rw=aw-(box.x+box.w)-10-M,fh=ah-2*M,lw=Math.min(cw,Lw),rw=Math.min(cw,Rw);
    const opts=[{w:cw,h:A,x:(aw-cw)/2,top:1},{w:cw,h:B,x:(aw-cw)/2,top:0},{w:lw,h:fh,x:M,top:2},{w:rw,h:fh,x:aw-M-rw,top:2}].filter(o=>o.w>=220&&o.h>=170).sort((p,q)=>q.w*q.h-p.w*p.h);
    const o=opts[0];
    if(o){card.style.width=o.w+"px";card.style.maxHeight=Math.min(o.h,fh)+"px";cw=card.offsetWidth;ch=card.offsetHeight;c=[o.x,o.top===1?M:o.top===0?ah-ch-M:Math.max(M,(ah-ch)/2)]}
    else{card.style.maxHeight=fh+"px";ch=card.offsetHeight;c=[(aw-cw)/2,A>=B?M:ah-ch-M]}   /* no band is big enough: the card may cover part of the highlight, but the text and buttons stay readable */
  }
  place(...(c||spots()[0]));
}
function tutShow(i){
  tutI=clamp(i,0,TSTEPS.length-1);const st=TSTEPS[tutI],last=tutI===TSTEPS.length-1;
  tutPanel=!!st.pick;
  if(st.pick&&!sel&&S.btns.length){selectOnly(S.btns[0]);tutPicked=true;render()}
  else if(!st.pick&&tutPicked){selectOnly(null);tutPicked=false;render()}      /* leaving that step: close the window the tour opened so it never sits under the next cards */
  fill();
  $("tstep").textContent=(tutI+1)+" / "+TSTEPS.length;$("ttitle").textContent=tc(st.t);$("tbody").innerHTML=st.b();
  $("tdots").innerHTML=TSTEPS.map((_,k)=>`<i class="${k===tutI?"on":k<tutI?"done":""}"></i>`).join("");
  $("tback").style.visibility=tutI?"visible":"hidden";$("tnext").textContent=last?"Start Editing":"Next";$("tskip").style.display=last?"none":"";
  tutPlace();clearTimeout(tutT);tutT=setTimeout(tutPlace,120);setTimeout(()=>{if(tutOn&&TSTEPS[tutI]===st)tutPlace()},700);
}
function tutStart(){
  if(mode!=="edit"||tutOn)return;
  tutOn=true;tutPicked=false;S.tut=1;save();
  ["laym","lyrm","presm","ipicker","picker","confm","donm","infom"].forEach(i=>$(i).classList.remove("open"));
  ebSet(false,false);$("tblock").classList.add("open");$("tut").classList.add("open");tutShow(0);
}
function tutClose(){
  if(!tutOn)return;tutOn=false;clearTimeout(tutT);
  ["tblock","tring","tut"].forEach(i=>$(i).classList.remove("open"));
  tutPanel=false;if(tutPicked){selectOnly(null);render()}tutPicked=false;fill();
}
/* opens by itself the first time only */
function tutAuto(){if(!S.tut)setTimeout(tutStart,500)}
$("help").onclick=tutStart;
$("tskip").onclick=tutClose;$("tback").onclick=()=>tutShow(tutI-1);
$("tnext").onclick=()=>tutI>=TSTEPS.length-1?tutClose():tutShow(tutI+1);
addEventListener("resize",()=>{if(tutOn)setTimeout(tutPlace,200)});
addEventListener("keydown",e=>{if(!tutOn)return;
  if(e.key==="Escape"){e.preventDefault();tutClose()}
  else if(e.key==="Enter"||e.key==="ArrowRight"){e.preventDefault();$("tnext").click()}
  else if(e.key==="ArrowLeft"&&tutI){e.preventDefault();tutShow(tutI-1)}},true);
