"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// The only bit of client JS in the admin opportunity flow: HTML forms can't
// issue DELETE requests, and a delete needs a confirmation prompt anyway.
export default function DeleteOpportunityButton({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${role}"? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/opportunities/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        alert(body?.error ?? "Failed to delete opportunity.");
        return;
      }
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <button className="btn-danger" disabled={isDeleting} onClick={handleDelete} type="button">
      {isDeleting ? "Deleting..." : "Delete"}
    </button>
  );
}
