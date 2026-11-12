# Unfound — Australia mission brief

**Be reached, not found.**
A safe-records layer for survivors of abusive partners and children caught in custody fights.

*Prepared 9 Nov 2026 · Team GenData · Companion to `PROJECT_OVERVIEW.md` (full project state) and the repo `Unfound-Be-reached-Not-found/`.*

---

## 1. The mission we tackle

In Australia, a family hiding from a dangerous person — a violent partner or an ex fighting over custody — is betrayed not by hackers but by paperwork. Every service they must still use (school, GP, court, police) holds their address and records in plain text, and access rules (AVOs, parenting orders) are enforced by manual flags and staff memory.

- NSW alone has **over 100,000 protection orders in force** (48,814 domestic AVOs commenced in 2023/24, police-initiated in 98% of cases).
- Victoria issued **12,000+ intervention orders between Nov 2024 and Mar 2025** — a 2.7× surge; 142,719 FVIO applications from 2020–24 involved children 17 or under.
- Queensland police systems were found to have auto-filled victims' addresses into documents served on offenders — a risk known "since at least 2017".
- Australia — unlike the ~39 US state Address Confidentiality Programs — **has no substitute-address infrastructure at all.** Only the electoral roll's silent-elector scheme exists.

The survivor can change her phone, her job, her friendships. **She cannot change how a school files a letter.**

**Mission:** make record protection a property of the network, not a promise on a form — so services can reach the families they must reach, and no one else can look.

## 2. What Unfound does

The family's address and the child's records are **sealed once, in their own browser**, split into parts (street / school zone / contact relay). Each service holds a role to open exactly one part:

| Service | Sees today | With Unfound |
|---|---|---|
| School | Full address | "In Footscray North zone ✓" |
| GP | Address + phone | Suburb + relay number |
| Court mail | Address in a clerk's file | Street opens only as the label prints |
| Police | Any record, any time | One view after 2-of-3 approvals, then revoked |
| The other parent (custody) | School portal by default | Only what the parenting order allows; every request logged |
| IT admin / operator | Everything | Ciphertext; a self-grant stays pending |

Opening more needs **2 of 3 independent approvers**. Every attempt, approval and refusal lands in a log **only the family can see**. No master key, no admin override — not even we can look. Built on TideCloak: keys exist only as shards across 20 independent nodes (14 required to act).

**Status (be honest about this):** the public demo runs a mock fabric — real AES-GCM encryption in the browser, same role and quorum rules, so it shows the experience, not the security guarantees. The live TideCloak path is complete and doctor-checked; it activates once enrolment succeeds (blocked 22 Oct 2026 by Tide's ORK network — on Tide's side, not ours).

## 3. Who uses it, who buys it

| Role | Who | What they do | Why they act |
|---|---|---|---|
| **Users (free)** | Survivors, protective parents | Seal, choose, read the "Who looked" log | Safety — always free |
| **Users (staff)** | School office, GP reception, caseworkers, police | Open the one part their role allows | Less work than today's manual process |
| **Referral channel** | Orange Door–affiliated services, FDR practitioners, Independent Children's Lawyers, Legal Aid | Onboard and steer families | Their existing duty (FVISS/MARAM; the s60I process) |
| **Buyers** | Vic/NSW government schools via Compass/Sentral; agencies | Per-student or per-site licence | FVISS duty (Vic), flag duty, privacy-tort liability |
| **Payers (custody)** | Protective parent ~A$10–20/month, fee-waived when needed | Subscription | Mediator/court-steered; fee waivers standard in this category |
| **Funders** | DSS Leaving Violence Program (A$925.2M), philanthropy | Fund the free tier via partner services | National Plan 2022–2032 |
| **Platform** | Tide (Sydney) | Key shards, roles, quorum | Its developer-GTM thesis needs a reference build — we are the exchange, not a favour |

**Business model in one line:** institutional SaaS (schools/agencies) + court/mediator-steered custody subscriptions + grants funding the permanently-free survivor mode. **Never:** data sales, ads, or analytics on the log — the operator must have zero reason to see plaintext.

## 4. The analogy (three things every Australian already understands)

1. **The silent elector, for everything.** The AEC already accepts that safety justifies hiding your address from the public roll. Unfound extends that accepted principle from one database to every service in your life.
2. **A PO Box for records.** The school doesn't need your street; it needs to reach you. Unfound is the relay — the PO Box — and the street stays sealed.
3. **The footy club account.** No committee lets one person spend alone — two signatories, every time. Unfound makes every records-access change a two-signatory account: no one opens what matters alone — not the principal, not the IT admin, not us.

## 5. What legitimises us

1. **A legislated duty already exists.** Under Victoria's FVISS, CISS and MARAM, schools are *prescribed entities* — legally required to identify and share family-violence risk information. We are infrastructure for an obligation schools already carry, not new behaviour.
2. **Orders schools must obey, enforced manually.** AVOs, IVOs, DVOs and parenting orders legally restrict access; schools receive paper copies at enrolment and implement them with flags and briefings. We make compliance enforceable instead of aspirational.
3. **The state's own record of failure.** Qld 2014 (QCAT found police liable after an officer leaked a survivor's address), Qld 2024 (auto-fill into papers served on offenders), Operation Impala (2,215 misuse allegations across seven agencies in four years). Documented by Australian regulators, not by us.
4. **New law with teeth.** Statutory privacy tort in force 10 Jun 2025 (agencies can be sued); the Children's Online Privacy Code must be registered by **10 Dec 2026**; QLD's on-the-spot 12-month Police Protection Directions took effect **1 Jan 2026** — each one creating a family whose records need protecting immediately.
5. **Money already committed.** National Plan (A$3.4B); Leaving Violence Program live since 1 Jul 2025 (A$925.2M over five years; up to A$5,000 per survivor, including school costs) — the funding rail for the free tier, delivered through partner-held grants.

## 6. Australian use cases

**Newcastle, NSW — the ADVO flag.** A survivor leaves Western Sydney with her son, enrols him at a public school running Sentral. Her police-initiated ADVO restricts the ex-partner. Today: the office prints the order, flags the file, briefs staff, and hopes. With Unfound: address sealed, school confirms "in zone ✓", the ADVO's access rules *are* the roles, and his attempt appears in her log.

**Footscray, VIC — the Orange Door pathway.** A caseworker at an Orange Door–affiliated service onboards a survivor under FVISS; Compass is the school's parent portal; the school sees the zone, the GP gets the relay, and the service fulfils its MARAM obligations with a system instead of a spreadsheet.

**Geelong, VIC — the custody track.** ~97% of separating parents never see a courtroom, but the high-risk minority do, and the FDR practitioner the protective parent must see first (the mandatory pre-filing step) refers the family. The parenting order becomes role-scoped access to the child's records: the other parent gets what the order says, nothing more, and every request is timestamped in her log.

**Townsville, QLD — the 2-minute order.** Police issue an on-the-spot 12-month Protection Direction. The school is told a parent is restricted — with no system to act on it. Unfound turns the direction into enforced roles the same afternoon.

## 7. Go-to-market

**Victoria beachhead → NSW scale → custody channel → state scheme.**

1. **Vic pilot (2027):** one Orange Door–aligned service + one Victorian government school, co-designed through Safe and Equal, funded via partner-held grants — sold as *FVISS/MARAM infrastructure*.
2. **Channel:** integrate with **Compass** (dominant parent portal in Victorian government schools, 5,000+ schools nationally) and **Sentral** (~two-thirds of NSW public schools, per the ACCC's May 2024 statement of issues). Two integrations cover both largest states.
3. **NSW expansion:** the country's largest AVO population, arriving through the Sentral channel.
4. **Custody:** free professional accounts for FDR practitioners, ICLs and Legal Aid lawyers — they are the referral rail; fee-waivered parent subscriptions behind them.
5. **The scheme sale:** to Queensland first (documented scandals, political appetite, new Police Protection Directions), then nationally — **Unfound as the substitute-address scheme Australia never built.**

Every timing hook converges in the next twelve months: the Children's Code (Dec 2026), QLD directions (live), tort liability (live), LVP money (flowing). The market isn't waiting to be created — it's waiting to be served.

---

**One line:** *Services can reach them. No one can look them up. Not the staff, not the admin, not the other parent, not even us.*

**Further reading:** `PROJECT_OVERVIEW.md` (full project state, meeting playbook) · repo README (`Unfound-Be-reached-Not-found/`) · `docs/UNFOUND_BRIEF.md` (cited evidence base) · live demo: https://unfound-be-reached-not-found.vercel.app/demo?story=1
