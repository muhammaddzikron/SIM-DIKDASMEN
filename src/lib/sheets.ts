import { TableName } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1BmBbXaumg7iI7YGn_8_mNBThOeqnR8YGrncXr0dgxbg';
export const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBp2XDUp2Tj325ijjDFNPdDFGZ8eM1X6CgNhlOMvFSoXv5XtcfDFlKkEaDAMkzQ4nE/exec';

export const SHEET_COLUMNS: Record<TableName, string[]> = {
  Users: ['id', 'email', 'name', 'role', 'password', 'cabangId', 'sekolahId', 'createdAt'],
  Cabang: ['id', 'name', 'code', 'username', 'password', 'defaultEmail'],
  Sekolah: [
    'id', 'name', 'npsn', 'username', 'password', 'cabangId', 'address', 'rtRw', 'postalCode', 'kelurahan', 'kecamatan', 'kabupatenKota',
    'status', 'level', 'phone', 'email', 'website', 'accreditation', 'accreditationExpiryDate', 'categoryCapability',
    'hasNib', 'nib', 'skPendirianNumber', 'skPendirianDate', 'skIzinOperasional', 'skIzinOperasionalDate',
    'jumlahSiswaPerKelas', 'jumlahKeseluruhanSiswa', 'jumlahGtp', 'jumlahGttp', 'jumlahKeseluruhanGuru',
    'jumlahKtp', 'jumlahKttp', 'jumlahKeseluruhanKaryawan', 'jumlahGuruSertifikasi', 'jumlahGuruInpassing',
    'jumlahDpkPns', 'sosmed', 'operatorName', 'operatorPhone', 'curriculum', 'vision', 'mission', 'description', 'logoUrl', 'bannerUrl'
  ],
  Guru: [
    'id', 'name', 'nipm', 'gender', 'pobDob', 'schoolId', 'status', 'guruType', 'subject', 'hasPpg',
    'nuptk', 'nrg', 'nip', 'nbm', 'skNumber', 'tmtAwal', 'education', 'educationProdi',
    'address', 'rtRw', 'postalCode', 'kelurahan', 'kecamatan', 'kabupatenKota', 'phone', 'persyarikatanActivity'
  ],
  TenagaKependidikan: [
    'id', 'name', 'nipm', 'nip', 'pobDob', 'gender', 'schoolId', 'status', 'position', 'nbm',
    'skNumber', 'tmtAwal', 'education', 'educationProdi', 'address', 'rtRw', 'postalCode',
    'kelurahan', 'kecamatan', 'kabupatenKota', 'phone', 'persyarikatanActivity'
  ],
  KepalaSekolah: [
    'id', 'name', 'nipm', 'pobDob', 'phone', 'periodNumber', 'nip', 'schoolId', 'startDate',
    'endDate', 'nuptk', 'nuks', 'serdikStatus', 'status'
  ],
  Siswa: [
    'id', 'name', 'gender', 'nisn', 'pobDob', 'schoolId', 'class', 'address', 'rtRw',
    'postalCode', 'kelurahan', 'kecamatan', 'kabupatenKota', 'status'
  ],
  SKGuru: ['id', 'skNumber', 'skDate', 'skEndDate', 'title', 'guruId', 'fileUrl', 'fileId', 'status', 'submissionType', 'nbmUrl', 'ijazahUrl', 'skLamaUrl'],
  SKTenagaKependidikan: ['id', 'skNumber', 'skDate', 'skEndDate', 'title', 'tendikId', 'fileUrl', 'fileId', 'status', 'submissionType', 'nbmUrl', 'ijazahUrl', 'skLamaUrl'],
  SKKepalaSekolah: ['id', 'skNumber', 'skDate', 'skEndDate', 'title', 'kepalaSekolahId', 'fileUrl', 'fileId', 'status', 'submissionType', 'nbmUrl', 'ijazahUrl', 'skLamaUrl'],
  Notifikasi: ['id', 'title', 'message', 'type', 'isRead', 'createdAt'],
  LogAktivitas: ['id', 'userEmail', 'action', 'details', 'timestamp'],
  Setting: ['key', 'value'],
};

interface SpreadsheetMeta {
  title: string;
  sheets: { title: string; sheetId: number }[];
}

// Fetch spreadsheet metadata (such as sheet IDs and names)
export async function getSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMeta> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch spreadsheet. Please ensure Spreadsheet ID is valid and accessible.`);
  }

  const data = await response.json();
  const sheets = data.sheets.map((s: any) => ({
    title: s.properties.title,
    sheetId: s.properties.sheetId,
  }));

  return {
    title: data.properties.title,
    sheets,
  };
}

// Read all database tables at once via Apps Script for maximum speed
export async function readAllTables(
  accessToken: string,
  spreadsheetId: string
): Promise<any | null> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const url = `${appsScriptUrl}?action=readAll&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      const response = await fetch(url);
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success' && resJson.data) {
          const d = resJson.data;
          return {
            users: Array.isArray(d.users) ? d.users : [],
            cabang: Array.isArray(d.cabang) ? d.cabang : [],
            sekolah: Array.isArray(d.sekolah) ? d.sekolah : [],
            guru: Array.isArray(d.guru) ? d.guru : [],
            tendik: Array.isArray(d.tendik) ? d.tendik : [],
            kepalaSekolah: Array.isArray(d.kepalaSekolah) ? d.kepalaSekolah : [],
            siswa: Array.isArray(d.siswa) ? d.siswa : [],
            skGuru: Array.isArray(d.skGuru) ? d.skGuru : [],
            skTendik: Array.isArray(d.skTendik) ? d.skTendik : [],
            skKepalaSekolah: Array.isArray(d.skKepalaSekolah) ? d.skKepalaSekolah : [],
            notifikasi: Array.isArray(d.notifikasi) ? d.notifikasi : [],
            logAktivitas: Array.isArray(d.logAktivitas) ? d.logAktivitas : [],
            settings: Array.isArray(d.settings) ? d.settings : [],
          };
        }
      }
    } catch (err) {
      console.warn('Apps Script readAllTables failed, falling back to per-table fetch:', err);
    }
  }
  return null;
}

// Initialize database by creating missing sheets and adding column headers
export async function initializeDatabase(
  accessToken: string,
  spreadsheetId: string
): Promise<void> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const response = await fetch(`${appsScriptUrl}?action=init&spreadsheetId=${encodeURIComponent(spreadsheetId)}`);
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success') {
          return;
        }
      }
    } catch (err) {
      console.warn('Apps Script initializeDatabase call failed:', err);
    }
  }

  if (!accessToken) {
    // If no access token and Apps Script was attempted, gracefully bypass Google Sheets v4 API call
    return;
  }

  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const existingSheetNames = new Set(meta.sheets.map((s) => s.title));
  const missingTables = (Object.keys(SHEET_COLUMNS) as TableName[]).filter(
    (name) => !existingSheetNames.has(name)
  );

  if (missingTables.length > 0) {
    // Add missing sheets in batch
    const requests = missingTables.map((table) => ({
      addSheet: {
        properties: {
          title: table,
        },
      },
    }));

    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      throw new Error(`Failed to create database sheets: ${err.error?.message || updateRes.statusText}`);
    }

    // Now write headers for these newly created sheets
    const dataToWrite = missingTables.map((table) => ({
      range: `${table}!A1`,
      values: [SHEET_COLUMNS[table]],
    }));

    const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
    const writeRes = await fetch(writeUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataToWrite,
      }),
    });

    if (!writeRes.ok) {
      console.error('Failed to write column headers:', await writeRes.text());
    }
  }

  // Ensure headers exist and are up to date for ALL tables
  const checkBlankTables = (Object.keys(SHEET_COLUMNS) as TableName[]);
  const batchGetRanges = checkBlankTables.map((t) => `${t}!A1:Z1`);
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=${batchGetRanges.map(encodeURIComponent).join('&ranges=')}`;
  
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (getRes.ok) {
    const getData = await getRes.json();
    const valueRanges = getData.valueRanges || [];
    const updateHeaderData: { range: string; values: string[][] }[] = [];

    checkBlankTables.forEach((table, idx) => {
      const existingHeaders: string[] = valueRanges[idx]?.values?.[0] || [];
      const expectedHeaders = SHEET_COLUMNS[table];
      const isMissingColumns = expectedHeaders.some((col) => !existingHeaders.includes(col));
      if (existingHeaders.length === 0 || isMissingColumns) {
        updateHeaderData.push({
          range: `${table}!A1`,
          values: [expectedHeaders],
        });
      }
    });

    if (updateHeaderData.length > 0) {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: updateHeaderData,
        }),
      });
    }
  }
}

// Read records from a table
export async function readTable<T>(
  accessToken: string,
  spreadsheetId: string,
  tableName: TableName
): Promise<T[]> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const url = `${appsScriptUrl}?action=read&sheet=${encodeURIComponent(tableName)}&spreadsheetId=${encodeURIComponent(spreadsheetId)}`;
      const response = await fetch(url);
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success' && Array.isArray(resJson.data)) {
          return resJson.data as T[];
        } else if (resJson.error) {
          throw new Error(resJson.error);
        }
      }
    } catch (err) {
      console.warn(`Apps Script readTable info for ${tableName}, falling back to standard API or local storage:`, err);
    }
  }

  if (!accessToken) {
    // If Apps Script fetch failed AND there is no OAuth token, check local storage database
    const localDbStr = localStorage.getItem('sim_offline_db');
    if (localDbStr) {
      try {
        const localDb = JSON.parse(localDbStr);
        const mapKey = tableName === 'Users' ? 'users' : tableName === 'Cabang' ? 'cabang' : tableName === 'Sekolah' ? 'sekolah' : tableName === 'Guru' ? 'guru' : tableName === 'TenagaKependidikan' ? 'tendik' : tableName === 'KepalaSekolah' ? 'kepalaSekolah' : tableName === 'Siswa' ? 'siswa' : tableName === 'SKGuru' ? 'skGuru' : tableName === 'SKTenagaKependidikan' ? 'skTendik' : tableName === 'SKKepalaSekolah' ? 'skKepalaSekolah' : tableName === 'Notifikasi' ? 'notifikasi' : tableName === 'LogAktivitas' ? 'logAktivitas' : tableName === 'Setting' ? 'settings' : (tableName as string).toLowerCase();
        if (Array.isArray(localDb[mapKey])) {
          return localDb[mapKey] as T[];
        }
      } catch (e) {
        // Ignore parse error
      }
    }
    console.warn(`No access token available to read ${tableName} via Sheets v4 API.`);
    return [];
  }

  const range = `${tableName}!A1:Z10000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    console.warn(`Failed to read table ${tableName}. Sheet might be empty or missing.`);
    return [];
  }

  const data = await response.json();
  const rows: string[][] = data.values || [];

  if (rows.length === 0) {
    return [];
  }

  const headers = rows[0];
  const records: T[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row[0]) continue; // Skip empty rows

    const obj: any = {};
    headers.forEach((header, index) => {
      // Map to columns
      obj[header] = row[index] !== undefined ? row[index] : '';
    });
    records.push(obj as T);
  }

  return records;
}

// Insert a record into a table
export async function insertRecord(
  accessToken: string,
  spreadsheetId: string,
  tableName: TableName,
  record: Record<string, any>
): Promise<void> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'insert',
          sheet: tableName,
          payload: record,
          spreadsheetId: spreadsheetId,
        }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success') {
          return;
        } else if (resJson.error) {
          throw new Error(resJson.error);
        }
      }
    } catch (err) {
      console.warn(`Apps Script insertRecord info for ${tableName}, falling back to standard API:`, err);
    }
  }

  const columns = SHEET_COLUMNS[tableName];
  // Convert record object to an array matching column order
  const rowValues = columns.map((col) => {
    const val = record[col];
    return val !== undefined ? String(val) : '';
  });

  const range = `${tableName}!A:A`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to insert record: ${err}`);
  }
}

// Update a record in a table
export async function updateRecord(
  accessToken: string,
  spreadsheetId: string,
  tableName: TableName,
  id: string,
  updatedFields: Record<string, any>
): Promise<void> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'update',
          sheet: tableName,
          payload: { id, ...updatedFields },
          spreadsheetId: spreadsheetId,
        }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success') {
          return;
        } else if (resJson.error) {
          throw new Error(resJson.error);
        }
      }
    } catch (err) {
      console.warn(`Apps Script updateRecord info for ${tableName}, falling back to standard API:`, err);
    }
  }

  // First, find the row index by fetching the first column (IDs)
  const idRange = `${tableName}!A1:A10000`;
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(idRange)}`;
  
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!getRes.ok) {
    throw new Error(`Failed to search for record to update: ${getRes.statusText}`);
  }

  const getData = await getRes.json();
  const ids: string[][] = getData.values || [];
  
  let rowIndex = -1;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      rowIndex = i + 1; // 1-indexed for sheets
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Record with ID ${id} not found in table ${tableName}`);
  }

  // Get current row values to merge
  const rowRange = `${tableName}!A${rowIndex}:Z${rowIndex}`;
  const getRowUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(rowRange)}`;
  const getRowRes = await fetch(getRowUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!getRowRes.ok) {
    throw new Error(`Failed to fetch current record row: ${getRowRes.statusText}`);
  }

  const getRowData = await getRowRes.json();
  const currentRowValues = getRowData.values?.[0] || [];

  const columns = SHEET_COLUMNS[tableName];
  // Build updated row values
  const updatedRowValues = columns.map((col, idx) => {
    if (updatedFields[col] !== undefined) {
      return String(updatedFields[col]);
    }
    return currentRowValues[idx] !== undefined ? String(currentRowValues[idx]) : '';
  });

  const updateRange = `${tableName}!A${rowIndex}`;
  const putUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(updateRange)}?valueInputOption=USER_ENTERED`;

  const response = await fetch(putUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [updatedRowValues],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to update record: ${err}`);
  }
}

// Delete a record from a table (deletes the entire sheet row)
export async function deleteRecord(
  accessToken: string,
  spreadsheetId: string,
  tableName: TableName,
  id: string
): Promise<void> {
  const appsScriptUrl = localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
  if (appsScriptUrl) {
    try {
      const response = await fetch(appsScriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'delete',
          sheet: tableName,
          payload: { id },
          spreadsheetId: spreadsheetId,
        }),
      });
      if (response.ok) {
        const resJson = await response.json();
        if (resJson.status === 'success') {
          return;
        } else if (resJson.error) {
          throw new Error(resJson.error);
        }
      }
    } catch (err) {
      console.warn(`Apps Script deleteRecord info for ${tableName}, falling back to standard API:`, err);
    }
  }

  // First, find the row index and the sheet ID
  const meta = await getSpreadsheetMetadata(accessToken, spreadsheetId);
  const sheetMeta = meta.sheets.find((s) => s.title === tableName);
  if (!sheetMeta) {
    throw new Error(`Sheet ${tableName} not found in metadata`);
  }
  const sheetId = sheetMeta.sheetId;

  const idRange = `${tableName}!A1:A10000`;
  const getUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(idRange)}`;
  
  const getRes = await fetch(getUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!getRes.ok) {
    throw new Error(`Failed to search for record to delete: ${getRes.statusText}`);
  }

  const getData = await getRes.json();
  const ids: string[][] = getData.values || [];
  
  let rowIndex = -1; // 0-indexed for batchUpdate deleteDimension
  for (let i = 0; i < ids.length; i++) {
    if (ids[i][0] === id) {
      rowIndex = i; // 0-indexed index corresponds to row number (i + 1)
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error(`Record with ID ${id} not found in table ${tableName}`);
  }

  // Delete row using batchUpdate deleteDimension
  const requests = [
    {
      deleteDimension: {
        range: {
          sheetId: sheetId,
          dimension: 'ROWS',
          startIndex: rowIndex,
          endIndex: rowIndex + 1,
        },
      },
    },
  ];

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  const response = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ requests }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Failed to delete record row: ${err}`);
  }
}
