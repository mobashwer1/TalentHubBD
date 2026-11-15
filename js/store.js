// Centralized Data Store with LocalStorage Persistence & Firebase-compatible Schema
const STORAGE_KEY = 'talenthub_bd_hrms_v1';

const defaultData = {
    tenant: {
        name: "TalentHub BD Enterprise HQ",
        email: "hr@talenthubbd.com"
    },
    jobs: [
        {
            id: "job_101",
            title: "Senior Full Stack Architect",
            dept: "Engineering",
            type: "Full-Time",
            location: "Dhaka / Remote",
            salaryRange: "৳120,000 - ৳160,000",
            skills: "React, Node.js, TypeScript, Firebase, Tailwind CSS, AWS",
            desc: "Lead architecture and scaling of enterprise cloud platforms and high-throughput microservices."
        },
        {
            id: "job_102",
            title: "HR Business Partner & Talent Lead",
            dept: "Human Resources",
            type: "Full-Time",
            location: "Gulshan, Dhaka",
            salaryRange: "৳80,000 - ৳110,000",
            skills: "Recruitment, Onboarding, Payroll, Performance Appraisal, Labor Law",
            desc: "Drive end-to-end employee lifecycle programs, compliance, and talent acquisition pipelines."
        },
        {
            id: "job_103",
            title: "Lead UI/UX Product Designer",
            dept: "Design",
            type: "Hybrid",
            location: "Banani, Dhaka",
            salaryRange: "৳75,000 - ৳95,000",
            skills: "Figma, Design Systems, Prototyping, User Research, Tailwind",
            desc: "Craft intuitive enterprise SaaS interfaces and accessible design systems."
        }
    ],
    candidates: [
        {
            id: "cand_1",
            name: "Md Mobashwer Ali",
            role: "Senior Full Stack Architect",
            mobile: "+8801711000001",
            email: "mobashwer@talenthubbd.com",
            designation: "Senior Web Developer",
            org: "Digital Solutions BD",
            exp: "5 Years",
            skills: "React, Node.js, TypeScript, Tailwind CSS, Firebase",
            aiScore: 95,
            stage: "shortlisted",
            appliedDate: "2026-11-10",
            interviewSchedule: null
        },
        {
            id: "cand_2",
            name: "Sadia Afrin",
            role: "HR Business Partner & Talent Lead",
            mobile: "+8801811000002",
            email: "sadia.hr@example.com",
            designation: "HR Executive",
            org: "Apex Holdings",
            exp: "4 Years",
            skills: "Recruitment, Onboarding, Payroll, Labor Law",
            aiScore: 89,
            stage: "call for interview",
            appliedDate: "2026-11-12",
            interviewSchedule: {
                datetime: "2026-11-18T11:00",
                platform: "Google Meet",
                notes: "Panel interview with HR Director"
            }
        }
    ],
    employees: [
        {
            id: "EMP-1001",
            name: "Rafiqul Islam",
            designation: "Lead DevOps Engineer",
            dept: "Engineering",
            mobile: "+8801911223344",
            email: "rafiq@talenthubbd.com",
            joinDate: "2024-03-15",
            status: "Active",
            basicSalary: 90000,
            allowance: 20000,
            tax: 4500,
            onboardingProgress: 100,
            checklist: { docs: true, account: true, asset: true, orientation: true },
            kpiScore: 4.8,
            kpiGoal: "Maintain 99.98% cloud uptime & automate CI/CD pipelines",
            lastReview: "Q3 2026"
        },
        {
            id: "EMP-1002",
            name: "Nusrat Jahan",
            designation: "Senior Finance & Payroll Officer",
            dept: "Finance",
            mobile: "+8801611223344",
            email: "nusrat@talenthubbd.com",
            joinDate: "2025-01-10",
            status: "Active",
            basicSalary: 70000,
            allowance: 15000,
            tax: 3000,
            onboardingProgress: 100,
            checklist: { docs: true, account: true, asset: true, orientation: true },
            kpiScore: 4.6,
            kpiGoal: "100% on-time monthly payroll & tax compliance audit",
            lastReview: "Q3 2026"
        },
        {
            id: "EMP-1003",
            name: "Tanvir Hasan",
            designation: "Frontend Software Engineer",
            dept: "Engineering",
            mobile: "+8801511223344",
            email: "tanvir@talenthubbd.com",
            joinDate: "2026-11-01",
            status: "Onboarding",
            basicSalary: 60000,
            allowance: 12000,
            tax: 2000,
            onboardingProgress: 50,
            checklist: { docs: true, account: true, asset: false, orientation: false },
            kpiScore: 4.0,
            kpiGoal: "Complete UI component library migration",
            lastReview: "Probation"
        }
    ],
    attendance: [
        { id: "att_1", empId: "EMP-1001", empName: "Rafiqul Islam", date: "2026-11-15", checkIn: "09:02 AM", checkOut: "06:10 PM", status: "Present" },
        { id: "att_2", empId: "EMP-1002", empName: "Nusrat Jahan", date: "2026-11-15", checkIn: "08:55 AM", checkOut: "06:00 PM", status: "Present" },
        { id: "att_3", empId: "EMP-1003", empName: "Tanvir Hasan", date: "2026-11-15", checkIn: "09:20 AM", checkOut: "Working", status: "Late" }
    ],
    leaves: [
        { id: "lv_1", empId: "EMP-1002", empName: "Nusrat Jahan", type: "Annual Leave", from: "2026-11-22", to: "2026-11-24", days: 3, reason: "Family event in Sylhet", status: "Pending" },
        { id: "lv_2", empId: "EMP-1001", empName: "Rafiqul Islam", type: "Sick Leave", from: "2026-10-12", to: "2026-10-13", days: 2, reason: "Seasonal fever", status: "Approved" }
    ],
    separations: [
        { id: "sep_1", empId: "EMP-0998", empName: "Kamrul Ahsan", dept: "Marketing", resignDate: "2026-11-01", lastWorkingDay: "2026-11-30", reason: "Relocating abroad for higher studies", exitInterview: "Completed", fnfAmount: 94500, status: "Notice Period" }
    ]
};

export const Store = {
    data: null,

    init() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                this.data = JSON.parse(saved);
            } catch (e) {
                this.data = structuredClone(defaultData);
            }
        } else {
            this.data = structuredClone(defaultData);
            this.save();
        }
        return this.data;
    },

    save() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    resetDemo() {
        this.data = structuredClone(defaultData);
        this.save();
    }
};