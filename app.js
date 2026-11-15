/* ================= LANDING, AUTH, SHELL & ROUTER ================= */
const ROLES = {
  employer: { label:'Employer / HR', nav:NAV,  pages:PAGES,  home:'dashboard', who:() => db.company.name },
  seeker:   { label:'Job Seeker',    nav:SNAV, pages:SPAGES, home:'s-home',    who:() => (me() ? me().name : '') },
  admin:    { label:'Platform Admin',nav:ANAV, pages:APAGES, home:'a-home',    who:() => 'Administrator' }
};
const ROLE_INFO = {
  seeker:   {icon:'fa-user-tie', color:'bg-emerald-50 text-emerald-600', title:'I\'m a Job Seeker',   desc:'Create a profile, get matched with jobs, apply and track your applications.'},
  employer: {icon:'fa-building', color:'bg-indigo-50 text-indigo-600',   title:'I\'m an Employer / HR', desc:'Post jobs, search talent, and manage hiring, payroll and exits in one place.'},
  admin:    {icon:'fa-user-shield', color:'bg-amber-50 text-amber-600',  title:'Platform Admin',       desc:'Oversee employers, job seekers and job postings.'}
};

A.pickRole = function(role, mode){
  ui.authRole = role;
  ui.authMode = role==='admin' ? (plat.admin ? 'login' : 'register') : (mode || 'login');
  location.hash = ''; go();
};
A.backToLanding = function(){ ui.authRole = null; ui.pendingApply = null; go(); };
A.toggleAuthMode = function(){ ui.authMode = ui.authMode==='login' ? 'register' : 'login'; go(); };

function renderLanding(){
  if(ui.authRole) return renderAuth(ui.authRole);
  const card = r => `<button onclick="A.pickRole('${r}')" class="card text-left hover:shadow-lg hover:border-indigo-300 transition cursor-pointer space-y-3"><div class="w-12 h-12 rounded-2xl ${ROLE_INFO[r].color} flex items-center justify-center text-xl"><i class="fa-solid ${ROLE_INFO[r].icon}"></i></div><div class="font-extrabold">${ROLE_INFO[r].title}</div><p class="text-xs text-slate-500">${ROLE_INFO[r].desc}</p><span class="text-xs font-extrabold text-indigo-600">Continue →</span></button>`;
  document.getElementById('app').innerHTML = `<div class="max-w-5xl mx-auto px-4 py-10 space-y-8">
    <div class="text-center space-y-3"><div class="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl mx-auto"><i class="fa-solid fa-people-group"></i></div><h1 class="text-4xl font-extrabold tracking-tight">HRFlow</h1><p class="text-slate-500 text-sm max-w-xl mx-auto">From the first job post to the last working day — hiring, HR operations and careers in one platform.</p></div>
    <div class="grid md:grid-cols-3 gap-4">${['seeker','employer','admin'].map(card).join('')}</div>
    <div class="text-center"><a href="#/board" class="btn btn-s"><i class="fa-solid fa-briefcase"></i> Browse open jobs without signing in</a></div></div>`;
}

function renderAuth(role){
  const reg = ui.authMode==='register', info = ROLE_INFO[role], adminSetup = role==='admin' && !plat.admin;
  const nameLbl = role==='employer' ? 'Company name' : 'Full name';
  document.getElementById('app').innerHTML = `<div class="min-h-screen flex items-center justify-center p-4"><div class="w-full max-w-md card !p-8 space-y-5 shadow-xl">
    <div class="text-center space-y-2"><div class="w-14 h-14 ${info.color} rounded-2xl flex items-center justify-center text-2xl mx-auto"><i class="fa-solid ${info.icon}"></i></div><h1 class="text-xl font-extrabold">${ROLES[role].label} ${reg?(adminSetup?'setup':'sign up'):'sign in'}</h1>
    <p class="text-xs text-slate-500">${adminSetup?'Create the platform administrator account (first-time setup).':reg?'Create your account to get started.':'Welcome back.'}</p></div>
    ${ui.pendingApply&&role==='seeker'?'<div class="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 font-bold">Sign in or create a profile to finish your application.</div>':''}
    <form id="authf" class="space-y-3">${reg && role!=='admin'?field(nameLbl,'name','','text',{req:1}):''}${field('Email','email','','email',{req:1})}${field('Password'+(reg?' (min 8 characters)':''),'pass','','password',{req:1})}
    ${reg && role==='employer'?`<label class="flex items-center gap-2 text-xs font-bold"><input type="checkbox" name="sample" checked> Load sample data so I can explore</label>`:''}
    <button class="btn btn-p w-full justify-center !py-3">${reg?'Create account':'Sign in'}</button></form>
    ${role!=='admin'?`<div class="text-center text-xs font-bold text-slate-500">${reg?'Already have an account?':'New here?'} <button onclick="A.toggleAuthMode()" class="text-indigo-600 hover:underline">${reg?'Sign in':'Create an account'}</button></div>`:''}
    <div class="text-center"><button onclick="A.backToLanding()" class="text-xs font-bold text-slate-500 hover:text-slate-700">← Choose a different mode</button></div></div></div>`;

  document.getElementById('authf').onsubmit = async e => {
    e.preventDefault(); const v = Object.fromEntries(new FormData(e.target)), email = v.email.trim().toLowerCase(), h = await hash(email+'|'+v.pass);
    if(reg){
      if(v.pass.length < 8) return alert('Password must be at least 8 characters.');
      if(role==='admin'){ plat.admin = {email, passHash:h}; savePlat(); setSession('admin','admin'); }
      else if(role==='seeker'){
        if(plat.seekers.some(s=>s.email===email)) return alert('A job seeker with this email already exists. Please sign in.');
        const id = uid('sk'); plat.seekers.push({id, email, passHash:h, name:v.name.trim(), status:'Active', created:today(), profile:emptyProfile(v.name.trim())}); savePlat(); setSession('seeker', id);
      } else {
        if(plat.employers.some(x=>x.email===email)) return alert('An employer with this email already exists. Please sign in.');
        const id = uid('emp'), name = v.name.trim();
        plat.employers.push({id, name, email, passHash:h, status:'Active', created:today()});
        saveWs(id, {company:{name, email}, settings:{currency:'৳',tax:5,pf:5}, departments:['Engineering','Human Resources','Sales','Marketing','Finance','Operations'], jobs:[], candidates:[], employees:[], onboarding:{}, leaves:[], attendance:{}, payroll:[], reviews:[], separations:[], saved:[]});
        openWorkspace(id); if(v.sample){ seed(); save(); seedSeekers(); } savePlat(); setSession('employer', id);
      }
    } else {
      let acct = null;
      if(role==='admin') acct = plat.admin && plat.admin.email===email ? {id:'admin', ...plat.admin} : null;
      else acct = (role==='seeker' ? plat.seekers : plat.employers).find(x => x.email===email);
      if(!acct || acct.passHash!==h) return alert('Invalid email or password.');
      if(acct.status && acct.status!=='Active') return alert('This account has been suspended. Please contact the platform administrator.');
      setSession(role, acct.id); if(role==='employer') openWorkspace(acct.id);
    }
    ui.authRole = null; const R = ROLES[role]; location.hash = '#/'+R.home;
    if(role==='seeker' && ui.pendingApply){ const p = ui.pendingApply; ui.pendingApply = null; go(); if(profileReady(me().profile)) A.applyForm(p.eid, p.jid); else { alert('Complete your profile (name, phone, skills) to finish applying.'); location.hash = '#/s-profile'; } return; }
    go();
  };
}

function shell(role, key, html){
  const R = ROLES[role];
  return `<div class="flex min-h-screen">
    <aside class="noprint ${ui.nav?'fixed inset-y-0 left-0 z-40 flex':'hidden'} md:sticky md:flex md:top-0 md:h-screen w-64 bg-slate-900 p-4 flex-col gap-1 shrink-0">
      <div class="flex items-center gap-3 px-2 py-3 mb-2"><div class="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white"><i class="fa-solid fa-people-group"></i></div><div><div class="text-white font-extrabold leading-tight">HRFlow</div><div class="text-[10px] text-indigo-300 font-bold uppercase">${R.label}</div></div></div>
      <div class="px-2 pb-2 text-[11px] text-slate-400 truncate">${esc(R.who())}</div>
      <nav class="nav flex-1 space-y-0.5 overflow-y-auto">${R.nav.map(n=>`<a href="#/${n[0]}" class="${n[0]===key?'on':''}" onclick="ui.nav=false"><i class="fa-solid ${n[2]}"></i>${n[1]}</a>`).join('')}</nav>
      <a href="#/board" target="_blank" class="nav text-xs"><span class="flex items-center gap-3 px-3.5 py-2 text-slate-400 hover:text-white"><i class="fa-solid fa-briefcase w-4 text-center"></i>Public job board</span></a>
      <button onclick="A.logout()" class="nav"><a class="w-full cursor-pointer"><i class="fa-solid fa-right-from-bracket"></i>Sign out</a></button></aside>
    <div class="flex-1 min-w-0"><div class="md:hidden noprint bg-white border-b border-slate-200 p-3 flex items-center gap-3"><button class="btn btn-s" onclick="ui.nav=!ui.nav;go()"><i class="fa-solid fa-bars"></i></button><b>HRFlow</b><span class="tag bg-indigo-50 text-indigo-700 ml-auto">${R.label}</span></div>
    <main class="p-4 sm:p-6 lg:p-8 max-w-7xl">${html}</main></div></div>`;
}

function go(){
  closeModal();
  const page = location.hash.replace('#/','');
  if(page==='board' || page==='careers') return renderBoard();
  const s = getSession();
  if(!s) return renderLanding();
  if(s.role==='employer'){
    const e = plat.employers.find(x=>x.id===s.id);
    if(!e || e.status!=='Active') return A.logout();
    if(curEmp!==s.id || !db) openWorkspace(s.id);
    if(!db) return A.logout();
  } else if(s.role==='seeker'){
    const u = plat.seekers.find(x=>x.id===s.id); if(!u || u.status!=='Active') return A.logout();
  } else if(s.role==='admin'){ if(!plat.admin) return A.logout(); }
  const R = ROLES[s.role]; if(!R) return A.logout();
  const key = R.pages[page] ? page : R.home;
  document.getElementById('app').innerHTML = shell(s.role, key, R.pages[key]());
}
window.addEventListener('hashchange', go);
go();
