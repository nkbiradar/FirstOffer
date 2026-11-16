// Original, long-form career guides for freshers (app/guides). These are the
// site's evergreen content: they answer what freshers actually search for and
// link into the live job pages. Keep them genuinely useful and up to date —
// update `updated` whenever a guide is edited.
export type GuideSection = {
  h: string;
  p?: string[];
  list?: string[];
  example?: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  updated: string; // yyyy-mm-dd
  readMins: number;
  intro: string;
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  related: { href: string; label: string }[];
};

export const GUIDES: Guide[] = [
  {
    slug: "how-to-write-email-to-hr-for-job",
    title: "How to Write an Email to HR for a Job (Fresher Templates 2026)",
    description:
      "A simple, proven format for emailing HR as a fresher — subject lines, a ready-to-copy template, a real example, and the mistakes that get your mail ignored.",
    updated: "2026-11-17",
    readMins: 6,
    intro:
      "Most fresher emails to HR never get a reply — not because the candidate is weak, but because the mail is long, vague, or missing the one detail HR needs. HRs read dozens of mails a day, usually on their phones. A short, specific mail that makes their job easy is the one that gets answered. Here is the exact format we recommend.",
    sections: [
      {
        h: "Step 1: Write a subject line HR can act on",
        p: [
          "The subject line decides whether your mail is opened. It should tell HR the role and who you are in one glance. If the job post asks for a specific subject line, always use that exact text — many HRs filter their inbox by it.",
        ],
        list: [
          "Application for [Role] – [Your Name]",
          "Application for Data Analyst (Fresher) – Rohan Sharma",
          "Referral request – Software Engineer at [Company] | Job ID: [ID] | [Your Name]",
        ],
      },
      {
        h: "Step 2: Keep the body under 150 words",
        p: [
          "Open with one line on who you are (degree, college, graduation year) and which role you are applying for. Then give a quick snapshot of why you fit — two or three points, not a paragraph. End with a polite request and your contact details.",
          "Do not paste your whole resume into the mail. The mail's only job is to make HR open your resume.",
        ],
      },
      {
        h: "Ready-to-copy template",
        example:
          "Subject: Application for [Role] – [Your Name]\n\nHi [HR's Name],\n\nI'm [Your Name], a [2026 B.Tech CSE graduate] from [College], and I'd like to apply for the [Role] opening at [Company].\n\nA quick snapshot:\n• Skills: [3–4 skills that match the job]\n• Experience: [internship or project with one clear result]\n• Why this role: [one line]\n\nI've attached my resume. I'd be grateful if you could consider my profile.\n\nThank you,\n[Your Name]\n[Phone] | [Email]\nLinkedIn: [link] | GitHub/Portfolio: [link]",
      },
      {
        h: "What to attach (and how to name it)",
        list: [
          "A one-page PDF resume — never a Word file or a photo.",
          "Name the file properly: YourName_Role_Resume.pdf (for example, RohanSharma_DataAnalyst_Resume.pdf).",
          "Add your LinkedIn and GitHub or portfolio links in the signature — recruiters check them.",
        ],
      },
      {
        h: "Mistakes that get your mail ignored",
        list: [
          "Sending the same generic mail to every company with \"Dear Sir/Madam\" and no role mentioned.",
          "Long paragraphs about your passion — HR wants facts: skills, projects, availability.",
          "No subject line, or a subject like \"Job\" or \"Resume\".",
          "Applying days late. Fresher openings often get hundreds of applications within hours — apply within 1–2 hours of a role being posted whenever you can.",
          "Following up every day. Send one polite follow-up after 4–5 days, then move on.",
        ],
      },
      {
        h: "How many HRs should you mail?",
        p: [
          "Treat it like a daily habit, not a one-time effort. Mailing 5–10 relevant openings a day, consistently for a couple of weeks, works far better than mailing 100 companies in one night with a generic message. Quality and speed beat volume.",
        ],
      },
    ],
    faqs: [
      { q: "Should I write the email body or attach a cover letter?", a: "For freshers, a short email body is enough. A separate cover letter is only needed if the job post asks for one." },
      { q: "Is it okay to email HR without a job opening?", a: "Yes, but your chances are much higher when you mail for a specific, recent opening and mention the exact role." },
      { q: "What if I don't know the HR's name?", a: "Use \"Hi Hiring Team,\" — it is polite and better than \"Dear Sir/Madam\"." },
    ],
    related: [
      { href: "/fresher-jobs", label: "Live fresher jobs with direct HR emails" },
      { href: "/guides/how-to-get-job-referral", label: "How to get a job referral as a fresher" },
      { href: "/guides/ats-friendly-resume-for-freshers", label: "ATS-friendly resume for freshers" },
    ],
  },
  {
    slug: "how-to-get-job-referral",
    title: "How to Get a Job Referral as a Fresher (Step-by-Step Guide)",
    description:
      "Referrals get your resume seen first. Learn how to find the right person, what to send them, a referral message template, and the one detail most freshers forget.",
    updated: "2026-11-17",
    readMins: 6,
    intro:
      "A referral moves your resume from a pile of thousands to the top of a recruiter's list. Most big companies — Accenture, IBM, Deloitte, Capgemini and many product startups — actively encourage employees to refer candidates. As a fresher you may not know anyone there yet, but you can still ask for referrals the right way.",
    sections: [
      {
        h: "Step 1: Find the exact job and note the Job ID",
        p: [
          "Go to the company's official careers page and find a role that genuinely matches your skills, degree and batch. Note the Job Title and the Job ID. An employee can only refer you to a specific opening — a request without a Job ID is the most common reason referrals never happen.",
        ],
      },
      {
        h: "Step 2: Check you actually fit the role",
        p: [
          "Read the job description carefully. Employees refer people they are comfortable vouching for, and many companies track how their referrals perform. If your skills don't match, ask for a different role instead of forcing it.",
        ],
      },
      {
        h: "Step 3: Find an employee or HR to ask",
        list: [
          "LinkedIn: search \"[Company] software engineer\" or \"[Company] HR\" and filter by your college or city — alumni are far more likely to help.",
          "Referral posts: many employees publicly post \"DM me for referrals\" — respond to those first.",
          "Connect with a short note before asking. A cold referral request from a stranger with no context rarely works.",
        ],
      },
      {
        h: "Step 4: Send a short, complete request",
        example:
          "Hi [Name],\n\nI'm [Your Name], a [2026 B.Tech CSE graduate] from [College]. I'm applying for the [Role] position at [Company] (Job ID: [ID]) and my profile matches it well — [one line on your key skill or project].\n\nWould you be open to referring me? I've attached my resume, and my details are below so it takes you only a minute:\n• Email: [email]\n• Phone: [phone]\n• Job link: [link]\n\nThank you for your time!\n[Your Name]",
      },
      {
        h: "Step 5: The employee submits your referral",
        p: [
          "They submit your profile through the company's internal referral portal. You will usually get an email from the company asking you to complete your application — do it the same day. If your profile matches, the recruiter contacts you for screening, an assessment, or interview rounds.",
        ],
      },
      {
        h: "Referral mistakes to avoid",
        list: [
          "No Job ID — always send the Job ID and the job link.",
          "Asking for \"any role\" — it puts the effort on the employee.",
          "Sending only \"Hi\" or \"Can you refer me?\" with no resume.",
          "Spamming many employees at the same company for the same role.",
          "Forgetting to thank them, even if the referral doesn't work out.",
        ],
      },
    ],
    faqs: [
      { q: "Does a referral guarantee an interview?", a: "No. A referral makes sure your resume is seen; you still need a profile that matches the role." },
      { q: "How long does a referral take?", a: "Usually a few days to two weeks, depending on the company's hiring speed." },
      { q: "Can I ask for referrals for multiple roles at one company?", a: "Pick the one or two roles that fit you best. Asking for many roles at once looks unfocused." },
    ],
    related: [
      { href: "/internal-openings", label: "Company-wise referral openings on FirstOffer" },
      { href: "/guides/how-to-write-email-to-hr-for-job", label: "How to write an email to HR" },
      { href: "/off-campus-jobs", label: "Off-campus jobs and hiring drives" },
    ],
  },
  {
    slug: "off-campus-placement-guide",
    title: "Off-Campus Placement Guide for Freshers (2026): How to Get Hired Without Campus Placements",
    description:
      "No campus placement? This guide covers where to find off-campus jobs, how to apply so HRs reply, a daily routine that works, and how to prepare for the rounds.",
    updated: "2026-11-17",
    readMins: 7,
    intro:
      "Most freshers in India don't get placed through their college. If your campus had few companies, or you graduated without an offer, off-campus hiring is how you get your first job — and thousands of freshers do it every year. It needs a system, not luck.",
    sections: [
      {
        h: "Where off-campus jobs actually come from",
        list: [
          "Company careers pages — the original source for every opening; set job alerts on the companies you like.",
          "Off-campus hiring drives — mass hiring programmes run by large IT services companies for specific batches.",
          "HR and employee posts on LinkedIn — many roles are shared there before they appear anywhere else.",
          "Referrals — the fastest way to get your resume read at bigger companies.",
          "Curated job platforms like FirstOffer that collect fresh openings with the direct apply link or HR email.",
        ],
      },
      {
        h: "Apply fast — speed matters more than you think",
        p: [
          "Popular fresher roles receive hundreds of applications within hours, and many HRs shortlist from the earliest ones. Apply within 1–2 hours of a role being posted whenever you can. This single habit improves response rates more than anything else.",
        ],
      },
      {
        h: "A daily routine that works",
        list: [
          "Morning (30 min): check new openings and apply to every role that genuinely matches you.",
          "Afternoon (30 min): send 2–3 referral requests for roles at bigger companies.",
          "Evening (1–2 hours): practise for interviews — DSA, SQL, aptitude, or your domain.",
          "Weekly: improve one thing on your resume or add to one project.",
        ],
      },
      {
        h: "Make your resume pass the first filter",
        p: [
          "Most companies run resumes through an Applicant Tracking System (ATS) before a person reads them. Use a clean one-page, single-column format, match keywords from the job description, and put your strongest project near the top.",
        ],
      },
      {
        h: "Prepare for the usual rounds",
        list: [
          "Online assessment: aptitude, logical reasoning, and basic coding or SQL.",
          "Technical interview: your projects, core CS subjects (DBMS, OOP, OS, networks) and problem solving.",
          "HR round: why this company, relocation, notice period, and salary expectations.",
        ],
      },
      {
        h: "Stay consistent for 2–3 weeks",
        p: [
          "Off-campus results come from consistency. Students who apply fast, follow up politely and keep improving their resume usually start getting calls within a couple of weeks. Track every application so you know what is working.",
        ],
      },
    ],
    faqs: [
      { q: "Is off-campus hiring only for IT jobs?", a: "No. Analytics, finance, operations, sales, design and many non-IT roles also hire freshers off campus." },
      { q: "Can I apply off-campus with a backlog?", a: "Some companies allow active backlogs and some don't — always check the eligibility section of the job post." },
      { q: "How many applications should I send?", a: "Focus on relevant roles. 5–10 well-targeted applications a day, every day, works better than mass-applying." },
    ],
    related: [
      { href: "/off-campus-jobs", label: "Live off-campus jobs and drives" },
      { href: "/jobs/2026-batch-jobs", label: "Jobs for the 2026 batch" },
      { href: "/guides/ats-friendly-resume-for-freshers", label: "Make your resume ATS-friendly" },
    ],
  },
  {
    slug: "ats-friendly-resume-for-freshers",
    title: "ATS-Friendly Resume for Freshers: Format, Sections & Common Mistakes",
    description:
      "Why fresher resumes get rejected by ATS software, the exact one-page format that works, how to write strong project bullets, and a checklist before you apply.",
    updated: "2026-11-17",
    readMins: 6,
    intro:
      "If you're applying everywhere and getting no calls, your resume may never be reaching a human. Most companies use an Applicant Tracking System (ATS) to filter resumes first. A messy layout or missing keywords can get you rejected in seconds — even when you're a good fit.",
    sections: [
      {
        h: "What an ATS looks for",
        list: [
          "Readable text — no tables, text boxes, icons or images that hide your content.",
          "Keywords from the job description, such as specific skills, tools and job titles.",
          "Standard section headings: Summary, Education, Experience, Projects, Skills.",
          "A simple file: a one-page PDF exported from a document, not a scanned image.",
        ],
      },
      {
        h: "The one-page format that works for freshers",
        list: [
          "Header: name, city, phone, email, LinkedIn, GitHub or portfolio.",
          "Summary (2–3 lines): who you are, your best work, your key skills.",
          "Education: degree, college, year, CGPA or percentage.",
          "Experience: internships and part-time work, newest first.",
          "Projects: 2–3 strong projects with links.",
          "Skills: grouped — languages, tools, frameworks, core subjects.",
          "Achievements and certifications: only the relevant ones.",
        ],
      },
      {
        h: "Write project bullets that show results",
        p: [
          "Recruiters want to know what you built and what changed because of it. Start each bullet with an action verb, mention the tool, and add a real number where you have one.",
        ],
        example:
          "Weak: Made a sales dashboard in Power BI.\nStrong: Built a Power BI dashboard tracking sales across 4 regions and 120+ products, with KPI cards for revenue, margin and top sellers.",
      },
      {
        h: "Common resume mistakes",
        list: [
          "Two-column designs and fancy templates that ATS software can't read.",
          "A long \"objective\" paragraph about passion instead of skills.",
          "Listing skills you can't explain in an interview.",
          "No links to projects — add GitHub or a live demo.",
          "Spelling mistakes and inconsistent dates.",
          "Using the same resume for every role — tweak keywords for each application.",
        ],
      },
      {
        h: "Checklist before you hit apply",
        list: [
          "One page, single column, PDF.",
          "File named YourName_Role_Resume.pdf.",
          "Keywords from this job description included naturally.",
          "Every link works and opens without login.",
          "Phone and email are correct.",
        ],
      },
    ],
    faqs: [
      { q: "Should a fresher resume be one page?", a: "Yes. One focused page is ideal for freshers and is what most recruiters expect." },
      { q: "Should I add a photo?", a: "No, not for most Indian private-sector applications. It adds nothing and can confuse ATS software." },
      { q: "Is CGPA important?", a: "Mention it if it's 7 or above, or if the job post asks for it. Many companies have cut-offs." },
    ],
    related: [
      { href: "/resume", label: "Free ATS resume template + resume review" },
      { href: "/resume-match", label: "Check your resume against a job's keywords" },
      { href: "/guides/how-to-write-email-to-hr-for-job", label: "How to write an email to HR" },
    ],
  },
  {
    slug: "fresher-interview-preparation",
    title: "How to Prepare for Your First Tech Interview as a Fresher",
    description:
      "A practical preparation plan for fresher interviews — what each round tests, the topics to revise, how to talk about your projects, and common HR questions.",
    updated: "2026-11-17",
    readMins: 6,
    intro:
      "Getting the interview call is half the job. The other half is showing up prepared. Fresher interviews follow a predictable pattern, so you can prepare for them in a focused way instead of trying to study everything.",
    sections: [
      {
        h: "Know the rounds",
        list: [
          "Online assessment: aptitude, logical reasoning, verbal ability, and 1–3 coding or SQL questions.",
          "Technical round 1: data structures and problem solving, plus questions on your resume.",
          "Technical round 2 (some companies): core subjects, system basics, or a deeper look at a project.",
          "HR round: communication, motivation, and practical details like relocation and joining date.",
        ],
      },
      {
        h: "What to revise for the technical rounds",
        list: [
          "DSA basics: arrays, strings, hashing, two pointers, sorting, recursion, linked lists, stacks and queues.",
          "One language deeply — usually Java, Python or C++ — including OOP concepts.",
          "DBMS and SQL: joins, group by, normalisation, indexes, and writing queries by hand.",
          "Operating systems and networks: processes vs threads, deadlocks, HTTP, TCP vs UDP.",
          "For data roles: SQL, Excel or Power BI, statistics basics, and Python with Pandas.",
        ],
      },
      {
        h: "Explain your projects like an engineer",
        p: [
          "Interviewers spend a lot of time on your projects. For each one, be ready to explain: the problem, why you chose your tech stack, one hard bug you fixed, and what you would improve. If a project is on your resume, you should be able to talk about it for five minutes.",
        ],
      },
      {
        h: "Common HR questions",
        list: [
          "Tell me about yourself — 60–90 seconds: education, key skills, one project, why this role.",
          "Why do you want to join our company?",
          "Where do you see yourself in 3 years?",
          "Are you open to relocation and shifts?",
          "Do you have any questions for us? — always ask one, such as what the first months in the role look like.",
        ],
      },
      {
        h: "A one-week plan before the interview",
        list: [
          "Days 1–3: revise DSA patterns and solve 3–4 problems a day.",
          "Day 4: core subjects and SQL.",
          "Day 5: practise explaining your projects out loud.",
          "Day 6: a mock interview with a friend, plus HR answers.",
          "Day 7: read about the company, rest, and prepare your setup if it's online.",
        ],
      },
    ],
    faqs: [
      { q: "How many coding problems should I practise?", a: "Focus on patterns rather than numbers. Around 100–150 well-understood problems covering the main patterns is enough for most fresher roles." },
      { q: "What if I don't know an answer?", a: "Say so honestly, explain how you would approach it, and think out loud. Interviewers value the approach." },
      { q: "Do I need to prepare system design?", a: "Usually not in depth for fresher roles — basic concepts like how a web request works are enough." },
    ],
    related: [
      { href: "/internal-openings", label: "Interview question kits (Internal HR)" },
      { href: "/tech-jobs", label: "Tech jobs for freshers" },
      { href: "/guides/off-campus-placement-guide", label: "Off-campus placement guide" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
