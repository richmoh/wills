/**
 * The in-page links in the left column of Questions, Terms and Privacy: one
 * link to a row, with a hairline above each and below the last.
 */
export function SideNav({
  label,
  items,
}: {
  /** names the list for screen readers, e.g. "Topics" */
  label: string;
  /** `id` is the id of the section the link jumps to */
  items: { id: string; label: string }[];
}) {
  return (
    <nav aria-label={label} className="mt-9 flex flex-col font-semibold">
      {items.map((item) => (
        <a key={item.id} href={`#${item.id}`} className="border-t border-line py-3 last:border-b">
          {item.label}
        </a>
      ))}
    </nav>
  );
}
