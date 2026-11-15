/* ================= BUSINESS LOGIC ================= */
function nextEmpCode(){ const n = db.employees.length + 1; return 'EMP-' + String(n).padStart(3,'0'); }
function calcPay(e, month){
  const gross = (+e.basic||0) + (+e.allowance||0);
  let absent = 0;
  for(const [d,m] of Object.entries(db.attendance)) if(d.startsWith(month) && m[e.id]==='Absent') absent++;
  const unpaid = db.leaves.filter(l=>l.empId===e.id && l.status==='Approved' && l.type==='Unpaid' && l.from.startsWith(month)).reduce((a,l)=>a+l.days,0);
  const absDed = r2((absent+unpaid) * gross/30);
  const taxable = Math.max(0, gross - absDed);
  const tax = r2(taxable * db.settings.tax/100);
  const pf = r2((+e.basic||0) * db.settings.pf/100);
  return { empId:e.id, name:e.name, code:e.code, basic:+e.basic||0, allowance:+e.allowance||0, gross, absentDays:absent+unpaid, absDed, tax, pf, net: r2(gross-absDed-tax-pf) };
}
function settlement(e, lwd){
  const gross = (+e.basic||0)+(+e.allowance||0);
  const day = Math.min(new Date(lwd+'T00:00').getDate(), 30);
  const sal = r2(gross/30*day);
  const enc = r2((e.leave?.Annual||0) * (+e.basic||0)/30);
  return { sal, enc, total: r2(sal+enc), days: day, annual: e.leave?.Annual||0 };
}

function seed(){
  const d = (n)=>{const x=new Date(); x.setDate(x.getDate()+n); return x.toISOString().slice(0,10)};
  db.departments = ['Engineering','Human Resources','Sales','Marketing','Finance','Operations'];
  db.jobs = [
    {id:uid('job'),title:'Senior Frontend Engineer',dept:'Engineering',type:'Full-Time',location:'Dhaka / Hybrid',skills:'React, TypeScript, Tailwind, Testing',desc:'Build and scale our web platform.',status:'Open',posted:d(-12)},
    {id:uid('job'),title:'Sales Executive',dept:'Sales',type:'Full-Time',location:'Dhaka',skills:'B2B Sales, CRM, Negotiation, Communication',desc:'Grow enterprise accounts.',status:'Open',posted:d(-5)},
    {id:uid('job'),title:'Finance Officer',dept:'Finance',type:'Full-Time',location:'Dhaka',skills:'Accounting, Excel, Payroll, Tax',desc:'Own monthly closing and payroll accounting.',status:'Closed',posted:d(-60)}
  ];
  const mk=(name,deptn,title,basic,al,join,mgr)=>({id:uid('emp'),code:nextEmpCode(),name,email:name.split(' ')[0].toLowerCase()+'@example.com',phone:'+8801700000000',dept:deptn,title,type:'Full-Time',joinDate:join,basic,allowance:al,status:'Active',manager:mgr||'',leave:{Annual:14,Sick:10,Casual:10}});
  const a=mk('Nusrat Jahan','Human Resources','HR Manager',90000,20000,'2022-03-01');
  db.employees.push(a);
  db.employees.push(mk('Rahim Uddin','Engineering','Tech Lead',140000,30000,'2021-06-15'));
  db.employees.push(mk('Sadia Karim','Sales','Sales Manager',85000,15000,'2023-01-10'));
  db.employees.push(mk('Tanvir Hasan','Finance','Accountant',60000,10000,'2023-08-20'));
  db.candidates = [
    {id:uid('cand'),jobId:db.jobs[0].id,role:db.jobs[0].title,name:'Farhan Ahmed',email:'farhan@mail.com',phone:'+8801811111111',exp:'6',skills:'React, TypeScript, Node.js, Testing',notes:'Strong portfolio.',stage:'Interview',applied:d(-6),interview:{datetime:d(2)+'T11:00',mode:'Google Meet',notes:'Technical round'},score:0},
    {id:uid('cand'),jobId:db.jobs[0].id,role:db.jobs[0].title,name:'Mim Akter',email:'mim@mail.com',phone:'+8801822222222',exp:'3',skills:'React, CSS, Figma',notes:'',stage:'Screening',applied:d(-3),score:0},
    {id:uid('cand'),jobId:db.jobs[1].id,role:db.jobs[1].title,name:'Imran Khan',email:'imran@mail.com',phone:'+8801833333333',exp:'4',skills:'B2B Sales, CRM, Communication',notes:'',stage:'Applied',applied:d(-1),score:0}
  ];
  db.candidates.forEach(c=>c.score=matchScore(c,db.jobs.find(j=>j.id===c.jobId)));
  db.reviews.push({id:uid('rev'),empId:db.employees[1].id,period:'2026 H1',rating:5,goals:'Ship v2 platform',comments:'Outstanding delivery.',reviewer:'Nusrat Jahan',date:d(-90)});
}

/* ================= AUTH (local demo — see notes for production) ================= */
async function hash(s){
  if(window.crypto?.subtle){ const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('hrflow|'+s)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
  let h=0; for(const c of s) h=(h*31+c.charCodeAt(0))|0; return 'weak'+h;
}
