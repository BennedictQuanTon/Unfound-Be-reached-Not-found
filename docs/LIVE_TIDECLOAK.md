# Live mode with a real TideCloak realm

The demo switches to **Live · TideCloak** when `public/tidecloak.json` exists. In live mode:

- Sign-in uses TideCloak (BYOiD, no password hash stored).
- `Seal my address` calls `doEncrypt` and `Show / Check zone / Try to open` call `doDecrypt` through Tide's network.
- Dan's **Roles** tab shows a "Run it on the real realm" panel that calls the Admin API: `addUserRoles` → `getPendingChangeSets` → `commitChangeSet`. Results land in the Fabric log.
- Approvers vote in the TideCloak admin console (QEA approvals inbox).

## 1. Server and realm

On Windows, run `bash scripts/setup-local.sh` from Git Bash with Docker Desktop installed.

```bash
docker run --name mytidecloak -d -p 8080:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin -e KC_BOOTSTRAP_ADMIN_PASSWORD=password \
  tideorg/tidecloak-dev:latest

mkdir -p ~/tide-setup && cd ~/tide-setup
npm init @tidecloak/nextjs@latest unfound-realm   # accept defaults
```

When the initializer prints `ACTION REQUIRED: Open this URL and complete Tide enrollment`, open it and finish enrolment. That account becomes the first realm admin. Then copy the generated `tidecloak.json` (in the new project folder) to this repo's `public/tidecloak.json`.

The initializer registers `http://localhost:3000` as the client URL, which is the port `npm run dev` uses here.

## Shortcut

After the initializer and your Tide enrolment have finished, one command does steps 1 (copy) and 2–3 (roles):

```bash
node tools/tide-setup.mjs ~/tide-setup/unfound-realm unfound
```

It copies `tidecloak.json` into `public/`, creates the six `_tide_addr*` roles, creates any missing persona users (`linh`, `school`, `gpclinic`, `dan`, `mai`, `ruth`, `officer`) and gives each one only its `_tide_addr*` roles from §3. It does not grant `tide-realm-admin`: give that to dan, mai and ruth in the admin console. With Quorum-Enforced Governance on, approve each resulting change set in the admin console, then rerun the script.

## 2. Roles (realm roles)

| Role | Purpose |
|------|---------|
| `_tide_addrfull.selfencrypt` / `_tide_addrfull.selfdecrypt` | Full address |
| `_tide_addrzone.selfencrypt` / `_tide_addrzone.selfdecrypt` | School zone |
| `_tide_addrcontact.selfencrypt` / `_tide_addrcontact.selfdecrypt` | Contact relay |

## 3. Users

Usernames must match the persona ids so the app knows who is signed in.

| Username | Roles |
|----------|-------|
| `linh` | all six `_tide_addr*` roles |
| `school` | `_tide_addrzone.selfdecrypt` |
| `gpclinic` (the GP persona; usernames need 3+ characters) | `_tide_addrcontact.selfdecrypt` |
| `dan` | `tide-realm-admin` |
| `mai` | `tide-realm-admin`, the three `.selfencrypt` roles |
| `ruth` | `tide-realm-admin` |
| `officer` | none |

Invite each user with its Tide link (Admin console → user → "Link Tide account", or `AdminAPI.getTideLinkUrl`).

Once a second `tide-realm-admin` exists, the realm is in multi-admin mode and every role change needs `max(1, floor(0.7 × N))` approvals. With dan, mai and ruth that is **2 of 3**. Approve your own setup changes in the QEA approvals inbox before inviting the next admin.

## 4. Check before recording

1. Sign in as `linh` → Seal my address → the Fabric log shows `doEncrypt … OK`.
2. Sign in as `school` → Check zone → `OK`. Try to open → `DENIED`.
   This step confirms Tide releases a tag to a different user who holds the role. If it fails, ask in Tide's Discord #support and record steps 3–4 in live mode and step 2 in mock mode.
3. Sign in as `dan` → Roles → Run it on the real realm → 1, 2, 3. Expect a pending change set and a refused commit.
4. Sign in to the admin console as `mai` and `ruth` and approve or deny in the QEA inbox.

Set `VITE_UNFOUND_MODE=mock` to force mock mode even when `tidecloak.json` is present.
