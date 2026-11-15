/* ================= PLATFORM ADMIN MODE ================= */
const ANAV = [['a-home','Overview','fa-gauge-high'],['a-employers','Employers','fa-building'],['a-seekers','Job seekers','fa-user-tie'],['a-jobs','All jobs','fa-briefcase']];
const emptyWs = e => ({company:{name:e.name}, jobs:[], candidates:[], employees:[]});
const allWs = () => plat.employers.map(e => ({e, ws: loadWs(e.id) || emptyWs(e)}));
const statusCls = s => s==='Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700';

function pageAHome(){
  const W = allWs(), jobs = W.flatMap(x => x.ws.jobs||[]), apps = W.reduce((a,x) => a + (x.ws.candidates||[]).filter(c=>c.seekerId).length, 0);
  const kpi = (l,v,i,c) => `<div class="card flex items-center gap-4"><div class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${c}"><i class="fa-solid ${i}"></i></div><div><div class="text-2xl font-extrabold">${v}</div><div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">${l}</div></div></div>`;
  const recent = (arr, f) => arr.slice(-5).reverse().map(f).join('') || '<p class="text-xs text-slate-400">None yet.</p>';
  return `<h2 class="text-2xl font-extrabold mb-1">Platform overview</h2><p class="text-xs text-slate-500 mb-5">Everything happening across employers and job seekers.</p>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">${kpi('Employers',plat.employers.length,'fa-building','bg-indigo-50 text-indigo-600')}${kpi('Job seekers',plat.seekers.length,'fa-user-tie','bg-emerald-50 text-emerald-600')}${kpi('Open jobs',jobs.filter(j=>j.status==='Open'&&!j.blocked).length,'fa-briefcase','bg-blue-50 text-blue-600')}${kpi('Seeker applications',apps,'fa-paper-plane','bg-amber-50 text-amber-600')}${kpi('Invitations',plat.invites.length,'fa-envelope','bg-purple-50 text-purple-600')}${kpi('Employees managed',W.reduce((a,x)=>a+(x.ws.employees||[]).length,0),'fa-users','bg-teal-50 text-teal-600')}${kpi('Suspended accounts',plat.employers.filter(e=>e.status!=='Active').length+plat.seekers.filter(s=>s.status!=='Active').length,'fa-ban','bg-rose-50 text-rose-600')}${kpi('Blocked jobs',jobs.filter(j=>j.blocked).length,'fa-flag','bg-slate-100 text-slate-600')}</div>
  <div class="grid lg:grid-cols-2 gap-4"><div class="card"><h3 class="font-extrabold text-sm mb-3">Newest employers</h3>${recent(plat.employers, e=>`<div class="flex justify-between text-xs py-2 border-b border-slate-100"><b>${esc(e.name)}</b><span>${fmt(e.created)}</span></div>`)}</div>
  <div class="card"><h3 class="font-extrabold text-sm mb-3">Newest job seekers</h3>${recent(plat.seekers, s=>`<div class="flex justify-between text-xs py-2 border-b border-slate-100"><b>${esc(s.name)}</b><span>${fmt(s.created)}</span></div>`)}</div></div>`;
}

function pageAEmployers(){
  return `<h2 class="text-2xl font-extrabold mb-4">Employers</h2><div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Company</th><th>Email</th><th>Joined</th><th>Jobs</th><th>Employees</th><th>Status</th><th></th></tr>
  ${allWs().map(({e,ws}) => `<tr><td class="font-bold">${esc(e.name)}</td><td>${esc(e.email)}</td><td>${fmt(e.created)}</td><td>${(ws.jobs||[]).length}</td><td>${(ws.employees||[]).length}</td><td>${badge(e.status,statusCls(e.status))}</td>
  <td class="whitespace-nowrap"><button class="btn btn-s" onclick="A.adminEmpStatus('${e.id}')">${e.status==='Active'?'Suspend':'Activate'}</button> <button class="btn btn-d" onclick="A.adminDelEmp('${e.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">No employers yet.</td></tr>'}</table></div>`;
}

function pageASeekers(){
  const W = allWs();
  return `<h2 class="text-2xl font-extrabold mb-4">Job seekers</h2><div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Name</th><th>Email</th><th>Location</th><th>Exp.</th><th>Visible</th><th>Applications</th><th>Status</th><th></th></tr>
  ${plat.seekers.map(s => `<tr><td class="font-bold">${esc(s.name)}${s.demo?' <span class="tag bg-slate-100 text-slate-500">demo</span>':''}</td><td>${esc(s.email)}</td><td>${esc(s.profile.location||'—')}</td><td>${esc(s.profile.exp||'0')}</td><td>${s.profile.visible?'Yes':'No'}</td><td>${W.reduce((a,x)=>a+(x.ws.candidates||[]).filter(c=>c.seekerId===s.id).length,0)}</td><td>${badge(s.status,statusCls(s.status))}</td>
  <td class="whitespace-nowrap"><button class="btn btn-s" onclick="A.adminSeekerStatus('${s.id}')">${s.status==='Active'?'Suspend':'Activate'}</button> <button class="btn btn-d" onclick="A.adminDelSeeker('${s.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="8" class="text-center text-slate-400 py-8">No job seekers yet.</td></tr>'}</table></div>`;
}

function pageAJobs(){
  const rows = allWs().flatMap(({e,ws}) => (ws.jobs||[]).map(j => ({j, e, ws})));
  return `<h2 class="text-2xl font-extrabold mb-1">All jobs</h2><p class="text-xs text-slate-500 mb-4">Take down a job to hide it from the public board without deleting it.</p><div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Title</th><th>Company</th><th>Location</th><th>Applicants</th><th>Status</th><th></th></tr>
  ${rows.map(({j,e,ws}) => `<tr><td class="font-bold">${esc(j.title)}</td><td>${esc(e.name)}</td><td>${esc(j.location)}</td><td>${(ws.candidates||[]).filter(c=>c.jobId===j.id).length}</td><td>${j.blocked?badge('Blocked','bg-rose-100 text-rose-700'):badge(j.status,stCls[j.status])}</td>
  <td class="whitespace-nowrap"><button class="btn btn-s" onclick="A.adminJobBlock('${e.id}','${j.id}')">${j.blocked?'Restore':'Take down'}</button> <button class="btn btn-d" onclick="A.adminDelJob('${e.id}','${j.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="6" class="text-center text-slate-400 py-8">No jobs posted yet.</td></tr>'}</table></div>`;
}

const APAGES = {'a-home':pageAHome,'a-employers':pageAEmployers,'a-seekers':pageASeekers,'a-jobs':pageAJobs};

A.adminEmpStatus = function(id){ const e = plat.employers.find(x=>x.id===id); e.status = e.status==='Active' ? 'Suspended' : 'Active'; savePlat(); go(); };
A.adminSeekerStatus = function(id){ const s = plat.seekers.find(x=>x.id===id); s.status = s.status==='Active' ? 'Suspended' : 'Active'; savePlat(); go(); };
A.adminDelEmp = function(id){ if(!confirm('Delete this employer and ALL its data (jobs, candidates, employees, payroll)? This cannot be undone.')) return;
  localStorage.removeItem(wsKey(id)); plat.employers = plat.employers.filter(e=>e.id!==id); plat.invites = plat.invites.filter(i=>i.employerId!==id); savePlat(); go(); };
A.adminDelSeeker = function(id){ if(confirm('Delete this job seeker and all of their applications?')){ removeSeeker(id); go(); } };
A.adminJobBlock = function(eid, jid){ const ws = loadWs(eid); const j = ws.jobs.find(x=>x.id===jid); j.blocked = !j.blocked; saveWs(eid, ws); go(); };
A.adminDelJob = function(eid, jid){ if(!confirm('Delete this job circular permanently?')) return; const ws = loadWs(eid); ws.jobs = ws.jobs.filter(x=>x.id!==jid); saveWs(eid, ws); go(); };
