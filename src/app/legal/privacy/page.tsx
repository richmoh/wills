import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LegalDocument, type LegalSection } from "@/components/marketing/LegalDocument";

export const metadata = { title: "Privacy policy" };

const list = "list-disc space-y-3 pl-6 marker:text-ink-mute";
const link = "font-semibold";
const code = "rounded-md border border-line bg-white px-1 py-0.5 text-[16px] text-ink";

const intro = (
  <p>
    This policy explains what Wasiyyah holds about you, why, and what
    you can do about it. Wasiyyah (&ldquo;we&rdquo;) decides how that
    information is used, which makes us the data controller under UK
    data protection law. You can reach us about anything here at
    hello@wasiyyahwills.com.
  </p>
);

const sections: LegalSection[] = [
  {
    id: "collect",
    heading: "What we collect",
    body: (
      <>
        <ul className={list}>
          <li>
            <strong>Your account.</strong> Your name, your email address
            and a password. We also record when the account was created,
            when you gave the consent described below, and whether you have
            bought the Complete Will Pack.
          </li>
          <li>
            <strong>Your will answers.</strong> Everything you enter in the
            interview, such as your legal name, home address, date of birth
            and marital status; which members of your family survive you,
            and their names; the names, addresses and relationship to you
            of the executors and guardians you appoint; your burial wishes;
            and any bequests, outstanding religious obligations and letter
            of wishes you add.
          </li>
          <li>
            <strong>Payment records.</strong>{" "}
            If you buy the Complete Will Pack we keep the amount, the date,
            whether the payment succeeded, and Stripe&rsquo;s reference for
            it. We never see or store your card details.
          </li>
          <li>
            <strong>Technical information.</strong>{" "}
            A sign-in cookie (see &ldquo;Cookies&rdquo; below). To stop repeated sign-in
            attempts, we also count attempts by IP address and email
            address; those counts are held in memory for about an hour at
            most and are never saved to our database. Like most websites, our web
            server keeps a log of the requests it receives (IP address,
            time, page requested and browser type).
          </li>
        </ul>
        <p>We never ask for bank or card details.</p>
      </>
    ),
  },
  {
    id: "religion",
    heading: "Information about your religion",
    body: (
      <>
        <p>
          Making an Islamic will tells us that you are Muslim, and some
          answers say more — your burial wishes, for example, or religious
          obligations you still owe. Information that reveals religious
          belief is &ldquo;special category&rdquo; data under UK GDPR and
          needs extra protection. We store and use it only with your
          explicit consent, which we ask for with a tick-box when you
          create your account. We cannot prepare an Islamic will without
          it.
        </p>
        <p>
          You can withdraw that consent at any time by deleting your
          account, which deletes the information (see &ldquo;Your
          choices&rdquo; below).
        </p>
      </>
    ),
  },
  {
    id: "other-people",
    heading: "Other people’s details",
    body: (
      <p>
        Your answers include details of other people: the relatives you
        name, and the executors and guardians you appoint. We hold these
        only as part of your will and use them only to prepare your
        documents.
      </p>
    ),
  },
  {
    id: "use",
    heading: "What we use it for, and our legal basis",
    body: (
      <>
        <ul className={list}>
          <li>
            <strong>Running your account and preparing your documents</strong>{" "}
            — signing you in, saving your answers, working out the
            inheritance shares and generating your will. The legal basis is
            our contract with you: we need this information to provide the
            service you asked for. For the information that reveals your
            religion, we rely in addition on your explicit consent.
          </li>
          <li>
            <strong>Taking payment</strong> for the Complete Will Pack and
            keeping a record of it. The legal basis is our contract with
            you.
          </li>
          <li>
            <strong>Keeping the service secure</strong> — limiting repeated
            sign-in attempts and keeping server logs. The legal basis is
            our legitimate interest in protecting your account and our
            service.
          </li>
        </ul>
        <p>
          We do not sell, rent or trade your information, and we do not use
          it for advertising. The only emails we send are ones you ask for,
          such as a password reset link.
        </p>
      </>
    ),
  },
  {
    id: "processors",
    heading: "Who else handles your information",
    body: (
      <>
        <p>Two companies handle limited information for us. Neither receives your will answers.</p>
        <ul className={list}>
          <li>
            <strong>Stripe</strong>{" "}
            takes card payments. If you buy the Complete Will Pack you pay
            on Stripe&rsquo;s own checkout page;
            we give Stripe your email address and an internal account
            reference so the payment can be matched to your account. Your
            card details go straight to Stripe and never reach our servers.
          </li>
          <li>
            <strong>Resend</strong> delivers our emails. When you ask for a
            password reset, we give Resend your email address and the reset
            message so that it can deliver it.
          </li>
        </ul>
        <p>
          Both companies may process this information outside the UK,
          including in the United States. We may also have to disclose
          information where the law requires it.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    heading: "Where it is stored and how it is protected",
    body: (
      <>
        <p>
          Data is stored on our own server infrastructure in Europe.
        </p>
        <ul className={list}>
          <li>The connection between your browser and the site is encrypted (HTTPS).</li>
          <li>
            Your password is stored only as a bcrypt hash, which cannot be
            turned back into the password — we cannot read it.
          </li>
          <li>
            Sign-in sessions and password reset links are stored only as
            hashes, so the database does not hold anything that could be
            used to sign in as you.
          </li>
          <li>
            A password reset link works once and expires after one hour,
            and resetting your password signs you out everywhere else.
          </li>
          <li>Repeated sign-in attempts are limited.</li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: (
      <p>
        We set one cookie, <code className={code}>wasiyyah_session</code>, when you create
        an account or sign in. It keeps you signed in for up to 30 days
        and is removed when you sign out. It is essential to the service,
        so we do not ask for cookie consent. We set no advertising or
        analytics cookies and load no third-party trackers. If you pay
        for the Complete Will Pack, Stripe&rsquo;s checkout page sets its
        own cookies under Stripe&rsquo;s privacy policy.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep it",
    body: (
      <ul className={list}>
        <li>
          We keep your account and your wills for as long as your account
          exists. We do not remove inactive accounts automatically,
          because a will is something people come back to and update
          over many years.
        </li>
        <li>
          Deleting a will from your dashboard removes it from our live
          database straight away.
        </li>
        <li>
          Deleting your account removes your account details, all of your
          wills and our payment records from our live database straight
          away. Stripe keeps its own record of any payment you made.
        </li>
        <li>
          A sign-in session expires after 30 days, and a password reset
          link after one hour.
        </li>
      </ul>
    ),
  },
  {
    id: "choices",
    heading: "Your choices",
    body: (
      <>
        <p>
          On your{" "}
          <Link href="/account" className={link}>Account page</Link> you
          can, at any time and without contacting us:
        </p>
        <ul className={list}>
          <li>
            <strong>download your data</strong> — a file containing your
            account details, the answers in each of your wills, and your
            payment records;
          </li>
          <li>
            <strong>delete your account</strong>, which permanently deletes
            everything listed above.
          </li>
        </ul>
        <p>
          You can correct your will answers yourself by editing the will.
          To change the name or email address on your account, email us.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your rights",
    body: (
      <>
        <p>
          Under UK GDPR you have the right to ask for a copy of your
          information, to have it corrected or erased, to have its use
          restricted, to object to its use, to receive it in a portable
          format, and to withdraw your consent at any time. Withdrawing
          consent does not affect anything done before you withdrew it. To
          use any of these rights, email hello@wasiyyahwills.com. We
          must reply within one month.
        </p>
        <p>
          If you are unhappy with how we have handled your information,
          please tell us so that we can try to put it right. You also have
          the right to complain to the Information Commissioner&rsquo;s
          Office, the UK&rsquo;s data protection regulator, at{" "}
          <a href="https://ico.org.uk/make-a-complaint/" className={link} rel="noopener noreferrer">
            ico.org.uk
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        If we change this policy we will publish the new version on this
        page and update the date at the top.
      </p>
    ),
  },
];

const closing = <p>Contact: hello@wasiyyahwills.com</p>;

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <LegalDocument
        title="Privacy policy"
        updated="Last updated: November 2026"
        intro={intro}
        sections={sections}
        closing={closing}
      />
      <SiteFooter />
    </>
  );
}
