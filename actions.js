/* ================= ACTIONS ================= */
const A = {
  /* jobs */
  jobForm(id){ const j = db.jobs.find(x=>x.id===id) || {title:'',dept:dept()[0]||'',type:'Full-Time',location:'',minExp:'',skills:'',desc:''};
    modal(id?'Edit job circular':'New job circular',
      field('Job title','title',j.title,'text',{req:1})+grid(field('Department','dept',j.dept,'select',{options:dept(),req:1}),field('Employment type','type',j.type,'select',{options:EMP_TYPES}))+grid(field('Location','location',j.location,'text',{req:1}),field('Minimum experience (years)','minExp',j.minExp,'number',{min:0,step:'0.5'}))+field('Required skills (comma separated — used for AI match scoring)','skills',j.skills,'text',{req:1})+field('Description','desc',j.desc,'textarea',{req:1}),
      v=>{ if(id) Object.assign(db.jobs.find(x=>x.id===id),v); else db.jobs.push({id:uid('job'),...v,status:'Open',posted:today()}); save(); closeModal(); go(); toast('Job circular saved'); }); },
  toggleJob(id){ const j=db.jobs.find(x=>x.id===id); j.status = j.status==='Open'?'Closed':'Open'; save(); go(); },
  delJob(id){ if(confirm('Delete this job circular? Candidates stay in the system.')){ db.jobs=db.jobs.filter(j=>j.id!==id); save(); go(); } },
  /* candidates */
  candForm(){ const open=db.jobs.filter(j=>j.status==='Open'); if(!open.length) return alert('Create an open job circular first.');
    modal('Add candidate', field('Applying for','jobId','','select',{options:open.map(j=>[j.id,j.title]),req:1})+grid(field('Full name','name','','text',{req:1}),field('Email','email','','email',{req:1}),field('Mobile','phone','','tel',{req:1}),field('Experience (years)','exp','','number',{min:0,step:'0.5'}))+field('Key skills (comma separated)','skills','','text',{req:1})+`<label class="fl">CV (PDF/DOC, max 1MB)<input type="file" name="cv" accept=".pdf,.doc,.docx"></label>`+field('Notes','notes','','textarea'),
      async v=>{ try{ const f=await readFile(v.cv); const job=db.jobs.find(j=>j.id===v.jobId); const c={id:uid('cand'),jobId:job.id,role:job.title,name:v.name,email:v.email,phone:v.phone,exp:v.exp,skills:v.skills,notes:v.notes,stage:'Applied',applied:today(),cv:f?f.data:'',cvName:f?f.name:''}; c.score=matchScore(c,job); db.candidates.push(c); save(); closeModal(); go(); toast('Candidate added · match '+c.score+'%'); }catch(e){ alert(e.message); } }); },
  setStage(id,stage){ const c=db.candidates.find(x=>x.id===id); c.stage=stage; save(); toast(c.name+' → '+stage); go(); },
  delCand(id){ if(confirm('Delete this candidate permanently?')){ db.candidates=db.candidates.filter(c=>c.id!==id); save(); go(); } },
  viewCV(id){ const c=db.candidates.find(x=>x.id===id); if(!c?.cv) return; fetch(c.cv).then(r=>r.blob()).then(b=>window.open(URL.createObjectURL(b),'_blank')); },
  schedule(id){ const c=db.candidates.find(x=>x.id===id), i=c.interview||{};
    modal('Schedule interview — '+esc(c.name), field('Date & time','datetime',i.datetime||'','datetime-local',{req:1})+field('Platform / location','mode',i.mode||'Google Meet','select',{options:['Google Meet','Zoom','Microsoft Teams','On-site','Phone']})+field('Notes for candidate','notes',i.notes||'','textarea',{rows:2}),
      v=>{ c.interview=v; if(['Applied','Screening','Shortlisted'].includes(c.stage)) c.stage='Interview'; save(); closeModal(); go();
        const sub=encodeURIComponent('Interview invitation — '+c.role), body=encodeURIComponent(`Dear ${c.name},\n\nYou are invited to an interview for ${c.role} on ${fmtDT(v.datetime)} via ${v.mode}.\n${v.notes||''}\n\nRegards,\n${db.company.name}`);
        modal('Interview scheduled ✅', `<p class="text-xs text-slate-600">Saved. Send the invitation using one of these (emails are sent from your own mail app):</p><div class="flex flex-wrap gap-2"><a class="btn btn-p" href="mailto:${esc(c.email)}?subject=${sub}&body=${body}">Email invitation</a><a class="btn btn-g" target="_blank" href="https://wa.me/${esc(c.phone.replace(/\D/g,''))}?text=${body}">WhatsApp</a><button class="btn btn-s" onclick="closeModal()">Close</button></div>`); }); },
  hire(id){ const c=db.candidates.find(x=>x.id===id), j=db.jobs.find(x=>x.id===c.jobId);
    modal('Hire '+esc(c.name)+' → create employee record', grid(field('Department','dept',j?.dept||dept()[0],'select',{options:dept()}),field('Job title','title',c.role,'text',{req:1}),field('Joining date','joinDate',today(),'date',{req:1}),field('Employment type','type',j?.type||'Full-Time','select',{options:EMP_TYPES}),field('Basic salary','basic','','number',{req:1,min:0}),field('Allowance','allowance','0','number',{min:0})),
      v=>{ const e={id:uid('emp'),code:nextEmpCode(),name:c.name,email:c.email,phone:c.phone,manager:'',status:'Active',leave:{Annual:14,Sick:10,Casual:10},...v}; db.employees.push(e); c.stage='Hired'; c.employeeId=e.id; db.onboarding[e.id]=ONBOARD.map(t=>({t,done:false})); save(); closeModal(); location.hash='#/onboarding'; toast(c.name+' hired — onboarding checklist created'); }, {submit:'Hire & start onboarding'}); },
  /* employees */
  empForm(id){ const e = emp(id) || {name:'',email:'',phone:'',dept:dept()[0]||'',title:'',type:'Full-Time',joinDate:today(),basic:'',allowance:0,manager:''};
    modal(id?'Edit employee':'Add employee', grid(field('Full name','name',e.name,'text',{req:1}),field('Email','email',e.email,'email',{req:1}),field('Phone','phone',e.phone,'tel'),field('Job title','title',e.title,'text',{req:1}),field('Department','dept',e.dept,'select',{options:dept()}),field('Type','type',e.type,'select',{options:EMP_TYPES}),field('Joining date','joinDate',e.joinDate,'date',{req:1}),field('Reports to','manager',e.manager,'text'),field('Basic salary','basic',e.basic,'number',{req:1,min:0}),field('Allowance','allowance',e.allowance,'number',{min:0})),
      v=>{ if(id) Object.assign(emp(id),v); else db.employees.push({id:uid('emp'),code:nextEmpCode(),status:'Active',leave:{Annual:14,Sick:10,Casual:10},...v}); save(); closeModal(); go(); toast('Employee saved'); }); },
  empView(id){ const e=emp(id), revs=db.reviews.filter(r=>r.empId===id), lv=db.leaves.filter(l=>l.empId===id);
    const row=(k,v)=>`<div><span class="text-slate-400 font-bold">${k}:</span> ${esc(v||'—')}</div>`;
    modal(esc(e.name)+' '+badge(e.status,stCls[e.status]), `<div class="grid grid-cols-2 gap-2 text-xs">${row('ID',e.code)}${row('Title',e.title)}${row('Department',e.dept)}${row('Type',e.type)}${row('Email',e.email)}${row('Phone',e.phone)}${row('Joined',fmt(e.joinDate))}${row('Reports to',e.manager)}${row('Basic',money(e.basic))}${row('Allowance',money(e.allowance))}${row('Leave balance',`A ${e.leave?.Annual} / S ${e.leave?.Sick} / C ${e.leave?.Casual}`)}${e.sepDate?row('Separated on',fmt(e.sepDate)):''}</div>
      <div class="text-xs"><b>Reviews:</b> ${revs.map(r=>esc(r.period)+' ('+r.rating+'/5)').join(', ')||'none'}<br><b>Leave requests:</b> ${lv.length}</div>
      <div class="flex gap-2">${e.status==='Active'?`<button class="btn btn-d" onclick="closeModal();A.sepForm('${id}')"><i class="fa-solid fa-door-open"></i> Start separation</button>`:''}<button class="btn btn-s" onclick="closeModal()">Close</button></div>`, null); },
  /* onboarding */
  startOnboard(){ const opts=live().filter(e=>!db.onboarding[e.id]); if(!opts.length) return alert('All active employees already have a checklist.');
    modal('Start onboarding', field('Employee','empId','','select',{options:opts.map(e=>[e.id,e.name])}), v=>{ db.onboarding[v.empId]=ONBOARD.map(t=>({t,done:false})); save(); closeModal(); go(); }); },
  tickOnboard(id,i,v){ db.onboarding[id][i].done=v; save(); go(); },
  delOnboard(id){ if(confirm('Remove this onboarding checklist?')){ delete db.onboarding[id]; save(); go(); } },
  addTask(kind,id){ modal('Add task', field('Task','t','','text',{req:1}), v=>{ (kind==='sep'?db.separations.find(s=>s.id===id).checklist:db.onboarding[id]).push({t:v.t,done:false}); save(); closeModal(); go(); }); },
  /* leave */
  leaveForm(){ modal('New leave request', field('Employee','empId','','select',{options:live().map(e=>[e.id,e.name]),req:1})+grid(field('Type','type','Annual','select',{options:LEAVE_TYPES}),field('Reason','reason',''),field('From','from',today(),'date',{req:1}),field('To','to',today(),'date',{req:1})),
    v=>{ if(v.to<v.from) return alert('"To" date must be on or after "From".'); db.leaves.push({id:uid('lv'),...v,days:daysBetween(v.from,v.to),status:'Pending',created:today()}); save(); closeModal(); go(); toast('Leave request submitted'); }); },
  leaveDecide(id,ok){ const l=db.leaves.find(x=>x.id===id), e=emp(l.empId);
    if(ok && l.type!=='Unpaid'){ const bal=e.leave?.[l.type]??0; if(bal<l.days && !confirm(`${e.name} has only ${bal} ${l.type} day(s) left but requested ${l.days}. Approve anyway (balance goes negative)?`)) return; e.leave[l.type]=bal-l.days; }
    l.status = ok?'Approved':'Rejected'; save(); go(); toast('Leave '+l.status.toLowerCase()); },
  /* attendance */
  attAll(v){ document.querySelectorAll('.att-sel').forEach(s=>{ if(!s.value) s.value=v; }); },
  attSave(){ const rec={}; document.querySelectorAll('.att-sel').forEach(s=>{ if(s.value) rec[s.dataset.id]=s.value; }); db.attendance[ui.attDate]=rec; save(); toast('Attendance saved for '+fmt(ui.attDate)); },
  /* payroll */
  runPayroll(){ const items=live().map(e=>calcPay(e,ui.payMonth)); if(!items.length) return alert('No active employees.'); const i=db.payroll.findIndex(p=>p.month===ui.payMonth); const run={month:ui.payMonth,status:'Draft',items,created:today()}; if(i>=0) db.payroll[i]=run; else db.payroll.push(run); save(); go(); },
  finalizePayroll(){ if(confirm('Finalize this payroll? Figures will be locked.')){ db.payroll.find(p=>p.month===ui.payMonth).status='Paid'; save(); go(); } },
  payCSV(){ const run=db.payroll.find(p=>p.month===ui.payMonth); csv('payroll_'+run.month,[['Code','Name','Basic','Allowance','Gross','Absent/unpaid days','Deduction','Tax','PF','Net'],...run.items.map(i=>[i.code,i.name,i.basic,i.allowance,i.gross,i.absentDays,i.absDed,i.tax,i.pf,i.net])]); },
  payslip(empId){ const run=db.payroll.find(p=>p.month===ui.payMonth), i=run.items.find(x=>x.empId===empId), e=emp(empId); const w=window.open('','_blank'); if(!w) return alert('Allow pop-ups to view payslips.');
    const r=(a,b)=>`<tr><td style="padding:6px 0">${a}</td><td style="text-align:right">${b}</td></tr>`;
    w.document.write(`<html><head><title>Payslip ${esc(i.name)}</title></head><body style="font-family:Arial;max-width:560px;margin:30px auto;color:#1e293b"><h2>${esc(db.company.name)}</h2><h3>Payslip — ${esc(run.month)}</h3><p><b>${esc(i.name)}</b> (${esc(i.code)})<br>${esc(e?.title||'')} · ${esc(e?.dept||'')}</p><table style="width:100%;border-collapse:collapse">${r('Basic',money(i.basic))}${r('Allowance',money(i.allowance))}${r('<b>Gross</b>','<b>'+money(i.gross)+'</b>')}${r('Absence deduction ('+i.absentDays+' days)','- '+money(i.absDed))}${r('Tax','- '+money(i.tax))}${r('Provident fund','- '+money(i.pf))}<tr style="border-top:2px solid #1e293b"><td style="padding:8px 0"><b>Net pay</b></td><td style="text-align:right"><b>${money(i.net)}</b></td></tr></table><p style="font-size:11px;color:#64748b">Status: ${esc(run.status)}</p><button onclick="print()">Print</button></body></html>`); w.document.close(); },
  /* performance */
  reviewForm(){ modal('New performance review', field('Employee','empId','','select',{options:live().map(e=>[e.id,e.name]),req:1})+grid(field('Period','period','2026 H2','text',{req:1}),field('Rating (1–5)','rating','3','select',{options:[1,2,3,4,5]}))+field('Goals','goals','','textarea',{rows:2})+field('Comments','comments','','textarea',{rows:2})+field('Reviewer','reviewer',db.company.name?'':'','text',{req:1}),
    v=>{ db.reviews.push({id:uid('rev'),...v,date:today()}); save(); closeModal(); go(); }); },
  delReview(id){ if(confirm('Delete review?')){ db.reviews=db.reviews.filter(r=>r.id!==id); save(); go(); } },
  /* separation */
  sepForm(preId){ const opts=db.employees.filter(e=>e.status==='Active'); if(!opts.length) return alert('No active employees.');
    modal('Start separation', field('Employee','empId',preId||'','select',{options:opts.map(e=>[e.id,e.name]),req:1})+grid(field('Type','type','Resignation','select',{options:SEP_TYPES}),field('Notice date','noticeDate',today(),'date',{req:1}),field('Last working day','lwd',today(),'date',{req:1}),field('Reason','reason',''))+'<p class="text-[11px] text-slate-500">Employee status changes to "Notice" and a clearance checklist is created.</p>',
      v=>{ if(v.lwd<v.noticeDate) return alert('Last working day cannot be before the notice date.'); if(db.separations.some(s=>s.empId===v.empId&&s.status!=='Completed')) return alert('A separation is already in progress for this employee.');
        db.separations.push({id:uid('sep'),...v,status:'In progress',checklist:OFFBOARD.map(t=>({t,done:false})),exitNotes:''}); emp(v.empId).status='Notice'; save(); closeModal(); location.hash='#/offboarding'; go(); }, {submit:'Start separation'}); },
  tickSep(id,i,v){ db.separations.find(s=>s.id===id).checklist[i].done=v; save(); go(); },
  exitNotes(id,v){ db.separations.find(s=>s.id===id).exitNotes=v; save(); toast('Exit notes saved'); },
  completeSep(id){ const s=db.separations.find(x=>x.id===id), left=s.checklist.filter(x=>!x.done).length;
    if(left && !confirm(left+' checklist item(s) are still open. Complete the separation anyway?')) return;
    if(!confirm('Mark '+empName(s.empId)+' as Separated? This ends their active employment record.')) return;
    const e=emp(s.empId); s.settlementFinal=settlement(e,s.lwd); s.status='Completed'; e.status='Separated'; e.sepDate=s.lwd; save(); go(); toast('Separation completed'); },
  cancelSep(id){ if(!confirm('Withdraw this separation and reinstate the employee as Active?')) return; const s=db.separations.find(x=>x.id===id); emp(s.empId).status='Active'; db.separations=db.separations.filter(x=>x.id!==id); save(); go(); },
  /* reports */
  repEmp(){ csv('employees',[['Code','Name','Email','Phone','Department','Title','Type','Joined','Status','Basic','Allowance'],...db.employees.map(e=>[e.code,e.name,e.email,e.phone,e.dept,e.title,e.type,e.joinDate,e.status,e.basic,e.allowance])]); },
  repCand(){ csv('candidates',[['Name','Position','Match %','Stage','Email','Phone','Experience','Skills','Applied'],...db.candidates.map(c=>[c.name,c.role,c.score,c.stage,c.email,c.phone,c.exp,c.skills,c.applied])]); },
  repLeave(){ csv('leaves',[['Employee','Type','From','To','Days','Status','Reason'],...db.leaves.map(l=>[empName(l.empId),l.type,l.from,l.to,l.days,l.status,l.reason])]); },
  repSep(){ csv('separations',[['Employee','Type','Notice','Last day','Status','Reason','Settlement total'],...db.separations.map(s=>[empName(s.empId),s.type,s.noticeDate,s.lwd,s.status,s.reason,(s.settlementFinal||(emp(s.empId)?settlement(emp(s.empId),s.lwd):{total:''})).total])]); },
  /* settings */
  saveSettings(ev){ ev.preventDefault(); const v=Object.fromEntries(new FormData(ev.target)); db.company.name=v.name; const pe=plat.employers.find(q=>q.id===curEmp); if(pe){ pe.name=v.name; savePlat(); } db.settings={currency:v.currency||'৳',tax:+v.tax||0,pf:+v.pf||0}; save(); go(); toast('Settings saved'); },
  addDept(ev){ ev.preventDefault(); const d=new FormData(ev.target).get('d').trim(); if(d && !db.departments.includes(d)){ db.departments.push(d); save(); go(); } },
  delDept(d){ if(db.employees.some(e=>e.dept===d)) return alert('Employees are assigned to this department.'); db.departments=db.departments.filter(x=>x!==d); save(); go(); },
  backup(){ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(db)],{type:'application/json'})); a.download='hrflow_backup_'+today()+'.json'; a.click(); },
  restore(inp){ const f=inp.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>{ try{ const d=JSON.parse(r.result); if(!d.company||!d.employees) throw 0; if(!confirm('Replace ALL current data with this backup?')) return; db=d; save(); go(); toast('Backup restored'); }catch(e){ alert('Invalid backup file.'); } }; r.readAsText(f); },
  loadSample(){ if(confirm('Add sample data to your workspace?')){ seed(); save(); go(); } },
  wipe(){ if(confirm('Delete this company workspace and ALL its data permanently?') && prompt('Type DELETE to confirm')==='DELETE'){ localStorage.removeItem(wsKey(curEmp)); plat.employers=plat.employers.filter(e=>e.id!==curEmp); plat.invites=plat.invites.filter(i=>i.employerId!==curEmp); savePlat(); A.logout(); } },
  logout(){ sessionStorage.removeItem(SESSION); curEmp=null; db=null; ui.authRole=null; location.hash=''; go(); }
};
