/**
 * Production Checklist — run log.
 *
 * Paste this into Extensions → Apps Script of the Google Sheet that should
 * hold the log, then deploy it as a Web app (see SETUP.md).
 * Each finished checklist in the app adds one row to the "Runs" tab.
 *
 * It also serves the admin page (admin.html): after a correct username and
 * password it returns every logged run. The login is set in
 * Project Settings → Script properties as ADMIN_USER and ADMIN_PASSWORD,
 * so it never appears in the public website code.
 */

const SHEET_NAME = "Runs";
const HEADERS = [
  "Date", "Name", "Area", "Routine", "Started", "Finished",
  "Minutes", "Steps done", "Notes", "Logged at", "Run ID",
];

const SESSION_SECONDS = 6 * 60 * 60; // admin stays signed in for 6 hours (Apps Script cache max)
const MAX_FAILED_LOGINS = 5;          // then logins are refused for 15 minutes

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: "Bad request" });
  }
  if (d.action === "login") return adminLogin_(d);
  if (d.action === "runs") return adminRuns_(d);
  if (d.action === "logout") {
    if (d.token) CacheService.getScriptCache().remove("session:" + d.token);
    return json_({ ok: true });
  }
  return logRun_(d);
}

// ---------- Logging finished checklists (called by the app) ----------

function logRun_(d) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!d.runId || !d.name || !d.date) throw new Error("Missing runId, name or date");

    const sheet = getSheet_();
    // The app retries when it can't confirm a save, so skip runs already logged.
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const ids = sheet.getRange(2, HEADERS.length, lastRow - 1, 1).getValues().flat();
      if (ids.indexOf(d.runId) !== -1) return json_({ ok: true, duplicate: true });
    }

    const tz = Session.getScriptTimeZone();
    const time = (iso) => (iso ? Utilities.formatDate(new Date(iso), tz, "h:mm a") : "");
    sheet.appendRow([
      d.date, d.name, d.area, d.routine, time(d.startedAt), time(d.finishedAt),
      d.minutes, d.stepsDone, d.notes, new Date(), d.runId,
    ].map(safe_));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// ---------- Admin page ----------

function adminLogin_(d) {
  const cache = CacheService.getScriptCache();
  const props = PropertiesService.getScriptProperties();
  const user = props.getProperty("ADMIN_USER");
  const pass = props.getProperty("ADMIN_PASSWORD");
  if (!user || !pass) return json_({ ok: false, error: "Admin login is not set up yet (see SETUP.md, step 5)." });

  const failed = Number(cache.get("failedLogins") || 0);
  if (failed >= MAX_FAILED_LOGINS) return json_({ ok: false, error: "Too many attempts. Try again in 15 minutes." });

  // Compare hashes so the check takes the same time whether the first letter or the last one is wrong.
  const ok = digest_(String(d.username || "").trim().toLowerCase()) === digest_(user.trim().toLowerCase()) &&
             digest_(String(d.password || "")) === digest_(pass);
  if (!ok) {
    cache.put("failedLogins", String(failed + 1), 15 * 60);
    return json_({ ok: false, error: "Wrong username or password." });
  }
  cache.remove("failedLogins");
  const token = Utilities.getUuid();
  cache.put("session:" + token, "1", SESSION_SECONDS);
  return json_({ ok: true, token: token });
}

function adminRuns_(d) {
  if (!d.token || !CacheService.getScriptCache().get("session:" + d.token)) {
    return json_({ ok: false, error: "session_expired" });
  }
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  // Display values = exactly what the sheet shows (dates stay "2026-10-31", not shifted by time zone).
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getDisplayValues() : [];
  const runs = rows.map((r) => ({
    date: r[0], name: r[1], area: r[2], routine: r[3], started: r[4], finished: r[5],
    minutes: r[6], stepsDone: r[7], notes: r[8], loggedAt: r[9], runId: r[10],
  }));
  return json_({ ok: true, runs: runs });
}

function digest_(s) {
  return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8));
}

// Visiting the Web app URL in a browser shows this — handy to check the deployment works.
function doGet() {
  return json_({ ok: true, message: "Production log is running." });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

// Anyone with the URL can post, so never let text be treated as a formula.
function safe_(v) {
  if (typeof v === "string" && /^[=+\-@]/.test(v)) return "'" + v;
  return v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
