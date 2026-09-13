// Curated keyword/skill dictionary for the Resume Keyword Matcher (Phase —
// see components/ResumeMatchTool.tsx and app/api/resume-match/route.ts).
//
// Deliberately NOT AI-based: matching is done by literal, explainable
// word-boundary search against the resume text and the job's own posted
// content. That's the whole point — the feature must never invent a skill
// or claim the user has experience they didn't write down, and a fixed
// dictionary + synonym list can't hallucinate the way a model prompt could.
//
// Each entry is one real-world skill/keyword. `aliases` are alternate
// spellings/names for the exact same skill (e.g. "JS" for "JavaScript") —
// finding an alias in text counts as finding the skill itself. `category`
// clusters skills that are genuinely comparable-but-different (e.g. SQL
// databases) so the matcher can surface "you have a related skill" instead
// of just "missing" when the resume has a close cousin of a JD requirement.
export type SkillEntry = {
  canonical: string;
  aliases: string[];
  category: string;
};

export const SKILL_DICTIONARY: SkillEntry[] = [
  // ── Programming languages ────────────────────────────────────────────
  { canonical: "JavaScript", aliases: ["JS", "Javascript"], category: "language" },
  { canonical: "TypeScript", aliases: ["TS"], category: "language" },
  { canonical: "Python", aliases: [], category: "language" },
  { canonical: "Java", aliases: [], category: "language" },
  { canonical: "C++", aliases: ["Cpp"], category: "language" },
  { canonical: "C#", aliases: ["C Sharp", "CSharp"], category: "language" },
  { canonical: "C", aliases: [], category: "language" },
  { canonical: "Go", aliases: ["Golang"], category: "language" },
  { canonical: "Rust", aliases: [], category: "language" },
  { canonical: "PHP", aliases: [], category: "language" },
  { canonical: "Ruby", aliases: [], category: "language" },
  { canonical: "Kotlin", aliases: [], category: "language" },
  { canonical: "Swift", aliases: [], category: "language" },
  { canonical: "R", aliases: ["R Programming"], category: "language" },
  { canonical: "MATLAB", aliases: [], category: "language" },
  { canonical: "Scala", aliases: [], category: "language" },
  { canonical: "Dart", aliases: [], category: "language" },
  { canonical: "SQL", aliases: ["Structured Query Language"], category: "language" },

  // ── Frontend ──────────────────────────────────────────────────────────
  { canonical: "React", aliases: ["React.js", "ReactJS"], category: "frontend-framework" },
  { canonical: "Angular", aliases: ["AngularJS"], category: "frontend-framework" },
  { canonical: "Vue", aliases: ["Vue.js", "VueJS"], category: "frontend-framework" },
  { canonical: "Svelte", aliases: [], category: "frontend-framework" },
  { canonical: "Next.js", aliases: ["NextJS", "Next JS"], category: "frontend-framework" },
  { canonical: "HTML", aliases: ["HTML5"], category: "frontend-core" },
  { canonical: "CSS", aliases: ["CSS3"], category: "frontend-core" },
  { canonical: "Tailwind CSS", aliases: ["Tailwind", "TailwindCSS"], category: "frontend-core" },
  { canonical: "Bootstrap", aliases: [], category: "frontend-core" },
  { canonical: "Redux", aliases: [], category: "frontend-core" },
  { canonical: "jQuery", aliases: [], category: "frontend-core" },

  // ── Backend / APIs ────────────────────────────────────────────────────
  { canonical: "Node.js", aliases: ["NodeJS", "Node JS", "Node"], category: "backend-framework" },
  { canonical: "Express.js", aliases: ["Express", "ExpressJS"], category: "backend-framework" },
  { canonical: "Django", aliases: [], category: "backend-framework" },
  { canonical: "Flask", aliases: [], category: "backend-framework" },
  { canonical: "FastAPI", aliases: [], category: "backend-framework" },
  { canonical: "Spring Boot", aliases: ["Spring", "SpringBoot"], category: "backend-framework" },
  { canonical: ".NET", aliases: ["ASP.NET", "DotNet"], category: "backend-framework" },
  { canonical: "Ruby on Rails", aliases: ["Rails"], category: "backend-framework" },
  { canonical: "REST API", aliases: ["REST APIs", "RESTful API", "RESTful Services", "RESTful"], category: "api-style" },
  { canonical: "GraphQL", aliases: [], category: "api-style" },
  { canonical: "Microservices", aliases: [], category: "architecture" },

  // ── Databases ─────────────────────────────────────────────────────────
  { canonical: "MySQL", aliases: [], category: "sql-database" },
  { canonical: "PostgreSQL", aliases: ["Postgres"], category: "sql-database" },
  { canonical: "SQLite", aliases: [], category: "sql-database" },
  { canonical: "Oracle Database", aliases: ["Oracle DB", "Oracle SQL"], category: "sql-database" },
  { canonical: "SQL Server", aliases: ["MS SQL Server", "MSSQL"], category: "sql-database" },
  { canonical: "MongoDB", aliases: ["Mongo"], category: "nosql-database" },
  { canonical: "Redis", aliases: [], category: "nosql-database" },
  { canonical: "Firebase", aliases: [], category: "nosql-database" },
  { canonical: "DynamoDB", aliases: [], category: "nosql-database" },
  { canonical: "Cassandra", aliases: [], category: "nosql-database" },

  // ── Cloud / DevOps ────────────────────────────────────────────────────
  { canonical: "AWS", aliases: ["Amazon Web Services"], category: "cloud-provider" },
  { canonical: "Azure", aliases: ["Microsoft Azure"], category: "cloud-provider" },
  { canonical: "Google Cloud Platform", aliases: ["GCP"], category: "cloud-provider" },
  { canonical: "Docker", aliases: [], category: "devops-tool" },
  { canonical: "Kubernetes", aliases: ["K8s"], category: "devops-tool" },
  { canonical: "CI/CD", aliases: ["Continuous Integration", "Continuous Deployment", "Continuous Delivery"], category: "devops-tool" },
  { canonical: "Jenkins", aliases: [], category: "devops-tool" },
  { canonical: "Terraform", aliases: [], category: "devops-tool" },
  { canonical: "Linux", aliases: [], category: "devops-tool" },
  { canonical: "Git", aliases: [], category: "version-control" },
  { canonical: "GitHub", aliases: [], category: "version-control" },
  { canonical: "GitLab", aliases: [], category: "version-control" },
  { canonical: "Bitbucket", aliases: [], category: "version-control" },

  // ── Data / ML ─────────────────────────────────────────────────────────
  { canonical: "Machine Learning", aliases: ["ML"], category: "data-ml" },
  { canonical: "Deep Learning", aliases: ["DL"], category: "data-ml" },
  { canonical: "Artificial Intelligence", aliases: ["AI"], category: "data-ml" },
  { canonical: "Natural Language Processing", aliases: ["NLP"], category: "data-ml" },
  { canonical: "Computer Vision", aliases: ["CV"], category: "data-ml" },
  { canonical: "Data Science", aliases: [], category: "data-ml" },
  { canonical: "Data Analysis", aliases: ["Data Analytics"], category: "data-ml" },
  { canonical: "Pandas", aliases: [], category: "data-tool" },
  { canonical: "NumPy", aliases: [], category: "data-tool" },
  { canonical: "TensorFlow", aliases: [], category: "data-tool" },
  { canonical: "PyTorch", aliases: [], category: "data-tool" },
  { canonical: "Scikit-learn", aliases: ["Sklearn"], category: "data-tool" },
  { canonical: "Power BI", aliases: ["PowerBI"], category: "data-tool" },
  { canonical: "Tableau", aliases: [], category: "data-tool" },
  { canonical: "Excel", aliases: ["MS Excel", "Microsoft Excel"], category: "data-tool" },

  // ── Mobile ────────────────────────────────────────────────────────────
  { canonical: "Android Development", aliases: ["Android"], category: "mobile" },
  { canonical: "iOS Development", aliases: ["iOS"], category: "mobile" },
  { canonical: "React Native", aliases: [], category: "mobile" },
  { canonical: "Flutter", aliases: [], category: "mobile" },

  // ── Testing / QA ──────────────────────────────────────────────────────
  { canonical: "Unit Testing", aliases: [], category: "testing" },
  { canonical: "Selenium", aliases: [], category: "testing-tool" },
  { canonical: "Cypress", aliases: [], category: "testing-tool" },
  { canonical: "Jest", aliases: [], category: "testing-tool" },
  { canonical: "JUnit", aliases: [], category: "testing-tool" },
  { canonical: "Postman", aliases: [], category: "testing-tool" },
  { canonical: "Quality Assurance", aliases: ["QA"], category: "testing" },
  { canonical: "Automation Testing", aliases: [], category: "testing" },

  // ── CS fundamentals ───────────────────────────────────────────────────
  { canonical: "Data Structures and Algorithms", aliases: ["DSA", "Data Structures", "Algorithms"], category: "cs-fundamentals" },
  { canonical: "Object-Oriented Programming", aliases: ["OOP", "OOPs"], category: "cs-fundamentals" },
  { canonical: "Database Management System", aliases: ["DBMS"], category: "cs-fundamentals" },
  { canonical: "Operating Systems", aliases: ["OS"], category: "cs-fundamentals" },
  { canonical: "Computer Networks", aliases: ["Networking"], category: "cs-fundamentals" },
  { canonical: "System Design", aliases: [], category: "cs-fundamentals" },
  { canonical: "Application Programming Interface", aliases: ["API"], category: "cs-fundamentals" },
  { canonical: "User Interface", aliases: ["UI"], category: "design" },
  { canonical: "User Experience", aliases: ["UX"], category: "design" },
  { canonical: "Figma", aliases: [], category: "design-tool" },

  // ── Process / soft skills ─────────────────────────────────────────────
  { canonical: "Agile", aliases: ["Agile Methodology"], category: "process" },
  { canonical: "Scrum", aliases: [], category: "process" },
  { canonical: "Project Management", aliases: [], category: "process" },
  { canonical: "Communication", aliases: ["Communication Skills"], category: "soft-skill" },
  { canonical: "Teamwork", aliases: ["Team Collaboration"], category: "soft-skill" },
  { canonical: "Problem Solving", aliases: ["Problem-Solving"], category: "soft-skill" },
  { canonical: "Leadership", aliases: [], category: "soft-skill" },
  { canonical: "Time Management", aliases: [], category: "soft-skill" },
  { canonical: "Analytical Skills", aliases: ["Analytical Thinking"], category: "soft-skill" },
  { canonical: "Critical Thinking", aliases: [], category: "soft-skill" },
];

/**
 * Categories where finding a *different* member of the same cluster in the
 * resume is worth surfacing as "🔄 related/alternative" instead of a flat
 * "⚠️ missing" — e.g. the JD wants PostgreSQL and the resume has MySQL.
 * Left out for narrow single-purpose categories (soft skills, process)
 * where a "related" suggestion wouldn't mean much.
 */
export const RELATED_CATEGORIES = new Set([
  "frontend-framework",
  "backend-framework",
  "sql-database",
  "nosql-database",
  "cloud-provider",
  "language",
  "testing-tool",
  "data-tool",
  "mobile",
  "version-control",
]);
