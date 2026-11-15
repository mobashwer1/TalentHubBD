// Helper utilities for TalentHub BD

export function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast-box');
    const titleEl = document.getElementById('toast-title');
    const descEl = document.getElementById('toast-desc');
    const iconEl = document.getElementById('toast-icon');

    if (!toast) return;

    titleEl.textContent = title;
    descEl.textContent = message;

    if (type === 'error') {
        iconEl.className = 'fa-solid fa-circle-exclamation text-rose-400 text-xl';
    } else if (type === 'info') {
        iconEl.className = 'fa-solid fa-circle-info text-indigo-400 text-xl';
    } else {
        iconEl.className = 'fa-solid fa-circle-check text-emerald-400 text-xl';
    }

    toast.classList.remove('hidden');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(() => {
        toast.classList.add('hidden');
    }, 3800);
}

export function calculateAIMatchScore(candidateSkillsStr, targetSkillsStr) {
    if (!candidateSkillsStr) return 55;
    const candSkills = candidateSkillsStr.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
    const targetSkills = (targetSkillsStr || '').toLowerCase().split(/[\s,]+/).map(s => s.trim()).filter(s => s.length > 2);

    if (targetSkills.length === 0) return Math.min(94, 65 + candSkills.length * 5);

    let matches = 0;
    candSkills.forEach(cs => {
        if (targetSkills.some(ts => ts.includes(cs) || cs.includes(ts))) {
            matches++;
        }
    });

    return Math.min(98, Math.max(54, 52 + (matches * 13) + (candSkills.length * 2)));
}

export function formatBDT(amount) {
    return '৳' + Number(amount || 0).toLocaleString('en-BD');
}

export function downloadCSV(filename, csvContent) {
    const blob = new Blob(["﻿" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}