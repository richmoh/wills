"use client";

/** Opens the browser's print dialog, which is also how the will is saved as a PDF. */
export function PrintButton({ className = "btn-primary" }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      Print, or save as PDF
    </button>
  );
}
