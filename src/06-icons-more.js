/* More built-in SVG icons (24x24, drawn with currentColor): ball sports, racket sports, water and boats, fitness and the outdoors.
   Same format as SVGI in 05-icons.js: name -> [group, label, svg paths]. A name that already exists is never replaced. */
(()=>{
const add=(cat,list)=>{if(!SVGCATS.includes(cat))SVGCATS.push(cat);list.forEach(([k,label,svg])=>{if(!SVGI[k])SVGI[k]=[cat,label,svg]})};

add("Basketball",[
["basketball","Basketball",'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.4 5.4c3.2 3.2 3.2 9 0 13.2M18.6 5.4c-3.2 3.2-3.2 9 0 13.2"/>'],
["hoop","Hoop",'<rect x="4" y="2.5" width="16" height="9" rx="1.5"/><path d="M9.5 6.5h5v5h-5M8 12h8M8 12l1.2 8M16 12l-1.2 8M12 12v8M8.6 16h6.8M9.2 20h5.6"/>'],
["dunk","Dunk",'<circle cx="12" cy="5" r="3"/><path d="M5 11.5h14M6 11.5l1.5 8.5M18 11.5 16.5 20M12 11.5V20M6.6 15.5h10.8M7.5 20h9"/>'],
["shoot-ball","Shoot",'<circle cx="6" cy="18" r="3"/><path d="M8.6 15.6C10 8 14 4.5 19 6M16 3.5 19.2 6 17 9.2"/>'],
["pass-ball","Pass",'<circle cx="17" cy="12" r="4.5"/><path d="M12.5 12h9M17 7.5v9M2 8.5h6M3 12h4M2 15.5h6"/>'],
["dribble","Dribble",'<circle cx="12" cy="7" r="4"/><path d="M12 3v8M8 7h8M7 21h10M12 13v5M9.5 15.5 12 18l2.5-2.5"/>'],
["rebound","Rebound",'<circle cx="12" cy="15" r="5"/><path d="M12 10V3M8.5 6.5 12 3l3.5 3.5M7 15h10"/>'],
["block-shot","Block",'<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 9.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S7 18 6 15l-2-3a1.5 1.5 0 0 1 2.5-1.5L7 12"/>'],
["substitute","Substitute",'<path d="M7 20V5M3.5 8.5 7 5l3.5 3.5M17 4v15M13.5 15.5 17 19l3.5-3.5"/>'],
["jump-shot","Jump Shot",'<circle cx="12" cy="4.5" r="2"/><path d="M12 7v6M8 9l4-2 4 2M9 21l3-8 3 8M18 3v4M20 5h-4"/>'],
]);

add("Ball Sports",[
["soccer-ball","Soccer Ball",'<circle cx="12" cy="12" r="9"/><path d="M12 8.5l3.3 2.4-1.3 3.9h-4l-1.3-3.9zM12 8.5V3.2M15.3 10.9l5.1-1.7M14 14.8l3.2 4.4M10 14.8l-3.2 4.4M8.7 10.9 3.6 9.2"/>'],
["goal","Goal",'<path d="M3 19V7h18v12M3 7l3-3h12l3 3M7 7v12M12 7v12M17 7v12M3 12h18"/>'],
["curve-shot","Curve Shot",'<circle cx="6" cy="18" r="3"/><path d="M9 16c4-1 8-5 10-12M19 4l-3.5.2M19 4l-.5 3.5"/>'],
["corner-flag","Corner Flag",'<path d="M7 21V3l10 4-10 4M3 21h8"/>'],
["foul-card","Card",'<rect x="7.5" y="3" width="9" height="18" rx="1.5" transform="rotate(12 12 12)" fill="currentColor"/>'],
["football","Football",'<ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-40 12 12)"/><path d="M8.7 15.3l6.6-6.6M9.7 12.7l1.6 1.6M11.2 11.2l1.6 1.6M12.7 9.7l1.6 1.6"/>'],
["goal-post","Goal Post",'<path d="M12 21v-8M6 3v6a6 6 0 0 0 12 0V3M12 9v4"/>'],
["rugby","Rugby",'<ellipse cx="12" cy="12" rx="10" ry="6" transform="rotate(-40 12 12)"/><path d="M9.2 9.2l5.6 5.6M7.8 16.2l3-3M13.2 10.8l3-3"/>'],
["volleyball","Volleyball",'<circle cx="12" cy="12" r="9"/><path d="M12 3c-3 4-3 8 0 9 3 1 6 0 8.5-3M3.3 14c4-2 8-1 9 2 .8 2.5 0 4.3-1 5M20.5 14c-4-1-8 1-8.5 5"/>'],
["spike","Spike",'<circle cx="16" cy="16" r="4"/><path d="M4 4l8 8M12 5v7H5"/>'],
["net","Net",'<path d="M3 5h18v10H3zM3 9h18M3 12h18M7 5v10M11 5v10M15 5v10M19 5v10M3 15v6M21 15v6"/>'],
["court","Court",'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M12 5v14M3 10h3v4H3M21 10h-3v4h3"/><circle cx="12" cy="12" r="2.5"/>'],
["baseball","Baseball",'<circle cx="12" cy="12" r="9"/><path d="M6 4.5c3 3 3 12 0 15M18 4.5c-3 3-3 12 0 15M8 8l1.5.5M8.3 12H10M8 16l1.5-.5M16 8l-1.5.5M15.7 12H14M16 16l-1.5-.5"/>'],
["bat","Bat",'<path d="M3 21l8-8M10 10l6.5-6.5a2.2 2.2 0 0 1 3 3L13 13z"/>'],
["catch-glove","Catch",'<path d="M7 21v-5l-3-4 1.5-1.2L8 13V5.5a1.5 1.5 0 0 1 3 0V10V4.5a1.5 1.5 0 0 1 3 0V10V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 7-6.5 7z"/>'],
["cricket","Cricket",'<path d="M4 20l8-8M11 13l5.5-5.5 3 3L14 16z"/><circle cx="6" cy="6" r="2.5"/>'],
["stumps","Stumps",'<path d="M8 6v14M12 6v14M16 6v14M7.5 4.5h4M12.5 4.5h4"/>'],
]);

add("Racket & Paddle",[
["tennis-ball","Tennis Ball",'<circle cx="12" cy="12" r="9"/><path d="M4.6 5.2c4.2 3.6 4.2 10 0 13.6M19.4 5.2c-4.2 3.6-4.2 10 0 13.6"/>'],
["tennis-racket","Tennis Racket",'<ellipse cx="9.5" cy="9.5" rx="6.2" ry="7.6" transform="rotate(45 9.5 9.5)"/><path d="M14 14l6.5 6.5M19 22l3-3M6.5 10.5l5-5M8.5 13l6-6"/>'],
["badminton","Badminton Racket",'<ellipse cx="8.5" cy="8.5" rx="4.6" ry="6" transform="rotate(45 8.5 8.5)"/><path d="M12 12l8.5 8.5M18.5 22l3-3M6 9.5l3.5-3.5M8 11.5l4-4"/>'],
["shuttlecock","Shuttlecock",'<path d="M12 21a2.5 2.5 0 0 1-2.5-2.5h5A2.5 2.5 0 0 1 12 21zM9.5 18.5 5 5M14.5 18.5 19 5M12 18.5V4M5 5c4-2 10-2 14 0M7.5 11.5c3 1 6 1 9 0"/>'],
["table-tennis","Table Tennis",'<circle cx="9.5" cy="9.5" r="6"/><path d="M14 14l6 6M17.5 12.5 20 15"/><circle cx="19.5" cy="5" r="1.8"/>'],
["pickleball","Pickleball",'<rect x="4" y="3" width="12" height="12" rx="5"/><path d="M10 15v6M8.5 21h3M7.5 7.5h.01M12.5 7.5h.01M10 10h.01M7.5 12h.01M12.5 12h.01"/><circle cx="19" cy="7" r="2"/>'],
["serve","Serve",'<circle cx="12" cy="4.5" r="2.5"/><path d="M12 9v5M9.5 11.5 12 9l2.5 2.5"/><ellipse cx="12" cy="18" rx="5" ry="3"/>'],
["smash","Smash",'<path d="M4 4l11 11M15 8v7H8M17.5 17.5l3 3M20 15l2 .5M15 20l.5 2"/>'],
["squash-ball","Ball Hit",'<circle cx="8" cy="16" r="4"/><path d="M13 11l8-8M15 3h6v6M3 8l2 1M5 4l1.5 1.5"/>'],
]);

add("Water & Boat",[
["paddle","Paddle",'<path d="M20 4 11 13M18 3l3 3"/><ellipse cx="8" cy="16" rx="2.5" ry="4.5" transform="rotate(45 8 16)"/>'],
["oars","Oars",'<path d="M5 5l14 14M19 5 5 19"/><ellipse cx="4.5" cy="4.5" rx="1.6" ry="3.2" transform="rotate(-45 4.5 4.5)"/><ellipse cx="19.5" cy="4.5" rx="1.6" ry="3.2" transform="rotate(45 19.5 4.5)"/>'],
["canoe","Canoe",'<path d="M2 13c3 5 17 5 20 0z"/><path d="M6 5l12 8M5 3.5l2 3M17 11.5l2 3"/>'],
["kayak","Kayak",'<path d="M1 14c5-2 17-2 22 0-5 2-17 2-22 0z"/><circle cx="12" cy="10" r="1.8"/><path d="M4 5l16 9M3 4l3 2M18 12l3 2"/>'],
["sailboat","Sailboat",'<path d="M12 3v14M12 4c4 2 6 6 6 10h-6M11 7c-3 2-5 5-5 9h5M3 19c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/>'],
["sail","Sail",'<path d="M6 21V3l12 14H6zM3 21h18"/>'],
["speedboat","Speedboat",'<path d="M3 15h18l-3 5H6zM8 15V9h6l3 6M11 9V6"/>'],
["jet-ski","Jet Ski",'<path d="M3 16c4 3 12 3 18-2l-4-5h-5l-1 3H6zM10 12 8 7H6"/>'],
["anchor","Anchor",'<circle cx="12" cy="5" r="2"/><path d="M12 7v14M7 11h10M5 15c0 3 3 6 7 6s7-3 7-6M5 15l-1.5-2.5M19 15l1.5-2.5"/>'],
["helm","Helm",'<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5M5 5l3.5 3.5M15.5 15.5 19 19M19 5l-3.5 3.5M8.5 15.5 5 19"/>'],
["life-ring","Life Ring",'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.6 3.6M14.8 14.8l3.6 3.6M18.4 5.6l-3.6 3.6M9.2 14.8l-3.6 3.6"/>'],
["waves","Waves",'<path d="M2 8c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 13c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 18c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'],
["dive","Dive",'<path d="M12 3v11M8 10l4 4 4-4M3 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/>'],
["surfboard","Surfboard",'<path d="M20 4C14 4 8 10 5 19l5-1c5-3 10-8 10-14zM12 12l-3 3"/>'],
["fishing-rod","Fishing Rod",'<path d="M3 21 17 5c1-1 3 0 4 1M21 6v8a3 3 0 0 1-6 0"/>'],
["fish","Fish",'<path d="M3 12c3-5 9-6 13-2l5-3v10l-5-3c-4 4-10 3-13-2zM8 11h.01"/>'],
["fish-hook","Fish Hook",'<path d="M14 3v13a4 4 0 0 1-8 0M6 16l-2-2M6 16l2-2"/>'],
["lighthouse","Lighthouse",'<path d="M9 21l1.5-13h3L15 21zM9.5 8h5l-.5-3h-4zM12 2v3M5 5l3 1.5M19 5l-3 1.5M7 21h10"/>'],
["snorkel-mask","Dive Mask",'<path d="M3 9h18v4a4 4 0 0 1-4 4h-1l-2-2h-4l-2 2H7a4 4 0 0 1-4-4zM12 9v6"/>'],
["bubbles","Bubbles",'<circle cx="8" cy="15" r="4"/><circle cx="16" cy="8" r="3"/><circle cx="17" cy="17" r="2"/>'],
]);

add("Fitness & Outdoor",[
["dumbbell","Dumbbell",'<path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12"/>'],
["barbell","Barbell",'<path d="M2 12h20M5 7v10M8 5v14M16 5v14M19 7v10"/>'],
["kettlebell","Kettlebell",'<path d="M8 8a4 4 0 1 1 8 0M7 9h10l2 9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/>'],
["jump-rope","Jump Rope",'<path d="M5 4v6M19 4v6M5 10c0 14 14 14 14 0"/>'],
["yoga","Yoga",'<circle cx="12" cy="5" r="2"/><path d="M12 8v5M5 11l7 2 7-2M8 21l4-8 4 8"/>'],
["ski","Ski",'<circle cx="15" cy="4" r="2"/><path d="M3 20l18-4M12 8l-3 6 5 3M9 14l-4 1M15 9l3 3"/>'],
["snowboard","Snowboard",'<rect x="2" y="9.5" width="20" height="5" rx="2.5" transform="rotate(-40 12 12)"/><path d="M9 14l1.5 1.5M13 10l1.5 1.5"/>'],
["ice-skate","Ice Skate",'<path d="M7 3v10l-3 3v3h16v-2l-6-3V8h-4V3zM4 21h17"/>'],
["roller-skate","Roller Skate",'<path d="M5 4h6v7l7 2v4H4zM4 17v2"/><circle cx="7" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/>'],
["golf","Golf",'<path d="M8 21V3l9 4-9 4M4 21h16"/><circle cx="16" cy="19" r=".8"/>'],
["golf-club","Golf Club",'<path d="M19 3l-7.5 15M11.5 18c-2.5.3-6 .8-6 2.5 3 .8 6 .5 8-.5z"/>'],
["bowling","Bowling",'<path d="M10 3h4c0 2-.5 3-1 4.5 1.5 1.5 2.5 3.5 2.5 6 0 3-1.5 5.5-3.5 7.5-2-2-3.5-4.5-3.5-7.5 0-2.5 1-4.5 2.5-6C10.5 6 10 5 10 3zM9.5 8h5"/>'],
["pool-ball","Pool",'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.8"/><circle cx="12" cy="10.6" r="1.2"/><circle cx="12" cy="13.6" r="1.5"/>'],
["cue-stick","Cue Stick",'<path d="M3 21 19 5M19 5l2-2M5 19l2 2"/>'],
["hockey","Hockey",'<path d="M6 3l6.5 14.5H18c1.5 0 2.5-.5 3-1.5"/><ellipse cx="9" cy="20" rx="4" ry="1.5"/>'],
["puck","Puck",'<ellipse cx="12" cy="9" rx="7" ry="3"/><path d="M5 9v5c0 1.7 3.1 3 7 3s7-1.3 7-3V9"/>'],
["darts","Darts",'<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4.5"/><circle cx="11" cy="13" r="1"/><path d="M11 13l9-9M17 3.5 20.5 3.5 20.5 7"/>'],
["boxing-glove","Boxing Glove",'<path d="M5 10a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v3a6 6 0 0 1-6 6h-2a3 3 0 0 1-3-3v-2H7a2 2 0 0 1-2-2zM9 19v3h6v-3M5 10c0 3 2 4 5 4h2"/>'],
["martial-belt","Martial Belt",'<path d="M3 10h18v4H3zM9 14l-2 7M15 14l2 7"/>'],
["whistle","Whistle",'<circle cx="16" cy="14" r="5"/><path d="M11 11H3v4h6M16 3v4M20 5l-2 3M12 5l2 3"/>'],
["stopwatch","Stopwatch",'<circle cx="12" cy="14" r="7"/><path d="M12 14l3-3M9.5 3h5M12 3v4"/>'],
["medal","Medal",'<circle cx="12" cy="15" r="5"/><path d="M8.5 11 6 3h4l2 4 2-4h4l-2.5 8"/>'],
["podium","Podium",'<path d="M3 21v-7h6v7M9 21V8h6v13M15 21v-9h6v9M3 21h18"/>'],
["finish-flag","Finish Flag",'<path d="M5 21V3M5 4h14v9H5M10 4v9M15 4v9M5 8.5h14"/>'],
["tent","Tent",'<path d="M3 20 12 4l9 16zM12 4v16M9 20l3-6 3 6"/>'],
["mountain","Mountain",'<path d="M2 20 9 8l4 6 3-4 6 10z"/>'],
["parachute","Parachute",'<path d="M3 11a9 8 0 0 1 18 0zM3 11l9 9M21 11l-9 9M8 11l4 9 4-9M12 20v2"/>'],
]);
})();
