function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Verifica che esista l'array barcodes
    if (!payload.barcodes || !Array.isArray(payload.barcodes)) {
      throw new Error("barcodes non è un array");
    }

    const sheet = SpreadsheetApp
      .openById("<SHEET_ID>")
      .getSheetByName("Foglio1");

    const now = new Date();

    const rows = payload.barcodes.map(item => [
      now,
      item.storeName || "",    // Store Name
      item.storeNumber || "",  // Store Number
      item.barcode || "",
      item.quantity || 0,
      item.photo_1 || "",
      item.photo_2 || "",
      item.photo_3 || "",
      item.photo_4 || "",
      "",
    ]);

    sheet.getRange(
      sheet.getLastRow() + 1,
      1,
      rows.length,
      rows[0].length
    ).setValues(rows);

    return ContentService
      .createTextOutput(JSON.stringify({
        status: "ok",
        inserted_rows: rows.length
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: "error",
        message: err.message
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
