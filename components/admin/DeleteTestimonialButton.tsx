"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Mirrors DeleteOpportunityButton.tsx — HTML forms can't issue DELETE
// requests, and a delete needs a confirmation prompt anyway.
export default function DeleteTestimonialButton({ id, studentName }: { id: string; studentName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${studentName}'s testimonial? This cannot be undone.`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/testimonials/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        alert(body?.error ?? "Failed to delete testimonial.");
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
