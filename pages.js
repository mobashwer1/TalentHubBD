/* ================= PAGES ================= */
const NAV = [
  ['dashboard','Dashboard','fa-gauge-high'],['recruitment','Recruitment','fa-user-plus'],['onboarding','Onboarding','fa-clipboard-check'],
  ['employees','Employees','fa-users'],['leave','Leave','fa-umbrella-beach'],['attendance','Attendance','fa-clock'],
  ['payroll','Payroll','fa-money-check-dollar'],['performance','Performance','fa-chart-line'],['offboarding','Separation','fa-door-open'],
  ['reports','Reports','fa-file-export'],['settings','Settings','fa-gear']
];

function pageDashboard(){
  const L = live();
  const openJobs = db.jobs.filter(j=>j.status==='Open').length;
  const active = db.candidates.filter(c=>!['Hired','Rejected'].includes(c.stage)).length;
  const pend = db.leaves.filter(l=>l.status==='Pending').length;
  const notice = db.employees.filter(e=>e.status==='Notice').length;
  const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear()-1);
  const left = db.separations.filter(s=>s.status==='Completed' && new Date(s.lwd) >= yearAgo).length;
  const turnover = L.length + left ? (left / (L.length + left/2) * 100).toFixed(1) : '0.0';
  const payroll = L.filter(e=>e.status!=='Separated').reduce((a,e)=>a+(+e.basic||0)+(+e.allowance||0),0);
  const dMax = Math.max(1,...dept().map(d=>L.filter(e=>e.dept===d).length));
  const pMax = Math.max(1,...STAGES.map(s=>db.candidates.filter(c=>c.stage===s).length));
  const todayAtt = db.attendance[today()] || {};
  const upcoming = db.candidates.filter(c=>c.interview && new Date(c.interview.datetime) >= new Date()).sort((a,b)=>a.interview.datetime.localeCompare(b.interview.datetime)).slice(0,5);
  const lwds = db.separations.filter(s=>s.status!=='Completed').sort((a,b)=>a.lwd.localeCompare(b.lwd)).slice(0,5);
  const kpi = (l,v,i,c) => `<div class="card flex items-center gap-4"><div class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg ${c}"><i class="fa-solid ${i}"></i></div><div><div class="text-2xl font-extrabold">${v}</div><div class="text-[11px] font-bold text-slate-500 uppercase tracking-wide">${l}</div></div></div>`;
  return `<h2 class="text-2xl font-extrabold mb-1">Welcome back 👋</h2><p class="text-xs text-slate-500 mb-5">${esc(db.company.name)} — your people operations at a glance.</p>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    ${kpi('Headcount',L.length,'fa-users','bg-indigo-50 text-indigo-600')}
    ${kpi('Open positions',openJobs,'fa-briefcase','bg-emerald-50 text-emerald-600')}
    ${kpi('Active candidates',active,'fa-user-plus','bg-blue-50 text-blue-600')}
    ${kpi('Pending leaves',pend,'fa-umbrella-beach','bg-amber-50 text-amber-600')}
    ${kpi('On notice',notice,'fa-door-open','bg-rose-50 text-rose-600')}
    ${kpi('Turnover (12m)',turnover+'%','fa-arrow-trend-down','bg-purple-50 text-purple-600')}
    ${kpi('Monthly gross',money(payroll),'fa-money-bill-wave','bg-teal-50 text-teal-600')}
    ${kpi('Present today',Object.values(todayAtt).filter(v=>['Present','Late','Remote'].includes(v)).length+' / '+L.length,'fa-clock','bg-cyan-50 text-cyan-600')}
  </div>
  <div class="grid lg:grid-cols-2 gap-4">
    <div class="card space-y-3"><h3 class="font-extrabold text-sm">Headcount by department</h3>${dept().map(d=>bar(d,L.filter(e=>e.dept===d).length,dMax)).join('')||'<p class="text-xs text-slate-400">No departments yet.</p>'}</div>
    <div class="card space-y-3"><h3 class="font-extrabold text-sm">Recruitment funnel</h3>${STAGES.map(s=>bar(s,db.candidates.filter(c=>c.stage===s).length,pMax,s==='Rejected'?'bg-rose-400':s==='Hired'?'bg-emerald-500':'bg-indigo-500')).join('')}</div>
    <div class="card"><h3 class="font-extrabold text-sm mb-3">Upcoming interviews</h3>${upcoming.map(c=>`<div class="flex justify-between text-xs py-2 border-b border-slate-100"><span class="font-bold">${esc(c.name)} <span class="text-slate-400 font-medium">· ${esc(c.role)}</span></span><span>${fmtDT(c.interview.datetime)}</span></div>`).join('')||'<p class="text-xs text-slate-400">Nothing scheduled.</p>'}</div>
    <div class="card"><h3 class="font-extrabold text-sm mb-3">Upcoming last working days</h3>${lwds.map(s=>`<div class="flex justify-between text-xs py-2 border-b border-slate-100"><span class="font-bold">${esc(empName(s.empId))} <span class="text-slate-400 font-medium">· ${esc(s.type)}</span></span><span>${fmt(s.lwd)}</span></div>`).join('')||'<p class="text-xs text-slate-400">No one is leaving. 🎉</p>'}</div>
  </div>`;
}

/* ---- Recruitment ---- */
function pageRecruitment(){
  const tabs = `<div class="flex gap-2 mb-4">${['candidates','jobs'].map(t=>`<button onclick="ui.recTab='${t}';go()" class="btn ${ui.recTab===t?'btn-p':'btn-s'}">${t==='jobs'?'Job circulars':'Candidates'}</button>`).join('')}
    <a href="#/board" target="_blank" class="btn btn-s ml-auto"><i class="fa-solid fa-arrow-up-right-from-square"></i> Public job board</a></div>`;
  if(ui.recTab==='jobs'){
    return `<div class="flex justify-between items-center mb-2"><h2 class="text-2xl font-extrabold">Recruitment</h2><button class="btn btn-p" onclick="A.jobForm()"><i class="fa-solid fa-plus"></i> New job circular</button></div>${tabs}
    <div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Title</th><th>Dept</th><th>Type</th><th>Location</th><th>Applicants</th><th>Status</th><th></th></tr>
    ${db.jobs.map(j=>`<tr><td class="font-bold">${esc(j.title)}<div class="text-[11px] text-slate-400 font-medium">${esc(j.skills)}</div></td><td>${esc(j.dept)}</td><td>${esc(j.type)}</td><td>${esc(j.location)}</td><td>${db.candidates.filter(c=>c.jobId===j.id).length}</td><td>${badge(j.status,stCls[j.status])}</td>
    <td class="whitespace-nowrap"><button class="btn btn-s" onclick="A.toggleJob('${j.id}')">${j.status==='Open'?'Close':'Reopen'}</button> <button class="btn btn-s" onclick="A.jobForm('${j.id}')"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-d" onclick="A.delJob('${j.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">No job circulars yet.</td></tr>'}</table></div>`;
  }
  const roles = [...new Set(db.candidates.map(c=>c.role))].sort();
  const q = ui.rq.toLowerCase();
  const list = db.candidates.filter(c => (ui.rRole==='All'||c.role===ui.rRole) && (ui.rStage==='All'||c.stage===ui.rStage) && (!q || `${c.name} ${c.email} ${c.phone} ${c.skills} ${c.role}`.toLowerCase().includes(q))).sort((a,b)=>b.score-a.score);
  return `<div class="flex justify-between items-center mb-2"><h2 class="text-2xl font-extrabold">Recruitment</h2><button class="btn btn-p" onclick="A.candForm()"><i class="fa-solid fa-plus"></i> Add candidate</button></div>${tabs}
  <div class="card mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
    <input class="inp" placeholder="Search name, phone, skill…" value="${esc(ui.rq)}" onchange="ui.rq=this.value;go()">
    <select class="inp" onchange="ui.rRole=this.value;go()"><option>All</option>${roles.map(r=>`<option ${r===ui.rRole?'selected':''}>${esc(r)}</option>`).join('')}</select>
    <select class="inp" onchange="ui.rStage=this.value;go()"><option>All</option>${STAGES.map(s=>`<option ${s===ui.rStage?'selected':''}>${s}</option>`).join('')}</select>
    <button class="btn btn-s justify-center" onclick="ui.rq='';ui.rRole='All';ui.rStage='All';go()">Clear filters</button></div>
  <div class="space-y-3">${list.map(c=>`<div class="card flex flex-col lg:flex-row gap-4 lg:items-center">
    <div class="flex-1 min-w-0"><div class="flex flex-wrap items-center gap-2 mb-1"><span class="font-extrabold text-base">${esc(c.name)}</span>${badge(c.stage,stCls[c.stage])}<span class="tag ${c.score>=75?'bg-emerald-100 text-emerald-800':c.score>=55?'bg-blue-100 text-blue-800':'bg-amber-100 text-amber-800'}"><i class="fa-solid fa-brain"></i> ${c.score}% match</span></div>
    <div class="text-xs text-slate-500">${esc(c.role)} · ${esc(c.exp||'0')} yrs · ${esc(c.phone)} · ${esc(c.email)}</div><div class="text-[11px] text-indigo-600 font-bold mt-1">${esc(c.skills)}</div>
    ${c.interview?`<div class="text-[11px] mt-1 text-amber-700 font-bold"><i class="fa-solid fa-calendar-check"></i> ${fmtDT(c.interview.datetime)} · ${esc(c.interview.mode)}</div>`:''}</div>
    <div class="flex flex-wrap gap-2 items-center"><select class="inp !w-auto !mt-0" onchange="A.setStage('${c.id}',this.value)">${STAGES.map(s=>`<option ${s===c.stage?'selected':''}>${s}</option>`).join('')}</select>
    ${c.cv?`<button class="btn btn-s" onclick="A.viewCV('${c.id}')"><i class="fa-solid fa-file-pdf"></i> CV</button>`:''}
    <button class="btn btn-s" onclick="A.schedule('${c.id}')"><i class="fa-solid fa-calendar-days"></i> Schedule</button>
    ${c.stage!=='Hired'?`<button class="btn btn-g" onclick="A.hire('${c.id}')"><i class="fa-solid fa-handshake"></i> Hire</button>`:''}
    <button class="btn btn-d" onclick="A.delCand('${c.id}')"><i class="fa-solid fa-trash"></i></button></div></div>`).join('')||'<div class="card text-center text-slate-400 text-sm py-10">No candidates match.</div>'}</div>`;
}

/* ---- Employees ---- */
function pageEmployees(){
  const q = ui.eq.toLowerCase();
  const list = db.employees.filter(e => (ui.eDept==='All'||e.dept===ui.eDept) && (ui.eStatus==='All'||e.status===ui.eStatus) && (!q || `${e.name} ${e.code} ${e.email} ${e.title}`.toLowerCase().includes(q)));
  return `<div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-extrabold">Employees</h2><button class="btn btn-p" onclick="A.empForm()"><i class="fa-solid fa-plus"></i> Add employee</button></div>
  <div class="card mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
    <input class="inp" placeholder="Search name, ID, title…" value="${esc(ui.eq)}" onchange="ui.eq=this.value;go()">
    <select class="inp" onchange="ui.eDept=this.value;go()"><option>All</option>${dept().map(d=>`<option ${d===ui.eDept?'selected':''}>${esc(d)}</option>`).join('')}</select>
    <select class="inp" onchange="ui.eStatus=this.value;go()">${['All','Active','Notice','Separated'].map(s=>`<option ${s===ui.eStatus?'selected':''}>${s}</option>`).join('')}</select>
    <button class="btn btn-s justify-center" onclick="ui.eq='';ui.eDept='All';ui.eStatus='All';go()">Clear</button></div>
  <div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Employee</th><th>ID</th><th>Department</th><th>Title</th><th>Joined</th><th>Status</th><th></th></tr>
  ${list.map(e=>`<tr><td><div class="flex items-center gap-3"><div class="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-xs flex items-center justify-center">${esc(initials(e.name))}</div><div><div class="font-bold">${esc(e.name)}</div><div class="text-[11px] text-slate-400">${esc(e.email)}</div></div></div></td>
  <td>${esc(e.code)}</td><td>${esc(e.dept)}</td><td>${esc(e.title)}</td><td>${fmt(e.joinDate)}</td><td>${badge(e.status,stCls[e.status])}</td>
  <td class="whitespace-nowrap"><button class="btn btn-s" onclick="A.empView('${e.id}')">View</button> <button class="btn btn-s" onclick="A.empForm('${e.id}')"><i class="fa-solid fa-pen"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">No employees found.</td></tr>'}</table></div>`;
}

/* ---- Onboarding ---- */
function pageOnboarding(){
  const items = Object.keys(db.onboarding).filter(id=>emp(id));
  return `<h2 class="text-2xl font-extrabold mb-1">Onboarding</h2><p class="text-xs text-slate-500 mb-4">Hiring a candidate automatically creates a checklist here. You can also start one for any employee.</p>
  <div class="mb-4"><button class="btn btn-p" onclick="A.startOnboard()"><i class="fa-solid fa-plus"></i> Start onboarding for employee</button></div>
  <div class="grid lg:grid-cols-2 gap-4">${items.map(id=>{const t=db.onboarding[id], done=t.filter(x=>x.done).length, pct=t.length?Math.round(done/t.length*100):0;
    return `<div class="card space-y-3"><div class="flex justify-between items-center"><div><div class="font-extrabold">${esc(empName(id))}</div><div class="text-[11px] text-slate-500">${esc(emp(id).title)} · joined ${fmt(emp(id).joinDate)}</div></div>${badge(pct+'%',pct===100?'bg-emerald-100 text-emerald-800':'bg-amber-100 text-amber-800')}</div>
    <div class="h-2 bg-slate-100 rounded-full"><div class="h-2 bg-emerald-500 rounded-full" style="width:${pct}%"></div></div>
    <div class="space-y-1.5">${t.map((x,i)=>`<label class="flex items-start gap-2 text-xs cursor-pointer"><input type="checkbox" class="mt-0.5" ${x.done?'checked':''} onchange="A.tickOnboard('${id}',${i},this.checked)"><span class="${x.done?'line-through text-slate-400':''}">${esc(x.t)}</span></label>`).join('')}</div>
    <div class="flex gap-2"><button class="btn btn-s" onclick="A.addTask('onboarding','${id}')"><i class="fa-solid fa-plus"></i> Add task</button><button class="btn btn-d" onclick="A.delOnboard('${id}')">Remove</button></div></div>`}).join('')||'<div class="card text-center text-slate-400 text-sm py-10 lg:col-span-2">No onboarding checklists yet.</div>'}</div>`;
}

/* ---- Leave ---- */
function pageLeave(){
  const list = db.leaves.filter(l=>ui.leaveFilter==='All'||l.status===ui.leaveFilter).sort((a,b)=>b.from.localeCompare(a.from));
  return `<div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-extrabold">Leave management</h2><button class="btn btn-p" onclick="A.leaveForm()"><i class="fa-solid fa-plus"></i> New leave request</button></div>
  <div class="flex gap-2 mb-3">${['All','Pending','Approved','Rejected'].map(s=>`<button class="btn ${ui.leaveFilter===s?'btn-p':'btn-s'}" onclick="ui.leaveFilter='${s}';go()">${s}</button>`).join('')}</div>
  <div class="card p-0 overflow-x-auto mb-6"><table class="t"><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th></th></tr>
  ${list.map(l=>`<tr><td class="font-bold">${esc(empName(l.empId))}</td><td>${esc(l.type)}</td><td>${fmt(l.from)}</td><td>${fmt(l.to)}</td><td>${l.days}</td><td class="max-w-[200px] truncate">${esc(l.reason)}</td><td>${badge(l.status,stCls[l.status])}</td>
  <td class="whitespace-nowrap">${l.status==='Pending'?`<button class="btn btn-g" onclick="A.leaveDecide('${l.id}',true)">Approve</button> <button class="btn btn-d" onclick="A.leaveDecide('${l.id}',false)">Reject</button>`:''}</td></tr>`).join('')||'<tr><td colspan="8" class="text-center text-slate-400 py-8">No leave requests.</td></tr>'}</table></div>
  <h3 class="font-extrabold text-sm mb-2">Leave balances (days)</h3><div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Employee</th><th>Annual</th><th>Sick</th><th>Casual</th></tr>${live().map(e=>`<tr><td class="font-bold">${esc(e.name)}</td><td>${e.leave?.Annual??0}</td><td>${e.leave?.Sick??0}</td><td>${e.leave?.Casual??0}</td></tr>`).join('')}</table></div>`;
}

/* ---- Attendance ---- */
function pageAttendance(){
  const rec = db.attendance[ui.attDate] || {};
  const onLeave = id => db.leaves.some(l=>l.empId===id && l.status==='Approved' && l.from<=ui.attDate && l.to>=ui.attDate);
  return `<h2 class="text-2xl font-extrabold mb-4">Attendance</h2>
  <div class="card mb-4 flex flex-wrap gap-3 items-end"><label class="fl">Date<input type="date" value="${ui.attDate}" onchange="ui.attDate=this.value;go()"></label>
  <button class="btn btn-s" onclick="A.attAll('Present')">Mark all present</button><button class="btn btn-p ml-auto" onclick="A.attSave()"><i class="fa-solid fa-floppy-disk"></i> Save attendance</button></div>
  <div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Employee</th><th>Department</th><th>Status</th></tr>
  ${live().map(e=>{const v = rec[e.id] || (onLeave(e.id)?'Leave':''); return `<tr><td class="font-bold">${esc(e.name)}</td><td>${esc(e.dept)}</td><td><select class="inp !w-40 !mt-0 att-sel" data-id="${e.id}"><option value="">— not marked —</option>${ATT.map(a=>`<option ${a===v?'selected':''}>${a}</option>`).join('')}</select></td></tr>`}).join('')||'<tr><td colspan="3" class="text-center text-slate-400 py-8">No active employees.</td></tr>'}</table></div>
  <p class="text-[11px] text-slate-500 mt-3">Absent days (and approved unpaid leave) are deducted automatically in payroll at gross ÷ 30 per day.</p>`;
}

/* ---- Payroll ---- */
function pagePayroll(){
  const run = db.payroll.find(p=>p.month===ui.payMonth);
  return `<h2 class="text-2xl font-extrabold mb-4">Payroll</h2>
  <div class="card mb-4 flex flex-wrap gap-3 items-end"><label class="fl">Month<input type="month" value="${ui.payMonth}" onchange="ui.payMonth=this.value;go()"></label>
  ${(!run || run.status==='Draft')?`<button class="btn btn-p" onclick="A.runPayroll()"><i class="fa-solid fa-calculator"></i> ${run?'Recalculate draft':'Run payroll'}</button>`:''}
  ${run&&run.status==='Draft'?`<button class="btn btn-g" onclick="A.finalizePayroll()"><i class="fa-solid fa-check"></i> Finalize & mark paid</button>`:''}
  ${run?`<button class="btn btn-s" onclick="A.payCSV()"><i class="fa-solid fa-file-excel"></i> Export CSV</button>`:''}
  ${run?`<span class="ml-auto">${badge(run.status,stCls[run.status])}</span>`:''}</div>
  ${run?`<div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Employee</th><th>Basic</th><th>Allowance</th><th>Gross</th><th>Absent/unpaid days</th><th>Deduction</th><th>Tax</th><th>PF</th><th>Net pay</th><th></th></tr>
  ${run.items.map(i=>`<tr><td class="font-bold">${esc(i.name)}<div class="text-[11px] text-slate-400">${esc(i.code)}</div></td><td>${money(i.basic)}</td><td>${money(i.allowance)}</td><td>${money(i.gross)}</td><td>${i.absentDays}</td><td>${money(i.absDed)}</td><td>${money(i.tax)}</td><td>${money(i.pf)}</td><td class="font-extrabold text-emerald-700">${money(i.net)}</td><td><button class="btn btn-s" onclick="A.payslip('${i.empId}')">Payslip</button></td></tr>`).join('')}
  <tr class="bg-slate-50 font-extrabold"><td>Total</td><td colspan="2"></td><td>${money(run.items.reduce((a,i)=>a+i.gross,0))}</td><td colspan="4"></td><td>${money(run.items.reduce((a,i)=>a+i.net,0))}</td><td></td></tr></table></div>`:'<div class="card text-center text-slate-400 text-sm py-10">No payroll run for this month yet.</div>'}
  <p class="text-[11px] text-slate-500 mt-3">Tax ${db.settings.tax}% on taxable gross and PF ${db.settings.pf}% of basic — change rates in Settings. Verify against local labour/tax law before real payouts.</p>`;
}

/* ---- Performance ---- */
function pagePerformance(){
  const stars = n => '★'.repeat(n) + '☆'.repeat(5-n);
  const avg = dept().map(d=>{const r=db.reviews.filter(x=>emp(x.empId)?.dept===d); return [d, r.length? (r.reduce((a,x)=>a+ +x.rating,0)/r.length).toFixed(1):null]}).filter(x=>x[1]);
  return `<div class="flex justify-between items-center mb-4"><h2 class="text-2xl font-extrabold">Performance</h2><button class="btn btn-p" onclick="A.reviewForm()"><i class="fa-solid fa-plus"></i> New review</button></div>
  ${avg.length?`<div class="card mb-4 grid sm:grid-cols-3 gap-4">${avg.map(a=>bar(a[0]+' (avg)',a[1],5,'bg-amber-400')).join('')}</div>`:''}
  <div class="card p-0 overflow-x-auto"><table class="t"><tr><th>Employee</th><th>Period</th><th>Rating</th><th>Goals</th><th>Comments</th><th>Reviewer</th><th></th></tr>
  ${db.reviews.slice().sort((a,b)=>b.date.localeCompare(a.date)).map(r=>`<tr><td class="font-bold">${esc(empName(r.empId))}</td><td>${esc(r.period)}</td><td class="text-amber-500 whitespace-nowrap">${stars(+r.rating)}</td><td class="max-w-[180px]">${esc(r.goals)}</td><td class="max-w-[220px]">${esc(r.comments)}</td><td>${esc(r.reviewer)}</td><td><button class="btn btn-d" onclick="A.delReview('${r.id}')"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')||'<tr><td colspan="7" class="text-center text-slate-400 py-8">No reviews yet.</td></tr>'}</table></div>`;
}

/* ---- Separation / Offboarding ---- */
function pageOffboarding(){
  return `<div class="flex justify-between items-center mb-1"><h2 class="text-2xl font-extrabold">Separation & offboarding</h2><button class="btn btn-p" onclick="A.sepForm()"><i class="fa-solid fa-plus"></i> Start separation</button></div>
  <p class="text-xs text-slate-500 mb-4">Resignation, termination, retirement or contract end — with clearance checklist, exit interview and final settlement.</p>
  <div class="grid lg:grid-cols-2 gap-4">${db.separations.slice().reverse().map(s=>{const e=emp(s.empId); if(!e) return ''; const done=s.checklist.filter(x=>x.done).length, st=settlement(e,s.lwd), fin=s.status==='Completed', snap=s.settlementFinal||st;
    return `<div class="card space-y-3"><div class="flex justify-between items-start"><div><div class="font-extrabold">${esc(e.name)}</div><div class="text-[11px] text-slate-500">${esc(e.title)} · ${esc(e.dept)}</div></div><div class="text-right">${badge(s.type,'bg-slate-100 text-slate-700')} ${badge(s.status,fin?'bg-slate-200 text-slate-600':'bg-amber-100 text-amber-800')}</div></div>
    <div class="grid grid-cols-2 gap-2 text-xs"><div><span class="text-slate-400 font-bold">Notice given:</span> ${fmt(s.noticeDate)}</div><div><span class="text-slate-400 font-bold">Last working day:</span> ${fmt(s.lwd)}</div><div class="col-span-2"><span class="text-slate-400 font-bold">Reason:</span> ${esc(s.reason||'—')}</div></div>
    <div class="text-[11px] font-extrabold text-slate-500 uppercase">Clearance checklist (${done}/${s.checklist.length})</div>
    <div class="space-y-1.5">${s.checklist.map((x,i)=>`<label class="flex items-start gap-2 text-xs cursor-pointer"><input type="checkbox" class="mt-0.5" ${x.done?'checked':''} ${fin?'disabled':''} onchange="A.tickSep('${s.id}',${i},this.checked)"><span class="${x.done?'line-through text-slate-400':''}">${esc(x.t)}</span></label>`).join('')}</div>
    <label class="fl">Exit interview notes<textarea rows="2" ${fin?'disabled':''} onchange="A.exitNotes('${s.id}',this.value)">${esc(s.exitNotes||'')}</textarea></label>
    <div class="bg-slate-50 rounded-xl p-3 text-xs space-y-1"><div class="font-extrabold text-slate-600 uppercase text-[11px]">Final settlement ${fin?'(paid out)':'(estimate)'}</div>
    <div class="flex justify-between"><span>Pro-rata salary (${snap.days}/30 days)</span><span>${money(snap.sal)}</span></div><div class="flex justify-between"><span>Annual leave encashment (${snap.annual} days)</span><span>${money(snap.enc)}</span></div><div class="flex justify-between font-extrabold border-t border-slate-200 pt-1"><span>Total</span><span>${money(snap.total)}</span></div></div>
    <div class="flex gap-2 flex-wrap">${fin?'':`<button class="btn btn-g" onclick="A.completeSep('${s.id}')"><i class="fa-solid fa-flag-checkered"></i> Complete separation</button><button class="btn btn-s" onclick="A.addTask('sep','${s.id}')"><i class="fa-solid fa-plus"></i> Add task</button><button class="btn btn-d" onclick="A.cancelSep('${s.id}')">Withdraw</button>`}</div></div>`}).join('')||'<div class="card text-center text-slate-400 text-sm py-10 lg:col-span-2">No separations recorded.</div>'}</div>`;
}

/* ---- Reports ---- */
function pageReports(){
  const b = (l,i,fn,d) => `<div class="card flex items-center gap-4"><div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><i class="fa-solid ${i}"></i></div><div class="flex-1"><div class="font-extrabold text-sm">${l}</div><div class="text-[11px] text-slate-500">${d}</div></div><button class="btn btn-g" onclick="A.${fn}()">CSV</button></div>`;
  const reasons = {}; db.separations.forEach(s=>reasons[s.type]=(reasons[s.type]||0)+1);
  const rMax = Math.max(1,...Object.values(reasons));
  return `<h2 class="text-2xl font-extrabold mb-4">Reports & exports</h2><div class="grid md:grid-cols-2 gap-4 mb-6">
  ${b('Employee master list','fa-users','repEmp','All employees with status & salary')}${b('Candidates & pipeline','fa-user-plus','repCand','Applicants, match score, stage')}
  ${b('Leave register','fa-umbrella-beach','repLeave','All leave requests and decisions')}${b('Separations','fa-door-open','repSep','Exits with settlement figures')}</div>
  <div class="card space-y-3"><h3 class="font-extrabold text-sm">Separations by type</h3>${Object.entries(reasons).map(([k,v])=>bar(k,v,rMax,'bg-rose-400')).join('')||'<p class="text-xs text-slate-400">No separations yet.</p>'}</div>`;
}

/* ---- Settings ---- */
function pageSettings(){
  const s = db.settings;
  return `<h2 class="text-2xl font-extrabold mb-4">Settings</h2><div class="grid lg:grid-cols-2 gap-4">
  <form class="card space-y-3" onsubmit="A.saveSettings(event)"><h3 class="font-extrabold text-sm">Company & payroll</h3>
    ${field('Company name','name',db.company.name,'text',{req:1})}${grid(field('Currency symbol','currency',s.currency),field('Tax rate (%)','tax',s.tax,'number',{step:'0.1',min:0,max:60}))}${field('Provident fund (% of basic)','pf',s.pf,'number',{step:'0.1',min:0,max:30})}<button class="btn btn-p">Save settings</button></form>
  <div class="card space-y-3"><h3 class="font-extrabold text-sm">Departments</h3><div class="flex flex-wrap gap-2">${dept().map(d=>`<span class="tag bg-indigo-50 text-indigo-700 !text-[11px] flex items-center gap-2">${esc(d)} <button onclick="A.delDept('${esc(d).replace(/'/g,'')}')" class="text-rose-500">✕</button></span>`).join('')}</div>
    <form class="flex gap-2" onsubmit="A.addDept(event)"><input name="d" class="inp" placeholder="New department" required><button class="btn btn-p">Add</button></form></div>
  <div class="card space-y-3 lg:col-span-2"><h3 class="font-extrabold text-sm">Data</h3><p class="text-xs text-slate-500">Data is stored in this browser. Export regular backups.</p>
    <div class="flex flex-wrap gap-2"><button class="btn btn-s" onclick="A.backup()"><i class="fa-solid fa-download"></i> Export backup (JSON)</button><label class="btn btn-s"><i class="fa-solid fa-upload"></i> Restore backup<input type="file" accept=".json" class="hidden" onchange="A.restore(this)"></label>
    <button class="btn btn-s" onclick="A.loadSample()"><i class="fa-solid fa-flask"></i> Add sample data</button><button class="btn btn-d" onclick="A.wipe()"><i class="fa-solid fa-triangle-exclamation"></i> Erase everything</button></div></div></div>`;
}

const PAGES = {dashboard:pageDashboard,recruitment:pageRecruitment,onboarding:pageOnboarding,employees:pageEmployees,leave:pageLeave,attendance:pageAttendance,payroll:pagePayroll,performance:pagePerformance,offboarding:pageOffboarding,reports:pageReports,settings:pageSettings};
