/* ================= PLATFORM LAYER (shared by Employer, Job Seeker and Admin modes) ================= */
Object.assign(ui, { authRole:null, authMode:'login', jq:'', jloc:'', jtype:'All', tq:'', tloc:'', tskills:'', tmin:'', tjob:'', tsaved:false, pendingApply:null });

/* ---- matching engine: profile vs job description ---- */
const STOP = new Set('a an and the of to in for with on at by from as is are be or we you our your will have has this that it their they them i can able ability work working experience years year strong good knowledge skills skill using use etc plus must should team'.split(' '));
const tokens = s => (String(s||'').toLowerCase().match(/[a-z0-9+#.]{2,}/g)||[]).map(w=>w.replace(/^\.+|\.+$/g,'')).filter(w=>w.length>1 && !STOP.has(w));
const splitList = s => String(s||'').toLowerCase().split(/[,;\n]+/).map(x=>x.trim()).filter(Boolean);
const skillMatch = (a,b) => a===b || a.includes(b) || b.includes(a);
const skillHits = (p, job) => { const have = splitList(p.skills); return splitList(job.skills).filter(n => have.some(h => skillMatch(h,n))); };
/* 65% required-skill coverage, 20% keyword overlap with the job description, 15% experience vs minimum */
function scoreProfile(p, job){
  const need = splitList(job.skills);
  const sk = need.length ? skillHits(p,job).length / need.length : 0.5;
  const jd = new Set(tokens([job.title, job.desc, job.skills].join(' ')));
  const pt = new Set(tokens([p.headline, p.summary, p.skills, p.education].join(' ')));
  const kw = jd.size ? [...jd].filter(w=>pt.has(w)).length / jd.size : 0;
  const min = parseFloat(job.minExp)||0, yrs = parseFloat(p.exp)||0;
  const ex = min ? Math.min(1, yrs/min) : (yrs>0 ? 0.8 : 0.5);
  return Math.max(10, Math.min(98, Math.round(100*(0.65*sk + 0.2*Math.min(1,kw*2.5) + 0.15*ex))));
}
function matchScore(c, job){ if(!job) return 50; return scoreProfile({skills:c.skills, exp:c.exp, summary:c.notes, headline:c.designation}, job); }

/* ---- cross-account queries ---- */
function boardJobs(){
  const out = [];
  plat.employers.forEach(e => { if(e.status!=='Active') return; const ws = loadWs(e.id); if(!ws) return;
    (ws.jobs||[]).forEach(j => { if(j.status==='Open' && !j.blocked) out.push({...j, employerId:e.id, company:(ws.company&&ws.company.name)||e.name}); }); });
  return out.sort((a,b)=>String(b.posted||'').localeCompare(String(a.posted||'')));
}
function myApplications(seekerId){
  const out = [];
  plat.employers.forEach(e => { const ws = loadWs(e.id); if(!ws) return;
    (ws.candidates||[]).filter(c=>c.seekerId===seekerId).forEach(c => { const {cv, ...rest} = c; out.push({...rest, hasCv:!!cv, employerId:e.id, company:(ws.company&&ws.company.name)||e.name}); }); });
  return out;
}
function removeSeeker(id){
  plat.employers.forEach(e => { const ws = loadWs(e.id); if(!ws) return; ws.candidates = (ws.candidates||[]).filter(c=>c.seekerId!==id); ws.saved = (ws.saved||[]).filter(x=>x!==id); saveWs(e.id, ws); });
  plat.seekers = plat.seekers.filter(s=>s.id!==id);
  plat.invites = plat.invites.filter(i=>i.seekerId!==id);
  savePlat();
}
const emptyProfile = (name='') => ({name, headline:'', phone:'', location:'', exp:'', salary:'', skills:'', education:'', summary:'', cv:'', cvName:'', visible:true});

function seedSeekers(){
  if(plat.seekers.length) return;
  const mk = (name,headline,loc,exp,skills,edu,summary,salary) => ({id:uid('sk'), email:name.split(' ')[0].toLowerCase()+'.demo@example.com', passHash:'demo-account-no-login', name, status:'Active', demo:true, created:today(),
    profile:{...emptyProfile(name), headline, phone:'+8801900000000', location:loc, exp, skills, education:edu, summary, salary}});
  plat.seekers.push(
    mk('Farhan Ahmed','Senior Frontend Engineer','Dhaka','6','React, TypeScript, Tailwind, Testing, Redux','BSc CSE','Builds fast, accessible web apps and mentors junior developers.','150000'),
    mk('Mim Akter','Frontend Developer','Dhaka','3','React, CSS, JavaScript, Figma','BSc CSE','Component-driven UI developer who loves design systems.','80000'),
    mk('Imran Khan','B2B Sales Executive','Chattogram','4','B2B Sales, CRM, Negotiation, Communication','BBA Marketing','Closed enterprise deals across telecom and SaaS accounts.','70000'),
    mk('Tahmina Rahman','Chartered Accountant','Dhaka','7','Accounting, Excel, Payroll, Tax, Audit','ICAB','Owns month-end close, payroll accounting and statutory filings.','110000'),
    mk('Sabbir Hossain','DevOps Engineer','Remote','5','AWS, Docker, Kubernetes, CI/CD, Firebase','BSc EEE','Automates deployments and keeps cloud costs predictable.','140000'),
    mk('Nabila Sultana','UI/UX Designer','Dhaka','4','Figma, Prototyping, Wireframing, UI/UX, Adobe XD','BFA','Designs end-to-end product journeys with research-backed decisions.','90000')
  );
  savePlat();
}
