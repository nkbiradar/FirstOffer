import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getHomepageOpportunities } from "@/lib/data/opportunities";

export default async function HomePage() {
  const { today, earlier, todayDateLabel } = await getHomepageOpportunities();

  return (
    <main className="page home">
      <h1>FirstOffer</h1>
      <p className="tagline">Fresher opportunities. One place.</p>
      <p className="description">
        Discover internships, full-time roles and off-campus opportunities
        collected and organized for freshers.
      </p>
      <Link className="cta" href="/opportunities">
        Explore Opportunities
      </Link>

      <section className="latest-section">
        <h2>Today&apos;s Opportunities — {todayDateLabel}</h2>
        {today.length === 0 ? (
          <p className="empty-state">No opportunities published today yet.</p>
        ) : (
          <div className="opportunity-grid">
            {today.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </section>

      {earlier.length > 0 && (
        <section className="latest-section">
          <h2>Earlier Opportunities</h2>
          <div className="opportunity-grid">
            {earlier.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
