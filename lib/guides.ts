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
      { href: "/#pricing", label: "Resume makeover, included in Full Access" },
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
  {
    slug: "aptitude-test-preparation-for-placements",
    title: "Aptitude Test Preparation for Placements: Topics & 30-Day Plan (2026)",
    description:
      "What fresher aptitude tests actually cover — quant, logical reasoning and verbal — plus a simple 30-day plan, speed tricks and the mistakes that cost candidates the cut-off.",
    updated: "2026-11-27",
    readMins: 7,
    intro:
      "For most mass-hiring and off-campus drives, the online aptitude test is the first filter, and it removes far more candidates than the interview does. The good news: the syllabus is predictable and the questions repeat in pattern. With 45–60 minutes of focused practice a day, most freshers can clear the cut-off within a month.",
    sections: [
      {
        h: "What the aptitude round usually tests",
        p: [
          "Exact patterns differ by company, but almost every fresher test mixes the same three areas, often with a coding or technical section for tech roles. Always check the latest pattern for the company you are targeting before the test.",
        ],
        list: [
          "Quantitative aptitude: percentages, profit & loss, ratio, averages, time & work, time-speed-distance, simple & compound interest, permutations & combinations, probability, number system.",
          "Logical reasoning: series, coding-decoding, blood relations, seating arrangement, syllogisms, puzzles, data sufficiency, direction sense.",
          "Verbal ability: reading comprehension, sentence correction, fill in the blanks, para jumbles, synonyms and antonyms.",
          "Data interpretation: tables, bar and pie charts, with percentage and ratio calculations.",
        ],
      },
      {
        h: "A simple 30-day plan",
        list: [
          "Days 1–10: Quant basics. One topic a day: learn the formula, solve 20–30 easy questions, then 10 timed ones.",
          "Days 11–18: Logical reasoning. Puzzles and arrangements take the longest, so practise them daily.",
          "Days 19–23: Verbal and data interpretation. Read one editorial a day to speed up comprehension.",
          "Days 24–30: Full-length timed mock tests every day. Spend as much time reviewing mistakes as taking the test.",
        ],
      },
      {
        h: "Speed matters more than difficulty",
        p: [
          "Most candidates who fail the aptitude round could solve the questions — they just run out of time. Learn shortcuts for percentages and fractions, memorise squares up to 30 and cubes up to 15, and practise mental calculation.",
          "In the test, do a first pass answering only the questions you can solve in under a minute. Come back to the harder ones later. Never spend three minutes on one question.",
        ],
      },
      {
        h: "Mistakes that cost freshers the cut-off",
        list: [
          "Guessing blindly when the test has negative marking — check the rules first.",
          "Practising without a timer, then panicking in the real test.",
          "Ignoring verbal ability because it feels easy; it is often the deciding section.",
          "Skipping mock-test review. The same mistake pattern repeats until you fix it.",
          "Taking the test on a weak internet connection or an untested device for online drives.",
        ],
      },
      {
        h: "After you clear the test",
        p: [
          "Clearing the aptitude round usually leads to a technical and an HR interview. Keep your resume ready, revise the projects you have listed, and prepare a short self-introduction. Then keep applying to new drives every day so you are never waiting on a single company.",
        ],
      },
    ],
    faqs: [
      { q: "How many days are enough for aptitude preparation?", a: "About 30 days of daily practice (45–60 minutes) is enough for most fresher tests if you are consistent and take timed mocks in the last week." },
      { q: "Is aptitude asked for non-IT roles too?", a: "Yes. Most mass-hiring drives, banks, consulting and operations roles use an aptitude test as the first screening round." },
      { q: "Is there negative marking in aptitude tests?", a: "It depends on the company. Read the test instructions carefully: if there is negative marking, avoid blind guesses." },
    ],
    related: [
      { href: "/off-campus-jobs", label: "Off-campus jobs and drives" },
      { href: "/guides/fresher-interview-preparation", label: "Fresher interview preparation" },
      { href: "/guides/off-campus-placement-guide", label: "Off-campus placement guide" },
    ],
  },
  {
    slug: "how-to-identify-fake-job-offers",
    title: "How to Identify Fake Job Offers & Job Scams (Fresher Safety Guide)",
    description:
      "The warning signs of fake job offers and placement scams in India — registration fees, fake offer letters, WhatsApp-only recruiters — and how to verify any offer before you respond.",
    updated: "2026-11-27",
    readMins: 6,
    intro:
      "Freshers are the main target of job scams because they are eager, applying everywhere and often don't know how real hiring works. The single most important rule: a genuine employer never asks a candidate to pay money to get a job. Here is how to spot a fake offer and check any opportunity before you share documents or money.",
    sections: [
      {
        h: "Red flags of a fake job offer",
        list: [
          "They ask for money: a registration fee, training fee, security deposit, laptop charge or \"refundable\" amount.",
          "You get an offer without any test or interview, or after a short chat on WhatsApp or Telegram only.",
          "The salary is far above normal fresher pay for very little work, such as liking videos or rating products.",
          "The email comes from a free address (gmail.com, yahoo.com) instead of the company's own domain.",
          "The offer letter has spelling mistakes, a blurry logo or no proper company address.",
          "They pressure you to decide immediately or ask for OTPs, bank details or Aadhaar and PAN copies early.",
        ],
      },
      {
        h: "How to verify an offer in 10 minutes",
        list: [
          "Search the role on the company's official careers page. If it isn't there, be careful.",
          "Check the sender's email domain matches the company's real website.",
          "Find the recruiter on LinkedIn: real recruiters have a work history at that company.",
          "Search the company name with \"scam\" or \"fraud\" and read recent experiences.",
          "Call the company's official number (from its website, not the mail) and ask HR to confirm.",
        ],
      },
      {
        h: "Common scams freshers face",
        p: [
          "Task-based \"work from home\" scams pay a small amount first to build trust, then ask you to deposit money for bigger tasks. Fake placement agencies charge a fee and promise guaranteed jobs at big companies. Impersonation scams copy a real company's name and logo and send fake offer letters asking for a training or background-verification fee.",
        ],
      },
      {
        h: "What to do if you've been targeted",
        list: [
          "Stop responding and do not send any more money or documents.",
          "If you shared bank details or paid money, contact your bank immediately.",
          "Report cyber fraud on the national cybercrime portal (cybercrime.gov.in) or call the cybercrime helpline 1930.",
          "Report the fake profile or number on the platform where you found it.",
        ],
      },
      {
        h: "How FirstOffer keeps listings safe",
        p: [
          "Every listing on FirstOffer is checked before it goes live and links to the company's own application route: its careers page, Google Form or HR contact. If anyone asks you for money in the name of a job you found here, don't pay. Report it to support@firstoffer.online.",
        ],
      },
    ],
    faqs: [
      { q: "Do genuine companies charge freshers a fee for jobs?", a: "No. Genuine employers do not charge candidates for applications, interviews, training or offer letters. Any request for money is a major red flag." },
      { q: "Is a job offer on WhatsApp real?", a: "Some recruiters do use WhatsApp, but an offer made only over chat, with no proper interview or official email, is very often a scam. Always verify through the company's official website." },
      { q: "Where do I report a job scam in India?", a: "Report it on cybercrime.gov.in or call the cybercrime helpline 1930. If money was involved, also contact your bank immediately." },
    ],
    related: [
      { href: "/fresher-jobs", label: "Verified fresher jobs" },
      { href: "/guides/how-to-write-email-to-hr-for-job", label: "How to email HR for a job" },
      { href: "/companies", label: "Companies hiring now" },
    ],
  },
  {
    slug: "linkedin-profile-tips-for-freshers",
    title: "LinkedIn Profile Tips for Freshers: Get Noticed by Recruiters (2026)",
    description:
      "How freshers can set up a LinkedIn profile recruiters actually find: headline formulas, an About section template, projects, skills and a simple weekly routine.",
    updated: "2026-11-27",
    readMins: 6,
    intro:
      "Recruiters search LinkedIn every day for freshers with specific skills. If your profile has a vague headline and an empty About section, you simply don't show up. A few focused changes make your profile searchable and give HR a reason to message you, or to say yes to your referral request.",
    sections: [
      {
        h: "Write a headline recruiters search for",
        p: [
          "Your headline is the most important line on your profile because it appears in every search result. Skip \"Student at XYZ College\". Instead, state the role you want and your top skills.",
        ],
        list: [
          "Aspiring Data Analyst | SQL, Python, Power BI | 2026 Graduate",
          "Software Engineer (Fresher) | Java, Spring Boot, React | Open to Work",
          "B.Tech CSE '26 | Machine Learning, NLP | Building AI projects",
        ],
      },
      {
        h: "About section template",
        example:
          "I'm a [2026 B.Tech CSE graduate] focused on [target role].\n\nWhat I've built:\n• [Project 1] – [what it does + one result]\n• [Project 2] – [what it does + one result]\n\nSkills: [5–8 skills from job descriptions you want]\n\nI'm looking for [role] opportunities in [city/remote]. Reach me at [email].",
      },
      {
        h: "Sections that matter most for freshers",
        list: [
          "Profile photo: a clear, well-lit face photo. Profiles with photos get far more views.",
          "Experience: add internships, freelance work and serious college roles, each with 2–3 result-focused bullets.",
          "Projects: link GitHub or a live demo for every project.",
          "Skills: add the exact skills used in job descriptions (for example, \"SQL\", not \"databases\").",
          "Open to Work: turn it on, set the job titles and locations you want, and choose recruiters-only if you prefer.",
          "Custom URL: change it to linkedin.com/in/yourname and use it on your resume.",
        ],
      },
      {
        h: "A simple weekly routine",
        list: [
          "Connect with 10–15 people a week: recruiters, alumni and engineers at companies you like, with a short personal note.",
          "Post once a week about something you built or learned. Short posts with a screenshot work well.",
          "Comment thoughtfully on posts from people in your target field.",
          "Ask for a referral only after reading the job description, and share the Job ID and your resume.",
        ],
      },
      {
        h: "Mistakes to avoid",
        list: [
          "Copy-pasting your resume word for word into every section.",
          "Generic connection requests with no note, or asking strangers for a job in the first message.",
          "Listing 50 skills you can't back up in an interview.",
          "Leaving the profile untouched for months while applying everywhere.",
        ],
      },
    ],
    faqs: [
      { q: "Should freshers turn on Open to Work?", a: "Yes. It helps recruiters find you. You can choose to show it only to recruiters if you don't want the green photo frame." },
      { q: "How many skills should I add on LinkedIn?", a: "Add the 10–15 skills that match the roles you want and that you can talk about confidently in an interview." },
      { q: "Can LinkedIn help me get a referral?", a: "Yes. Connect with employees at the company, read the job description first, and send a short, specific message with the Job ID and your resume." },
    ],
    related: [
      { href: "/guides/how-to-get-job-referral", label: "How to get a job referral" },
      { href: "/guides/ats-friendly-resume-for-freshers", label: "ATS-friendly resume for freshers" },
      { href: "/fresher-jobs", label: "Fresher jobs hiring now" },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
