import { sql } from "@/lib/db";
import type { CeidAccount, CeidRole } from "@/types/ceid";

interface AccountRow {
  id: string | number;
  cursor_sub: string;
  netid: string;
  display_name: string;
  email: string;
  role: CeidRole;
  affiliations: string[] | null;
  auth_source: "yale_cas" | "demo";
  college: string;
  class_year: string;
  created_at: string | Date;
  updated_at: string | Date;
  last_login_at: string | Date;
}

function mapRow(row: AccountRow): CeidAccount {
  return {
    id: Number(row.id),
    cursorSub: row.cursor_sub,
    netid: row.netid,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    affiliations: row.affiliations || [],
    authSource: row.auth_source,
    college: row.college,
    classYear: row.class_year,
    lastLoginAt: new Date(row.last_login_at).toISOString(),
  };
}

export async function getAccountByCursorSub(
  cursorSub: string
): Promise<CeidAccount | null> {
  const rows = await sql<AccountRow>(
    `select * from ceid_accounts where cursor_sub = $1 limit 1`,
    [cursorSub]
  );
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function upsertAccount(input: {
  cursorSub: string;
  netid: string;
  displayName: string;
  email: string;
  role: CeidRole;
  affiliations: string[];
  authSource: "yale_cas" | "demo";
  college?: string;
  classYear?: string;
}): Promise<CeidAccount> {
  // Demo must never clobber a Yale CAS–verified account (role/affiliations).
  if (input.authSource === "demo") {
    const existing = await getAccountByCursorSub(input.cursorSub);
    if (existing?.authSource === "yale_cas") {
      throw new Error("Cannot overwrite a Yale CAS–linked account with demo auth");
    }
  }

  const rows = await sql<AccountRow>(
    `insert into ceid_accounts (
      cursor_sub, netid, display_name, email, role, affiliations, auth_source, college, class_year, last_login_at, updated_at
    ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9, now(), now())
    on conflict (cursor_sub) do update set
      netid = excluded.netid,
      display_name = excluded.display_name,
      email = excluded.email,
      role = excluded.role,
      affiliations = excluded.affiliations,
      auth_source = excluded.auth_source,
      college = excluded.college,
      class_year = excluded.class_year,
      last_login_at = now(),
      updated_at = now()
    where ceid_accounts.auth_source is distinct from 'yale_cas'
       or excluded.auth_source = 'yale_cas'
    returning *`,
    [
      input.cursorSub,
      input.netid.toLowerCase(),
      input.displayName,
      input.email,
      input.role,
      input.affiliations,
      input.authSource,
      input.college || "",
      input.classYear || "",
    ]
  );
  if (!rows[0]) {
    const kept = await getAccountByCursorSub(input.cursorSub);
    if (kept) return kept;
    throw new Error("Account upsert failed");
  }
  return mapRow(rows[0]);
}

export async function unlinkAccount(cursorSub: string): Promise<void> {
  await sql(`delete from ceid_accounts where cursor_sub = $1`, [cursorSub]);
}

export async function listRsvpRoster() {
  return sql<{
    workshop_id: string;
    workshop_title: string;
    starts_at: string | Date | null;
    location: string;
    netid: string;
    display_name: string;
    role: string;
    claimed_at: string | Date;
  }>(
    `select workshop_id, workshop_title, starts_at, location, netid, display_name, role, claimed_at
     from ceid_rsvp_roster
     order by claimed_at desc
     limit 100`
  );
}

export async function recordRsvp(input: {
  workshopId: string;
  workshopTitle: string;
  startsAt?: string;
  location: string;
  cursorSub: string;
  netid: string;
  displayName: string;
  role: CeidRole;
}) {
  await sql(
    `insert into ceid_rsvp_roster (
      workshop_id, workshop_title, starts_at, location, cursor_sub, netid, display_name, role
    ) values ($1,$2,$3,$4,$5,$6,$7,$8)
    on conflict (workshop_id, cursor_sub) do update set
      workshop_title = excluded.workshop_title,
      claimed_at = now()`,
    [
      input.workshopId,
      input.workshopTitle,
      input.startsAt || null,
      input.location,
      input.cursorSub,
      input.netid,
      input.displayName,
      input.role,
    ]
  );
}

export async function listAnnouncements() {
  return sql<{
    id: string | number;
    author_name: string;
    body: string;
    created_at: string | Date;
  }>(
    `select id, author_name, body, created_at from ceid_floor_announcements order by created_at desc limit 20`
  );
}

export async function createAnnouncement(input: {
  authorSub: string;
  authorName: string;
  body: string;
}) {
  const rows = await sql<{ id: string | number }>(
    `insert into ceid_floor_announcements (author_sub, author_name, body)
     values ($1,$2,$3) returning id`,
    [input.authorSub, input.authorName, input.body]
  );
  return rows[0];
}
