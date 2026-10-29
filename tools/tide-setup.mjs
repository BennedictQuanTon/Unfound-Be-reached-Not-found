// One-shot live setup, run after the TideCloak initializer and your Tide enrolment have finished:
//   node tools/tide-setup.mjs [path-to-generated-project] [realm]
// 1. copies the generated tidecloak.json into public/
// 2. creates the six _tide_addr* realm roles
// 3. creates the persona users (linh, school, gp, mai, dan, ruth, officer) if missing and gives each
//    only the _tide_addr* roles its persona needs (docs/LIVE_TIDECLOAK.md §3); other users are untouched
//    (with QEA on, approve the change sets in the admin console, then rerun this script)

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const project = process.argv[2] ?? path.join(os.homedir(), "tide-setup", "unfound-realm");
const realm = process.argv[3] ?? process.env.TIDE_REALM ?? "unfound";
const base = process.env.TIDECLOAK_URL ?? "http://localhost:8080";
const admin = { user: process.env.TC_ADMIN ?? "admin", pass: process.env.TC_PASS ?? process.env.KC_BOOTSTRAP_ADMIN_PASSWORD };
if (!admin.pass) {
  console.error("Set TC_PASS (or KC_BOOTSTRAP_ADMIN_PASSWORD) to your local TideCloak master admin password.");
  process.exit(2);
}

function find(dir, name, depth = 0) {
  if (depth > 4 || !fs.existsSync(dir)) return null;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isFile() && e.name === name) return p;
    if (e.isDirectory()) {
      const hit = find(p, name, depth + 1);
      if (hit) return hit;
    }
  }
  return null;
}

const cfg = find(project, "tidecloak.json");
const parsed = cfg ? JSON.parse(fs.readFileSync(cfg, "utf8") || "{}") : {};
if (!cfg || !parsed.realm) {
  console.error(`No tidecloak.json under ${project}. Finish "bash init/tcinit.sh" and the Tide enrolment first.`);
  process.exit(1);
}
fs.copyFileSync(cfg, path.resolve("public/tidecloak.json"));
console.log(`✔ copied ${cfg} → public/tidecloak.json`);

const tok = await fetch(`${base}/realms/master/protocol/openid-connect/token`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "password", client_id: "admin-cli", username: admin.user, password: admin.pass }),
}).then((r) => r.json());
if (!tok.access_token) {
  console.error("Could not sign in to the master realm:", tok);
  process.exit(1);
}
const api = (p, init = {}) =>
  fetch(`${base}/admin/realms/${realm}${p}`, { ...init, headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json", ...(init.headers ?? {}) } });

const names = ["addrfull", "addrzone", "addrcontact"].flatMap((t) => [`_tide_${t}.selfencrypt`, `_tide_${t}.selfdecrypt`]);
for (const name of names) {
  const r = await api("/roles", { method: "POST", body: JSON.stringify({ name, description: "Unfound address tag" }) });
  console.log(`${r.status === 201 ? "✔ created" : r.status === 409 ? "• exists " : r.status === 202 ? "• change set (approve it in the admin console)" : `✖ ${r.status}`} ${name}`);
}
const roles = await Promise.all(names.map((n) => api(`/roles/${encodeURIComponent(n)}`).then((r) => r.json())));

// Which _tide_addr* roles each persona's username holds (docs/LIVE_TIDECLOAK.md §3). Anyone not listed here is
// left alone. Usernames need 3+ characters, so the gp persona signs in as "gpclinic" (mapped back in live.tsx).
const personas = {
  linh: names,
  school: ["_tide_addrzone.selfdecrypt"],
  gpclinic: ["_tide_addrcontact.selfdecrypt"],
  mai: ["_tide_addrfull.selfencrypt", "_tide_addrzone.selfencrypt", "_tide_addrcontact.selfencrypt"],
  dan: [],
  ruth: [],
  officer: [],
};
const findUser = async (id) => {
  const list = await api(`/users?username=${encodeURIComponent(id)}&exact=true`).then((r) => r.json());
  return Array.isArray(list) ? list[0] : undefined;
};
// Users whose creation is already waiting for approval: posting again would file a duplicate change request.
const pending = await api("/iga/change-requests?status=PENDING").then((r) => (r.ok ? r.json() : []));
const pendingUsers = new Set((Array.isArray(pending) ? pending : []).filter((c) => c.actionType === "CREATE_USER").map((c) => c.rows?.[0]?.USERNAME));
for (const [id, wanted] of Object.entries(personas)) {
  let user = await findUser(id);
  if (!user && pendingUsers.has(id)) {
    console.log(`• ${id}: creation already waiting for approval in the admin console`);
    continue;
  }
  if (!user) {
    // Tide realms require an email; .example is reserved, so these can never reach a real inbox.
    const r = await api("/users", { method: "POST", body: JSON.stringify({ username: id, email: `${id}@unfound.example`, enabled: true, emailVerified: false, attributes: { tideInvitable: ["true"] } }) });
    console.log(r.status === 201 ? `✔ created ${id}` : r.status === 202 ? `• ${id}: change set created, approve it in the admin console (QEA)` : `✖ ${r.status} ${id}`);
    user = await findUser(id);
  }
  if (!user) {
    console.log(`→ ${id}: not created yet, its roles will be assigned on a rerun after approval`);
    continue;
  }
  if (!wanted.length) continue;
  const mine = roles.filter((role) => wanted.includes(role.name));
  const r = await api(`/users/${user.id}/role-mappings/realm`, { method: "POST", body: JSON.stringify(mine) });
  const note = r.status === 202 ? "change set created, approve it in the admin console (QEA)" : r.status === 204 ? "assigned" : `status ${r.status}`;
  console.log(`→ ${id}: ${note}`);
}
console.log(
  '\nNext: in the admin console give tide-realm-admin to dan, mai and ruth; invite each persona with "Link Tide account"; approve any change sets, then rerun this script. Then restart `npm run dev`, sign in with Tide on /demo, and Seal my address.',
);
