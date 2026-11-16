import { NewWillButton, UpgradeButton } from "@/components/DashboardActions";

/**
 * The dark panel at the foot of My wills. On the free plan it says what the
 * Complete Will Pack adds and offers it; on the paid plan it says what the
 * user has, and is where another will is started.
 */
export function PlanPanel({
  isPremium,
  price,
  spouseFirstName,
}: {
  isPremium: boolean;
  /** what the pack costs, as shown: "£39" */
  price: string;
  /** the spouse a mirror will could be made for, when a will names one */
  spouseFirstName?: string;
}) {
  const action = "btn-gold px-6 py-[15px] text-[18px]";
  return (
    <section className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5 rounded-3xl bg-deep p-[clamp(24px,3vw,40px)] text-white">
      <div className="min-w-0 flex-[1_1_420px]">
        <h2 className="text-[24px] leading-[1.3] font-bold tracking-[-0.02em]">
          {isPremium ? "You have the Complete Will Pack" : "You are on the free plan"}
        </h2>
        <p className="mt-2 text-mist">
          {isPremium ? (
            <>
              Lifetime access to bequests to charity, a religious-debts schedule, a letter of
              wishes, a guide for your executors, the estate checklist and a mirror will for your
              spouse.
            </>
          ) : (
            <>
              The Complete Will Pack adds bequests to charity, a religious-debts schedule, a
              letter of wishes, a guide for your executors and{" "}
              {spouseFirstName ? (
                <>{spouseFirstName}&rsquo;s mirror will</>
              ) : (
                "a mirror will for your spouse"
              )}
              . {price}, once.
            </>
          )}
        </p>
      </div>
      {isPremium ? (
        <NewWillButton label="Start another will" className={action} />
      ) : (
        <UpgradeButton className={action} />
      )}
    </section>
  );
}
