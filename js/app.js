// Main Application Controller for TalentHub BD
import { Store } from './store.js';
import { showToast, formatBDT } from './helpers.js';
import {
    renderCareerPortalJobs,
    renderATSPipeline,
    submitCandidateApplication,
    postNewJobCircular,
    exportATSReport
} from './recruitment.js';
import {
    renderOnboardingModule,
    renderEmployeeRecords,
    renderLeaveAndAttendance,
    renderPayrollModule,
    exportPayrollSheet,
    renderPerformanceModule,
    renderSeparationModule
} from './lifecycle.js';

// Initialize Data Store
Store.init();

function updateOverviewKPIs() {
    const kpiOpenings = document.getElementById('stat-openings');
    const kpiCandidates = document.getElementById('stat-candidates');
    const kpiEmployees = document.getElementById('stat-employees');
    const kpiLeaves = document.getElementById('stat-leaves');

    if (kpiOpenings) kpiOpenings.textContent = Store.data.jobs.length;
    if (kpiCandidates) kpiCandidates.textContent = Store.data.candidates.length;
    if (kpiEmployees) kpiEmployees.textContent = Store.data.employees.length;
    if (kpiLeaves) kpiLeaves.textContent = Store.data.leaves.filter(l => l.status === 'Pending').length;
}

function refreshAllViews() {
    updateOverviewKPIs();
    renderCareerPortalJobs();
    renderATSPipeline();
    renderOnboardingModule();
    renderEmployeeRecords();
    renderLeaveAndAttendance();
    renderPayrollModule();
    renderPerformanceModule();
    renderSeparationModule();
}

// Global Action Handlers attached to window for inline HTML events
window.AppActions = {
    switchMainView(view) {
        ['view-landing', 'view-careers', 'view-hrms'].forEach(id => {
            document.getElementById(id)?.classList.add('hidden');
        });
        document.getElementById(`view-${view}`)?.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        refreshAllViews();
    },

    switchHRMSTab(tabName) {
        const tabs = ['ats', 'onboarding', 'records', 'attendance', 'payroll', 'performance', 'separation'];
        tabs.forEach(t => {
            document.getElementById(`hrms-panel-${t}`)?.classList.add('hidden');
            const btn = document.getElementById(`hrms-tab-${t}`);
            if (btn) {
                btn.className = "px-4 py-2.5 rounded-xl font-extrabold text-xs bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition cursor-pointer flex items-center gap-2";
            }
        });

        document.getElementById(`hrms-panel-${tabName}`)?.classList.remove('hidden');
        const activeBtn = document.getElementById(`hrms-tab-${tabName}`);
        if (activeBtn) {
            activeBtn.className = "px-4 py-2.5 rounded-xl font-extrabold text-xs bg-indigo-600 text-white shadow-sm transition cursor-pointer flex items-center gap-2";
        }
        refreshAllViews();
    },

    openApplyModal(jobTitle = '') {
        renderCareerPortalJobs();
        const select = document.getElementById('apply-role-select');
        if (select && jobTitle) select.value = jobTitle;
        document.getElementById('modal-apply')?.classList.remove('hidden');
    },

    closeApplyModal() {
        document.getElementById('modal-apply')?.classList.add('hidden');
        document.getElementById('form-apply')?.reset();
    },

    handleApplySubmit(e) {
        e.preventDefault();
        submitCandidateApplication({
            role: document.getElementById('apply-role-select').value,
            name: document.getElementById('apply-name').value.trim(),
            mobile: document.getElementById('apply-mobile').value.trim(),
            email: document.getElementById('apply-email').value.trim(),
            designation: document.getElementById('apply-designation').value.trim(),
            org: document.getElementById('apply-org').value.trim(),
            exp: document.getElementById('apply-exp').value.trim(),
            skills: document.getElementById('apply-skills').value.trim()
        });
        this.closeApplyModal();
        refreshAllViews();
    },

    openJobModal() {
        document.getElementById('modal-job')?.classList.remove('hidden');
    },

    closeJobModal() {
        document.getElementById('modal-job')?.classList.add('hidden');
        document.getElementById('form-job')?.reset();
    },

    handleJobSubmit(e) {
        e.preventDefault();
        postNewJobCircular({
            title: document.getElementById('job-title').value.trim(),
            dept: document.getElementById('job-dept').value.trim(),
            type: document.getElementById('job-type').value,
            location: document.getElementById('job-location').value.trim(),
            salaryRange: document.getElementById('job-salary').value.trim(),
            skills: document.getElementById('job-skills').value.trim(),
            desc: document.getElementById('job-desc').value.trim()
        });
        this.closeJobModal();
        refreshAllViews();
    },

    filterATS() {
        renderATSPipeline();
    },

    changeCandidateStage(candId, newStage) {
        const cand = Store.data.candidates.find(c => c.id === candId);
        if (!cand) return;
        cand.stage = newStage;
        Store.save();

        if (newStage === 'call for interview') {
            this.openScheduleModal(candId);
        } else if (newStage === 'joined') {
            this.convertCandidateToEmployee(candId);
        } else {
            showToast('Pipeline Updated', `${cand.name} moved to ${newStage.toUpperCase()}.`);
            refreshAllViews();
        }
    },

    openScheduleModal(candId) {
        document.getElementById('schedule-cand-id').value = candId;
        document.getElementById('modal-schedule')?.classList.remove('hidden');
    },

    closeScheduleModal() {
        document.getElementById('modal-schedule')?.classList.add('hidden');
    },

    handleScheduleSubmit(e) {
        e.preventDefault();
        const candId = document.getElementById('schedule-cand-id').value;
        const cand = Store.data.candidates.find(c => c.id === candId);
        if (cand) {
            cand.stage = 'call for interview';
            cand.interviewSchedule = {
                datetime: document.getElementById('schedule-datetime').value,
                platform: document.getElementById('schedule-platform').value,
                notes: document.getElementById('schedule-notes').value
            };
            Store.save();
            showToast('Interview Scheduled', `Invitation sent to ${cand.name} (${cand.email}).`);
        }
        this.closeScheduleModal();
        refreshAllViews();
    },

    convertCandidateToEmployee(candId) {
        const cand = Store.data.candidates.find(c => c.id === candId);
        if (!cand) return;

        const exists = Store.data.employees.some(e => e.email === cand.email);
        if (exists) {
            showToast('Already Onboarded', `${cand.name} is already in Employee Records.`, 'info');
            return;
        }

        cand.stage = 'joined';
        const newEmpId = 'EMP-' + (1001 + Store.data.employees.length);
        Store.data.employees.unshift({
            id: newEmpId,
            name: cand.name,
            designation: cand.role,
            dept: 'Engineering',
            mobile: cand.mobile,
            email: cand.email,
            joinDate: new Date().toISOString().split('T')[0],
            status: 'Onboarding',
            basicSalary: 75000,
            allowance: 15000,
            tax: 3500,
            onboardingProgress: 25,
            checklist: { docs: true, account: false, asset: false, orientation: false },
            kpiScore: 4.5,
            kpiGoal: 'Complete 90-day onboarding & probation deliverables',
            lastReview: 'Probation'
        });

        Store.save();
        showToast('Candidate Onboarded!', `${cand.name} added to Onboarding & Core HR as ${newEmpId}.`);
        this.switchHRMSTab('onboarding');
    },

    exportATS() {
        exportATSReport();
    },

    toggleOnboardingTask(empId, taskKey) {
        const emp = Store.data.employees.find(e => e.id === empId);
        if (!emp) return;
        if (!emp.checklist) emp.checklist = { docs: false, account: false, asset: false, orientation: false };
        emp.checklist[taskKey] = !emp.checklist[taskKey];

        const done = Object.values(emp.checklist).filter(Boolean).length;
        emp.onboardingProgress = Math.round((done / 4) * 100);
        if (emp.onboardingProgress === 100) {
            emp.status = 'Active';
            showToast('Onboarding Completed!', `${emp.name} is now an Active employee.`);
        }
        Store.save();
        refreshAllViews();
    },

    openAddEmployeeModal() {
        document.getElementById('modal-employee')?.classList.remove('hidden');
    },

    closeAddEmployeeModal() {
        document.getElementById('modal-employee')?.classList.add('hidden');
        document.getElementById('form-employee')?.reset();
    },

    handleAddEmployeeSubmit(e) {
        e.preventDefault();
        const newId = 'EMP-' + (1001 + Store.data.employees.length);
        Store.data.employees.unshift({
            id: newId,
            name: document.getElementById('emp-name').value.trim(),
            designation: document.getElementById('emp-designation').value.trim(),
            dept: document.getElementById('emp-dept').value.trim(),
            mobile: document.getElementById('emp-mobile').value.trim(),
            email: document.getElementById('emp-email').value.trim(),
            joinDate: document.getElementById('emp-joindate').value || new Date().toISOString().split('T')[0],
            status: 'Active',
            basicSalary: Number(document.getElementById('emp-salary').value) || 60000,
            allowance: 12000,
            tax: 2500,
            onboardingProgress: 100,
            checklist: { docs: true, account: true, asset: true, orientation: true },
            kpiScore: 4.5,
            kpiGoal: 'Achieve departmental quarterly KPIs',
            lastReview: 'Q4 2026'
        });
        Store.save();
        this.closeAddEmployeeModal();
        showToast('Employee Record Created', `Added ${newId} to Core HR Directory.`);
        refreshAllViews();
    },

    filterEmployees() {
        renderEmployeeRecords();
    },

    logQuickAttendance() {
        const emp = Store.data.employees[0];
        if (!emp) return;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        Store.data.attendance.unshift({
            id: 'att_' + Date.now(),
            empId: emp.id,
            empName: emp.name,
            date: now.toISOString().split('T')[0],
            checkIn: timeStr,
            checkOut: 'Working',
            status: 'Present'
        });
        Store.save();
        showToast('Attendance Logged', `Checked in ${emp.name} at ${timeStr}.`);
        renderLeaveAndAttendance();
    },

    openLeaveModal() {
        document.getElementById('modal-leave')?.classList.remove('hidden');
    },

    closeLeaveModal() {
        document.getElementById('modal-leave')?.classList.add('hidden');
    },

    handleLeaveSubmit(e) {
        e.preventDefault();
        Store.data.leaves.unshift({
            id: 'lv_' + Date.now(),
            empId: 'EMP-1001',
            empName: document.getElementById('leave-emp-name').value.trim(),
            type: document.getElementById('leave-type').value,
            from: document.getElementById('leave-from').value,
            to: document.getElementById('leave-to').value,
            days: Number(document.getElementById('leave-days').value) || 1,
            reason: document.getElementById('leave-reason').value.trim(),
            status: 'Pending'
        });
        Store.save();
        this.closeLeaveModal();
        showToast('Leave Request Submitted', 'Sent to HR Manager for approval.');
        refreshAllViews();
    },

    updateLeaveStatus(leaveId, status) {
        const lv = Store.data.leaves.find(l => l.id === leaveId);
        if (lv) {
            lv.status = status;
            Store.save();
            showToast(`Leave ${status}`, `Leave request for ${lv.empName} marked as ${status}.`);
            refreshAllViews();
        }
    },

    openPayslipModal(empId) {
        const emp = Store.data.employees.find(e => e.id === empId);
        if (!emp) return;
        const net = (emp.basicSalary || 0) + (emp.allowance || 0) - (emp.tax || 0);
        const body = document.getElementById('payslip-modal-content');
        if (body) {
            body.innerHTML = `
                <div class="border-b border-slate-200 pb-4 flex justify-between items-center">
                    <div>
                        <h4 class="font-extrabold text-lg text-indigo-950">TalentHub BD Enterprise</h4>
                        <p class="text-xs text-slate-500">Official Salary Payslip &bull; November 2026</p>
                    </div>
                    <span class="bg-emerald-100 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full">PAID</span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs py-3 border-b border-slate-100">
                    <div><span class="text-slate-400">Employee:</span> <strong>${emp.name} (${emp.id})</strong></div>
                    <div><span class="text-slate-400">Department:</span> <strong>${emp.dept}</strong></div>
                    <div><span class="text-slate-400">Designation:</span> <strong>${emp.designation}</strong></div>
                    <div><span class="text-slate-400">Payment Mode:</span> <strong>Bank Transfer (EFT)</strong></div>
                </div>
                <div class="space-y-2 text-xs py-3">
                    <div class="flex justify-between"><span>Basic Salary</span><strong>${formatBDT(emp.basicSalary)}</strong></div>
                    <div class="flex justify-between text-emerald-700"><span>House Rent & Medical Allowance</span><strong>+${formatBDT(emp.allowance)}</strong></div>
                    <div class="flex justify-between text-rose-600"><span>Income Tax & PF Deduction</span><strong>-${formatBDT(emp.tax)}</strong></div>
                    <div class="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                        <span>Net Disbursed Salary</span>
                        <span class="text-indigo-600">${formatBDT(net)}</span>
                    </div>
                </div>
            `;
        }
        document.getElementById('modal-payslip')?.classList.remove('hidden');
    },

    closePayslipModal() {
        document.getElementById('modal-payslip')?.classList.add('hidden');
    },

    exportPayroll() {
        exportPayrollSheet();
    },

    rateEmployeeKPI(empId) {
        const emp = Store.data.employees.find(e => e.id === empId);
        if (!emp) return;
        const newRating = prompt(`Enter new KPI Rating (1.0 - 5.0) for ${emp.name}:`, emp.kpiScore || '4.5');
        if (newRating === null) return;
        const parsed = Math.min(5, Math.max(1, parseFloat(newRating) || 4.5));
        const newGoal = prompt(`Update OKR / Quarterly Goal for ${emp.name}:`, emp.kpiGoal || '');

        emp.kpiScore = parsed.toFixed(1);
        if (newGoal) emp.kpiGoal = newGoal;
        emp.lastReview = 'Nov 2026';
        Store.save();
        showToast('Appraisal Updated', `${emp.name}'s KPI rating updated to ${emp.kpiScore}/5.0.`);
        renderPerformanceModule();
    },

    initiateSeparationForEmployee(empId) {
        const emp = Store.data.employees.find(e => e.id === empId);
        if (!emp) return;
        const reason = prompt(`Initiate Offboarding / Resignation for ${emp.name}. Enter reason:`, 'Career advancement');
        if (!reason) return;

        emp.status = 'Notice Period';
        const fnf = (emp.basicSalary || 60000) + (emp.allowance || 10000);
        Store.data.separations.unshift({
            id: 'sep_' + Date.now(),
            empId: emp.id,
            empName: emp.name,
            dept: emp.dept,
            resignDate: new Date().toISOString().split('T')[0],
            lastWorkingDay: '2026-12-15',
            reason,
            exitInterview: 'Scheduled',
            fnfAmount: fnf,
            status: 'Notice Period'
        });

        Store.save();
        showToast('Offboarding Initiated', `${emp.name} moved to Separation & Notice Period.`);
        this.switchHRMSTab('separation');
    },

    completeFnFSettlement(sepId) {
        const sep = Store.data.separations.find(s => s.id === sepId);
        if (!sep) return;
        sep.status = 'Settled';
        sep.exitInterview = 'Completed';
        const emp = Store.data.employees.find(e => e.id === sep.empId);
        if (emp) emp.status = 'Separated';
        Store.save();
        showToast('F&F Settlement Closed', `Final settlement of ${formatBDT(sep.fnfAmount)} cleared for ${sep.empName}.`);
        refreshAllViews();
    },

    resetAllDemoData() {
        if (confirm('Reset all demo data to factory defaults?')) {
            Store.resetDemo();
            refreshAllViews();
            showToast('Data Reset', 'All modules restored to initial state.', 'info');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    refreshAllViews();
});