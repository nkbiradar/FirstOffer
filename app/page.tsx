import Link from "next/link";
import OpportunityCard from "@/components/OpportunityCard";
import { getLatestOpportunities } from "@/lib/data/opportunities";

export default async function HomePage() {
  const opportunities = await getLatestOpportunities(6);

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
        <h2>Latest Opportunities</h2>
        {opportunities.length === 0 ? (
          <p className="empty-state">No opportunities available right now.</p>
        ) : (
          <div className="opportunity-grid">
            {opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
