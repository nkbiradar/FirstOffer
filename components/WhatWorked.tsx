import Link from "next/link";
import WhatWorkedCard from "@/components/WhatWorkedCard";
import { getPublishedWhatWorked } from "@/lib/data/what-worked";

// "What worked for them" next to the Full Access pay button (/unlock).
// Same stories as /what-worked — add them once at /admin/what-worked.
export default async function WhatWorked({ limit = 3 }: { limit?: number }) {
  const stories = await getPublishedWhatWorked(limit);
  if (stories.length === 0) return null;
  return (
    <section className="what-worked" aria-labelledby="what-worked-title">
      <h2 id="what-worked-title">💬 What worked for them</h2>
      <div className="what-worked-list">
        {stories.map((s) => (
          <WhatWorkedCard compact key={s.id} story={s} />
        ))}
      </div>
      <p style={{ marginTop: 12, textAlign: "center" }}>
        <Link href="/what-worked">Read more stories →</Link>
      </p>
    </section>
  );
}
