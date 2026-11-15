/* ================= HELPERS ================= */
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.classList.remove('hidden'); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.add('hidden'),3200); }
function closeModal(){ const m=document.getElementById('modal'); m.classList.add('hidden'); m.innerHTML=''; }
function modal(title, body, onSubmit, opt={}){
  const m=document.getElementById('modal');
  m.innerHTML = `<div class="bg-white rounded-3xl ${opt.wide?'max-w-3xl':'max-w-lg'} w-full p-6 max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl">
    <div class="flex justify-between items-center"><h3 class="font-extrabold text-lg">${title}</h3><button type="button" onclick="closeModal()" class="text-slate-400 hover:text-slate-700"><i class="fa-solid fa-xmark"></i></button></div>
    ${onSubmit ? `<form id="mf" class="space-y-3">${body}<div class="flex justify-end gap-2 pt-2"><button type="button" class="btn btn-s" onclick="closeModal()">Cancel</button><button class="btn btn-p">${opt.submit||'Save'}</button></div></form>` : body}
  </div>`;
  m.classList.remove('hidden');
  if(onSubmit) m.querySelector('#mf').onsubmit = e => { e.preventDefault(); onSubmit(Object.fromEntries(new FormData(e.target))); };
}
function field(label,name,val='',type='text',o={}){
  const req = o.req ? 'required' : '';
  if(type==='select') return `<label class="fl">${label}<select name="${name}" ${req}>${(o.options||[]).map(x=>{const [v,l]=Array.isArray(x)?x:[x,x];return `<option value="${esc(v)}" ${String(v)===String(val)?'selected':''}>${esc(l)}</option>`}).join('')}</select></label>`;
  if(type==='textarea') return `<label class="fl">${label}<textarea name="${name}" rows="${o.rows||3}" ${req}>${esc(val)}</textarea></label>`;
  return `<label class="fl">${label}<input name="${name}" type="${type}" value="${esc(val)}" ${req} ${o.step?`step="${o.step}"`:''} ${o.min!==undefined?`min="${o.min}"`:''} ${o.max!==undefined?`max="${o.max}"`:''} ${o.accept?`accept="${o.accept}"`:''} ${o.ph?`placeholder="${esc(o.ph)}"`:''}></label>`;
}
const grid = (...c) => `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${c.join('')}</div>`;
function readFile(file){ return new Promise((res,rej)=>{ if(!file||!file.size) return res(null); if(file.size>1024*1024) return rej(new Error('File exceeds 1MB limit')); const r=new FileReader(); r.onload=()=>res({data:r.result,name:file.name}); r.onerror=()=>rej(new Error('Could not read file')); r.readAsDataURL(file); }); }
function csv(name, rows){
  const q = v => { v = String(v ?? ''); if(/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g,'""') + '"'; };
  const blob = new Blob(['\ufeff' + rows.map(r=>r.map(q).join(',')).join('\n')], {type:'text/csv;charset=utf-8;'});
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${name}_${today()}.csv`; document.body.appendChild(a); a.click(); a.remove();
}
const emp = id => db.employees.find(e=>e.id===id);
const empName = id => emp(id)?.name || 'Unknown';
const dept = () => db.departments;
const live = () => db.employees.filter(e=>e.status!=='Separated');
const badge = (txt,cls) => `<span class="tag ${cls}">${esc(txt)}</span>`;
const stCls = {Applied:'bg-slate-100 text-slate-700',Screening:'bg-blue-50 text-blue-700',Shortlisted:'bg-indigo-50 text-indigo-700',Interview:'bg-amber-50 text-amber-700',Offer:'bg-orange-50 text-orange-700',Hired:'bg-emerald-100 text-emerald-800',Rejected:'bg-rose-100 text-rose-700',Active:'bg-emerald-100 text-emerald-800',Notice:'bg-amber-100 text-amber-800',Separated:'bg-slate-200 text-slate-600',Pending:'bg-amber-100 text-amber-800',Approved:'bg-emerald-100 text-emerald-800','Rejected ':'bg-rose-100 text-rose-700',Open:'bg-emerald-100 text-emerald-800',Closed:'bg-slate-200 text-slate-600',Draft:'bg-amber-100 text-amber-800',Paid:'bg-emerald-100 text-emerald-800'};
const bar = (label,val,max,color='bg-indigo-500') => `<div class="space-y-1"><div class="flex justify-between text-[11px] font-bold text-slate-600"><span>${esc(label)}</span><span>${val}</span></div><div class="h-2 bg-slate-100 rounded-full"><div class="h-2 rounded-full ${color}" style="width:${max?Math.round(val/max*100):0}%"></div></div></div>`;
