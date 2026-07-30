export const APPS_SCRIPT_CODE = `/**
 * ==============================================================================
 * SIM DIKDASMEN - GOOGLE APPS SCRIPT WEB APP ENGINE (COMPLETE CODE.GS)
 * ==============================================================================
 * SCRIPT INI DIPASANG DI GOOGLE APPS SCRIPT PADA SPREADSHEET TARGET ANDA.
 * 
 * CARA MEMASANG & MEMPERBARUI DI GOOGLE APPS SCRIPT:
 * 1. Buka Google Sheets Database Anda di browser.
 * 2. Klik menu Extensi (Extensions) > Apps Script.
 * 3. Hapus seluruh isi kode bawaan (jika ada), lalu TEMPEL (PASTE) SELURUH KODE INI.
 * 4. Klik ikon Disket (Simpan / Save project).
 * 5. Klik tombol "Terapkan" / "Deploy" (di pojok kanan atas) > "Terapkan sebagai web app" / "New deployment".
 * 6. Pilih Jenis (Select type): "Web app".
 * 7. Deskripsi (Description): "SIM Dikdasmen API v2 - Cross Device Sync"
 * 8. Jalankan sebagai (Execute as): "Saya" / "Me" (Email Google Anda)
 * 9. Yang memiliki akses (Who has access): "Siapa saja" / "Anyone" (SANGAT PENTING!)
 * 10. Klik "Terapkan" / "Deploy", berikan Izin Akses (Authorize Access) jika diminta.
 * 11. Salin (Copy) URL Web App yang dihasilkan (berakhiran /exec).
 * 12. Tempel URL tersebut di Pengaturan Aplikasi SIM Dikdasmen.
 * ==============================================================================
 */

// Structure Schema Kolom untuk Setiap Tabel
var SHEET_COLUMNS = {
  "Users": ["id", "email", "username", "name", "role", "password", "cabangId", "sekolahId", "createdAt"],
  "Cabang": ["id", "name", "code", "username", "password", "defaultEmail"],
  "Sekolah": [
    "id", "name", "npsn", "username", "password", "cabangId", "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota",
    "status", "level", "phone", "email", "website", "accreditation", "accreditationExpiryDate", "categoryCapability",
    "hasNib", "nib", "skPendirianNumber", "skPendirianDate", "skIzinOperasional", "skIzinOperasionalDate",
    "jumlahSiswaPerKelas", "jumlahKeseluruhanSiswa", "jumlahGtp", "jumlahGttp", "jumlahKeseluruhanGuru",
    "jumlahKtp", "jumlahKttp", "jumlahKeseluruhanKaryawan", "jumlahGuruSertifikasi", "jumlahGuruInpassing",
    "jumlahDpkPns", "sosmed", "operatorName", "operatorPhone", "curriculum", "vision", "mission", "description", "logoUrl", "bannerUrl"
  ],
  "Guru": [
    "id", "name", "nipm", "gender", "pobDob", "schoolId", "status", "guruType", "subject", "hasPpg",
    "nuptk", "nrg", "nip", "nbm", "skNumber", "tmtAwal", "education", "educationProdi",
    "address", "rtRw", "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "phone", "persyarikatanActivity"
  ],
  "TenagaKependidikan": [
    "id", "name", "nipm", "nip", "pobDob", "gender", "schoolId", "status", "position", "nbm",
    "skNumber", "tmtAwal", "education", "educationProdi", "address", "rtRw", "postalCode",
    "kelurahan", "kecamatan", "kabupatenKota", "phone", "persyarikatanActivity"
  ],
  "KepalaSekolah": [
    "id", "name", "nipm", "pobDob", "phone", "periodNumber", "nip", "schoolId", "startDate",
    "endDate", "nuptk", "nuks", "serdikStatus", "status"
  ],
  "Siswa": [
    "id", "name", "gender", "nisn", "pobDob", "schoolId", "class", "address", "rtRw",
    "postalCode", "kelurahan", "kecamatan", "kabupatenKota", "status"
  ],
  "SKGuru": ["id", "skNumber", "skDate", "skEndDate", "title", "guruId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "SKTenagaKependidikan": ["id", "skNumber", "skDate", "skEndDate", "title", "tendikId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "SKKepalaSekolah": ["id", "skNumber", "skDate", "skEndDate", "title", "kepalaSekolahId", "fileUrl", "fileId", "status", "submissionType", "nbmUrl", "ijazahUrl", "skLamaUrl"],
  "Notifikasi": ["id", "title", "message", "type", "isRead", "createdAt"],
  "LogAktivitas": ["id", "userEmail", "action", "details", "timestamp"],
  "Setting": ["key", "value"]
};

// Response helper
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Pastikan semua sheet dan header kolom tersedia otomatis
function ensureAllSheetsExist(ss) {
  var sheetNames = Object.keys(SHEET_COLUMNS);
  sheetNames.forEach(function(sheetName) {
    var sheet = ss.getSheetByName(sheetName);
    var cols = SHEET_COLUMNS[sheetName];
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(cols);
    } else {
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(cols);
      } else {
        var existingHeaders = sheet.getRange(1, 1, 1, Math.max(1, sheet.getLastColumn())).getValues()[0];
        if (!existingHeaders || existingHeaders.length === 0 || existingHeaders[0] === "") {
          sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
        }
      }
    }
  });
}

// Membaca seluruh data dari satu sheet
function readSheetData(sheet) {
  if (!sheet) return [];
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol === 0) return [];

  var data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = data[0];
  var result = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (!row[0] && row.join("").trim() === "") continue; // Lewati baris kosong
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      var header = headers[j];
      if (header) {
        var cellVal = row[j];
        if (cellVal instanceof Date) {
          obj[header] = Utilities.formatDate(cellVal, Session.getScriptTimeZone() || "GMT+7", "yyyy-MM-dd");
        } else {
          obj[header] = cellVal !== undefined && cellVal !== null ? String(cellVal) : "";
        }
      }
    }
    result.push(obj);
  }
  return result;
}

// Handler HTTP GET
function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (e && e.parameter && e.parameter.spreadsheetId) {
      try {
        ss = SpreadsheetApp.openById(e.parameter.spreadsheetId);
      } catch (err) {}
    }

    ensureAllSheetsExist(ss);

    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "readAll";
    var sheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : "";

    if (action === "ping") {
      return createJsonResponse({ status: "success", message: "Koneksi SIM Dikdasmen Apps Script Terhubung!", timestamp: new Date().toISOString() });
    }

    if (action === "init") {
      return createJsonResponse({ status: "success", message: "Seluruh sheet database berhasil diinisialisasi." });
    }

    if (action === "readAll" || !sheetName) {
      var allData = {
        users: readSheetData(ss.getSheetByName("Users")),
        cabang: readSheetData(ss.getSheetByName("Cabang")),
        sekolah: readSheetData(ss.getSheetByName("Sekolah")),
        guru: readSheetData(ss.getSheetByName("Guru")),
        tendik: readSheetData(ss.getSheetByName("TenagaKependidikan")),
        kepalaSekolah: readSheetData(ss.getSheetByName("KepalaSekolah")),
        siswa: readSheetData(ss.getSheetByName("Siswa")),
        skGuru: readSheetData(ss.getSheetByName("SKGuru")),
        skTendik: readSheetData(ss.getSheetByName("SKTenagaKependidikan")),
        skKepalaSekolah: readSheetData(ss.getSheetByName("SKKepalaSekolah")),
        notifikasi: readSheetData(ss.getSheetByName("Notifikasi")),
        logAktivitas: readSheetData(ss.getSheetByName("LogAktivitas")),
        settings: readSheetData(ss.getSheetByName("Setting"))
      };
      return createJsonResponse({ status: "success", data: allData });
    }

    if (action === "read" && sheetName) {
      var targetSheet = ss.getSheetByName(sheetName);
      if (!targetSheet) {
        return createJsonResponse({ status: "success", data: [] });
      }
      var records = readSheetData(targetSheet);
      return createJsonResponse({ status: "success", data: records });
    }

    return createJsonResponse({ status: "error", error: "Aksi GET tidak valid: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}

// Handler HTTP POST
function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = {};

    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }

    if (postData.spreadsheetId) {
      try {
        ss = SpreadsheetApp.openById(postData.spreadsheetId);
      } catch (err) {}
    }

    ensureAllSheetsExist(ss);

    var action = postData.action;
    var sheetName = postData.sheet;
    var payload = postData.payload || {};

    if (action === "init") {
      return createJsonResponse({ status: "success", message: "Database berhasil diinisialisasi." });
    }

    if (!sheetName) {
      return createJsonResponse({ status: "error", error: "Parameter sheet tidak ditemukan pada request POST." });
    }

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      var defaultCols = SHEET_COLUMNS[sheetName] || ["id"];
      sheet.appendRow(defaultCols);
    }

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (action === "insert") {
      var rowToAppend = headers.map(function(col) {
        var val = payload[col];
        return val !== undefined && val !== null ? String(val) : "";
      });
      sheet.appendRow(rowToAppend);
      return createJsonResponse({ status: "success", message: "Data berhasil ditambahkan ke sheet " + sheetName });
    }

    if (action === "update") {
      var idToUpdate = payload.id;
      if (!idToUpdate) {
        return createJsonResponse({ status: "error", error: "Payload ID wajib diisi untuk perbarui data." });
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ status: "error", error: "Data tidak ditemukan (sheet kosong)." });
      }

      var ids = sheet.getRange(1, 1, lastRow, 1).getValues();
      var targetRow = -1;
      for (var r = 1; r < ids.length; r++) {
        if (String(ids[r][0]) === String(idToUpdate)) {
          targetRow = r + 1; // 1-indexed
          break;
        }
      }

      if (targetRow === -1) {
        return createJsonResponse({ status: "error", error: "Data dengan ID " + idToUpdate + " tidak ditemukan di " + sheetName });
      }

      var existingValues = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
      var updatedRow = headers.map(function(col, idx) {
        if (payload.hasOwnProperty(col)) {
          return payload[col] !== undefined && payload[col] !== null ? String(payload[col]) : "";
        }
        return existingValues[idx] !== undefined && existingValues[idx] !== null ? String(existingValues[idx]) : "";
      });

      sheet.getRange(targetRow, 1, 1, updatedRow.length).setValues([updatedRow]);
      return createJsonResponse({ status: "success", message: "Data ID " + idToUpdate + " berhasil diperbarui." });
    }

    if (action === "delete") {
      var idToDelete = payload.id;
      if (!idToDelete) {
        return createJsonResponse({ status: "error", error: "Payload ID wajib diisi untuk hapus data." });
      }

      var lastRow = sheet.getLastRow();
      if (lastRow <= 1) {
        return createJsonResponse({ status: "error", error: "Data tidak ditemukan (sheet kosong)." });
      }

      var ids = sheet.getRange(1, 1, lastRow, 1).getValues();
      var rowToDelete = -1;
      for (var r = 1; r < ids.length; r++) {
        if (String(ids[r][0]) === String(idToDelete)) {
          rowToDelete = r + 1;
          break;
        }
      }

      if (rowToDelete === -1) {
        return createJsonResponse({ status: "error", error: "Data dengan ID " + idToDelete + " tidak ditemukan di " + sheetName });
      }

      sheet.deleteRow(rowToDelete);
      return createJsonResponse({ status: "success", message: "Data ID " + idToDelete + " berhasil dihapus." });
    }

    return createJsonResponse({ status: "error", error: "Aksi POST tidak didukung: " + action });
  } catch (err) {
    return createJsonResponse({ status: "error", error: err.toString() });
  }
}
`;
