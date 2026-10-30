/**
 * Production Checklist — run log.
 *
 * Paste this into Extensions → Apps Script of the Google Sheet that should
 * hold the log, then deploy it as a Web app (see SETUP.md).
 * Each finished checklist in the app adds one row to the "Runs" tab.
 */

const SHEET_NAME = "Runs";
const HEADERS = [
  "Date", "Name", "Area", "Routine", "Started", "Finished",
  "Minutes", "Steps done", "Notes", "Logged at", "Run ID",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
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
