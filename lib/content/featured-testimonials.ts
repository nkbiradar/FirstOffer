// Hand-picked "What worked for them" stories shown next to the Full Access
// pay button (/unlock). Real students only, shared with their permission —
// quotes are their own words with light grammar fixes. Add new ones at the
// top; the first 3 are shown.
export type FeaturedTestimonial = {
  name: string;
  company: string;
  role: string;
  result: "interview" | "selected";
  quote: string;
  college?: string;
  batch?: string;
  /** e.g. "6 days" — how long until the call / offer. */
  timeTaken?: string;
};

export const FEATURED_TESTIMONIALS: FeaturedTestimonial[] = [
  {
    name: "Aman",
    company: "Blend360",
    role: "Data Analyst",
    result: "interview",
    quote:
      "I had applied to so many companies before, but the chances of getting a response were too low. My friends suggested FirstOffer — I applied to all the data analyst roles posted there, updated my resume with the FirstOffer template and applied daily. Finally, I got an interview call.",
    college: "JSS Mysuru",
    batch: "2025",
    timeTaken: "6 days",
  },
];
