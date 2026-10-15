// Keyword landing pages: /jobs/<slug> (app/jobs/[slug]).
// Each page targets one search people actually type ("data analyst jobs for
// freshers", "2026 batch jobs", "IT jobs for freshers"...) and lists the
// live openings that match it. Copy is written per page (not templated) so
// Google doesn't treat the pages as duplicates. A page with no live jobs is
// noindexed automatically (see app/jobs/[slug]/page.tsx).
import type { ListOpportunitiesOptions } from "@/lib/data/opportunities";

export type KeywordPage = {
  slug: string;
  /** Short label for chips / footer links. */
  label: string;
  /** H1 and <title> (the year is added automatically). */
  heading: string;
  filter: ListOpportunitiesOptions;
  intro: string;
  faqs: { q: string; a: string }[];
};

export const KEYWORD_PAGES: KeywordPage[] = [
  {
    slug: "it-jobs-for-freshers",
    label: "IT Jobs",
    heading: "IT Jobs for Freshers",
    filter: { roleCategories: ["software", "qa", "data", "ai-ml"] },
    intro:
      "Entry-level IT jobs across software development, testing, data and AI — from product startups to IT services companies. Every opening links to the company's own careers page, Google Form or HR email.",
    faqs: [
      {
        q: "Which IT jobs can a fresher apply for?",
        a: "The most common entry-level IT roles are software engineer / developer, QA or test engineer, data analyst, technical support engineer and associate cloud or DevOps engineer. Most ask for one programming language, basic SQL and good fundamentals.",
      },
      {
        q: "Do I need a CS degree for an IT job?",
        a: "Not always. Many listings accept B.E./B.Tech in any branch, BCA, MCA or B.Sc graduates — check the eligibility and batch shown on each opening before you apply.",
      },
      {
        q: "How often are new IT openings added?",
        a: "New roles are added every day, and each listing stays live for 2 days so you only see fresh openings. Apply early — the first applicants usually get the most attention.",
      },
    ],
  },
  {
    slug: "software-engineer-jobs-for-freshers",
    label: "Software Engineer Jobs",
    heading: "Software Engineer Jobs for Freshers",
    filter: { roleCategory: "software" },
    intro:
      "SDE, software developer, full-stack, frontend, backend, mobile and DevOps roles open to freshers. Hand-checked listings with direct application links and the batches each company is hiring.",
    faqs: [
      {
        q: "What do companies test in fresher software engineer interviews?",
        a: "Usually an online coding test (arrays, strings, hashing, basic DP), followed by technical rounds on DSA, OOP, DBMS, OS basics and your projects. Practise explaining your approach out loud.",
      },
      {
        q: "What is the typical salary for a fresher software engineer?",
        a: "It varies widely by company — from around 3–4 LPA at many service companies to 10+ LPA at product companies. Each listing on FirstOffer shows the CTC when the company has shared it.",
      },
      {
        q: "Which skills should I list on my resume for SDE roles?",
        a: "One strong language (Java, Python, C++ or JavaScript), DSA, Git, SQL and 2–3 projects with real outcomes. Match the keywords in the job description you're applying to.",
      },
    ],
  },
  {
    slug: "data-analyst-jobs-for-freshers",
    label: "Data Analyst Jobs",
    heading: "Data Analyst Jobs for Freshers",
    filter: { roleCategories: ["data", "business-analyst"] },
    intro:
      "Entry-level data analyst, business analyst, MIS and BI roles for freshers. Most ask for SQL, Excel and one of Power BI, Tableau or Python — each listing shows the exact skills and batches required.",
    faqs: [
      {
        q: "What skills do I need for a fresher data analyst job?",
        a: "SQL (joins, GROUP BY, window functions), Excel (lookups, pivot tables), one BI tool such as Power BI or Tableau, and basic statistics. Python with pandas is a strong plus.",
      },
      {
        q: "Can non-CS graduates become data analysts?",
        a: "Yes. Many data and business analyst roles accept any graduate who can show SQL and Excel skills with a small project, such as a sales dashboard built on public data.",
      },
      {
        q: "What is asked in a data analyst interview?",
        a: "Typically SQL queries on a sample table, an Excel task, questions on mean vs median and outliers, and a case question like 'why did sales drop last month?'.",
      },
    ],
  },
  {
    slug: "ai-ml-jobs-for-freshers",
    label: "AI / ML Jobs",
    heading: "AI & Machine Learning Jobs for Freshers",
    filter: { roleCategory: "ai-ml" },
    intro:
      "AI, machine learning, data science, NLP, computer vision and GenAI roles open to freshers and interns. Listings are hand-checked and link to the company's own application route.",
    faqs: [
      {
        q: "Can a fresher get an AI/ML job in India?",
        a: "Yes — mostly as ML engineer trainee, data scientist intern, GenAI developer or AI engineer roles at startups. Strong Python, ML fundamentals and 1–2 end-to-end projects make the biggest difference.",
      },
      {
        q: "What should I learn for fresher AI/ML roles?",
        a: "Python, NumPy and pandas, scikit-learn, model evaluation (precision, recall, overfitting), plus one deep-learning framework. For GenAI roles add prompting, embeddings and RAG.",
      },
      {
        q: "Are AI internships paid?",
        a: "Most listings on FirstOffer show the stipend when the company shares it. Be careful of any 'internship' that asks you to pay a fee — genuine companies don't charge candidates.",
      },
    ],
  },
  {
    slug: "testing-jobs-for-freshers",
    label: "QA / Testing Jobs",
    heading: "Software Testing & QA Jobs for Freshers",
    filter: { roleCategory: "qa" },
    intro:
      "Manual testing, automation testing, QA engineer and SDET openings for freshers. A great entry point into IT — each listing shows the tools and batches the company is looking for.",
    faqs: [
      {
        q: "Is software testing a good career for freshers?",
        a: "Yes. QA roles are a common way into IT, and testers who learn automation (Selenium, Playwright, API testing) can grow into SDET and DevOps roles.",
      },
      {
        q: "What is asked in a fresher testing interview?",
        a: "SDLC vs STLC, types of testing, writing test cases for a login page, bug life cycle, and basic SQL. Automation roles add Java or Python and Selenium basics.",
      },
    ],
  },
  {
    slug: "ui-ux-design-jobs-for-freshers",
    label: "UI/UX Design Jobs",
    heading: "UI/UX Design Jobs for Freshers",
    filter: { roleCategory: "design" },
    intro:
      "Junior UI/UX designer, product designer and graphic design roles and internships for freshers. A strong portfolio matters more than your degree for most of these openings.",
    faqs: [
      {
        q: "Do I need a design degree for a UI/UX job?",
        a: "No. Most companies hire on portfolio — 2–3 case studies that show your process (problem, research, wireframes, final design) work better than many polished screens.",
      },
      {
        q: "Which tools should a fresher designer know?",
        a: "Figma is expected almost everywhere. Basic prototyping, design systems and an understanding of usability testing help you stand out.",
      },
    ],
  },
  {
    slug: "non-it-jobs-for-freshers",
    label: "Non-IT Jobs",
    heading: "Non-IT Jobs for Freshers",
    filter: { roleCategories: ["finance", "marketing-sales", "hr-ops", "product"] },
    intro:
      "Finance, research, marketing, sales, HR, operations and product roles for freshers — for graduates who want a career outside coding. Every listing is hand-checked and links to the company directly.",
    faqs: [
      {
        q: "Which non-IT jobs are good for freshers?",
        a: "Business development, digital marketing, financial and equity research analyst, HR and recruitment, operations and customer success roles all hire freshers regularly.",
      },
      {
        q: "Can engineering graduates apply for non-IT jobs?",
        a: "Yes. Many companies hire any graduate for analyst, operations and product roles. Check the eligibility on each listing.",
      },
    ],
  },
  {
    slug: "core-engineering-jobs-for-freshers",
    label: "Core Engineering Jobs",
    heading: "Core Engineering Jobs for Freshers",
    filter: { roleCategory: "core" },
    intro:
      "Electronics, embedded, VLSI, hardware, mechanical, electrical and civil roles for fresh engineering graduates — hand-checked openings with direct application links.",
    faqs: [
      {
        q: "Are there core jobs for ECE and EEE freshers?",
        a: "Yes — embedded systems, VLSI design and verification, firmware, IoT and hardware testing roles hire ECE/EEE freshers. Projects with microcontrollers or Verilog help a lot.",
      },
      {
        q: "Do core companies hire through off-campus drives?",
        a: "Many do, alongside graduate engineer trainee (GET) programmes. Keep an eye on the batch shown on each listing.",
      },
    ],
  },
  {
    slug: "internships-for-students",
    label: "Internships",
    heading: "Internships for Students & Freshers",
    filter: { type: "internship" },
    intro:
      "Paid and unpaid internships for college students and recent graduates — tech, data, design, marketing and more. Each listing shows the stipend (when shared), duration details and eligible batches.",
    faqs: [
      {
        q: "Can final-year students apply for these internships?",
        a: "Yes — many internships are aimed at final and pre-final year students. Check the batch on each listing to see who is eligible.",
      },
      {
        q: "Do internships lead to full-time offers?",
        a: "Often. Many startups and companies convert good interns into full-time employees (a pre-placement offer). Treat your internship like a long interview.",
      },
      {
        q: "Should I ever pay for an internship?",
        a: "No. Genuine companies don't charge candidates. Avoid any 'internship' that asks for a registration or training fee.",
      },
    ],
  },
  {
    slug: "2026-batch-jobs",
    label: "2026 Batch Jobs",
    heading: "Jobs for 2026 Batch Freshers",
    filter: { batch: "2026" },
    intro:
      "Live openings that are hiring the 2026 graduating batch — full-time roles, internships and off-campus drives. Listings are filtered by the batches each company has said it accepts.",
    faqs: [
      {
        q: "When do companies start hiring the 2026 batch?",
        a: "Off-campus hiring for a batch usually runs from the final year through the months after graduation. New 2026 batch openings are added here every day.",
      },
      {
        q: "Can I apply before I get my degree certificate?",
        a: "Usually yes — companies hiring a batch expect you to complete your degree on time. Some ask for no active backlogs; check each listing's eligibility.",
      },
    ],
  },
  {
    slug: "2025-batch-jobs",
    label: "2025 Batch Jobs",
    heading: "Jobs for 2025 Batch Freshers",
    filter: { batch: "2025" },
    intro:
      "Live openings that accept 2025 graduates — full-time roles, internships and off-campus drives from companies hiring recent graduates. Updated every day.",
    faqs: [
      {
        q: "Are companies still hiring 2025 batch freshers?",
        a: "Yes. Many companies hire across 2–3 recent batches. Each listing shows exactly which batches are eligible.",
      },
      {
        q: "I have a gap after graduating — can I still apply?",
        a: "Often yes. Use the gap to build projects or certifications and mention them clearly on your resume. Some companies state a maximum gap in their eligibility.",
      },
    ],
  },
  {
    slug: "2024-batch-jobs",
    label: "2024 Batch Jobs",
    heading: "Jobs for 2024 Batch Graduates",
    filter: { batch: "2024" },
    intro:
      "Openings that still accept 2024 graduates — entry-level roles for candidates with 0–2 years of experience or a gap after college. Updated daily.",
    faqs: [
      {
        q: "Do companies hire 2024 graduates as freshers?",
        a: "Many do, especially for roles open to 0–2 years of experience. Check the batch and experience requirement on each listing.",
      },
      {
        q: "How do I explain a gap year in interviews?",
        a: "Be honest and specific: what you learned, built or prepared during that time. A small project or certification makes the answer much stronger.",
      },
    ],
  },
];

export function getKeywordPage(slug: string): KeywordPage | undefined {
  return KEYWORD_PAGES.find((p) => p.slug === slug);
}
