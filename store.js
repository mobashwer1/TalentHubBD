/* ================= DATA LAYER =================
   Local-first (localStorage) so it works instantly with zero setup.
   All reads/writes go through load()/save(); swap these two for Firebase/REST later. */
/* Platform store (accounts: employers, job seekers, admin, invitations) + one HR workspace per employer.
   Local-first (localStorage). To go multi-user, replace these functions with a backend (see README). */
const PKEY = 'hrflow_platform_v2', WSPREFIX = 'hrflow_ws_', OLDKEY = 'hrflow_v1', SESSION = 'hrflow_session';
let plat = loadPlat();      // shared across all roles
let curEmp = null;          // id of the employer whose workspace is loaded into `db`
let db = null;              // the current employer's HR workspace
function loadPlat(){
  try { const p = JSON.parse(localStorage.getItem(PKEY)); if(p){ p.employers=p.employers||[]; p.seekers=p.seekers||[]; p.invites=p.invites||[]; return p; } } catch(e){}
  const p = {admin:null, employers:[], seekers:[], invites:[]};
  try { // migrate a workspace created with the earlier single-company version
    const old = JSON.parse(localStorage.getItem(OLDKEY));
    if(old && old.company){ const id='emp_'+Date.now().toString(36); p.employers.push({id,name:old.company.name,email:old.company.email,passHash:old.company.passHash,status:'Active',created:new Date().toISOString().slice(0,10)}); localStorage.setItem(WSPREFIX+id, JSON.stringify(old)); }
  } catch(e){}
  try { localStorage.setItem(PKEY, JSON.stringify(p)); } catch(e){}
  return p;
}
const FULL_MSG = 'Storage is full. Export a backup (Settings) and remove large CV files.';
function savePlat(){ try { localStorage.setItem(PKEY, JSON.stringify(plat)); } catch(e){ alert(FULL_MSG); } }
const wsKey = id => WSPREFIX + id;
function loadWs(id){ try { return JSON.parse(localStorage.getItem(wsKey(id))); } catch(e){ return null; } }
function saveWs(id, data){ try { localStorage.setItem(wsKey(id), JSON.stringify(data)); } catch(e){ alert(FULL_MSG); } }
function save(){ if(curEmp && db) saveWs(curEmp, db); }
function openWorkspace(id){ curEmp = id; db = loadWs(id); }
function getSession(){ try { const s = JSON.parse(sessionStorage.getItem(SESSION)); return s && s.role ? s : null; } catch(e){ return null; } }
function setSession(role, id){ sessionStorage.setItem(SESSION, JSON.stringify({role, id})); }

const STAGES = ['Applied','Screening','Shortlisted','Interview','Offer','Hired','Rejected'];
const LEAVE_TYPES = ['Annual','Sick','Casual','Unpaid'];
const ATT = ['Present','Late','Remote','Absent','Leave'];
const EMP_TYPES = ['Full-Time','Part-Time','Contract','Intern'];
const SEP_TYPES = ['Resignation','Termination','Retirement','End of Contract','Other'];
const ONBOARD = ['Sign offer letter & employment contract','Collect ID, certificates & bank details','Create email & system accounts','Issue laptop / equipment','Orientation & policy briefing','Assign buddy & manager 1:1','Set 30-60-90 day goals'];
const OFFBOARD = ['Resignation / termination letter accepted','Knowledge transfer completed','Return company assets (laptop, ID, keys)','Revoke system & email access','Department clearance signed','Exit interview conducted','Final settlement processed','Experience certificate issued'];

const uid = p => p + '_' + Math.random().toString(36).slice(2,9) + Date.now().toString(36).slice(-3);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today = () => new Date().toISOString().slice(0,10);
const thisMonth = () => today().slice(0,7);
const fmt = d => { if(!d) return '—'; const x = new Date(d.length===10 ? d+'T00:00' : d); return isNaN(x) ? '—' : x.toLocaleDateString(undefined,{day:'2-digit',month:'short',year:'numeric'}); };
const fmtDT = d => d ? new Date(d).toLocaleString(undefined,{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '—';
const money = n => (db?.settings?.currency || '৳') + ' ' + Number(n||0).toLocaleString(undefined,{maximumFractionDigits:2});
const r2 = n => Math.round((n + Number.EPSILON) * 100) / 100;
const daysBetween = (a,b) => Math.round((new Date(b+'T00:00') - new Date(a+'T00:00')) / 864e5) + 1;
const initials = n => (n||'?').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();

/* ================= UI STATE ================= */
const ui = { recTab:'candidates', rq:'', rRole:'All', rStage:'All', eq:'', eDept:'All', eStatus:'All', attDate:today(), payMonth:thisMonth(), leaveFilter:'All', nav:false };
