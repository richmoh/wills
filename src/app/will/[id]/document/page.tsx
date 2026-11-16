import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { buildWillDocument } from "@/lib/document";
import { firstIncompleteStep } from "@/lib/interview";
import { isUuid, normalizeWillData } from "@/lib/will-types";
import { AppHeader } from "@/components/AppHeader";
import { PrintButton } from "@/components/PrintButton";
import { PackSheet, WillSheet } from "@/components/document/Sheets";
import { SigningAside } from "@/components/document/SigningAside";

export const metadata = { title: "Your will" };

/** Short names for the documents of the pack, used by the links that jump to each one. */
const DOCUMENT_NAMES: Record<string, string> = {
  letter: "Letter of wishes",
  executors: "Executor guide",
  checklist: "Estate checklist",
};

/**
 * "How to sign it" jumps to the signing checklist beside the will, which owns
 * #signing, so the printed signing instructions take another id.
 */
const sheetId = (extraId: string) => (extraId === "signing" ? "signing-instructions" : extraId);

/** Documents the free plan leaves out. */
const PACK_ONLY = ["Executor guide", "Estate checklist"];

const PILL = "rounded-full px-[18px] py-[11px] no-underline";

export default async function WillDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const { id } = await params;
  if (!isUuid(id)) notFound();
  const row = await queryOne<{ id: string; data: unknown; status: string; updated_at: string }>(
    `select id, data, status, updated_at from wills where id = $1 and user_id = $2`,
    [id, user.id]
  );
  if (!row) notFound();

  const data = normalizeWillData(row.data);
  // a will is only shown once it has been generated from a complete set of answers
  if (row.status !== "complete" || firstIncompleteStep(data, user.is_premium)) {
    redirect(`/will/${row.id}/edit`);
  }

  const doc = buildWillDocument(data, user.is_premium);
  // the date the will was generated — it must not change each time the page is opened
  const generatedOn = new Date(row.updated_at).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const executors = data.executors.map((e) => e.name.trim()).filter(Boolean);

  // Only the sheets inside <main> are printed. Everything else is no-print,
  // and the print: classes undo the screen layout so each sheet is an ordinary
  // full-width block that can break across pages.
  return (
    <div className="min-h-screen bg-[#E6EBE7] print:min-h-0 print:bg-white">
      <AppHeader width="max-w-[1320px]" />

      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-start gap-x-10 gap-y-8 px-[clamp(20px,4vw,48px)] pt-6 pb-24 print:block print:max-w-none print:p-0">
        <div className="no-print -mb-3 flex w-full flex-wrap items-center justify-between gap-x-8 gap-y-2.5">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 py-2.5 font-bold text-ink no-underline hover:text-emerald"
          >
            <svg
              aria-hidden="true"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 5l-7 7 7 7" />
            </svg>
            My wills
          </Link>
          <div className="flex flex-wrap gap-3">
            <Link href={`/will/${row.id}/edit`} className="btn-ghost">
              Change my answers
            </Link>
            <PrintButton />
          </div>
        </div>

        <main className="flex min-w-0 flex-[999_1_560px] flex-col gap-5 print:block">
          <nav
            aria-label="Your documents"
            className="no-print flex flex-wrap gap-2 text-[16px] font-bold"
          >
            <a href="#will" aria-current="true" className={`${PILL} bg-ink text-white`}>
              Your will
            </a>
            <a href="#signing" className={`${PILL} bg-white text-ink hover:text-emerald`}>
              How to sign it
            </a>
            {doc.extras
              .filter((extra) => extra.id !== "signing")
              .map((extra) => (
                <a
                  key={extra.id}
                  href={`#${sheetId(extra.id)}`}
                  className={`${PILL} bg-white text-ink hover:text-emerald`}
                >
                  {DOCUMENT_NAMES[extra.id] ?? extra.title}
                </a>
              ))}
            {!user.is_premium &&
              PACK_ONLY.map((name) => (
                <Link
                  key={name}
                  href="/pricing"
                  className={`${PILL} bg-white text-ink-soft hover:text-emerald`}
                >
                  {name} · in the pack
                </Link>
              ))}
          </nav>

          <WillSheet doc={doc} isPremium={user.is_premium} generatedOn={generatedOn} />
          {doc.extras.map((extra) => (
            <PackSheet key={extra.id} id={sheetId(extra.id)} extra={extra} />
          ))}
        </main>

        <SigningAside executors={executors} isPremium={user.is_premium} />
      </div>
    </div>
  );
}
