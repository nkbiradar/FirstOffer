// ─────────────────────────────────────────────────────────────────────────────
// User Reviews — demo / placeholder data
//
// ⚠️  These are DEMO entries for display purposes only.
//     Names, colleges, companies and reviews are illustrative — not real users.
//     Replace with verified, user-submitted reviews when you collect them.
//     Mark real entries isVerified: true and remove isSample: true.
//
// To add a real review: append to USER_REVIEWS below.
// To remove demo entries: delete entries marked isSample: true.
// ─────────────────────────────────────────────────────────────────────────────

export interface UserReview {
  id: string;
  /** Full name of the reviewer */
  name: string;
  /** College or university name */
  college: string;
  /** Graduation batch year, e.g. "2025" or "2026" */
  batch: string;
  /** Company where they got the opportunity */
  company: string;
  /** Role / position title */
  role: string;
  /** Short review text (keep under ~180 characters for best display) */
  review: string;
  /** 1–5 star rating */
  rating: 1 | 2 | 3 | 4 | 5;
  /** Optional URL to a profile photo. Leave null for auto-colored initials avatar. */
  photoUrl?: string | null;
  /** Set to true only after you have verified this review is genuine. */
  isVerified: boolean;
  /** Internal flag — remove these entries once you have real reviews. */
  isSample?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⚠️  DEMO DATA — illustrative only, not real user submissions
// ─────────────────────────────────────────────────────────────────────────────
export const USER_REVIEWS: UserReview[] = [
  {
    id: "demo-1",
    name: "Rahul Sharma",
    college: "IIIT Hyderabad",
    batch: "2026",
    company: "Razorpay",
    role: "Software Engineer Intern",
    review:
      "FirstOffer surfaced an off-campus opening at Razorpay I wouldn't have found on my own. The listing linked straight to their careers page — applied the same morning it went live.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-2",
    name: "Ananya Nair",
    college: "NIT Calicut",
    batch: "2026",
    company: "Flipkart",
    role: "Product Management Intern",
    review:
      "Really appreciated that every role links directly to the company — no aggregators in the middle. Found a PM internship at Flipkart within two weeks of bookmarking the site.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-3",
    name: "Aditya Verma",
    college: "DTU Delhi",
    batch: "2025",
    company: "Groww",
    role: "Frontend Developer Intern",
    review:
      "The 48-hour auto-expiry is the best part — nothing I browsed was stale. Spotted a frontend role at Groww on day one and had my application in before evening.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-4",
    name: "Sneha Patil",
    college: "VIT Vellore",
    batch: "2026",
    company: "Meesho",
    role: "Data Analyst Intern",
    review:
      "I check FirstOffer every morning now. The feed is clean, the filters work, and companies actually respond because you're applying through their own forms — not a middleman.",
    rating: 4,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-5",
    name: "Karthik R",
    college: "PSG College of Technology",
    batch: "2025",
    company: "CRED",
    role: "Backend Engineer Intern",
    review:
      "Discovered a backend internship at CRED that wasn't listed anywhere else I was tracking. The direct-apply link saved me a lot of back-and-forth.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-6",
    name: "Priya Menon",
    college: "College of Engineering, Pune",
    batch: "2026",
    company: "PhonePe",
    role: "ML Engineering Intern",
    review:
      "No account wall, no resume gate — I could actually browse everything before deciding to sign in. Found a well-matched ML role at PhonePe and applied in under five minutes.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-7",
    name: "Arjun Kumar",
    college: "IIT (BHU) Varanasi",
    batch: "2025",
    company: "Zepto",
    role: "Operations Intern",
    review:
      "What stands out is how current everything is. Off-campus drives I'd normally hear about weeks late were right there on day one. Applied to Zepto's ops role the same day it was posted.",
    rating: 4,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-8",
    name: "Neha Singh",
    college: "Thapar University",
    batch: "2026",
    company: "Lenskart",
    role: "Marketing Intern",
    review:
      "I liked that roles are curated by hand, not scraped in bulk — the quality is noticeably better than other aggregators I've tried. Found a solid marketing internship at Lenskart.",
    rating: 4,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-9",
    name: "Rohit Das",
    college: "Jadavpur University",
    batch: "2025",
    company: "Ola Electric",
    role: "Embedded Systems Intern",
    review:
      "Ola Electric's internship wasn't on LinkedIn or Naukri when I spotted it on FirstOffer. Applied the same day, heard back within a week. The fresh listings are the real differentiator.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-10",
    name: "Aishwarya Rao",
    college: "RV College of Engineering",
    batch: "2026",
    company: "upGrad",
    role: "Content Strategy Intern",
    review:
      "Simple, honest platform. No fake urgency, no premium tiers — just listings with direct apply links. Found a content strategy role at upGrad within days of signing up.",
    rating: 4,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-11",
    name: "Preeti Jaiswal",
    college: "Symbiosis Institute of Technology",
    batch: "2025",
    company: "BrowserStack",
    role: "QA Engineer Intern",
    review:
      "The application tracker is genuinely useful — I applied to eight roles over two weeks and could see at a glance what I'd sent out. BrowserStack was the one that moved forward.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-12",
    name: "Sahana R",
    college: "BITS Pilani",
    batch: "2026",
    company: "Postman",
    role: "Developer Evangelist Intern",
    review:
      "Found a Postman internship I hadn't seen anywhere else. The listing went live on a Monday; I applied by Tuesday and had a call scheduled by Thursday. Freshness makes a real difference.",
    rating: 5,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
  {
    id: "demo-13",
    name: "Vikram Mehta",
    college: "Manipal Institute of Technology",
    batch: "2025",
    company: "Zoho",
    role: "Full-Stack Developer Intern",
    review:
      "Zoho posts roles that don't always make it to the big boards. FirstOffer had it on day one, the link went straight to Zoho's own portal, and the whole process was clean.",
    rating: 4,
    photoUrl: null,
    isVerified: false,
    isSample: true,
  },
];

/**
 * Returns all reviews for rendering.
 * When you have enough real verified reviews, you can filter out demos:
 *   return USER_REVIEWS.filter((r) => !r.isSample);
 */
export function getUserReviews(): UserReview[] {
  return USER_REVIEWS;
}
