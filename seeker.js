/* ================= JOB SEEKER MODE + PUBLIC JOB BOARD ================= */
const SNAV = [['s-home','Dashboard','fa-house'],['s-jobs','Find jobs','fa-magnifying-glass'],['s-apps','My applications','fa-paper-plane'],['s-invites','Invitations','fa-envelope-open-text'],['s-profile','My profile','fa-id-card']];
const me = () => { const s = getSession(); return s && s.role==='seeker' ? plat.seekers.find(x=>x.id===s.id) : null; };
const PROFILE_FIELDS = ['name','headline','phone','location','exp','skills','education','summary','cv'];
const profileDone = p => Math.round(PROFILE_FIELDS.filter(k => String(p[k]||'').trim()).length / PROFILE_FIELDS.length * 100);
const profileReady = p => !!(p.name && p.phone && p.skills);
const FLOW = ['Applied','Screening','Shortlisted','Interview','Offer','Hired'];
const scoreCls = n => n>=75 ? 'bg-emerald-100 text-emerald-800' : n>=55 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800';

function tracker(stage){
  if(stage==='Rejected') return '<div class="text-xs font-bold text-rose-600"><i class="fa-solid fa-circle-xmark"></i> Not selected for this role</div>';
  const i = FLOW.indexOf(stage);
  return `<div class="flex items-center gap-1 flex-wrap">${FLOW.map((s,k)=>`<span class="tag ${k<=i?'bg-indigo-600 text-white':'bg-slate-100 text-slate-400'}">${s}</span>`).join('<span class="text-slate-300 text-xs">›</span>')}</div>`;
}

function jobCard(j, o={}){
  const need = splitList(j.skills), hits = o.hits || [];
  return `<div class="card space-y-3 flex flex-col"><div class="flex justify-between items-start gap-2"><div><span class="tag bg-indigo-100 text-indigo-700">${esc(j.dept)}</span><h3 class="font-extrabold text-lg mt-1">${esc(j.title)}</h3><div class="text-xs text-slate-500 font-semibold">${esc(j.company)}</div></div>
    ${o.score!=null?`<span class="tag ${scoreCls(o.score)} !text-[11px] whitespace-nowrap"><i class="fa-solid fa-brain"></i> ${o.score}% match</span>`:''}</div>
    <div class="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1"><span><i class="fa-solid fa-location-dot text-indigo-500"></i> ${esc(j.location)}</span><span><i class="fa-solid fa-briefcase text-indigo-500"></i> ${esc(j.type)}</span>${j.minExp?`<span><i class="fa-solid fa-star text-indigo-500"></i> ${esc(j.minExp)}+ yrs</span>`:''}<span><i class="fa-solid fa-calendar text-indigo-500"></i> Posted ${fmt(j.posted)}</span></div>
    <p class="text-xs text-slate-600 leading-relaxed flex-1">${esc(j.desc)}</p>
    <div class="flex flex-wrap gap-1">${need.map(n=>`<span class="tag ${hits.includes(n)?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600'}">${esc(n)}</span>`).join('')}</div>${o.action||''}</div>`;
}

function filteredBoard(){
  const q = tokens(ui.jq), loc = ui.jloc.trim().toLowerCase();
  return boardJobs().filter(j => { const blob = [j.title,j.company,j.dept,j.skills,j.desc,j.location].join(' ').toLowerCase();
    return q.every(t=>blob.includes(t)) && (!loc || j.location.toLowerCase().includes(loc)) && (ui.jtype==='All' || j.type===ui.jtype); });
}
function boardFilters(){
  return `<div class="card mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3"><input class="inp" placeholder="Search title, skill, company…" value="${esc(ui.jq)}" onchange="ui.jq=this.value;go()"><input class="inp" placeholder="Location" value="${esc(ui.jloc)}" onchange="ui.jloc=this.value;go()">
    <select class="inp" onchange="ui.jtype=this.value;go()">${['All',...EMP_TYPES,'Contractual','Remote','Internship'].filter((v,i,a)=>a.indexOf(v)===i).map(t=>`<option ${t===ui.jtype?'selected':''}>${t}</option>`).join('')}</select>
    <button class="btn btn-s justify-center" onclick="Object.assign(ui,{jq:'',jloc:'',jtype:'All'});go()">Clear filters</button></div>`;
}

/* ---- seeker pages ---- */
function pageSHome(){
  const u = me(), p = u.profile, pct = profileDone(p), apps = myApplications(u.id);
  const inv = plat.invites.filter(i => i.seekerId===u.id && i.status==='Sent');
  const applied = new Set(apps.map(a => a.employerId+':'+a.jobId));
  const rec = p.skills ? boardJobs().filter(j => !applied.has(j.employerId+':'+j.id)).map(j => ({j, score:scoreProfile(p,j)})).sort((a,b)=>b.score-a.score).slice(0,4) : [];
  const iv = apps.filter(a => a.interview && new Date(a.interview.datetime) >= new Date()).sort((a,b)=>a.interview.datetime.localeCompare(b.interview.datetime));
  const kpi = (l,v,i,c) => `<div class="card flex items-center gap-4"><div class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${c}"><i class="fa-solid ${i}"></i></div><div><div class="text-2xl font-extrabold">${v}</div><div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">${l}</div></div></div>`;
  return `<h2 class="text-2xl font-extrabold mb-1">Hello, ${esc((p.name||'there').split(' ')[0])} 👋</h2><p class="text-xs text-slate-500 mb-5">Your job search at a glance.</p>
  ${pct<100?`<div class="card mb-5 flex flex-col sm:flex-row sm:items-center gap-3 ${profileReady(p)?'':'border-amber-300 bg-amber-50'}"><div class="flex-1"><div class="font-extrabold text-sm">Profile ${pct}% complete</div><div class="h-2 bg-slate-200 rounded-full mt-2"><div class="h-2 bg-indigo-600 rounded-full" style="width:${pct}%"></div></div><div class="text-[11px] text-slate-500 mt-1">${profileReady(p)?'A complete profile with a CV gets found by employers more often.':'Add your name, phone and skills so you can apply and be matched.'}</div></div><a href="#/s-profile" class="btn btn-p">Complete profile</a></div>`:''}
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${kpi('Applications',apps.length,'fa-paper-plane','bg-indigo-50 text-indigo-600')}${kpi('Interviews',iv.length,'fa-calendar-check','bg-amber-50 text-amber-600')}${kpi('Invitations',inv.length,'fa-envelope-open-text','bg-emerald-50 text-emerald-600')}${kpi('Visible to employers',p.visible?'Yes':'No','fa-eye','bg-blue-50 text-blue-600')}</div>
  ${iv.length?`<div class="card mb-6"><h3 class="font-extrabold text-sm mb-2">Upcoming interviews</h3>${iv.map(a=>`<div class="flex justify-between text-xs py-2 border-b border-slate-100"><span class="font-bold">${esc(a.role)} <span class="text-slate-400 font-medium">· ${esc(a.company)}</span></span><span>${fmtDT(a.interview.datetime)} · ${esc(a.interview.mode)}</span></div>`).join('')}</div>`:''}
  <h3 class="font-extrabold mb-3">Recommended for you</h3><div class="grid md:grid-cols-2 gap-4">${rec.map(({j,score})=>jobCard(j,{score,hits:skillHits(p,j),action:`<button class="btn btn-p self-start" onclick="A.applyForm('${j.employerId}','${j.id}')">Apply now</button>`})).join('')||'<div class="card text-sm text-slate-400 md:col-span-2 text-center py-8">Add your skills to see personalised matches.</div>'}</div>`;
}

function pageSJobs(){
  const u = me(), p = u.profile, hasProfile = !!String(p.skills||'').trim();
  const mine = new Set(myApplications(u.id).map(a => a.employerId+':'+a.jobId));
  const list = filteredBoard().map(j => ({j, score: hasProfile ? scoreProfile(p,j) : null})).sort((a,b) => hasProfile ? b.score-a.score : 0);
  return `<h2 class="text-2xl font-extrabold mb-1">Find jobs</h2><p class="text-xs text-slate-500 mb-4">${hasProfile?'Sorted by how well each job fits your profile.':'Add skills to your profile to see match scores.'}</p>${boardFilters()}
  <div class="grid md:grid-cols-2 gap-4">${list.map(({j,score})=>jobCard(j,{score,hits:hasProfile?skillHits(p,j):[],action: mine.has(j.employerId+':'+j.id)?'<span class="tag bg-emerald-100 text-emerald-800 self-start !text-[11px]">✓ Applied</span>':`<button class="btn btn-p self-start" onclick="A.applyForm('${j.employerId}','${j.id}')"><i class="fa-solid fa-paper-plane"></i> Apply now</button>`})).join('')||'<div class="card text-center text-slate-400 text-sm py-10 md:col-span-2">No open jobs match your filters.</div>'}</div>`;
}

function pageSApps(){
  const u = me(), apps = myApplications(u.id).sort((a,b)=>b.applied.localeCompare(a.applied));
  return `<h2 class="text-2xl font-extrabold mb-4">My applications</h2><div class="space-y-4">${apps.map(a => {
    const dt = a.interview ? a.interview.datetime.replace(/[-:]/g,'')+'00' : '';
    return `<div class="card space-y-3"><div class="flex justify-between flex-wrap gap-2"><div><div class="font-extrabold">${esc(a.role)}</div><div class="text-xs text-slate-500">${esc(a.company)} · applied ${fmt(a.applied)} · ${a.score}% match</div></div>${badge(a.stage,stCls[a.stage])}</div>${tracker(a.stage)}
    ${a.interview?`<div class="bg-indigo-900 text-white p-4 rounded-xl space-y-1"><div class="text-[11px] font-extrabold uppercase text-indigo-200"><i class="fa-solid fa-calendar-check text-emerald-400"></i> Interview scheduled</div><div class="text-sm font-bold">${fmtDT(a.interview.datetime)} · ${esc(a.interview.mode)}</div><p class="text-xs text-indigo-100">${esc(a.interview.notes||'')}</p><a target="_blank" rel="noopener" class="inline-block mt-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3 py-1.5 rounded-lg" href="https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Interview: '+a.role+' at '+a.company)}&dates=${dt}/${dt}">Add to Google Calendar</a></div>`:''}
    <div><button class="btn btn-d" onclick="A.withdraw('${a.employerId}','${a.id}')">Withdraw application</button></div></div>`; }).join('')||'<div class="card text-center text-slate-400 text-sm py-10">You haven\'t applied yet. <a href="#/s-jobs" class="text-indigo-600 font-bold">Browse jobs</a></div>'}</div>`;
}

function pageSInvites(){
  const u = me(), list = plat.invites.filter(i => i.seekerId===u.id).sort((a,b)=>b.date.localeCompare(a.date));
  return `<h2 class="text-2xl font-extrabold mb-1">Invitations</h2><p class="text-xs text-slate-500 mb-4">Employers who found your profile and invited you to apply.</p><div class="space-y-3">${list.map(i => {
    const cls = i.status==='Sent' ? 'bg-amber-100 text-amber-800' : i.status==='Applied' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600';
    return `<div class="card space-y-2"><div class="flex justify-between flex-wrap gap-2"><div><div class="font-extrabold">${esc(i.jobTitle)}</div><div class="text-xs text-slate-500">${esc(i.company)} · ${fmt(i.date)}</div></div>${badge(i.status,cls)}</div><p class="text-xs text-slate-600">${esc(i.msg)}</p>
    ${i.status==='Sent'?`<div class="flex gap-2"><button class="btn btn-p" onclick="A.applyForm('${i.employerId}','${i.jobId}')">Apply</button><button class="btn btn-s" onclick="A.declineInvite('${i.id}')">Decline</button></div>`:''}</div>`; }).join('')||'<div class="card text-center text-slate-400 text-sm py-10">No invitations yet. Keep your profile visible and complete to be found.</div>'}</div>`;
}

function pageSProfile(){
  const u = me(), p = u.profile, pct = profileDone(p);
  return `<h2 class="text-2xl font-extrabold mb-1">My profile</h2><p class="text-xs text-slate-500 mb-4">Employers search this profile. Your email and phone are shared only when you apply to them.</p>
  <div class="h-2 bg-slate-200 rounded-full mb-4 max-w-3xl"><div class="h-2 bg-indigo-600 rounded-full" style="width:${pct}%"></div></div>
  <form class="card space-y-3 max-w-3xl" onsubmit="A.saveProfile(event)">
    ${grid(field('Full name','name',p.name,'text',{req:1}),field('Professional headline','headline',p.headline,'text',{ph:'e.g. Senior React Developer'}))}
    ${grid(field('Mobile','phone',p.phone,'tel',{req:1}),field('Location','location',p.location,'text',{ph:'Dhaka / Remote'}))}
    ${grid(field('Experience (years)','exp',p.exp,'number',{min:0,step:'0.5'}),field('Expected salary (monthly)','salary',p.salary))}
    ${field('Key skills (comma separated) *','skills',p.skills,'text',{req:1,ph:'React, Node.js, SQL'})}
    ${field('Education','education',p.education)}${field('Professional summary','summary',p.summary,'textarea',{rows:4})}
    <label class="fl">CV / Resume (PDF or DOC, max 1MB)<input type="file" name="cv" accept=".pdf,.doc,.docx"></label>
    ${p.cv?`<div class="text-xs">Current CV: <b>${esc(p.cvName)}</b> <button type="button" class="btn btn-s" onclick="A.viewMyCV()">View</button></div>`:''}
    <label class="flex items-center gap-2 text-xs font-bold"><input type="checkbox" name="visible" ${p.visible?'checked':''}> Let employers find my profile in talent search</label>
    <button class="btn btn-p">Save profile</button></form>
  <div class="card max-w-3xl mt-4 flex items-center justify-between gap-3"><div><div class="font-extrabold text-sm">Delete my account</div><div class="text-[11px] text-slate-500">Removes your profile and all your applications.</div></div><button class="btn btn-d" onclick="A.deleteMe()">Delete account</button></div>`;
}

const SPAGES = {'s-home':pageSHome,'s-jobs':pageSJobs,'s-apps':pageSApps,'s-invites':pageSInvites,'s-profile':pageSProfile};

/* ---- public job board (no login needed to browse) ---- */
function renderBoard(){
  const list = filteredBoard(), s = getSession();
  document.getElementById('app').innerHTML = `<div class="max-w-6xl mx-auto p-4 sm:p-6 space-y-5"><div class="bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-3xl p-8"><h1 class="text-3xl font-extrabold">Find your next role</h1><p class="text-indigo-200 text-sm mt-2">${list.length} open position(s). Create a free job-seeker profile to apply and get matched.</p>
    <div class="flex flex-wrap gap-2 mt-4"><button class="btn bg-white text-indigo-900" onclick="A.pickRole('seeker','register')">Create seeker profile</button><button class="btn bg-indigo-700 text-white" onclick="A.pickRole('seeker')">Seeker login</button><button class="btn bg-indigo-700 text-white" onclick="A.pickRole('employer')">Employer login</button></div></div>
    ${boardFilters()}<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">${list.map(j=>jobCard(j,{action:`<button class="btn btn-p self-start" onclick="A.boardApply('${j.employerId}','${j.id}')">Apply now</button>`})).join('')||'<p class="text-slate-500 text-sm">No open positions right now.</p>'}</div>
    <a href="#/" class="text-xs font-bold text-indigo-600 inline-block">← ${s?'Back to my account':'Home'}</a></div>`;
}

/* ---- seeker actions ---- */
A.boardApply = function(eid, jid){
  const s = getSession();
  if(s && s.role==='seeker') return A.applyForm(eid, jid);
  if(s) return alert('Sign in as a job seeker to apply for jobs.');
  ui.pendingApply = {eid, jid}; A.pickRole('seeker', 'register');
};
A.applyForm = function(eid, jid){
  const u = me(); if(!u) return A.boardApply(eid, jid);
  if(!profileReady(u.profile)){ alert('Please add your name, phone and skills to your profile before applying.'); location.hash = '#/s-profile'; return; }
  const ws = loadWs(eid), job = ws && (ws.jobs||[]).find(j=>j.id===jid);
  if(!job || job.status!=='Open' || job.blocked) return alert('This job is no longer open.');
  modal('Apply — '+esc(job.title), `<p class="text-xs text-slate-600">Your profile${u.profile.cv?' and CV':''}, email and phone will be shared with <b>${esc(ws.company.name)}</b>.</p><span class="tag ${scoreCls(scoreProfile(u.profile,job))} !text-[11px]">Your match: ${scoreProfile(u.profile,job)}%</span>`+field('Cover note (optional)','cover','','textarea',{rows:3}), v => {
    const w = loadWs(eid); if(!w) return;
    if((w.candidates||[]).some(c=>c.seekerId===u.id && c.jobId===jid)){ closeModal(); return alert('You have already applied to this job.'); }
    const p = u.profile;
    w.candidates = w.candidates || [];
    w.candidates.push({id:uid('cand'), jobId:jid, role:job.title, name:p.name, email:u.email, phone:p.phone, exp:p.exp, skills:p.skills, designation:p.headline, notes:v.cover||'', stage:'Applied', applied:today(), cv:p.cv||'', cvName:p.cvName||'', score:scoreProfile(p,job), seekerId:u.id, source:'Job seeker'});
    saveWs(eid, w);
    plat.invites.filter(i=>i.seekerId===u.id && i.employerId===eid && i.jobId===jid).forEach(i=>i.status='Applied'); savePlat();
    closeModal(); go(); toast('Application sent to '+w.company.name);
  }, {submit:'Submit application'});
};
A.withdraw = function(eid, cid){ if(!confirm('Withdraw this application?')) return; const w = loadWs(eid); if(w){ w.candidates = w.candidates.filter(c=>c.id!==cid); saveWs(eid, w); } go(); };
A.declineInvite = function(id){ const i = plat.invites.find(x=>x.id===id); if(i){ i.status='Declined'; savePlat(); go(); } };
A.viewMyCV = function(){ const u = me(); if(u && u.profile.cv) fetch(u.profile.cv).then(r=>r.blob()).then(b=>window.open(URL.createObjectURL(b),'_blank')); };
A.saveProfile = async function(ev){
  ev.preventDefault(); const fd = new FormData(ev.target), v = Object.fromEntries(fd), u = me();
  try {
    const f = await readFile(fd.get('cv'));
    u.profile = {...u.profile, name:v.name.trim(), headline:v.headline, phone:v.phone, location:v.location, exp:v.exp, salary:v.salary, skills:v.skills, education:v.education, summary:v.summary, visible:!!v.visible};
    if(f){ u.profile.cv = f.data; u.profile.cvName = f.name; }
    u.name = u.profile.name; savePlat(); go(); toast('Profile saved');
  } catch(e){ alert(e.message); }
};
A.deleteMe = function(){ if(confirm('Delete your account, profile and all applications permanently?')){ removeSeeker(me().id); A.logout(); } };
