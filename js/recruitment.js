// Module 1: Recruitment & Smart ATS
import { Store } from './store.js';
import { calculateAIMatchScore, showToast, downloadCSV } from './helpers.js';

export const PIPELINE_STAGES = [
    "screening",
    "shortlisted",
    "call for interview",
    "offer letter sent",
    "hired",
    "joined",
    "rejected"
];

export const STAGE_BADGE_CLASS = {
    "screening": "stage-screening",
    "shortlisted": "stage-shortlisted",
    "call for interview": "stage-interview",
    "offer letter sent": "stage-offer",
    "hired": "stage-hired",
    "joined": "stage-joined",
    "rejected": "stage-rejected"
};

export function renderCareerPortalJobs() {
    const grid = document.getElementById('career-jobs-grid');
    const roleSelect = document.getElementById('apply-role-select');
    if (!grid) return;

    const jobs = Store.data.jobs;
    if (roleSelect) {
        let optionsHtml = '<option value="">Select Job Position</option>';
        jobs.forEach(function(j) {
            optionsHtml += '<option value="' + j.title + '">' + j.title + ' (' + j.dept + ')</option>';
        });
        roleSelect.innerHTML = optionsHtml;
    }

    if (jobs.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 bg-white rounded-3xl border border-slate-200 text-sm text-slate-500">No active circulars at the moment.</div>';
        return;
    }

    let html = '';
    jobs.forEach(function(job) {
        let skillsHtml = '';
        if (job.skills) {
            job.skills.split(',').forEach(function(s) {
                skillsHtml += '<span class="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">' + s.trim() + '</span>';
            });
        }

        html += '<div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between space-y-5">';
        html += '<div class="space-y-2.5">';
        html += '<div class="flex items-center justify-between gap-2">';
        html += '<span class="text-[10px] font-extrabold uppercase bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md">' + job.dept + '</span>';
        html += '<span class="text-[11px] font-bold text-slate-500"><i class="fa-solid fa-location-dot text-indigo-600 mr-1"></i>' + job.location + '</span>';
        html += '</div>';
        html += '<h4 class="font-extrabold text-lg text-slate-900">' + job.title + '</h4>';
        html += '<p class="text-xs font-bold text-emerald-600">' + (job.salaryRange || 'Competitive Package') + '</p>';
        html += '<p class="text-xs text-slate-600 leading-relaxed">' + job.desc + '</p>';
        html += '<div class="pt-1 flex flex-wrap gap-1.5">' + skillsHtml + '</div>';
        html += '</div>';
        html += '<button onclick="window.AppActions.openApplyModal(\'' + job.title + '\')" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2">';
        html += '<i class="fa-solid fa-paper-plane"></i> Apply & Parse CV';
        html += '</button>';
        html += '</div>';
    });

    grid.innerHTML = html;
}

export function renderATSPipeline() {
    const container = document.getElementById('ats-pipeline-container');
    const roleFilter = document.getElementById('ats-filter-role');
    if (!container) return;

    if (roleFilter) {
        const currentVal = roleFilter.value || 'All';
        const titles = [...new Set(Store.data.jobs.map(function(j) { return j.title; }))];
        let roleOpts = '<option value="All">All Positions</option>';
        titles.forEach(function(t) {
            roleOpts += '<option value="' + t + '" ' + (currentVal === t ? 'selected' : '') + '>' + t + '</option>';
        });
        roleFilter.innerHTML = roleOpts;
    }

    const fRole = roleFilter ? roleFilter.value : 'All';
    const fStage = document.getElementById('ats-filter-stage')?.value || 'All';
    const fSearch = (document.getElementById('ats-filter-search')?.value || '').trim().toLowerCase();

    const candidates = Store.data.candidates;
    let html = '';

    PIPELINE_STAGES.forEach(function(stage) {
        if (fStage !== 'All' && fStage !== stage) return;

        const matched = candidates.filter(function(c) {
            const mStage = c.stage === stage;
            const mRole = fRole === 'All' || c.role === fRole;
            const mSearch = !fSearch || (c.name + ' ' + c.email + ' ' + c.mobile + ' ' + c.skills + ' ' + c.org).toLowerCase().includes(fSearch);
            return mStage && mRole && mSearch;
        });

        if (matched.length === 0) return;

        html += '<div class="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden border-l-4 border-l-indigo-600">';
        html += '<div class="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">';
        html += '<span class="uppercase tracking-wider text-xs font-extrabold text-slate-800 flex items-center gap-2">';
        html += '<i class="fa-solid fa-layer-group text-indigo-600"></i> ' + stage;
        html += '<span class="bg-indigo-100 text-indigo-800 rounded-full px-2.5 py-0.5 text-[10px]">' + matched.length + '</span>';
        html += '</span></div>';
        html += '<div class="divide-y divide-slate-100">';

        matched.forEach(function(c) {
            const scoreClass = c.aiScore >= 85 ? 'bg-emerald-100 text-emerald-800' : (c.aiScore >= 70 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800');
            
            let stageOpts = '';
            PIPELINE_STAGES.forEach(function(st) {
                stageOpts += '<option value="' + st + '" ' + (c.stage === st ? 'selected' : '') + '>' + st.toUpperCase() + '</option>';
            });

            html += '<div class="p-5 hover:bg-slate-50/70 transition flex flex-col lg:flex-row justify-between gap-4">';
            html += '<div class="lg:w-1/3 space-y-1.5">';
            html += '<div class="flex flex-wrap items-center gap-2">';
            html += '<span class="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded text-[11px]">' + c.role + '</span>';
            html += '<span class="font-extrabold text-[11px] px-2.5 py-0.5 rounded ' + scoreClass + '"><i class="fa-solid fa-brain mr-1"></i>' + c.aiScore + '% AI Match</span>';
            html += '</div>';
            html += '<h4 class="font-extrabold text-slate-900 text-base">' + c.name + '</h4>';
            html += '<p class="text-xs text-slate-500"><i class="fa-solid fa-phone text-emerald-600 mr-1"></i>' + c.mobile + ' &bull; <i class="fa-solid fa-envelope text-indigo-500 mx-1"></i>' + c.email + '</p>';
            html += '</div>';

            html += '<div class="lg:w-1/3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-xs text-slate-600 space-y-1">';
            html += '<div><strong class="text-slate-400">Current:</strong> ' + (c.designation || 'N/A') + ' (' + (c.org || 'Independent') + ')</div>';
            html += '<div><strong class="text-slate-400">Experience:</strong> ' + (c.exp || 'N/A') + '</div>';
            html += '<div><strong class="text-slate-400">Skills:</strong> ' + c.skills + '</div>';
            if (c.interviewSchedule) {
                html += '<div class="text-indigo-700 font-bold pt-1"><i class="fa-solid fa-video mr-1"></i>Interview: ' + c.interviewSchedule.datetime.replace('T', ' ') + ' (' + c.interviewSchedule.platform + ')</div>';
            }
            html += '</div>';

            html += '<div class="lg:w-1/3 flex flex-col justify-between gap-2.5">';
            html += '<select onchange="window.AppActions.changeCandidateStage(\'' + c.id + '\', this.value)" class="w-full px-3.5 py-2 text-xs font-extrabold rounded-xl border cursor-pointer">';
            html += stageOpts + '</select>';
            html += '<div class="flex gap-2">';
            html += '<button onclick="window.AppActions.openScheduleModal(\'' + c.id + '\')" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"><i class="fa-solid fa-calendar-plus mr-1"></i>Schedule</button>';
            html += '<button onclick="window.AppActions.convertCandidateToEmployee(\'' + c.id + '\')" class="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"><i class="fa-solid fa-user-check mr-1"></i>Onboard</button>';
            html += '</div></div></div>';
        });

        html += '</div></div>';
    });

    container.innerHTML = html || '<div class="bg-white rounded-3xl border border-slate-200 p-10 text-center text-sm text-slate-500">No candidates match the current filter criteria.</div>';
}

export function submitCandidateApplication(formData) {
    const job = Store.data.jobs.find(function(j) { return j.title === formData.role; });
    const aiScore = calculateAIMatchScore(formData.skills, job ? job.skills : '');

    const newCand = {
        id: 'cand_' + Date.now(),
        name: formData.name,
        role: formData.role,
        mobile: formData.mobile,
        email: formData.email,
        designation: formData.designation,
        org: formData.org,
        exp: formData.exp,
        skills: formData.skills,
        aiScore,
        stage: 'screening',
        appliedDate: new Date().toISOString().split('T')[0],
        interviewSchedule: null
    };

    Store.data.candidates.unshift(newCand);
    Store.save();
    showToast('Application Received!', 'AI Match Score: ' + aiScore + '%. Added to Screening pipeline.');
}

export function postNewJobCircular(jobData) {
    Store.data.jobs.unshift(Object.assign({ id: 'job_' + Date.now() }, jobData));
    Store.save();
    renderCareerPortalJobs();
    renderATSPipeline();
    showToast('Job Circular Published', jobData.title + ' is now live on the Career Portal.');
}

export function exportATSReport() {
    let csv = "Candidate Name,Applied Role,AI Match Score,Stage,Mobile,Email,Experience,Skills\n";
    Store.data.candidates.forEach(function(c) {
        csv += '"' + c.name + '","' + c.role + '","' + c.aiScore + '%","' + c.stage.toUpperCase() + '","' + c.mobile + '","' + c.email + '","' + (c.exp || '') + '","' + c.skills + '"\n';
    });
    downloadCSV('TalentHub_BD_ATS_Report.csv', csv);
    showToast('Report Downloaded', 'ATS Pipeline CSV exported successfully.');
}