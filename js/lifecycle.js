// Modules 2 to 7: Onboarding, Core HR Records, Leave & Attendance, Payroll, Performance & Separation
import { Store } from './store.js';
import { formatBDT, showToast, downloadCSV } from './helpers.js';

// --- MODULE 2: EMPLOYEE ONBOARDING ---
export function renderOnboardingModule() {
    const container = document.getElementById('onboarding-list-container');
    if (!container) return;

    const onboardingStaff = Store.data.employees.filter(e => e.status === 'Onboarding' || e.onboardingProgress < 100);
    const allStaff = Store.data.employees;
    const listToShow = onboardingStaff.length > 0 ? onboardingStaff : allStaff;

    container.innerHTML = listToShow.map(emp => {
        const cl = emp.checklist || { docs: true, account: false, asset: false, orientation: false };
        const completedCount = Object.values(cl).filter(Boolean).length;
        const pct = Math.round((completedCount / 4) * 100);

        return `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                    <div class="flex items-center gap-2">
                        <span class="text-[11px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded">${emp.id}</span>
                        <span class="text-[11px] font-extrabold ${pct === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} px-2.5 py-0.5 rounded-full">
                            ${pct === 100 ? 'Completed' : 'In Progress (' + pct + '%)'}
                        </span>
                    </div>
                    <h4 class="font-extrabold text-base text-slate-900 mt-1">${emp.name}</h4>
                    <p class="text-xs text-slate-500">${emp.designation} &bull; ${emp.dept} &bull; Joining: ${emp.joinDate}</p>
                </div>
                <div class="w-full sm:w-48">
                    <div class="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Checklist Progress</span>
                        <span>${pct}%</span>
                    </div>
                    <div class="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div class="bg-indigo-600 h-full transition-all" style="width: ${pct}%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-bold">
                <label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300">
                    <input type="checkbox" ${cl.docs ? 'checked' : ''} onchange="window.AppActions.toggleOnboardingTask('${emp.id}', 'docs')" class="accent-indigo-600 w-4 h-4">
                    <span>NID & Academic Docs</span>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300">
                    <input type="checkbox" ${cl.account ? 'checked' : ''} onchange="window.AppActions.toggleOnboardingTask('${emp.id}', 'account')" class="accent-indigo-600 w-4 h-4">
                    <span>Corporate Email & Slack</span>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300">
                    <input type="checkbox" ${cl.asset ? 'checked' : ''} onchange="window.AppActions.toggleOnboardingTask('${emp.id}', 'asset')" class="accent-indigo-600 w-4 h-4">
                    <span>Laptop & ID Card Issued</span>
                </label>
                <label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:border-indigo-300">
                    <input type="checkbox" ${cl.orientation ? 'checked' : ''} onchange="window.AppActions.toggleOnboardingTask('${emp.id}', 'orientation')" class="accent-indigo-600 w-4 h-4">
                    <span>HR Policy Orientation</span>
                </label>
            </div>
        </div>`;
    }).join('');
}

// --- MODULE 3: EMPLOYEE RECORDS (CORE HR) ---
export function renderEmployeeRecords() {
    const tbody = document.getElementById('core-hr-table-body');
    const countEl = document.getElementById('core-hr-count');
    if (!tbody) return;

    const search = (document.getElementById('hr-search-input')?.value || '').toLowerCase();
    const employees = Store.data.employees.filter(e =>
        !search || `${e.name} ${e.id} ${e.dept} ${e.designation}`.toLowerCase().includes(search)
    );

    if (countEl) countEl.textContent = employees.length;

    tbody.innerHTML = employees.map(emp => {
        const badge = emp.status === 'Active'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : (emp.status === 'Onboarding' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200');

        return `
        <tr class="hover:bg-slate-50/70 transition">
            <td class="p-3.5 font-extrabold text-indigo-600">${emp.id}</td>
            <td class="p-3.5">
                <div class="font-extrabold text-slate-900">${emp.name}</div>
                <div class="text-[11px] text-slate-500">${emp.email}</div>
            </td>
            <td class="p-3.5 font-bold text-slate-700">${emp.designation}</td>
            <td class="p-3.5 text-slate-600">${emp.dept}</td>
            <td class="p-3.5 text-slate-600">${emp.joinDate}</td>
            <td class="p-3.5"><span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${badge}">${emp.status}</span></td>
            <td class="p-3.5 text-right space-x-2">
                <button onclick="window.AppActions.initiateSeparationForEmployee('${emp.id}')" class="text-rose-600 hover:underline font-bold text-xs cursor-pointer">Offboard</button>
            </td>
        </tr>`;
    }).join('');
}

// --- MODULE 4: LEAVE & ATTENDANCE ---
export function renderLeaveAndAttendance() {
    const attBody = document.getElementById('attendance-table-body');
    const lvBody = document.getElementById('leave-table-body');

    if (attBody) {
        attBody.innerHTML = Store.data.attendance.map(a => `
            <tr class="hover:bg-slate-50/70">
                <td class="p-3 font-extrabold text-slate-900">${a.empName} <span class="text-[10px] text-slate-400">(${a.empId})</span></td>
                <td class="p-3 text-slate-600">${a.date}</td>
                <td class="p-3 font-bold text-emerald-700">${a.checkIn}</td>
                <td class="p-3 font-bold text-slate-700">${a.checkOut}</td>
                <td class="p-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${a.status === 'Present' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                        ${a.status}
                    </span>
                </td>
            </tr>
        `).join('');
    }

    if (lvBody) {
        lvBody.innerHTML = Store.data.leaves.map(l => `
            <tr class="hover:bg-slate-50/70">
                <td class="p-3 font-extrabold text-slate-900">${l.empName}</td>
                <td class="p-3 font-bold text-indigo-600">${l.type}</td>
                <td class="p-3 text-slate-600">${l.from} to ${l.to} (${l.days}d)</td>
                <td class="p-3 text-slate-500">${l.reason}</td>
                <td class="p-3">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${l.status === 'Approved' ? 'bg-emerald-50 text-emerald-700' : (l.status === 'Rejected' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700')}">
                        ${l.status}
                    </span>
                </td>
                <td class="p-3 text-right space-x-1">
                    ${l.status === 'Pending' ? `
                        <button onclick="window.AppActions.updateLeaveStatus('${l.id}', 'Approved')" class="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer">Approve</button>
                        <button onclick="window.AppActions.updateLeaveStatus('${l.id}', 'Rejected')" class="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer">Reject</button>
                    ` : '<span class="text-[11px] text-slate-400">Processed</span>'}
                </td>
            </tr>
        `).join('');
    }
}

// --- MODULE 5: PAYROLL MANAGEMENT ---
export function renderPayrollModule() {
    const tbody = document.getElementById('payroll-table-body');
    const totalEl = document.getElementById('payroll-total-net');
    if (!tbody) return;

    let grandTotal = 0;
    tbody.innerHTML = Store.data.employees.map(emp => {
        const net = (emp.basicSalary || 0) + (emp.allowance || 0) - (emp.tax || 0);
        grandTotal += net;
        return `
        <tr class="hover:bg-slate-50/70">
            <td class="p-3.5">
                <div class="font-extrabold text-slate-900">${emp.name}</div>
                <div class="text-[11px] text-slate-500">${emp.id} &bull; ${emp.designation}</div>
            </td>
            <td class="p-3.5 font-semibold">${formatBDT(emp.basicSalary)}</td>
            <td class="p-3.5 text-emerald-600 font-semibold">+${formatBDT(emp.allowance)}</td>
            <td class="p-3.5 text-rose-600 font-semibold">-${formatBDT(emp.tax)}</td>
            <td class="p-3.5 font-extrabold text-slate-900">${formatBDT(net)}</td>
            <td class="p-3.5 text-right">
                <button onclick="window.AppActions.openPayslipModal('${emp.id}')" class="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-[11px] cursor-pointer">
                    <i class="fa-solid fa-file-invoice mr-1"></i>Payslip
                </button>
            </td>
        </tr>`;
    }).join('');

    if (totalEl) totalEl.textContent = formatBDT(grandTotal);
}

export function exportPayrollSheet() {
    let csv = "Employee ID,Name,Department,Basic Salary (BDT),Allowances (BDT),Tax Deduction (BDT),Net Payable (BDT)
";
    Store.data.employees.forEach(e => {
        const net = (e.basicSalary || 0) + (e.allowance || 0) - (e.tax || 0);
        csv += `"${e.id}","${e.name}","${e.dept}",${e.basicSalary},${e.allowance},${e.tax},${net}
`;
    });
    downloadCSV('TalentHub_BD_Payroll_Sheet.csv', csv);
    showToast('Payroll Exported', 'Monthly salary sheet downloaded in CSV format.');
}

// --- MODULE 6: PERFORMANCE & APPRAISAL ---
export function renderPerformanceModule() {
    const grid = document.getElementById('performance-cards-grid');
    if (!grid) return;

    grid.innerHTML = Store.data.employees.map(emp => `
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div class="flex items-start justify-between">
                <div>
                    <span class="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded">${emp.dept}</span>
                    <h4 class="font-extrabold text-base text-slate-900 mt-1.5">${emp.name}</h4>
                    <p class="text-xs text-slate-500">${emp.designation}</p>
                </div>
                <div class="text-right bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
                    <span class="block text-[9px] font-extrabold uppercase text-amber-700">KPI Rating</span>
                    <span class="text-base font-black text-amber-600"><i class="fa-solid fa-star text-xs mr-1"></i>${emp.kpiScore || '4.5'}/5.0</span>
                </div>
            </div>
            <div class="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs space-y-1">
                <div class="font-extrabold text-slate-700">Current OKR / Goal:</div>
                <p class="text-slate-600">${emp.kpiGoal || 'Deliver quarterly departmental milestones.'}</p>
            </div>
            <div class="flex items-center justify-between pt-1">
                <span class="text-[11px] font-bold text-slate-400">Cycle: ${emp.lastReview || 'Q4 2026'}</span>
                <button onclick="window.AppActions.rateEmployeeKPI('${emp.id}')" class="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl cursor-pointer">
                    Update Appraisal
                </button>
            </div>
        </div>
    `).join('');
}

// --- MODULE 7: SEPARATION & OFFBOARDING ---
export function renderSeparationModule() {
    const tbody = document.getElementById('separation-table-body');
    if (!tbody) return;

    tbody.innerHTML = Store.data.separations.map(sep => `
        <tr class="hover:bg-slate-50/70">
            <td class="p-3.5">
                <div class="font-extrabold text-slate-900">${sep.empName}</div>
                <div class="text-[11px] text-slate-500">${sep.empId} &bull; ${sep.dept}</div>
            </td>
            <td class="p-3.5 text-slate-600">${sep.resignDate}</td>
            <td class="p-3.5 font-bold text-slate-800">${sep.lastWorkingDay}</td>
            <td class="p-3.5 text-slate-600">${sep.reason}</td>
            <td class="p-3.5 font-extrabold text-emerald-700">${formatBDT(sep.fnfAmount)}</td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full text-[10px] font-extrabold ${sep.status === 'Settled' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}">
                    ${sep.status}
                </span>
            </td>
            <td class="p-3.5 text-right">
                ${sep.status !== 'Settled' ? `
                    <button onclick="window.AppActions.completeFnFSettlement('${sep.id}')" class="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-3 py-1.5 rounded-xl text-[11px] cursor-pointer">
                        Settle F&F
                    </button>
                ` : '<span class="text-xs font-bold text-emerald-600"><i class="fa-solid fa-check-double"></i> Closed</span>'}
            </td>
        </tr>
    `).join('');
}