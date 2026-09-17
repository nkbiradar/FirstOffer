import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const failed = params.error === "1";

  return (
    <main className="page">
      <div className="container unsubscribe-page">
        {failed ? (
          <>
            <h1>Link expired or invalid</h1>
            <p>
              This unsubscribe link didn&apos;t check out. You can turn email alerts on or off anytime from your
              dashboard instead.
            </p>
          </>
        ) : (
          <>
            <h1>You&apos;re unsubscribed</h1>
            <p>
              You won&apos;t get emailed about new opportunities anymore. You can turn alerts back on anytime from
              your dashboard.
            </p>
          </>
        )}
        <Link className="btn btn-primary" href="/dashboard">
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
