const STORE_KEY = "fitmeko_state_v1";

const defaultState = {
  screen: "today",
  workouts: [
    {id:"push", name:"Push Day", muscles:"Chest · Shoulders · Triceps", duration:58, exercises:[
      {id:"bench",name:"Bench Press",muscle:"Chest",sets:[{w:80,r:8},{w:80,r:8},{w:82.5,r:6},{w:82.5,r:6}],rest:100},
      {id:"incline",name:"Incline Dumbbell Press",muscle:"Chest",sets:[{w:30,r:10},{w:30,r:9},{w:30,r:8}],rest:90},
      {id:"lateral",name:"Cable Lateral Raise",muscle:"Shoulders",sets:[{w:10,r:14},{w:10,r:13},{w:10,r:12}],rest:70},
      {id:"pushdown",name:"Triceps Pushdown",muscle:"Triceps",sets:[{w:32.5,r:12},{w:32.5,r:10},{w:32.5,r:9}],rest:70},
      {id:"shoulder",name:"Seated Shoulder Press",muscle:"Shoulders",sets:[{w:22.5,r:10},{w:22.5,r:9},{w:22.5,r:8}],rest:90}
    ]},
    {id:"pull", name:"Pull Day", muscles:"Back · Biceps · Rear Delts", duration:52, exercises:[
      {id:"row",name:"Barbell Row",muscle:"Back",sets:[{w:70,r:8},{w:70,r:8},{w:72.5,r:6}],rest:100},
      {id:"pulldown",name:"Lat Pulldown",muscle:"Back",sets:[{w:60,r:10},{w:60,r:9},{w:60,r:9}],rest:90},
      {id:"curl",name:"EZ Bar Curl",muscle:"Biceps",sets:[{w:30,r:10},{w:30,r:9},{w:30,r:8}],rest:75}
    ]},
    {id:"legs", name:"Leg Day", muscles:"Quads · Hamstrings · Calves", duration:64, exercises:[
      {id:"squat",name:"Back Squat",muscle:"Quads",sets:[{w:120,r:6},{w:120,r:6},{w:125,r:5},{w:125,r:5}],rest:120},
      {id:"rdl",name:"Romanian Deadlift",muscle:"Hamstrings",sets:[{w:90,r:8},{w:90,r:8},{w:90,r:7}],rest:100},
      {id:"calf",name:"Standing Calf Raise",muscle:"Calves",sets:[{w:70,r:12},{w:70,r:12},{w:70,r:11}],rest:70}
    ]}
  ],
  history: [
    {id:1,date:"2026-09-12",name:"Push Day",duration:58,volume:8420,sets:15,exercises:5,prs:2,calories:390},
    {id:2,date:"2026-09-09",name:"Leg Day",duration:64,volume:11860,sets:14,exercises:3,prs:1,calories:470},
    {id:3,date:"2026-09-07",name:"Pull Day",duration:52,volume:7210,sets:9,exercises:3,prs:0,calories:340},
    {id:4,date:"2026-09-04",name:"Push Day",duration:55,volume:8120,sets:14,exercises:5,prs:0,calories:370}
  ],
  profile:{name:"Arish",goal:"Strength & Muscle",experience:"Intermediate",weeklyTarget:4,units:"kg",defaultRest:90,notifications:true,dark:true},
  current:null,
  selectedWorkout:"push",
  timer:{running:false,seconds:0,total:0},
  settings:{}
};

let state = loadState();
let timerHandle = null;
let toastHandle = null;

function loadState(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    return saved ? deepMerge(structuredClone(defaultState), saved) : structuredClone(defaultState);
  }catch(e){ return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function deepMerge(base, extra){
  if(!extra || typeof extra!=="object") return base;
  for(const k of Object.keys(extra)){
    if(extra[k] && typeof extra[k]==="object" && !Array.isArray(extra[k]) && typeof base[k]==="object" && base[k]!==null) base[k]=deepMerge(base[k],extra[k]);
    else base[k]=extra[k];
  }
  return base;
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function formatDate(d){const x=new Date(d+"T12:00:00"); return x.toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"});}
function formatTime(sec){sec=Math.max(0,Math.floor(sec)); return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`;}
function totalVolume(workout){return workout.exercises.flatMap(e=>e.sets).reduce((a,s)=>a+(Number(s.w)||0)*(Number(s.r)||0),0);}
function totalSets(workout){return workout.exercises.reduce((a,e)=>a+e.sets.length,0);}
function showToast(msg){const t=document.querySelector(".toast");if(!t)return;t.textContent=msg;t.classList.add("show");clearTimeout(toastHandle);toastHandle=setTimeout(()=>t.classList.remove("show"),2200)}
function nav(screen){state.screen=screen;render();window.scrollTo({top:0,behavior:"smooth"});save();}

function icon(name){
  const map={home:"⌂",workout:"◒",progress:"▥",history:"◷",profile:"◎",play:"▶",pause:"Ⅱ",plus:"+",edit:"✎",check:"✓",timer:"◷",trophy:"♛",settings:"⚙"};
  return map[name]||"•";
}

function renderShell(){
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="brand"><div class="brand-mark">FM</div><div class="brand-text"><strong>FitMeko</strong><span>Workout cockpit</span></div></div>
      <nav class="nav">
        ${navButton("today","Today", "home")}
        ${navButton("workout","Workout","workout")}
        ${navButton("progress","Progress","progress")}
        ${navButton("history","History","history")}
        ${navButton("profile","Profile","profile")}
      </nav>
      <div class="side-footer"><div class="profile-mini"><div class="avatar">${esc((state.profile.name||"A").slice(0,1).toUpperCase())}</div><div>${esc(state.profile.name)}<small>${esc(state.profile.goal)}</small></div></div></div>
    </aside>
    <main class="main">
      <header class="topbar">
        <div class="topbar-left"><div class="page-kicker">FITMEKO</div><div class="page-title">${pageTitle()}</div></div>
        <div class="top-actions">
          ${state.current ? `<button class="primary-btn" onclick="resumeWorkout()">Resume workout · ${formatTime(state.current.elapsed)}</button>`:""}
          <button class="icon-btn" title="Settings" onclick="nav('profile')">${icon("settings")}</button>
        </div>
      </header>
      <div class="content">${screenHTML()}</div>
    </main>
    <nav class="mobile-nav">
      ${mobileNavButton("today","⌂","Today")}${mobileNavButton("workout","◒","Workout")}${mobileNavButton("progress","▥","Progress")}${mobileNavButton("history","◷","History")}${mobileNavButton("profile","◎","Profile")}
    </nav>
    <div class="toast"></div>
  </div>
  <div class="modal-backdrop" id="modalBackdrop" onclick="closeModal(event)"><div class="modal" id="modal" onclick="event.stopPropagation()"></div></div>`;
}
function navButton(s,label,i){return `<button class="${state.screen===s?'active':''}" onclick="nav('${s}')"><span class="ico">${icon(i)}</span>${label}</button>`}
function mobileNavButton(s,i,label){return `<button class="${state.screen===s?'active':''}" onclick="nav('${s}')"><span>${i}</span>${label}</button>`}
function pageTitle(){return ({today:"Today",workout:"Workout",progress:"Progress",history:"History",profile:"Profile"})[state.screen]||"FitMeko"}

function screenHTML(){
  if(state.current && state.screen==="workout") return activeWorkoutHTML();
  return ({today:todayHTML,workout:workoutHTML,progress:progressHTML,history:historyHTML,profile:profileHTML})[state.screen]();
}

function todayHTML(){
  const selected=state.workouts.find(w=>w.id===state.selectedWorkout)||state.workouts[0];
  const d=new Date(), days=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dateLabel=d.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  const last=state.history[0];
  return `<div>
    <section class="hero">
      <div>
        <div class="kicker">${dateLabel}</div>
        <h1>Ready to get stronger, ${esc(state.profile.name)}?</h1>
        <p>${state.current ? "You have an active session waiting. Pick up exactly where you left off." : "Your next session is lined up. Start training and let FitMeko handle the set-to-rest flow."}</p>
        <div class="hero-meta"><span class="pill">Strength</span><span class="pill">${selected.exercises.length} exercises</span><span class="pill">~${selected.duration} min</span><span class="pill">Smart session</span></div>
        ${state.current ? `<button class="primary-btn" onclick="resumeWorkout()">Resume workout</button>` : `<button class="primary-btn" onclick="startWorkout('${selected.id}')">Start ${esc(selected.name)} →</button>`}
      </div>
      <div class="hero-side">
        <div><div class="kicker">CURRENT STREAK</div><div class="metric-big">12<span style="font-size:20px">d</span></div><div class="metric-label">Consistency is compounding.</div></div>
        <div class="row-between"><div><div class="kicker">WEEKLY TARGET</div><div class="stat-value" style="font-family:'DM Mono'">3 / ${state.profile.weeklyTarget}</div></div><button class="ghost-btn" onclick="nav('progress')">View progress</button></div>
      </div>
    </section>

    <div class="section-head"><h2>Quick read</h2><span>signals that matter today</span></div>
    <div class="grid metric-grid">
      ${statCard("Last workout",last?.name||"—",last?`${last.duration} min · ${last.volume.toLocaleString()} kg`:"No history yet")}
      ${statCard("Weekly volume",sumRecentVolume().toLocaleString()+" kg","+8% vs last week")}
      ${statCard("Personal records","7","Keep going")}
      ${statCard("Readiness","Good","Ready to train")}
    </div>

    <div class="section-head"><h2>Week</h2><span>${days[d.getDay()]}, ${d.getDate()}</span></div>
    <div class="card"><div class="day-row">${weekDaysHTML()}</div></div>

    <div class="section-head"><h2>Today's workout</h2><span>${selected.muscles}</span></div>
    <div class="grid grid-2">
      <div class="card">
        <div class="row-between"><div><h3>${esc(selected.name)}</h3><div class="sub">${esc(selected.muscles)}</div></div><span class="tag">${selected.exercises.length} exercises</span></div>
        <div style="margin-top:14px">${selected.exercises.slice(0,5).map((e,i)=>`<div class="workout-row"><div class="workout-icon">${i+1}</div><div class="info"><strong>${esc(e.name)}</strong><small>${esc(e.muscle)} · ${e.sets.length} sets · ${e.sets[0].r}–${e.sets[e.sets.length-1].r} reps</small></div><div class="row-right"><strong>${e.sets[0].w} kg</strong><small>target</small></div></div>`).join("")}</div>
      </div>
      <div class="card"><div class="row-between"><div><h3>Last session</h3><div class="sub">${last?formatDate(last.date):"—"}</div></div><span class="tag">2 PRs</span></div>
        <div style="margin-top:10px">${selected.exercises.slice(0,4).map(e=>`<div class="workout-row"><div class="info"><strong>${esc(e.name)}</strong><small>Previous best</small></div><div class="row-right"><strong>${e.sets[0].w} × ${e.sets[0].r}</strong><small>kg × reps</small></div></div>`).join("")}</div>
      </div>
    </div>
  </div>`;
}
function statCard(label,value,detail){return `<div class="card stat-card"><div class="kicker">${label}</div><div class="stat-value">${esc(value)}</div><div class="sub">${esc(detail)}</div></div>`}
function sumRecentVolume(){return state.history.slice(0,3).reduce((a,x)=>a+x.volume,0)}
function weekDaysHTML(){
  const now=new Date(), out=[]; const monday=new Date(now); const dow=(now.getDay()+6)%7; monday.setDate(now.getDate()-dow);
  for(let i=0;i<7;i++){const d=new Date(monday);d.setDate(monday.getDate()+i);const key=d.toISOString().slice(0,10);const done=state.history.some(x=>x.date===key);const today=key===now.toISOString().slice(0,10);out.push(`<div class="day ${done?'done':''} ${today?'today':''}">${d.toLocaleDateString(undefined,{weekday:'narrow'})}<b>${d.getDate()}</b></div>`)}
  return out.join("");
}

function workoutHTML(){
  return `<div>
    <div class="section-head"><div><h2>Workout library</h2><span>Choose a session or build your own</span></div><button class="primary-btn" onclick="openBuilder()">+ Create workout</button></div>
    <div class="grid grid-3">${state.workouts.map(w=>workoutCard(w)).join("")}</div>

    <div class="section-head"><h2>Smart recommendation</h2><span>optional coaching layer</span></div>
    <div class="card" style="border-color:rgba(255,125,110,.22);background:linear-gradient(135deg,rgba(255,125,110,.07),#121419)">
      <div class="row-between"><div><div class="kicker">RECOMMENDED</div><h3 style="font-size:16px;margin-top:7px">Progress your bench today</h3><div class="sub" style="max-width:600px">Last session hit 8 reps at 80 kg twice. Try 82.5 kg for your opening set, then adapt from performance.</div></div><button class="primary-btn" onclick="startWorkout('push')">Use recommendation</button></div>
    </div>
  </div>`;
}
function workoutCard(w){
  return `<div class="card">
    <div class="row-between"><div><div class="kicker">${w.duration} MIN</div><h3 style="margin-top:7px;font-size:17px">${esc(w.name)}</h3><div class="sub">${esc(w.muscles)}</div></div><span class="tag">${w.exercises.length} exercises</span></div>
    <div style="margin:15px 0 11px">${w.exercises.slice(0,4).map(e=>`<div class="workout-row"><div class="workout-icon">${e.name[0]}</div><div class="info"><strong>${esc(e.name)}</strong><small>${e.sets.length} sets · ${e.sets[0].r}-${e.sets[e.sets.length-1].r} reps</small></div></div>`).join("")}</div>
    <button class="primary-btn" style="width:100%" onclick="startWorkout('${w.id}')">Start workout →</button>
  </div>`;
}

function activeWorkoutHTML(){
  const c=state.current, w=state.workouts.find(x=>x.id===c.workoutId);
  if(!c||!w) return `<div class="empty">No active workout.</div>`;
  const ex=w.exercises[c.exerciseIndex];
  const set=ex.sets[c.setIndex]||{w:0,r:0};
  const completed=c.completed||[];
  const progress=Math.round(((c.exerciseIndex + c.setIndex/ex.sets.length)/w.exercises.length)*100);
  return `<div class="active-workout-shell">
    <div class="workout-header"><div class="title"><strong>${esc(w.name)}</strong><span>${formatTime(c.elapsed)} elapsed · ${c.exerciseIndex+1}/${w.exercises.length} exercises</span></div><div class="top-actions"><button class="ghost-btn" onclick="pauseSession()">${c.paused?'Resume':'Pause'}</button><button class="danger-btn" onclick="endSession()">End</button></div></div>
    <div class="progress-line"><div style="width:${Math.max(4,progress)}%"></div></div>
    <div class="exercise-screen">
      <div class="card exercise-main">
        <div class="exercise-art">◉</div>
        <div class="exercise-head"><div class="kicker">${esc(ex.muscle)}</div><h1>${esc(ex.name)}</h1><p>Keep the movement controlled. Match the target before adding load.</p></div>
        <div class="last-row">${ex.sets.slice(0,3).map((s,i)=>`<span class="last-chip">Last ${i+1}: <b>${s.w} kg × ${s.r}</b></span>`).join("")}</div>
        <div class="set-controls">
          <div class="set-box"><label>WEIGHT (${state.profile.units.toUpperCase()})</label><div class="counter"><button onclick="adjustCurrent('w',-2.5)">−</button><input id="weightInput" type="number" step="0.5" value="${set.w}" onchange="setCurrentValue('w',this.value)"><button onclick="adjustCurrent('w',2.5)">+</button></div></div>
          <div class="set-box"><label>REPS</label><div class="counter"><button onclick="adjustCurrent('r',-1)">−</button><input id="repsInput" type="number" value="${set.r}" onchange="setCurrentValue('r',this.value)"><button onclick="adjustCurrent('r',1)">+</button></div></div>
        </div>
        <div class="set-footer"><button class="ghost-btn" onclick="skipExercise()">Skip exercise</button><button class="primary-btn" onclick="completeCurrentSet()">✓ Complete set ${c.setIndex+1}/${ex.sets.length}</button></div>
      </div>
      <div class="card">
        <div class="row-between"><div><h3>Session flow</h3><div class="sub">automatic set → rest → next set</div></div><span class="tag">${completed.filter(Boolean).length}/${totalSets(w)} sets</span></div>
        <div class="set-list">
          ${ex.sets.map((s,i)=>`<div class="set-item ${i<c.setIndex?'done':''}"><div class="set-num">${i<c.setIndex?'✓':i+1}</div><div><strong>Set ${i+1}</strong><div class="sub">${s.w} kg × ${s.r} reps</div></div><div class="mono">${i<c.setIndex?'DONE':i===c.setIndex?'NOW':'NEXT'}</div></div>`).join("")}
        </div>
        <div style="margin-top:18px" class="timer">
          ${renderMiniTimer()}
        </div>
      </div>
    </div>
  </div>`;
}
function renderMiniTimer(){
  const t=state.timer, running=t.running, sec=t.seconds,total=Math.max(1,t.total);
  const deg=`${Math.round((1-sec/total)*360)}deg`;
  return `<div>
    <div class="ring" style="--deg:${deg}"><div class="ring-inner"><div class="word">${running?'REST':'READY'}</div><div class="time">${formatTime(sec)}</div></div></div>
    <div class="timer-controls">
      <button class="ghost-btn" onclick="addRest(30)">+30s</button>
      <button class="ghost-btn" onclick="toggleTimer()">${running?'Pause':'Start'}</button>
      <button class="ghost-btn" onclick="skipRest()">Skip</button>
    </div>
  </div>`;
}

function progressHTML(){
  return `<div>
    <div class="section-head"><div><h2>Progress</h2><span>Performance without dashboard noise</span></div><select id="periodSelect" class="ghost-btn" onchange="drawAllCharts()"><option>7 days</option><option selected>30 days</option><option>3 months</option><option>1 year</option><option>All time</option></select></div>
    <div class="grid metric-grid">
      ${statCard("Total volume","42,350 kg","+12% vs previous period")}
      ${statCard("Workouts","16","+2 this month")}
      ${statCard("Training frequency","3.4 / wk","Target 4 / wk")}
      ${statCard("Average duration","56 min","−4 min vs last month")}
    </div>
    <div class="section-head"><h2>Performance</h2><span>Strength and volume trends</span></div>
    <div class="grid grid-2">
      <div class="card"><div class="row-between"><div><h3>Strength progression</h3><div class="sub">Estimated 1RM · Bench Press</div></div><span class="tag">+7.4%</span></div><div class="chart"><canvas id="strengthChart"></canvas></div></div>
      <div class="card"><div class="row-between"><div><h3>Volume progression</h3><div class="sub">Weekly training volume</div></div><span class="tag">+9.1%</span></div><div class="chart"><canvas id="volumeChart"></canvas></div></div>
    </div>
    <div class="grid grid-2" style="margin-top:16px">
      <div class="card"><div class="row-between"><div><h3>Weekly activity</h3><div class="sub">Sessions completed</div></div><span class="tag">This month</span></div><div class="chart"><canvas id="activityChart"></canvas></div></div>
      <div class="card"><div class="row-between"><div><h3>Muscle-group volume</h3><div class="sub">Relative distribution</div></div><span class="tag">30 days</span></div><div style="margin-top:18px">${bar("Chest",76)}${bar("Back",66)}${bar("Quads",59)}${bar("Shoulders",48)}${bar("Biceps",34)}</div></div>
    </div>
    <div class="section-head"><h2>Personal records</h2><button class="ghost-btn" onclick="openPRModal()">View all</button></div>
    <div class="grid grid-3">${[
      ["Bench Press","100 kg","12 Sep 2026","+5.3%"],["Back Squat","140 kg","09 Sep 2026","+4.1%"],["Deadlift","180 kg","31 Aug 2026","+7.2%"]
    ].map(r=>`<div class="card"><div class="record" style="border:0;padding:0"><div class="badge">♛</div><div class="info"><strong>${r[0]}</strong><small>${r[2]} · previous 95 kg</small></div><div class="pr">${r[1]}<div class="small" style="color:var(--green);text-align:right">${r[3]}</div></div></div></div>`).join("")}</div>
  </div>`;
}
function bar(label,val){return `<div style="margin:14px 0"><div class="row-between small"><span>${label}</span><span class="mono">${val}%</span></div><div style="height:7px;background:#1f2229;border-radius:10px;overflow:hidden;margin-top:7px"><div style="width:${val}%;height:100%;background:var(--accent);border-radius:10px"></div></div></div>`}

function historyHTML(){
  return `<div>
    <div class="section-head"><div><h2>History</h2><span>Every session, one place</span></div><div class="toolbar"><input id="historySearch" placeholder="Search workouts…" oninput="filterHistory()"><select id="historyFilter" onchange="filterHistory()"><option value="all">All</option><option>PRs</option><option>Longest</option></select></div></div>
    <div class="timeline" id="historyList">${historyRows(state.history)}</div>
  </div>`;
}
function historyRows(arr){
  if(!arr.length) return `<div class="card empty">No sessions match your filter.</div>`;
  return arr.map(s=>`<div class="session-card"><div class="session-date">${new Date(s.date+"T12:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short"}).toUpperCase()}</div><div><strong>${esc(s.name)}</strong><small>${s.duration} min · ${s.exercises} exercises · ${s.sets} sets · ${s.volume.toLocaleString()} kg</small></div><div class="right"><strong>${s.prs?`+${s.prs} PR`:"—"}</strong><small>${s.calories} kcal</small></div></div>`).join("");
}
function filterHistory(){
  const q=(document.getElementById("historySearch")?.value||"").toLowerCase(), f=document.getElementById("historyFilter")?.value||"all";
  let arr=state.history.filter(x=>(x.name+" "+x.date).toLowerCase().includes(q));
  if(f==="PRs") arr=arr.filter(x=>x.prs>0); if(f==="Longest") arr=[...arr].sort((a,b)=>b.duration-a.duration);
  const el=document.getElementById("historyList");if(el)el.innerHTML=historyRows(arr);
}

function profileHTML(){
  const p=state.profile;
  return `<div class="profile-form">
    <div class="section-head"><div><h2>Profile & settings</h2><span>Personal defaults shape every session</span></div><button class="primary-btn" onclick="saveProfile()">Save changes</button></div>
    <div class="card">
      <div class="form-grid">
        <div class="field"><label>NAME</label><input id="p_name" value="${esc(p.name)}"></div>
        <div class="field"><label>TRAINING GOAL</label><select id="p_goal"><option ${p.goal==="Strength & Muscle"?"selected":""}>Strength & Muscle</option><option ${p.goal==="Hypertrophy"?"selected":""}>Hypertrophy</option><option ${p.goal==="General Fitness"?"selected":""}>General Fitness</option></select></div>
        <div class="field"><label>EXPERIENCE</label><select id="p_exp">${["Beginner","Intermediate","Advanced"].map(x=>`<option ${p.experience===x?"selected":""}>${x}</option>`).join("")}</select></div>
        <div class="field"><label>WEEKLY TARGET</label><input id="p_target" type="number" min="1" max="7" value="${p.weeklyTarget}"></div>
        <div class="field"><label>UNITS</label><select id="p_units"><option ${p.units==="kg"?"selected":""}>kg</option><option ${p.units==="lb"?"selected":""}>lb</option></select></div>
        <div class="field"><label>DEFAULT REST (SECONDS)</label><input id="p_rest" type="number" min="20" max="300" value="${p.defaultRest}"></div>
      </div>
    </div>
    <div class="section-head"><h2>Preferences</h2><span>Quiet and predictable</span></div>
    <div class="card">
      ${prefRow("Notifications","Workout reminders and completion nudges","notifications")}
      ${prefRow("Haptic cues","Use vibration where supported","haptic")}
      ${prefRow("Auto-advance","Move from rest to next set automatically","autoAdvance")}
      <div style="margin-top:12px" class="row-between"><div><strong style="font-size:12px">Data</strong><div class="sub">Local-first demo storage. Export or reset your data.</div></div><div class="top-actions"><button class="ghost-btn" onclick="exportData()">Export JSON</button><button class="danger-btn" onclick="resetData()">Reset</button></div></div>
    </div>
    <div class="section-head"><h2>About the product</h2></div>
    <div class="card"><div class="kicker">FITMEKO 2026</div><h3 style="font-size:18px;margin-top:8px">A cockpit for your workout.</h3><div class="sub" style="max-width:680px;line-height:1.7;margin-top:9px">Fast set tracking, automatic rest timing, meaningful progress, and an active session that never gets lost.</div></div>
  </div>`;
}
function prefRow(title,sub,key){const on=state.settings[key]!==false;return `<div class="row-between" style="padding:13px 0;border-bottom:1px solid #20232a"><div><strong style="font-size:12px">${title}</strong><div class="sub">${sub}</div></div><button class="toggle ${on?'on':''}" onclick="toggleSetting('${key}')"></button></div>`}

function openModal(inner){document.getElementById("modal").innerHTML=inner;document.getElementById("modalBackdrop").classList.add("open")}
function closeModal(){document.getElementById("modalBackdrop").classList.remove("open")}
function openPRModal(){openModal(`<div class="modal-head"><h3>Personal records</h3><button class="icon-btn" onclick="closeModal()">×</button></div>${[
["Bench Press","100 kg","95 kg","12 Sep 2026","+5.3%"],["Back Squat","140 kg","134.5 kg","09 Sep 2026","+4.1%"],["Deadlift","180 kg","168 kg","31 Aug 2026","+7.2%"],["Overhead Press","60 kg","57.5 kg","29 Aug 2026","+4.3%"],["Weighted Pull-up","+35 kg","+30 kg","26 Aug 2026","+16.7%"]].map(r=>`<div class="record"><div class="badge">♛</div><div class="info"><strong>${r[0]}</strong><small>${r[3]} · previous ${r[2]}</small></div><div class="pr">${r[1]}<div class="small" style="color:var(--green)">${r[4]}</div></div></div>`).join("")}`)}

function openBuilder(){
  let w={id:"custom_"+Date.now(),name:"New Workout",muscles:"Full Body",duration:45,exercises:[
    {id:"custom1",name:"Bench Press",muscle:"Chest",sets:[{w:60,r:8},{w:60,r:8}],rest:90}
  ]};
  openModal(builderModal(w,false));
}
function builderModal(w,editing){
  return `<div class="modal-head"><div><h3>${editing?'Edit':'Create'} workout</h3><div class="sub">Build it once, then let the session run itself.</div></div><button class="icon-btn" onclick="closeModal()">×</button></div>
    <div class="form-grid">
      <div class="field"><label>WORKOUT NAME</label><input id="b_name" value="${esc(w.name)}"></div>
      <div class="field"><label>MUSCLE GROUPS</label><input id="b_muscles" value="${esc(w.muscles)}"></div>
    </div>
    <div class="section-head" style="margin-top:20px"><h2>Exercises</h2><button class="ghost-btn" onclick="addBuilderExercise()">+ Add exercise</button></div>
    <div id="builderList" class="exercise-builder-list">${w.exercises.map((e,i)=>builderExercise(e,i)).join("")}</div>
    <div style="display:flex;gap:9px;margin-top:18px"><button class="ghost-btn" onclick="closeModal()">Cancel</button><button class="primary-btn" style="flex:1" onclick="saveBuilder('${w.id}',${editing})">${editing?'Save workout':'Create workout'}</button></div>`;
}
function builderExercise(e,i){return `<div class="builder-item" data-index="${i}"><div class="drag">☰</div><div><input class="builder-name" value="${esc(e.name)}" style="width:100%" placeholder="Exercise name"><div style="display:flex;gap:7px;margin-top:6px"><input class="builder-muscle" value="${esc(e.muscle)}" placeholder="Muscle"><input class="builder-rest" type="number" value="${e.rest}" placeholder="Rest"></div></div><button class="icon-btn" onclick="this.closest('.builder-item').remove()">×</button></div>`}
let builderCount=2;
function addBuilderExercise(){
  const list=document.getElementById("builderList");const div=document.createElement("div");div.innerHTML=builderExercise({name:"New Exercise",muscle:"Chest",rest:90},builderCount++);list.appendChild(div.firstElementChild);
}
function saveBuilder(id,editing){
  const items=[...document.querySelectorAll(".builder-item")];
  if(!items.length)return showToast("Add at least one exercise");
  const w={id,name:document.getElementById("b_name").value.trim()||"Custom Workout",muscles:document.getElementById("b_muscles").value.trim()||"Full Body",duration:45,exercises:items.map((el,i)=>({id:id+"_"+i,name:el.querySelector(".builder-name").value.trim()||"Exercise "+(i+1),muscle:el.querySelector(".builder-muscle").value.trim()||"Full Body",rest:Number(el.querySelector(".builder-rest").value)||90,sets:[{w:20,r:10},{w:20,r:10},{w:20,r:10}]}))};
  if(editing){const idx=state.workouts.findIndex(x=>x.id===id);if(idx>=0)state.workouts[idx]=w;}else state.workouts.push(w);
  state.selectedWorkout=id;save();closeModal();render();showToast(editing?"Workout saved":"Workout created");
}

function startWorkout(workoutId){
  const w=state.workouts.find(x=>x.id===workoutId);if(!w)return;
  state.current={workoutId,exerciseIndex:0,setIndex:0,elapsed:0,paused:false,completed:[],startedAt:Date.now()};
  state.timer={running:false,seconds:0,total:0};
  save();state.screen="workout";render();startSessionClock();showToast("Workout started");
}
function resumeWorkout(){if(!state.current)return;state.screen="workout";state.current.paused=false;startSessionClock();render()}
function startSessionClock(){clearInterval(timerHandle);timerHandle=setInterval(()=>{if(!state.current)return clearInterval(timerHandle);if(!state.current.paused){state.current.elapsed++;save();updateLiveBits()}},1000)}
function updateLiveBits(){
  const t=document.querySelector(".workout-header .title span"); if(t)t.textContent=`${formatTime(state.current.elapsed)} elapsed · ${state.current.exerciseIndex+1}/${state.workouts.find(x=>x.id===state.current.workoutId).exercises.length} exercises`;
  const mini=document.querySelector(".timer"); if(mini)mini.innerHTML=renderMiniTimer();
}
function pauseSession(){state.current.paused=!state.current.paused;save();render()}
function endSession(){if(confirm("End this workout? Progress already completed will be kept in history.")){finishWorkout(false)}}
function finishWorkout(completed=true){
  clearInterval(timerHandle);
  const c=state.current,w=state.workouts.find(x=>x.id===c.workoutId);
  const vol=totalVolume(w),sets=Math.max(1,c.completed?.filter(Boolean).length||totalSets(w));
  state.history.unshift({id:Date.now(),date:new Date().toISOString().slice(0,10),name:w.name,duration:Math.max(1,Math.round(c.elapsed/60)),volume:vol,sets,exercises:w.exercises.length,prs:completed?1:0,calories:Math.round(c.elapsed*6)});
  const summary={duration:c.elapsed,volume:vol,sets,exercises:w.exercises.length,prs:completed?1:0,name:w.name};
  state.current=null;state.timer={running:false,seconds:0,total:0};save();
  openModal(`<div style="text-align:center;padding:18px 6px"><div class="kicker">SESSION ${completed?'COMPLETE':'SAVED'}</div><h1 style="font-size:30px;margin:9px 0">Great session.</h1><div class="sub">Your work is logged and ready for the next comparison.</div><div class="grid grid-2" style="margin-top:22px;text-align:left">${statCard("Duration",formatTime(summary.duration),"Training time")}${statCard("Volume",summary.volume.toLocaleString()+" kg","Total load")}${statCard("Sets",summary.sets,"Completed")}${statCard("PRs",summary.prs.toString(),"New bests")}</div><button class="primary-btn" style="width:100%;margin-top:18px" onclick="closeModal();nav('history')">View workout history</button></div>`);
}
function completeCurrentSet(){
  const c=state.current,w=state.workouts.find(x=>x.id===c.workoutId),e=w.exercises[c.exerciseIndex],s=e.sets[c.setIndex];
  const wi=Number(document.getElementById("weightInput").value),ri=Number(document.getElementById("repsInput").value);
  if(!wi||!ri)return showToast("Enter weight and reps");
  s.w=wi;s.r=ri;c.completed[c.exerciseIndex*10+c.setIndex]=true;
  if(c.setIndex<e.sets.length-1){c.setIndex++;startRest(e.rest||state.profile.defaultRest);showToast("Set complete · rest started")}
  else if(c.exerciseIndex<w.exercises.length-1){c.exerciseIndex++;c.setIndex=0;startRest(e.rest||state.profile.defaultRest);showToast("Exercise complete · next set ready")}
  else{save();render();finishWorkout(true);return}
  save();render();
}
function startRest(seconds){state.timer={running:true,seconds,total:seconds};const h=setInterval(()=>{if(!state.timer.running){clearInterval(h);return}state.timer.seconds--; if(state.timer.seconds<=0){clearInterval(h);state.timer.running=false;showToast("Rest complete · go")}updateLiveBits();save()},1000); }
function toggleTimer(){if(!state.timer.total)return startRest(state.profile.defaultRest);state.timer.running=!state.timer.running;updateLiveBits();save()}
function addRest(s){state.timer.seconds+=s;state.timer.total=Math.max(state.timer.total,state.timer.seconds);updateLiveBits();save()}
function skipRest(){state.timer.running=false;state.timer.seconds=0;updateLiveBits();save()}
function adjustCurrent(key,delta){
  const c=state.current,w=state.workouts.find(x=>x.id===c.workoutId),e=w.exercises[c.exerciseIndex],s=e.sets[c.setIndex];
  s[key]=Math.max(0,key==="w"?Number(s[key]||0)+delta:Number(s[key]||0)+delta);render();save();
}
function setCurrentValue(key,v){
  const c=state.current,w=state.workouts.find(x=>x.id===c.workoutId),e=w.exercises[c.exerciseIndex],s=e.sets[c.setIndex];s[key]=Number(v)||0;save()
}
function skipExercise(){
  const c=state.current,w=state.workouts.find(x=>x.id===c.workoutId);
  if(c.exerciseIndex<w.exercises.length-1){c.exerciseIndex++;c.setIndex=0;state.timer={running:false,seconds:0,total:0};save();render();showToast("Exercise skipped")}
  else finishWorkout(false);
}

function toggleSetting(k){state.settings[k]=state.settings[k]===false;save();render()}
function saveProfile(){
  state.profile.name=document.getElementById("p_name").value.trim()||"Athlete";
  state.profile.goal=document.getElementById("p_goal").value;
  state.profile.experience=document.getElementById("p_exp").value;
  state.profile.weeklyTarget=Math.max(1,Math.min(7,Number(document.getElementById("p_target").value)||4));
  state.profile.units=document.getElementById("p_units").value;
  state.profile.defaultRest=Math.max(20,Math.min(300,Number(document.getElementById("p_rest").value)||90));
  save();render();showToast("Profile saved");
}
function exportData(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="fitmeko-data.json";a.click();URL.revokeObjectURL(url);showToast("Data exported");
}
function resetData(){if(confirm("Reset FitMeko data?")){localStorage.removeItem(STORE_KEY);state=structuredClone(defaultState);location.reload()}}
function drawChart(id,data){
  const c=document.getElementById(id);if(!c)return;const box=c.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=box.width*dpr;c.height=box.height*dpr;
  const ctx=c.getContext("2d");ctx.scale(dpr,dpr);const w=box.width,h=box.height,pad={l:10,r:10,t:12,b:24};ctx.strokeStyle="#252832";ctx.lineWidth=1;
  for(let i=0;i<4;i++){const y=pad.t+(h-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}
  const min=Math.min(...data)-1,max=Math.max(...data)+1;const pts=data.map((v,i)=>[pad.l+i*(w-pad.l-pad.r)/(data.length-1),pad.t+(max-v)/(max-min)*(h-pad.t-pad.b)]);
  ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.lineTo(pts.at(-1)[0],h-pad.b);ctx.lineTo(pts[0][0],h-pad.b);ctx.closePath();ctx.fillStyle="rgba(255,125,110,.07)";ctx.fill();
  ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle="#ff7d6e";ctx.lineWidth=2;ctx.stroke();
  pts.forEach(([x,y])=>{ctx.fillStyle="#ff9a86";ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill()});
  ctx.fillStyle="#7d8390";ctx.font="10px Inter";ctx.textAlign="center";["W1","W2","W3","W4","W5","W6","W7","W8"].forEach((x,i)=>{const px=pad.l+i*(w-pad.l-pad.r)/7;ctx.fillText(x,px,h-7)})
}
function drawAllCharts(){
  drawChart("strengthChart",[88,89,91,90,93,95,97,100]);
  drawChart("volumeChart",[8,7.2,9.1,8.8,9.5,10.2,10.7,11.4]);
  drawChart("activityChart",[2,3,2,4,3,4,3,4]);
}

function render(){
  document.getElementById("app").innerHTML=renderShell();
  requestAnimationFrame(()=>drawAllCharts());
  if(state.current && state.current.screen==="workout"){ /* session remains */ }
}

window.addEventListener("resize",()=>drawAllCharts());
window.addEventListener("beforeunload",save);

render();
