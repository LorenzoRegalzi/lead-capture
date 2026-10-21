// Apps Script web app that receives leads from /api/save-lead and writes them to the Sheet.
// Setup: Project Settings → Script Properties → add SHEET_ID with the spreadsheet id.
const SHEET_ID = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
const SHEET_NAME = "Foglio1";
const SUBMISSION_ID_COLUMN = 11; // column K

function doPost(e) {
  const lock = LockService.getScriptLock();
  // Wait up to 30s for other submissions to finish writing
  if (!lock.tryLock(30000)) {
    return json({ status: "error", message: "Server busy, please retry" });
  }

  try {
    const payload = JSON.parse(e.postData.contents);

    if (!Array.isArray(payload.barcodes) || payload.barcodes.length === 0) {
      throw new Error("barcodes must be a non-empty array");
    }

    const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
    const submissionId = payload.submissionId || "";

    // A resend of a lead that is already in the sheet: don't write it twice
    if (submissionId && isAlreadySaved(sheet, submissionId)) {
      return json({ status: "ok", inserted_rows: 0, duplicate: true });
    }

    // Same date the app shows in its history/CSV; falls back to now for old clients
    const parsed = payload.submittedAt ? new Date(payload.submittedAt) : null;
    const date = parsed && !isNaN(parsed) ? parsed : new Date();

    const rows = payload.barcodes.map(item => [
      date,
      item.storeName || "",
      item.storeNumber || "",
      item.barcode || "",
      item.quantity || 0,
      item.photo_1 || "",
      item.photo_2 || "",
      item.photo_3 || "",
      item.photo_4 || "",
      "",
      submissionId,
    ]);

    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    SpreadsheetApp.flush(); // write before releasing the lock

    return json({ status: "ok", inserted_rows: rows.length });
  } catch (err) {
    return json({ status: "error", message: err.message });
  } finally {
    lock.releaseLock();
  }
}

function isAlreadySaved(sheet, submissionId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return false;
  return sheet
    .getRange(1, SUBMISSION_ID_COLUMN, lastRow, 1)
    .createTextFinder(submissionId)
    .matchEntireCell(true)
    .findNext() !== null;
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
