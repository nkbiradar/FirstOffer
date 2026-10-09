"use client";

export default function PrintButton({ label = "Download / Print PDF" }: { label?: string }) {
  return (
    <button className="btn btn-primary" onClick={() => window.print()} type="button">
      {label}
    </button>
  );
}
