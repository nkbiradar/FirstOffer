// City landing pages: /fresher-jobs/<slug> (app/fresher-jobs/[city]).
// Each one targets "fresher jobs in <city>" searches and lists the live
// openings whose location matches any of `terms`. Copy is written per city
// (not templated) so Google doesn't treat the pages as duplicates.

export type CityPage = {
  slug: string;
  name: string;
  /** Location strings to match (ILIKE), e.g. both spellings of a city. */
  terms: string[];
  /** Remote page filters by work mode instead of location. */
  remote?: boolean;
  intro: string;
  faqs: { q: string; a: string }[];
};

export const CITY_PAGES: CityPage[] = [
  {
    slug: "bangalore",
    name: "Bangalore",
    terms: ["Bangalore", "Bengaluru"],
    intro:
      "Bengaluru is India's biggest tech hiring hub — product startups, SaaS companies and global capability centres hire freshers here all year round, especially for software, data and QA roles.",
    faqs: [
      {
        q: "Which roles do companies in Bangalore hire freshers for?",
        a: "Mostly software development (frontend, backend, full-stack), QA/testing, data analyst, DevOps and support engineering roles, plus internships at early-stage startups.",
      },
      {
        q: "Are Bangalore fresher jobs on FirstOffer verified?",
        a: "Every listing is hand-checked before it goes live and links to the company's own application form, careers page or HR contact. Listings are removed after 48 hours so you never apply to stale openings.",
      },
    ],
  },
  {
    slug: "hyderabad",
    name: "Hyderabad",
    terms: ["Hyderabad", "Secunderabad"],
    intro:
      "Hyderabad's HITEC City and Gachibowli are home to large IT services firms, global tech centres and fast-growing startups that run regular fresher and off-campus hiring drives.",
    faqs: [
      {
        q: "Do Hyderabad companies hire 2025 and 2026 batch freshers?",
        a: "Yes. Many openings listed here are open to recent graduates and final-year students — each listing shows the eligible batches before you apply.",
      },
      {
        q: "What skills help freshers get shortlisted in Hyderabad?",
        a: "Strong fundamentals in DSA, one programming language (Java, Python or JavaScript), SQL, and a project you can explain clearly. Cloud and testing skills are also in demand.",
      },
    ],
  },
  {
    slug: "pune",
    name: "Pune",
    terms: ["Pune"],
    intro:
      "Pune combines IT parks in Hinjewadi and Kharadi with a strong engineering and automotive-tech base, making it a steady source of fresher roles in software, embedded systems and analytics.",
    faqs: [
      {
        q: "What kind of fresher jobs are available in Pune?",
        a: "Software engineering, testing, technical support, data and embedded/automotive software roles, along with internships at product startups.",
      },
      {
        q: "How often are new Pune openings added?",
        a: "New opportunities are added daily as companies publish them, and each listing stays live for up to 48 hours.",
      },
    ],
  },
  {
    slug: "chennai",
    name: "Chennai",
    terms: ["Chennai"],
    intro:
      "Chennai is a major centre for IT services, SaaS companies and engineering firms, with consistent entry-level hiring across development, QA and support roles.",
    faqs: [
      {
        q: "Are there off-campus drives for freshers in Chennai?",
        a: "Yes — both off-campus drives and direct openings are listed here, with the company's own application link or form.",
      },
      {
        q: "Can I apply to Chennai jobs if I'm from another state?",
        a: "Usually yes. Check the location and work mode on each listing — many roles also offer hybrid or relocation options.",
      },
    ],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    terms: ["Mumbai", "Navi Mumbai", "Thane"],
    intro:
      "Mumbai's fresher market is strong in fintech, banking technology, media and consulting, with growing hiring from product startups in Navi Mumbai and Thane.",
    faqs: [
      {
        q: "Which industries hire freshers in Mumbai?",
        a: "Fintech, banking and financial services technology, consulting, media-tech and e-commerce — for both technical and analyst roles.",
      },
      {
        q: "Do Mumbai listings include Navi Mumbai and Thane?",
        a: "Yes, this page includes openings across Mumbai, Navi Mumbai and Thane.",
      },
    ],
  },
  {
    slug: "delhi-ncr",
    name: "Delhi NCR",
    terms: ["Delhi", "Noida", "Gurgaon", "Gurugram", "Faridabad", "Ghaziabad"],
    intro:
      "Delhi NCR — including Gurugram and Noida — is home to large product companies, consulting firms and a dense startup ecosystem hiring freshers across tech, analytics and business roles.",
    faqs: [
      {
        q: "Does this page include Gurugram and Noida jobs?",
        a: "Yes. It covers openings in Delhi, Noida, Gurugram, Faridabad and Ghaziabad.",
      },
      {
        q: "What roles are common for freshers in Delhi NCR?",
        a: "Software development, data and business analyst, QA, product support and consulting roles, plus paid internships at startups.",
      },
    ],
  },
  {
    slug: "remote",
    name: "Remote",
    terms: [],
    remote: true,
    intro:
      "Remote fresher jobs let you work from anywhere in India. Competition is higher, so apply early — every remote opening here links straight to the company's own application route.",
    faqs: [
      {
        q: "Are remote fresher jobs genuine?",
        a: "Every listing on FirstOffer is hand-checked before it goes live. Never pay any company a fee to get a job — genuine employers don't charge candidates.",
      },
      {
        q: "Do remote jobs hire 2026 batch students?",
        a: "Some do, especially remote internships. Each listing shows the eligible batches so you can check before applying.",
      },
    ],
  },
];

export function getCityPage(slug: string): CityPage | undefined {
  return CITY_PAGES.find((c) => c.slug === slug);
}
