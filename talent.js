/* ================= EMPLOYER: TALENT SEARCH (find job seekers that fit a job description) ================= */
NAV.splice(2, 0, ['talent', 'Talent search', 'fa-magnifying-glass']);

const seekerPool = () => plat.seekers.filter(s => s.status==='Active' && s.profile && s.profile.visible && String(s.profile.skills||'').trim());

function pageTalent(){
  const jobs = db.jobs.filter(j => j.status==='Open' && !j.blocked);
  const job = jobs.find(j => j.id===ui.tjob) || null;
  const saved = db.saved || [];
  const qt = tokens(ui.tq), reqSk = splitList(ui.tskills), loc = ui.tloc.trim().toLowerCase(), min = parseFloat(ui.tmin)||0;
  const res = seekerPool().filter(s => {
    const p = s.profile, blob = [p.name,p.headline,p.skills,p.summary,p.education,p.location].join(' ').toLowerCase(), have = splitList(p.skills);
    return qt.every(t => blob.includes(t)) && reqSk.every(r => have.some(h => skillMatch(h,r))) && (!loc || String(p.location).toLowerCase().includes(loc)) && (parseFloat(p.exp)||0) >= min && (!ui.tsaved || saved.includes(s.id));
  }).map(s => ({s, score: job ? scoreProfile(s.profile, job) : null}))
    .sort((a,b) => job ? b.score - a.score : (parseFloat(b.s.profile.exp)||0) - (parseFloat(a.s.profile.exp)||0));

  return `<h2 class="text-2xl font-extrabold mb-1">Talent search</h2>
  <p class="text-xs text-slate-500 mb-4">Find job seekers who fit your job description. Pick one of your open jobs to rank everyone by fit. Contact details stay private until a candidate applies.</p>
  <div class="card mb-4 grid grid-cols-2 lg:grid-cols-6 gap-3 items-end">
    <label class="fl col-span-2">Rank by job fit<select onchange="ui.tjob=this.value;go()"><option value="">— no job selected —</option>${jobs.map(j=>`<option value="${j.id}" ${j.id===ui.tjob?'selected':''}>${esc(j.title)}</option>`).join('')}</select></label>
    <label class="fl">Keyword<input value="${esc(ui.tq)}" placeholder="e.g. fintech" onchange="ui.tq=this.value;go()"></label>
    <label class="fl">Must-have skills<input value="${esc(ui.tskills)}" placeholder="react, aws" onchange="ui.tskills=this.value;go()"></label>
    <label class="fl">Location<input value="${esc(ui.tloc)}" placeholder="Dhaka" onchange="ui.tloc=this.value;go()"></label>
    <label class="fl">Min. years<input type="number" min="0" step="0.5" value="${esc(ui.tmin)}" onchange="ui.tmin=this.value;go()"></label>
    <label class="flex items-center gap-2 text-xs font-bold col-span-2"><input type="checkbox" ${ui.tsaved?'checked':''} onchange="ui.tsaved=this.checked;go()"> Saved only (${saved.length})</label>
    <button class="btn btn-s justify-center col-span-2" onclick="Object.assign(ui,{tq:'',tloc:'',tskills:'',tmin:'',tjob:'',tsaved:false});go()">Clear filters</button></div>
  ${!jobs.length?'<div class="card mb-4 text-xs text-amber-700 bg-amber-50 border-amber-200">Post an open job circular first to rank candidates by fit.</div>':''}
  ${job?`<div class="text-xs font-bold text-indigo-700 mb-3"><i class="fa-solid fa-brain"></i> Ranking ${res.length} candidate(s) against “${esc(job.title)}”.</div>`:`<div class="text-xs text-slate-500 mb-3">${res.length} candidate(s) found.</div>`}
  <div class="grid lg:grid-cols-2 gap-4">${res.map(({s,score}) => {
    const p = s.profile, hits = job ? skillHits(p,job) : [], need = job ? splitList(job.skills) : [];
    const applied = db.candidates.some(c => c.seekerId===s.id), inv = plat.invites.find(i => i.seekerId===s.id && i.employerId===curEmp);
    const isSaved = saved.includes(s.id);
    return `<div class="card space-y-3"><div class="flex justify-between items-start gap-2"><div class="flex items-center gap-3"><div class="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm flex items-center justify-center">${esc(initials(p.name))}</div><div><div class="font-extrabold">${esc(p.name)}</div><div class="text-xs text-slate-500">${esc(p.headline||'Job seeker')}</div></div></div>
      ${score!==null?`<span class="tag ${score>=75?'bg-emerald-100 text-emerald-800':score>=55?'bg-blue-100 text-blue-800':'bg-amber-100 text-amber-800'} !text-[11px] whitespace-nowrap">${score}% fit</span>`:''}</div>
      <div class="text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1"><span><i class="fa-solid fa-location-dot text-indigo-500"></i> ${esc(p.location||'—')}</span><span><i class="fa-solid fa-briefcase text-indigo-500"></i> ${esc(p.exp||'0')} yrs</span>${p.salary?`<span><i class="fa-solid fa-coins text-indigo-500"></i> expects ${esc(p.salary)}</span>`:''}<span><i class="fa-solid fa-lock text-slate-400"></i> contact private</span></div>
      <p class="text-xs text-slate-600 leading-relaxed">${esc((p.summary||'').slice(0,180))}${(p.summary||'').length>180?'…':''}</p>
      <div class="flex flex-wrap gap-1">${splitList(p.skills).map(k => `<span class="tag ${need.some(n=>skillMatch(k,n))?'bg-emerald-100 text-emerald-800':'bg-slate-100 text-slate-600'}">${esc(k)}</span>`).join('')}</div>
      ${job?`<div class="text-[11px] text-slate-500">Matches ${hits.length} of ${need.length} required skills${need.length-hits.length?' · missing: '+esc(need.filter(n=>!hits.includes(n)).join(', ')):''}</div>`:''}
      <div class="flex flex-wrap gap-2 items-center"><button class="btn btn-s" onclick="A.viewSeeker('${s.id}')">View profile</button>
        ${applied?'<span class="tag bg-emerald-100 text-emerald-800">Applied to you</span>':inv?`<span class="tag bg-amber-100 text-amber-800">Invited · ${esc(inv.status)}</span>`:`<button class="btn btn-p" onclick="A.inviteForm('${s.id}')"><i class="fa-solid fa-paper-plane"></i> Invite to apply</button>`}
        <button class="btn ${isSaved?'btn-g':'btn-s'}" onclick="A.toggleSave('${s.id}')"><i class="fa-solid fa-bookmark"></i> ${isSaved?'Saved':'Save'}</button></div></div>`;
  }).join('')||'<div class="card text-center text-slate-400 text-sm py-10 lg:col-span-2">No matching candidates. Try fewer filters — only seekers who made their profile visible appear here.</div>'}</div>`;
}
PAGES.talent = pageTalent;

A.toggleSave = function(sid){ db.saved = db.saved || []; db.saved = db.saved.includes(sid) ? db.saved.filter(x=>x!==sid) : [...db.saved, sid]; save(); go(); };

A.viewSeeker = function(sid){
  const s = plat.seekers.find(x=>x.id===sid); if(!s) return; const p = s.profile;
  const cand = db.candidates.find(c => c.seekerId===sid);
  const row = (k,v) => `<div><span class="text-slate-400 font-bold">${k}:</span> ${esc(v||'—')}</div>`;
  modal(esc(p.name), `<div class="text-sm font-bold text-slate-600">${esc(p.headline)}</div>
    <div class="grid grid-cols-2 gap-2 text-xs">${row('Location',p.location)}${row('Experience',(p.exp||'0')+' yrs')}${row('Education',p.education)}${row('Expected salary',p.salary)}</div>
    <div class="text-xs"><b>Skills:</b> ${esc(p.skills)}</div><div class="text-xs leading-relaxed"><b>Summary:</b> ${esc(p.summary||'—')}</div>
    ${cand?`<div class="bg-emerald-50 rounded-xl p-3 text-xs space-y-1"><b>Contact (applied to you):</b><br>${esc(s.email)} · ${esc(p.phone)}</div>${cand.cv?`<button class="btn btn-s" onclick="A.viewCV('${cand.id}')"><i class="fa-solid fa-file-pdf"></i> View CV</button>`:''}`:'<div class="bg-slate-50 rounded-xl p-3 text-xs text-slate-500"><i class="fa-solid fa-lock"></i> Contact details and CV are shared when the candidate applies to one of your jobs.</div>'}
    <div class="flex gap-2"><button class="btn btn-s" onclick="closeModal()">Close</button></div>`, null);
};

A.inviteForm = function(sid){
  const s = plat.seekers.find(x=>x.id===sid), jobs = db.jobs.filter(j => j.status==='Open' && !j.blocked);
  if(!jobs.length) return alert('Post an open job circular first.');
  const dflt = `Hi ${s.profile.name.split(' ')[0]}, we think your background is a great fit for this role at ${db.company.name}. We'd love for you to apply.`;
  modal('Invite '+esc(s.profile.name)+' to apply', field('Job','jobId',ui.tjob||jobs[0].id,'select',{options:jobs.map(j=>[j.id,j.title])})+field('Message','msg',dflt,'textarea',{rows:3}), v => {
    const job = jobs.find(j=>j.id===v.jobId);
    if(plat.invites.some(i=>i.seekerId===sid && i.employerId===curEmp && i.jobId===job.id)) return alert('You already invited this candidate to this job.');
    plat.invites.push({id:uid('inv'), seekerId:sid, employerId:curEmp, company:db.company.name, jobId:job.id, jobTitle:job.title, msg:v.msg, date:today(), status:'Sent'});
    savePlat(); closeModal(); go(); toast('Invitation sent to '+s.profile.name);
  }, {submit:'Send invitation'});
};
