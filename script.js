const STORE_KEY = 'fitmeko_pastel_v2';

const defaultState = {
  tab: 'home',
  weekDone: [true,false,true,true,false,false,false],
  workout: {
    name: 'Push Day', muscles: 'Chest · Shoulders · Triceps', duration: 58,
    exercises: [
      {name:'Bench Press', muscle:'Chest', sets:[{w:80,r:8},{w:80,r:8},{w:82.5,r:6},{w:82.5,r:6}],rest:90},
      {name:'Incline Dumbbell Press', muscle:'Chest', sets:[{w:30,r:10},{w:30,r:9},{w:30,r:8}],rest:80},
      {name:'Cable Lateral Raise', muscle:'Shoulders', sets:[{w:10,r:14},{w:10,r:13},{w:10,r:12}],rest:65},
      {name:'Triceps Pushdown', muscle:'Triceps', sets:[{w:32.5,r:12},{w:32.5,r:10},{w:32.5,r:9}],rest:65}
    ]
  },
  session: null,
  rest: {running:false,seconds:0,total:0},
  profile: {name:'Arish',goal:'Strength & Muscle',weeklyTarget:4,units:'kg',rest:90},
  notifications:true,
  history:[
    {date:'12 Sep 2026',name:'Push Day',duration:58,volume:8420,prs:2},
    {date:'09 Sep 2026',name:'Leg Day',duration:64,volume:11860,prs:1},
    {date:'07 Sep 2026',name:'Pull Day',duration:52,volume:7210,prs:0},
    {date:'04 Sep 2026',name:'Push Day',duration:55,volume:8120,prs:0}
  ]
};

let state = load();
let restHandle = null;
let clockHandle = null;
let toastHandle = null;

function load(){
  try { return Object.assign(structuredClone(defaultState), JSON.parse(localStorage.getItem(STORE_KEY)||'null')||{}); }
  catch(e) { return structuredClone(defaultState); }
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function toast(msg){ const t=document.querySelector('.toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); clearTimeout(toastHandle); toastHandle=setTimeout(()=>t.classList.remove('show'),1800); }
function fmt(sec){ sec=Math.max(0,Math.floor(sec)); return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`; }
function volume(w=state.workout){ return w.exercises.flatMap(e=>e.sets).reduce((a,s)=>a+(+s.w||0)*(+s.r||0),0); }

function nav(tab){ state.tab=tab; save(); render(); window.scrollTo({top:0,behavior:'smooth'}); }

function shell(body){
  return `<div class="shell"><div class="app">
    <div class="header">
      <div class="hello"><div class="avatar"></div><div class="hi"><h1>Hi, ${esc(state.profile.name)} 👋</h1><p>Ready to get stronger today?</p></div></div>
      <div class="header-actions"><button class="icon-btn" onclick="toast('You’re all caught up ✨')">♡</button><button class="icon-btn" onclick="nav('profile')">⚙</button></div>
    </div>
    <div class="main">${body}</div>
    ${bottomNav()}
    <div class="toast"></div>
    <div class="modal-wrap" id="modalWrap" onclick="closeModal()"><div class="modal" id="modal" onclick="event.stopPropagation()"></div></div>
  </div></div>`;
}
function bottomNav(){
  const items=[['home','⌂','Home'],['planner','▦','Planner'],['plus','＋',''],['focus','◷','Focus'],['profile','◎','Profile']];
  return `<div class="bottom-nav">${items.map(x=>x[0]==='plus'
    ? `<button onclick="openQuickAdd()" class="${state.tab==='plus'?'active':''}"><span class="nav-ico">⊕</span></button>`
    : `<button class="${state.tab===x[0]?'active':''}" onclick="nav('${x[0]}')"><span class="nav-ico">${x[1]}</span>${x[2]}</button>`).join('')}</div>`;
}

function home(){
 const d=new Date();
 const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const nums=[20,21,22,23,24,25,26];
 return `
 <div class="date-strip">${days.map((x,i)=>`<div class="date ${i===1?'active':''}">${x}<b>${nums[i]}</b></div>`).join('')}</div>

 <div class="section"><div class="section-head"><h2>Today’s Workout</h2><span onclick="nav('planner')">View all</span></div>
 <div class="hero"><div class="hero-top"><div><div class="kicker">PLANNED SESSION</div><h2>${state.session?'Workout in progress':'Push Day'}</h2><p>${state.session?'Pick up where you left off.':'Chest, shoulders & triceps · ~58 min'}</p></div><div class="hero-art"></div></div>
 <div class="hero-meta"><span class="hero-chip">6 exercises</span><span class="hero-chip">~60 min</span><span class="hero-chip">Smart session</span></div>
 <button class="primary" onclick="${state.session?'resume()':'startWorkout()'}">${state.session?'Resume Workout →':'Start Workout →'}</button></div></div>

 <div class="quote"><div class="bubble">✦</div><p>“Discipline today, success tomorrow.”</p></div>

 <div class="section"><div class="section-head"><h2>Your Week</h2><span>3 / 7 workouts</span></div>
 <div class="week-card"><div class="week">${days.map((x,i)=>`<div class="wday">${x[0]}<div class="dot ${state.weekDone[i]?'done':''} ${i===1?'today':''}">${state.weekDone[i]?'✓':''}</div></div>`).join('')}</div></div></div>

 <div class="section"><div class="section-head"><h2>Today’s Schedule</h2><span>See all</span></div>
 <div class="list-card">
  ${scheduleRow('▣','pink','Mathematics','Chapters 1–3','09:00 AM')}
  ${scheduleRow('♧','green','Biology','Cell Structure','11:30 AM')}
  ${scheduleRow('⌂','gold','History','The First World War','02:00 PM')}
  ${scheduleRow('⚛','purple','Physics','Motion in a Straight Line','04:30 PM')}
 </div></div>

 <div class="section"><div class="section-head"><h2>Quick Stats</h2><span onclick="nav('progress')">View progress</span></div>
 <div class="kpi-grid">${kpi('Current Streak','12 days','Keep it going')}${kpi('Weekly Volume','12,450 kg','+8% this week',true)}${kpi('Total Workouts','124','Lifetime')}${kpi('PRs','7','This month',true)}</div></div>
 `;
}
function scheduleRow(icon,cls,title,sub,time){
 return `<div class="row"><div class="row-icon ${cls}">${icon}</div><div class="row-info"><strong>${title}</strong><small>${sub}</small></div><div class="row-time">${time}</div></div>`;
}
function kpi(label,value,sub,good=false){return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div><div class="sub ${good?'delta':''}">${sub}</div></div>`}

function planner(){
 return `<div class="page-title">Planner</div><p class="page-sub">Choose a session or customize your week.</p>
 <div class="section"><div class="section-head"><h2>Workout plans</h2><button class="small-btn" onclick="openBuilder()">+ New</button></div>
 <div class="list-card">
  ${plannerRow('💜','Push Day','Chest · Shoulders · Triceps','4 exercises · 58 min','startWorkout()')}
  ${plannerRow('💚','Pull Day','Back · Biceps · Rear delts','3 exercises · 52 min','startPull()')}
  ${plannerRow('🌿','Leg Day','Quads · Hamstrings · Calves','3 exercises · 64 min','startLegs()')}
 </div></div>
 <div class="section"><div class="section-head"><h2>Build your week</h2><span>drag-like simplicity</span></div>
 <div class="week-card"><div class="week">${['M','T','W','T','F','S','S'].map((x,i)=>`<div class="wday">${x}<div class="dot ${i<4?'done':''}">${i<4?'✓':''}</div></div>`).join('')}</div></div></div>`;
}
function plannerRow(emoji,name,sub,meta,action){return `<div class="row" onclick="${action}"><div class="row-icon purple">${emoji}</div><div class="row-info"><strong>${name}</strong><small>${sub} · ${meta}</small></div><div class="row-time">›</div></div>`}

function focus(){
 const s=state.session;
 return `<div class="page-title">Focus Timer</div><p class="page-sub">Stay focused on your goal.</p>
 <div class="section"><div class="focus-card">
  <div style="display:flex;justify-content:center;gap:6px"><span class="small-btn" style="background:#8061db;color:#fff;border-color:#8061db">Pomodoro</span><span class="small-btn">Short Break</span></div>
  <div class="timer-ring" id="timerRing"><div class="timer-inner"><small>${state.rest.running?'Rest':'Focus'}</small><strong id="focusTime">${state.rest.running?fmt(state.rest.seconds):'25:00'}</strong></div></div>
  <div style="text-align:center"><div style="font-family:Nunito;font-size:14px;font-weight:800">${s?('Set '+(s.setIndex+1)+' · '+s.exercise.name):'Focus on your workout'}</div><div class="helper" style="margin-top:4px">Complete your set, then take a clean rest.</div></div>
  <div class="timer-controls" style="margin-top:16px"><button class="soft-btn" onclick="addRest(30)">+30s</button><button class="soft-btn accent" onclick="toggleRest()">${state.rest.running?'Pause':'Start'}</button><button class="soft-btn" onclick="skipRest()">Skip</button></div>
 </div></div>
 ${s?`<div class="section"><div class="section-head"><h2>Current set</h2><span>${s.exercise.muscle}</span></div>${setEditorHTML()}</div>`:''}`;
}

function setEditorHTML(){
 const c=state.session,e=c.exercise,ss=e.sets[c.setIndex];
 return `<div class="form-card"><div class="set-row"><div class="badge">${c.setIndex+1}</div><div><b style="font-size:10px">${e.name}</b><div class="helper">Last: ${e.sets[Math.max(0,c.setIndex-1)]?.w||ss.w} kg × ${e.sets[Math.max(0,c.setIndex-1)]?.r||ss.r}</div></div><button class="small-btn" onclick="completeSet()">✓ Done</button></div>
 <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
  <div class="field"><label>Weight</label><input id="cw" type="number" step="0.5" value="${ss.w}"></div>
  <div class="field"><label>Reps</label><input id="cr" type="number" value="${ss.r}"></div>
 </div></div>`;
}

function progress(){
 return `<div class="page-title">Progress</div><p class="page-sub">A calm view of how your training is moving.</p>
 <div class="section"><div class="kpi-grid">${kpi('Study time','18h 45m','This month')}${kpi('Workouts','16','+2 this month',true)}${kpi('Volume','42,350 kg','+12%',true)}${kpi('PRs','7','Keep going',true)}</div></div>
 <div class="section"><div class="section-head"><h2>Weekly Activity</h2><span>View all</span></div><div class="chart"><canvas id="progressChart"></canvas><div class="legend"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div></div></div>
 <div class="section"><div class="section-head"><h2>Subjects / Muscle Groups</h2><span>30 days</span></div><div class="form-card">
  ${bar('Chest',75)}${bar('Back',63)}${bar('Quads',58)}${bar('Shoulders',47)}
 </div></div>
 <div class="section"><div class="section-head"><h2>Personal Records</h2><span onclick="openPRs()">View all</span></div><div class="list-card">
  ${record('Bench Press','100 kg','12 Sep 2026')}${record('Back Squat','140 kg','09 Sep 2026')}${record('Deadlift','180 kg','31 Aug 2026')}${record('Overhead Press','60 kg','29 Aug 2026')}
 </div></div>`;
}
function bar(name,val){return `<div style="margin:10px 0"><div class="row-between" style="display:flex;justify-content:space-between"><span style="font-size:9px">${name}</span><span style="font-size:9px;color:#9b9097">${val}%</span></div><div class="progress-bar" style="margin-top:5px"><div class="progress-fill" style="width:${val}%"></div></div></div>`}
function record(n,v,d){return `<div class="record"><div class="trophy">♛</div><div><strong>${n}</strong><small>${d} · previous best</small></div><b>${v}</b></div>`}

function history(){
 return `<div class="page-title">History</div><p class="page-sub">Your training story, one session at a time.</p>
 <div class="section"><div class="form-card"><div class="field"><label>Search</label><input id="histSearch" placeholder="Push Day, Leg Day..." oninput="filterHistory()"></div></div></div>
 <div class="section"><div class="section-head"><h2>Recent sessions</h2><span>12 Sep 2026</span></div><div class="session" id="historyList">${historyRows(state.history)}</div></div>`;
}
function historyRows(arr){ return arr.map((x,i)=>`<div class="row" onclick="openHistory(${i})"><div class="row-icon ${i%2?'green':'pink'}">${i%2?'♧':'▦'}</div><div class="row-info"><strong>${x.name}</strong><small>${x.date} · ${x.duration} min · ${x.volume.toLocaleString()} kg</small></div><div class="row-time">${x.prs?x.prs+' PR':'›'}</div></div>`).join('') || '<div class="helper" style="padding:20px;text-align:center">No sessions found.</div>';}
function filterHistory(){const q=(document.getElementById('histSearch')?.value||'').toLowerCase();const arr=state.history.filter(x=>(x.name+x.date).toLowerCase().includes(q));document.getElementById('historyList').innerHTML=historyRows(arr);}

function profile(){
 const p=state.profile;
 return `<div class="page-title">Profile</div><p class="page-sub">Personalize FitMeko around your training.</p>
 <div class="section"><div class="form-card">
  <div class="field"><label>Name</label><input id="pname" value="${esc(p.name)}"></div>
  <div class="field"><label>Training goal</label><select id="pgoal"><option ${p.goal==='Strength & Muscle'?'selected':''}>Strength & Muscle</option><option ${p.goal==='Hypertrophy'?'selected':''}>Hypertrophy</option><option ${p.goal==='General Fitness'?'selected':''}>General Fitness</option></select></div>
  <div class="field"><label>Weekly target</label><input id="ptarget" type="number" min="1" max="7" value="${p.weeklyTarget}"></div>
  <div class="field"><label>Default rest (seconds)</label><input id="prest" type="number" min="30" max="300" value="${p.rest}"></div>
  <button class="primary" style="width:100%" onclick="saveProfile()">Save changes</button>
 </div></div>
 <div class="section"><div class="section-head"><h2>Preferences</h2><span>simple & quiet</span></div><div class="form-card">
  ${pref('Notifications','Workout reminders','notifications')}${pref('Auto-advance','Move through sets automatically','autoAdvance')}${pref('Haptics','Subtle feedback where supported','haptics')}
 </div></div>
 <div class="section"><div class="section-head"><h2>Data</h2><span>local first</span></div><div class="form-card"><div class="helper">Everything in this demo is stored in your browser. Export it anytime.</div><div style="display:flex;gap:7px;margin-top:10px"><button class="small-btn" onclick="exportData()">Export JSON</button><button class="small-btn" onclick="resetData()">Reset demo</button></div></div></div>`;
}
function pref(title,sub,key){const on=state[key]!==false;return `<div class="toggle-row"><div><div style="font-size:10px;font-weight:700">${title}</div><div class="helper">${sub}</div></div><button class="toggle ${on?'on':''}" onclick="togglePref('${key}')"></button></div>`}

function startWorkout(){
 state.session={exerciseIndex:0,setIndex:0,elapsed:0,exercise:null};
 state.session.exercise=structuredClone(state.workout.exercises[0]);
 state.rest={running:false,seconds:0,total:0};
 state.tab='focus'; save(); startClock(); render(); toast('Workout started ✨');
}
function startPull(){
 state.workout={name:'Pull Day',muscles:'Back · Biceps · Rear Delts',duration:52,exercises:[
  {name:'Barbell Row',muscle:'Back',sets:[{w:70,r:8},{w:70,r:8},{w:72.5,r:6}],rest:90},
  {name:'Lat Pulldown',muscle:'Back',sets:[{w:60,r:10},{w:60,r:9},{w:60,r:9}],rest:80},
  {name:'EZ Bar Curl',muscle:'Biceps',sets:[{w:30,r:10},{w:30,r:9},{w:30,r:8}],rest:70}
 ]}; startWorkout();
}
function startLegs(){
 state.workout={name:'Leg Day',muscles:'Quads · Hamstrings · Calves',duration:64,exercises:[
  {name:'Back Squat',muscle:'Quads',sets:[{w:120,r:6},{w:120,r:6},{w:125,r:5},{w:125,r:5}],rest:110},
  {name:'Romanian Deadlift',muscle:'Hamstrings',sets:[{w:90,r:8},{w:90,r:8},{w:90,r:7}],rest:95},
  {name:'Standing Calf Raise',muscle:'Calves',sets:[{w:70,r:12},{w:70,r:12},{w:70,r:11}],rest:70}
 ]}; startWorkout();
}
function resume(){ state.tab='focus'; startClock(); render(); }
function startClock(){ clearInterval(clockHandle); clockHandle=setInterval(()=>{if(state.session){state.session.elapsed++;save();const el=document.querySelector('.hi p'); if(el)el.textContent=`${fmt(state.session.elapsed)} in session`;}},1000); }
function completeSet(){
 const c=state.session;if(!c)return;const w=+document.getElementById('cw').value||0,r=+document.getElementById('cr').value||0;
 c.exercise.sets[c.setIndex]={w,r}; state.rest={running:true,seconds:c.exercise.rest||state.profile.rest,total:c.exercise.rest||state.profile.rest};
 const next=c.setIndex<c.exercise.sets.length-1;
 if(next){c.setIndex++;}
 else if(c.exerciseIndex<state.workout.exercises.length-1){c.exerciseIndex++;c.setIndex=0;c.exercise=structuredClone(state.workout.exercises[c.exerciseIndex]);toast('Exercise complete — next one ready');}
 else {finishWorkout();return;}
 save();render();runRest();toast('Set complete · rest started');
}
function runRest(){
 clearInterval(restHandle); restHandle=setInterval(()=>{ if(!state.rest.running)return; state.rest.seconds--; if(state.rest.seconds<=0){state.rest.running=false;clearInterval(restHandle);toast('Rest complete · go!')} save();updateTimerUI(); },1000);
}
function updateTimerUI(){
 const t=document.getElementById('focusTime'); if(t)t.textContent=state.rest.running?fmt(state.rest.seconds):'25:00';
}
function toggleRest(){ if(!state.rest.total){state.rest={running:true,seconds:state.profile.rest,total:state.profile.rest};runRest();} else {state.rest.running=!state.rest.running;if(state.rest.running)runRest();} save();render(); }
function addRest(sec){state.rest.seconds+=sec;state.rest.total=Math.max(state.rest.total,state.rest.seconds);save();render();toast('+30 seconds')}
function skipRest(){state.rest={running:false,seconds:0,total:0};save();render()}
function finishWorkout(){
 clearInterval(clockHandle); clearInterval(restHandle);
 const c=state.session, w=state.workout;
 state.history.unshift({date:'13 Sep 2026',name:w.name,duration:Math.max(1,Math.round(c.elapsed/60)),volume:volume(w),prs:1});
 state.weekDone[6]=true; state.session=null; state.rest={running:false,seconds:0,total:0}; save();
 openModal(`<div style="text-align:center;padding:12px 6px"><div style="font-size:26px">✦</div><h3 style="font-family:Nunito;font-size:23px;margin:5px 0">Workout Complete!</h3><p class="helper">Great session. Your progress is logged.</p><div class="kpi-grid" style="margin-top:15px">${kpi('Duration',fmt(c.elapsed),'Session time')}${kpi('Volume',volume(w).toLocaleString()+' kg','Total load')}${kpi('Sets',totalSetsDone(c),'Completed')}${kpi('PRs','1','New best',true)}</div><button class="primary" style="width:100%;margin-top:14px" onclick="closeModal();nav('history')">View history</button></div>`);
}
function totalSetsDone(c){return Math.max(1,(c.exerciseIndex*10+c.setIndex+1))}
function openHistory(i){const x=state.history[i];openModal(`<div class="modal-head"><div><h3>${x.name}</h3><div class="helper">${x.date} · ${x.duration} min</div></div><button class="close" onclick="closeModal()">×</button></div><div class="kpi-grid">${kpi('Volume',x.volume.toLocaleString()+' kg','Total')}${kpi('PRs',String(x.prs),'Session')}${kpi('Exercises','5','Logged')}${kpi('Sets','15','Logged')}</div><div class="section"><div class="section-head"><h2>Breakdown</h2><span>example</span></div><div class="form-card">${['Bench Press · 80 × 8 · 80 × 8 · 82.5 × 6','Incline Dumbbell Press · 30 × 10 · 30 × 9 · 30 × 8','Cable Lateral Raise · 10 × 14 · 10 × 13 · 10 × 12'].map(s=>`<div class="record"><div class="badge">✓</div><div><strong>${s}</strong><small>Completed</small></div></div>`).join('')}</div></div>`)}
function openPRs(){openModal(`<div class="modal-head"><h3>Personal Records</h3><button class="close" onclick="closeModal()">×</button></div>${record('Bench Press','100 kg','12 Sep 2026')}${record('Back Squat','140 kg','09 Sep 2026')}${record('Deadlift','180 kg','31 Aug 2026')}${record('Overhead Press','60 kg','29 Aug 2026')}${record('Pull-up','+35 kg','26 Aug 2026')}`)}
function openQuickAdd(){openModal(`<div class="modal-head"><h3>Quick Add</h3><button class="close" onclick="closeModal()">×</button></div><button class="primary" style="width:100%;margin-bottom:8px" onclick="closeModal();startWorkout()">Start workout</button><button class="soft-btn" style="width:100%" onclick="closeModal();openBuilder()">Create workout</button>`)}
function openBuilder(){openModal(`<div class="modal-head"><div><h3>Create a workout</h3><div class="helper">Small setup, reusable session.</div></div><button class="close" onclick="closeModal()">×</button></div><div class="field"><label>Workout name</label><input id="bn" value="New Workout"></div><div class="field"><label>Muscle groups</label><input id="bm" value="Full Body"></div><div class="field"><label>First exercise</label><input id="be" value="Bench Press"></div><button class="primary" style="width:100%;margin-top:2px" onclick="createWorkout()">Create workout</button>`)}
function createWorkout(){const n=document.getElementById('bn').value||'New Workout',m=document.getElementById('bm').value||'Full Body',e=document.getElementById('be').value||'Exercise';state.workout={name:n,muscles:m,duration:45,exercises:[{name:e,muscle:m.split(' · ')[0],sets:[{w:20,r:10},{w:20,r:10},{w:20,r:10}],rest:90}]};save();closeModal();nav('planner');toast('Workout created ✓')}
function saveProfile(){state.profile.name=document.getElementById('pname').value||'Athlete';state.profile.goal=document.getElementById('pgoal').value;state.profile.weeklyTarget=+document.getElementById('ptarget').value||4;state.profile.rest=+document.getElementById('prest').value||90;save();render();toast('Profile saved')}
function togglePref(k){state[k]=state[k]===false;save();render()}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='fitmeko-data.json';a.click();URL.revokeObjectURL(u);toast('Exported')}
function resetData(){if(confirm('Reset FitMeko demo data?')){localStorage.removeItem(STORE_KEY);location.reload()}}
function closeModal(){document.getElementById('modalWrap')?.classList.remove('open')}
function openModal(content){const b=document.getElementById('modalWrap'),m=document.getElementById('modal');if(!b||!m)return;m.innerHTML=content;b.classList.add('open')}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}

function drawProgress(){
 const c=document.getElementById('progressChart'); if(!c)return;
 const r=c.getBoundingClientRect(),dpr=devicePixelRatio||1;c.width=r.width*dpr;c.height=r.height*dpr;
 const ctx=c.getContext('2d');ctx.scale(dpr,dpr);const w=r.width,h=r.height;
 ctx.strokeStyle='#eee2de';ctx.lineWidth=1;for(let i=0;i<4;i++){const y=12+(h-32)*i/3;ctx.beginPath();ctx.moveTo(10,y);ctx.lineTo(w-10,y);ctx.stroke()}
 const vals=[2,3,2.5,4,3,4.2,3.7,4.8],min=1,max=5.2;
 const pts=vals.map((v,i)=>[12+i*(w-24)/(vals.length-1),12+(max-v)/(max-min)*(h-32)]);
 ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle='#8061db';ctx.lineWidth=3;ctx.stroke();
 pts.forEach(([x,y])=>{ctx.fillStyle='#fff';ctx.strokeStyle='#8061db';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fill();ctx.stroke();});
}

function totalSets(w){return w.exercises.reduce((a,e)=>a+e.sets.length,0)}

function render(){
 let body='';
 if(state.tab==='home')body=home();
 else if(state.tab==='planner')body=planner();
 else if(state.tab==='focus')body=focus();
 else if(state.tab==='progress')body=progress();
 else if(state.tab==='history')body=history();
 else if(state.tab==='profile')body=profile();
 else body=home();
 document.getElementById('app').innerHTML=shell(body);
 requestAnimationFrame(drawProgress);
}

window.addEventListener('resize',drawProgress);
window.addEventListener('beforeunload',save);
render();
