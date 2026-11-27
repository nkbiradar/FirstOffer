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
  /** Same jobs as another page: canonical points there, never indexed. */
  canonicalPath?: string;
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
    slug: "noida",
    name: "Noida",
    terms: ["Noida", "Greater Noida"],
    intro:
      "Noida's Sector 62, Sector 63 and Greater Noida are packed with IT services firms, product companies and fast-growing startups that hire freshers for development, QA, support and digital roles.",
    faqs: [
      {
        q: "Which companies hire freshers in Noida?",
        a: "A mix of IT services companies, SaaS and product startups, and digital agencies. Each listing shows the company name and links to its own application route.",
      },
      {
        q: "Is Noida included in the Delhi NCR page too?",
        a: "Yes. The Delhi NCR page covers the whole region; this page shows only openings located in Noida and Greater Noida.",
      },
    ],
  },
  {
    slug: "gurgaon",
    name: "Gurgaon",
    terms: ["Gurgaon", "Gurugram"],
    intro:
      "Gurugram (Gurgaon) is a hub for global tech centres, consulting firms, fintech and e-commerce companies, with steady fresher hiring for software, analytics and business roles.",
    faqs: [
      {
        q: "Does this page show both Gurgaon and Gurugram jobs?",
        a: "Yes. Companies use both names, so this page lists openings tagged with either spelling.",
      },
      {
        q: "What roles do freshers get in Gurugram?",
        a: "Software development, data and business analyst, consulting, product support and operations roles, plus paid internships at startups.",
      },
    ],
  },
  {
    slug: "ahmedabad",
    name: "Ahmedabad",
    terms: ["Ahmedabad", "Gandhinagar", "GIFT City"],
    intro:
      "Ahmedabad and Gandhinagar, including GIFT City, have a growing base of IT services companies, product startups and fintech firms hiring freshers in development and analytics.",
    faqs: [
      {
        q: "Are there IT jobs for freshers in Ahmedabad?",
        a: "Yes. Most openings here are software development, QA, web and mobile development and data roles, along with internships.",
      },
      {
        q: "Does this page include Gandhinagar and GIFT City?",
        a: "Yes, openings in Gandhinagar and GIFT City are listed here along with Ahmedabad.",
      },
    ],
  },
  {
    slug: "indore",
    name: "Indore",
    terms: ["Indore"],
    intro:
      "Indore has become one of central India's fastest-growing IT cities, with IT parks and software companies regularly hiring freshers for development, testing and support roles.",
    faqs: [
      {
        q: "What kind of fresher jobs are available in Indore?",
        a: "Mainly software development (web, mobile and full-stack), QA, technical support and digital marketing roles, plus internships.",
      },
      {
        q: "Are Indore jobs on FirstOffer verified?",
        a: "Every listing is checked before it goes live and links to the company's own application form, careers page or HR contact.",
      },
    ],
  },
  {
    slug: "jaipur",
    name: "Jaipur",
    terms: ["Jaipur"],
    intro:
      "Jaipur's IT sector, from Mahindra World City to growing startup clusters, offers fresher roles in software development, QA, digital marketing and business support.",
    faqs: [
      {
        q: "Do companies in Jaipur hire 2025 and 2026 batch freshers?",
        a: "Yes. Each listing shows the eligible batches, so you can check before you apply.",
      },
      {
        q: "Which skills help freshers get hired in Jaipur?",
        a: "Solid basics in one programming language, web development (HTML, CSS, JavaScript, React), SQL and a project you can explain clearly.",
      },
    ],
  },
  {
    slug: "kolkata",
    name: "Kolkata",
    terms: ["Kolkata", "Salt Lake"],
    intro:
      "Kolkata's Salt Lake Sector V and New Town host large IT services companies and growing startups that hire freshers for software, support and analyst roles.",
    faqs: [
      {
        q: "Which roles are common for freshers in Kolkata?",
        a: "Software development, testing, technical support, data and business analyst roles, along with internships.",
      },
      {
        q: "Can I apply to Kolkata jobs from another city?",
        a: "Usually yes. Check the work mode on each listing, since some roles are hybrid or offer relocation.",
      },
    ],
  },
  {
    slug: "chandigarh",
    name: "Chandigarh & Mohali",
    terms: ["Chandigarh", "Mohali", "Panchkula"],
    intro:
      "The Chandigarh tricity, especially Mohali's IT City, has a steady flow of fresher openings at IT services companies and startups in development, QA and digital roles.",
    faqs: [
      {
        q: "Does this page include Mohali and Panchkula?",
        a: "Yes. It covers openings in Chandigarh, Mohali and Panchkula.",
      },
      {
        q: "What fresher roles are available in Mohali?",
        a: "Mostly web and mobile development, QA, technical support and digital marketing roles, plus paid internships.",
      },
    ],
  },
  {
    slug: "coimbatore",
    name: "Coimbatore",
    terms: ["Coimbatore"],
    intro:
      "Coimbatore combines a strong engineering-college base with a growing IT and SaaS sector, offering fresher roles in software, embedded systems and support.",
    faqs: [
      {
        q: "Are there IT jobs for freshers in Coimbatore?",
        a: "Yes. You'll find software development, QA, embedded and technical support openings here, along with internships.",
      },
      {
        q: "How often are new Coimbatore openings added?",
        a: "New openings are added daily as companies publish them, and each listing stays live for up to 48 hours.",
      },
    ],
  },
  {
    slug: "kochi",
    name: "Kochi",
    terms: ["Kochi", "Cochin", "Infopark"],
    intro:
      "Kochi's Infopark and SmartCity host IT services firms and product startups that hire freshers for development, QA and support roles across Kerala.",
    faqs: [
      {
        q: "Does this page include Infopark Kochi jobs?",
        a: "Yes. Openings at Infopark and elsewhere in Kochi (Cochin) are listed here.",
      },
      {
        q: "What skills do Kochi companies look for in freshers?",
        a: "Good programming fundamentals, web or mobile development skills, SQL and clear communication. A strong project helps a lot.",
      },
    ],
  },
  {
    slug: "remote",
    canonicalPath: "/jobs/remote-jobs-for-freshers",
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
