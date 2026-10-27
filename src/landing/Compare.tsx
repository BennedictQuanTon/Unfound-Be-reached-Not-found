import { motion } from "motion/react";
import { CountUp, Reveal, Words } from "../motion/primitives";
import { ease } from "../motion/tokens";

// Numbers measured on this build (tools: headless Chrome runs of /demo?story=1 and the landing page).
const PROOF: { v: number; d?: number; suffix?: string; prefix?: string; comma?: boolean; label: string; note: string }[] = [
  { v: 0, label: "plaintext addresses stored", note: "12 ciphertexts across 4 synthetic survivors" },
  { v: 412, label: "status for a lone admin's commit", note: "QUORUM_NOT_MET, every self-grant attempt" },
  { v: 2, suffix: " of 3", label: "approvers for any role change", note: "max(1, floor(0.7 × N)), N = 3 realm admins" },
  { v: 15, label: "Tide operations, end to end", note: "8 scenes, 7 personas, 68 s, 0 console errors" },
  { v: 1, label: "view per break-glass grant", note: "role revoked the moment it is used" },
  { v: 16.8, d: 1, suffix: " ms", label: "p99 frame while scrolling", note: "60 fps, 0 dropped frames over 738" },
];

type Mark = "yes" | "part" | "no";
const COLS = ["Survivor chooses what each service sees", "Insiders and admins cannot read it", "No single person can grant access", "Emergency access with witnesses", "Survivor sees who looked", "Works across services"];
const ROWS: { name: string; cite: number[]; marks: Mark[]; us?: boolean }[] = [
  { name: "Collecting less: each service keeps only what it needs", cite: [], marks: ["part", "part", "no", "no", "no", "no"] },
  { name: "Silent elector enrolment (AU)", cite: [8], marks: ["no", "part", "no", "no", "no", "no"] },
  { name: "Address Confidentiality Programs (US states)", cite: [9, 10], marks: ["part", "part", "no", "part", "no", "part"] },
  { name: "Role-based access + audit logs (e.g. police records systems)", cite: [3, 5], marks: ["no", "no", "no", "part", "no", "no"] },
  { name: "Encryption at rest with a provider-held key", cite: [11], marks: ["no", "no", "no", "no", "no", "part"] },
  { name: "Unfound on TideCloak", cite: [12, 13, 14], marks: ["yes", "yes", "yes", "yes", "yes", "yes"], us: true },
];

function Cell({ m }: { m: Mark }) {
  return (
    <span className={`cmp-mark ${m}`} aria-label={m === "yes" ? "Yes" : m === "part" ? "Partly" : "No"}>
      {m === "yes" ? (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : m === "part" ? (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 8h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      ) : (
        <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
      )}
    </span>
  );
}

export function Compare() {
  return (
    <section id="compare" className="section">
      <div className="container">
        <div className="section-head">
          <Reveal><span className="eyebrow">Proof</span></Reveal>
          <h2><Words text="What the prototype actually does." /></h2>
          <Reveal delay={0.1}><p>Measured on this build with automated runs of the full story and the landing page. Every number below came out of a passing run.</p></Reveal>
        </div>

        <ol className="proof">
          {PROOF.map((p, i) => (
            <Reveal as="li" key={p.label} delay={i * 0.05}>
              <span className="proof-num">
                <CountUp value={p.v} decimals={p.d ?? 0} suffix={p.suffix ?? ""} prefix={p.prefix ?? ""} comma={p.comma} />
              </span>
              <b>{p.label}</b>
              <span className="muted">{p.note}</span>
            </Reveal>
          ))}
        </ol>

        <div className="section-head" style={{ marginTop: 96 }}>
          <Reveal><span className="eyebrow">Compared</span></Reveal>
          <h2><Words text="What exists today, and the gap." /></h2>
        </div>

        <Reveal className="cmp-wrap">
          <table className="cmp">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Approach</span></th>
                {COLS.map((c) => <th key={c} scope="col">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => (
                <motion.tr
                  key={r.name}
                  className={r.us ? "us" : ""}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.6, ease: ease.out, delay: i * 0.06 }}
                >
                  <th scope="row">
                    {r.name}
                    <span className="cite">{r.cite.map((c) => <a key={c} href={`#ref-${c}`}>[{c}]</a>)}</span>
                  </th>
                  {r.marks.map((m, k) => <td key={k}><Cell m={m} /></td>)}
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="source" style={{ marginTop: 12 }}>
          <Cell m="yes" /> yes · <Cell m="part" /> partly or only in some places · <Cell m="no" /> no. Assessments are ours, from the public descriptions cited. Unfound's marks hold for the services that join it; see <a href="#scope">Scope</a>.
        </p>
        <p className="source accessed">Sources accessed 22–27 October 2026. Programs and products change; check the cited pages for their current features.</p>
      </div>
    </section>
  );
}

export const REFS: { n: number; text: string; url: string; on?: string }[] = [
  { n: 1, text: "Australian Bureau of Statistics. Personal Safety, Australia 2021–22: Partner violence.", url: "https://www.abs.gov.au/statistics/people/crime-and-justice/partner-violence/2021-22" },
  { n: 2, text: "Crime and Corruption Commission Queensland. Operation Impala, Exhibit 95: misuse of confidential information, 2015–2019.", url: "https://www.ccc.qld.gov.au/sites/default/files/Docs/Public-Hearings/Impala/Exhibits/Operation-Impala-Exhibit-95-Queensland-Police-Service-Complaints-and-Allegations-Data-Analysis.PDF" },
  { n: 3, text: "Crime and Corruption Commission Queensland. Agencies must ensure Queenslanders' confidential information is protected (2020).", url: "https://www.ccc.qld.gov.au/news/agencies-must-ensure-queenslanders-confidential-information-protected" },
  { n: 4, text: "UN Viet Nam, MOLISA, GSO, UNFPA, DFAT. National Study on Violence against Women in Viet Nam 2019.", url: "https://vietnam.un.org/en/53665-journey-change-second-national-study-violence-against-women-viet-nam-2019-released" },
  { n: 5, text: "QCAT finds Queensland Police Service liable after an officer leaked a survivor's address (reported 2018–2019).", url: "https://www.sydneycriminallawyers.com.au/?p=41673" },
  { n: 6, text: "AAP. Police privacy breach puts DV survivors' lives at risk (QPrime auto-population, Information Commissioner).", url: "https://aapnews.aap.com.au/news/police-privacy-breach-puts-dv-survivors-lives-at-risk" },
  { n: 7, text: "VnEconomy. Thousands of GB of personal data collected and traded illegally in Viet Nam.", url: "https://vneconomy.vn/phat-hien-hang-nghin-gb-du-lieu-ca-nhan-bi-thu-thap-mua-ban-trai-phep-trong-do-co-nhieu-du-lieu-nhay-cam.htm" },
  { n: 8, text: "Australian Electoral Commission. Silent electors.", url: "https://www.aec.gov.au/enrol/special_category/silent-elector.htm" },
  { n: 9, text: "Washington Secretary of State. Address Confidentiality Program.", url: "https://www.sos.wa.gov/acp" },
  { n: 10, text: "Address confidentiality program (overview of US state programs).", url: "https://en.wikipedia.org/wiki/Address_confidentiality_program" },
  { n: 11, text: "Tide. Beyond cybersecurity: how to think about Emergent Authority.", url: "https://tide.org/blog/emergent-authority-beyond-cybersecurity" },
  { n: 12, text: "Tide documentation. Core concepts: Hermetic E2EE, Quorum-Enforced Governance, tamper-proof authorization.", url: "https://docs.tide.org/Core-Concepts/core-concepts" },
  { n: 13, text: "Tide documentation. Quorum-Enforced Governance workflow.", url: "https://docs.tide.org/Core-Concepts/iga-workflow" },
  { n: 14, text: "Tide documentation. TideCloak React SDK reference (doEncrypt, doDecrypt).", url: "https://docs.tide.org/Languages/React/tidecloak-react-reference" },
  { n: 15, text: "Tide. UNLOCKED, Challenge 2 of the RMIT hackathon.", url: "https://tide.org/unlocked/" },
  { n: 16, text: "UK Information Commissioner's Office. Data breaches put domestic abuse victims' lives at risk (seven reprimands since June 2022), 29 Sep 2023.", url: "https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2023/09/data-breaches-put-domestic-abuse-victims-lives-at-risk-uk-information-commissioner-warns/", on: "27 Oct 2026" },
  { n: 17, text: "UK Information Commissioner's Office. Reprimand to Charnwood Borough Council, 29 Nov 2023.", url: "https://ico.org.uk/action-weve-taken/enforcement/charnwood-borough-council", on: "27 Oct 2026" },
  { n: 18, text: "Office of the Information Commissioner Queensland. Prioritising privacy to keep victims safe, Dec 2025.", url: "https://www.oic.qld.gov.au/government/compliance-and-audit-reports/prioritising-privacy-to-keep-victims-safe", on: "26 Oct 2026" },
];

export function References() {
  return (
    <section id="references" className="section refs">
      <div className="container">
        <div className="refs-grid">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <Reveal><span className="eyebrow">References</span></Reveal>
            <h2 className="refs-title"><Words text="Sources." /></h2>
            <Reveal delay={0.1}><p>Statistics were checked against the primary documents where they were available.</p></Reveal>
            <p className="source accessed">Links accessed 22–27 October 2026.</p>
          </div>
          <ol className="refs-list">
            {REFS.map((r) => (
              <li key={r.n} id={`ref-${r.n}`}>
                <span className="ref-n">{String(r.n).padStart(2, "0")}</span>
                <span>
                  <a href={r.url} target="_blank" rel="noreferrer">{r.text}</a>
                  <span className="ref-date"> Accessed {r.on ?? "22 Oct 2026"}.</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
