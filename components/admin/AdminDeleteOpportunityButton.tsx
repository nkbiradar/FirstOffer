"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// A trimmed variant of components/admin/DeleteOpportunityButton.tsx for use
// on the PUBLIC opportunity detail page's admin-only quick-actions bar (see
// app/opportunities/[id]/page.tsx) rather than the /admin/opportunities
// table. The difference is what happens after a successful delete: the
// table version calls router.refresh() to re-render the same list with the
// row gone; here that would refresh a page whose opportunity no longer
// exists (a 404), so this redirects to the public listings instead. Hits
// the exact same DELETE /api/admin/opportunities/[id] route — deleting
// works regardless of the opportunity's status (draft, published, or
// already expired), same as the admin table's button.
export default function AdminDeleteOpportunityButton({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${role}"? This removes it from the site immediately and cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        alert(body?.error ?? "Failed to delete opportunity.");
        setIsDeleting(false);
        return;
      }
      router.push("/opportunities");
    } catch {
      alert("Network error — try again.");
      setIsDeleting(false);
    }
  }

  return (
    <button className="btn-danger" type="button" onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? "Deleting..." : "Delete this listing"}
    </button>
  );
}
