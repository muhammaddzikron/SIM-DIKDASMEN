/**
 * SIM DIKDASMEN - Google Apps Script
 * =================================
 * Skenario Penggunaan:
 * 1. Buka spreadsheet Google Sheets Anda (https://docs.google.com/spreadsheets/d/1BmBbXaumg7iI7YGn_8_mNBThOeqnR8YGrncXr0dgxbg/edit)
 * 2. Klik menu "Ekstensi" (Extensions) > "Apps Script".
 * 3. Hapus semua kode default di dalam editor script, lalu tempelkan seluruh kode ini.
 * 4. Simpan dengan menekan tombol save (ikon disket) atau Ctrl+S.
 * 5. Jalankan fungsi 'setupDatabase' sekali untuk memastikan semua sheet dan kolom terinisialisasi secara otomatis.
 *
 * Fitur Script:
 * - setupDatabase: Membuat sheet Users, Cabang, Sekolah, Guru, KepalaSekolah, Siswa, SKGuru, SKKepalaSekolah, Notifikasi, LogAktivitas, dan Setting otomatis.
 * - doGet/doPost: Bertindak sebagai Web App API endpoint opsional untuk membaca/menulis data via JSON tanpa OAuth kompleks.
 * - onEditTrigger: Otomatis memantau perubahan status SK dan mengirimkan email pemberitahuan ke sekolah penerima.
 */

// Definisi Struktur Kolom Database SIM DIKDASMEN (Versi Terbaru)
var SHEET_COLUMNS = {
  "Users": ["id", "email", "name", "role", "password", "cabangId", "sekolahId", "createdAt"],
  "Cabang": ["id", "name", "code"],
  "Sekolah": ["id", "name", "npsn", "cabangId", "address", "status", "level"],
  "Guru": ["id", "name", "nipm", "pobDob", "gender", "schoolId", "status", "position", "nbm", "skNumber", "tmtAwal", "education", "educationProdi", "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "phone", "persyarikatanActivity"],
  "TenagaKependidikan": ["id", "name", "nipm", "nip", "pobDob", "gender", "schoolId", "status", "position", "nbm", "skNumber", "tmtAwal", "education", "educationProdi", "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "phone", "persyarikatanActivity"],
  "KepalaSekolah": ["id", "name", "nipm", "pobDob", "gender", "schoolId", "status", "position", "nbm", "skNumber", "tmtAwal", "education", "educationProdi", "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "phone", "persyarikatanActivity"],
  "Siswa": ["id", "name", "gender", "nisn", "pobDob", "schoolId", "class", "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "status"],
  "SKGuru": ["id", "skNumber", "skDate", "skEndDate", "title", "guruId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "SKTenagaKependidikan": ["id", "skNumber", "skDate", "skEndDate", "title", "tendikId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "SKKepalaSekolah": ["id", "skNumber", "skDate", "skEndDate", "title", "kepalaSekolahId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "Notifikasi": ["id", "title", "message", "type", "isRead", "createdAt"],
  "LogAktivitas": ["id", "userEmail", "action", "details", "timestamp"],
  "Setting": ["key", "value"]
};

/**
 * 1. INISIALISASI DATABASE SPREADSHEET
 * Membuat sheet/tab baru beserta kolom headernya jika belum ada di spreadsheet aktif.
 */
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetsCreated = [];
  var sheetsExisting = [];

  for (var sheetName in SHEET_COLUMNS) {
    var sheet = ss.getSheetByName(sheetName);
    var headers = SHEET_COLUMNS[sheetName];

    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      // Atur baris pertama sebagai header kolom
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      // Styling Header: Bold, background slate, teks putih, border tipis
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1E293B");
      headerRange.setFontColor("#FFFFFF");
      sheet.setFrozenRows(1);
      
      // Auto-fit kolom
      for (var col = 1; col <= headers.length; col++) {
        sheet.autoResizeColumn(col);
      }
      sheetsCreated.push(sheetName);
    } else {
      sheetsExisting.push(sheetName);
    }
  }

  Logger.log("Inisialisasi Selesai!");
  Logger.log("Sheet Baru Dibuat: " + sheetsCreated.join(", "));
  Logger.log("Sheet Sudah Ada: " + sheetsExisting.join(", "));
  
  return {
    status: "success",
    message: "Inisialisasi Selesai!",
    created: sheetsCreated,
    existing: sheetsExisting
  };
}

/**
 * 2. WEB APP API ENDPOINTS (OPSIONAL)
 * Mengizinkan aplikasi eksternal membaca data via GET request.
 */
function doGet(e) {
  var action = e.parameter.action;
  var sheetName = e.parameter.sheet;
  
  if (!action || !sheetName) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Parameter 'action' dan 'sheet' wajib diisi."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Sheet '" + sheetName + "' tidak ditemukan."
    })).setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "read") {
    var data = readSheetData(sheet);
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      data: data
    })).setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({
    error: "Action tidak dikenal."
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Mengizinkan penulisan data via POST request (JSON Payload).
 */
function doPost(e) {
  try {
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;
    var sheetName = postData.sheet;
    var payload = postData.payload;

    if (!action || !sheetName || !payload) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Missing parameters: action, sheet, or payload."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Sheet '" + sheetName + "' tidak ditemukan."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "insert") {
      var headers = SHEET_COLUMNS[sheetName];
      var newRow = [];
      for (var i = 0; i < headers.length; i++) {
        var key = headers[i];
        newRow.push(payload[key] !== undefined ? payload[key] : "");
      }
      sheet.appendRow(newRow);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil ditambahkan!"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "update") {
      var id = payload.id;
      var headers = SHEET_COLUMNS[sheetName];
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var idColIdx = headers.indexOf("id") + 1;
        if (idColIdx === 0) idColIdx = headers.indexOf("key") + 1; // Support settings
        var ids = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
        for (var r = 0; r < ids.length; r++) {
          if (String(ids[r][0]) === String(id)) {
            var rowIndex = r + 2;
            for (var k = 0; k < headers.length; k++) {
              var colName = headers[k];
              if (payload[colName] !== undefined) {
                sheet.getRange(rowIndex, k + 1).setValue(payload[colName]);
              }
            }
            return ContentService.createTextOutput(JSON.stringify({
              status: "success",
              message: "Data berhasil diperbarui!"
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        error: "Record dengan ID " + id + " tidak ditemukan."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "delete") {
      var id = payload.id;
      var headers = SHEET_COLUMNS[sheetName];
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var idColIdx = headers.indexOf("id") + 1;
        if (idColIdx === 0) idColIdx = headers.indexOf("key") + 1;
        var ids = sheet.getRange(2, idColIdx, lastRow - 1, 1).getValues();
        for (var r = 0; r < ids.length; r++) {
          if (String(ids[r][0]) === String(id)) {
            sheet.deleteRow(r + 2);
            return ContentService.createTextOutput(JSON.stringify({
              status: "success",
              message: "Data berhasil dihapus!"
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        error: "Record dengan ID " + id + " tidak ditemukan."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      error: "Action POST tidak dikenal."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Helper untuk membaca seluruh baris data dari sheet dan memetakan ke JSON Array.
 */
function readSheetData(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  if (lastRow <= 1) return [];

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var result = [];

  for (var r = 0; r < values.length; r++) {
    var row = values[r];
    var item = {};
    for (var c = 0; c < headers.length; c++) {
      item[headers[c]] = row[c];
    }
    result.push(item);
  }
  return result;
}

/**
 * 3. OTOMATISASI DAN TRIGGER EMAIL (REAL-TIME ACTION)
 * Terpicu otomatis jika admin mengubah status SK menjadi "Terbit".
 */
function onEdit(e) {
  var range = e.range;
  var sheet = range.getSheet();
  var sheetName = sheet.getName();
  
  // Deteksi edit di sheet SKGuru, SKTenagaKependidikan, atau SKKepalaSekolah
  if (sheetName === "SKGuru" || sheetName === "SKTenagaKependidikan" || sheetName === "SKKepalaSekolah") {
    var row = range.getRow();
    var col = range.getColumn();
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Cari index kolom "status" dan "title"
    var colStatusIdx = headers.indexOf("status") + 1;
    var colTitleIdx = headers.indexOf("title") + 1;
    var colSkNumberIdx = headers.indexOf("skNumber") + 1;

    if (col === colStatusIdx && row > 1) {
      var newValue = range.getValue();
      
      // Jika status berubah menjadi "Terbit"
      if (newValue === "Terbit") {
        var skTitle = sheet.getRange(row, colTitleIdx).getValue();
        var skNum = sheet.getRange(row, colSkNumberIdx).getValue();
        
        // Catat ke LogAktivitas otomatis
        logSystemActivity(
          "TRIGGER_SYSTEM", 
          "SK Terbit Terdeteksi secara real-time: No " + skNum + " (" + skTitle + ")"
        );
        
        // Opsional: Kirim email pemberitahuan ke admin cabang/sekolah
        // (Silakan aktifkan dengan menghapus tanda komentar di bawah jika email pengirim dikonfigurasi)
        /*
        MailApp.sendEmail({
          to: "dikdasmen.klaten@gmail.com",
          subject: "[SIM DIKDASMEN] Pemberitahuan Penerbitan SK Baru",
          body: "Yth. Pimpinan Cabang & Kepala Sekolah,\n\nDengan hormat diberitahukan bahwa SK baru telah diterbitkan:\n\n" +
                "Nomor SK: " + skNum + "\n" +
                "Judul SK: " + skTitle + "\n" +
                "Status: TERBIT & AKTIF\n\n" +
                "Silakan login ke dashboard SIM DIKDASMEN Klaten untuk mengunduh lampiran SK tersebut.\n\n" +
                "Terima kasih.\n--\nSIM DIKDASMEN - © MPI PDM Klaten"
        });
        */
      }
    }
  }
}

/**
 * Helper untuk menulis aktivitas ke sheet LogAktivitas
 */
function logSystemActivity(action, details) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var logSheet = ss.getSheetByName("LogAktivitas");
  if (logSheet) {
    var logId = "log-auto-" + Math.random().toString(36).substr(2, 5);
    var timestamp = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss");
    logSheet.appendRow([logId, "system-automation@mpi-pdm-klaten.org", action, details, timestamp]);
  }
}
