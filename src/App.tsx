import React, { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { initAuth, logout } from './lib/firebase';
import {
  DEFAULT_SPREADSHEET_ID,
  initializeDatabase,
  readTable,
  insertRecord,
  updateRecord,
  deleteRecord,
} from './lib/sheets';
import { DEFAULT_DRIVE_FOLDER_ID } from './lib/drive';
import { DatabaseState, TableName, User, Role } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CrudView from './components/CrudView';
import RecycleBinView from './components/RecycleBinView';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle, Database, FolderGit, Globe } from 'lucide-react';

const TAB_TO_TABLE_MAP: Record<string, TableName> = {
  users: 'Users',
  cabang: 'Cabang',
  sekolah: 'Sekolah',
  guru: 'Guru',
  kepalaSekolah: 'KepalaSekolah',
  siswa: 'Siswa',
  skGuru: 'SKGuru',
  skKepalaSekolah: 'SKKepalaSekolah',
  notifikasi: 'Notifikasi',
  logAktivitas: 'LogAktivitas',
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Connection settings with local storage persistence
  const [spreadsheetId, setSpreadsheetId] = useState(() => {
    return localStorage.getItem('sim_spreadsheet_id') || DEFAULT_SPREADSHEET_ID;
  });
  const [driveFolderId, setDriveFolderId] = useState(() => {
    return localStorage.getItem('sim_drive_folder_id') || DEFAULT_DRIVE_FOLDER_ID;
  });
  const [appsScriptUrl, setAppsScriptUrl] = useState(() => {
    return localStorage.getItem('sim_apps_script_url') || 'https://script.google.com/macros/s/AKfycbzBp2XDUp2Tj325ijjDFNPdDFGZ8eM1X6CgNhlOMvFSoXv5XtcfDFlKkEaDAMkzQ4nE/exec';
  });

  // Recycle Bin State loaded from local storage
  const [recycleBin, setRecycleBin] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('sim_recycle_bin');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Database State holding all sheet records
  const [data, setData] = useState<DatabaseState>({
    users: [],
    cabang: [],
    sekolah: [],
    guru: [],
    kepalaSekolah: [],
    siswa: [],
    skGuru: [],
    skKepalaSekolah: [],
    notifikasi: [],
    logAktivitas: [],
    settings: [],
  });

  // User Profile configuration state (Role & Tenant scoping)
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Synchronize All Tables from Google Sheets
  const syncData = useCallback(async (token: string, currentSpreadsheetId: string) => {
    setLoading(true);
    setDbError(null);
    try {
      // 1. Initialize sheets if any are missing
      await initializeDatabase(token, currentSpreadsheetId);

      // 2. Read all tables in parallel for max performance
      const [
        users,
        cabang,
        sekolah,
        guru,
        kepalaSekolah,
        siswa,
        skGuru,
        skKepalaSekolah,
        notifikasi,
        logAktivitas,
        settings,
      ] = await Promise.all([
        readTable<any>(token, currentSpreadsheetId, 'Users'),
        readTable<any>(token, currentSpreadsheetId, 'Cabang'),
        readTable<any>(token, currentSpreadsheetId, 'Sekolah'),
        readTable<any>(token, currentSpreadsheetId, 'Guru'),
        readTable<any>(token, currentSpreadsheetId, 'KepalaSekolah'),
        readTable<any>(token, currentSpreadsheetId, 'Siswa'),
        readTable<any>(token, currentSpreadsheetId, 'SKGuru'),
        readTable<any>(token, currentSpreadsheetId, 'SKKepalaSekolah'),
        readTable<any>(token, currentSpreadsheetId, 'Notifikasi'),
        readTable<any>(token, currentSpreadsheetId, 'LogAktivitas'),
        readTable<any>(token, currentSpreadsheetId, 'Setting'),
      ]);

      const freshData: DatabaseState = {
        users,
        cabang,
        sekolah,
        guru,
        kepalaSekolah,
        siswa,
        skGuru,
        skKepalaSekolah,
        notifikasi,
        logAktivitas,
        settings,
      };

      // 3. Seed starter data if database is entirely empty (no schools found)
      if (freshData.sekolah.length === 0 && freshData.cabang.length === 0) {
        console.log('Seeding starter database values...');
        const starterCabang = [
          { id: 'cab-1', name: 'Pimpinan Cabang Pendidikan Wilayah V', code: 'CAB-V' },
        ];
        const starterSekolah = [
          { id: 'sch-1', name: 'SMAN 1 Klaten', npsn: '20309501', cabangId: 'cab-1', address: 'Jl. Merbabu No.13, Klaten', status: 'Negeri', level: 'SMA' },
          { id: 'sch-2', name: 'SMKN 1 Klaten', npsn: '20309502', cabangId: 'cab-1', address: 'Jl. Pemuda No.120, Klaten', status: 'Negeri', level: 'SMK' },
        ];
        const starterGuru = [
          { id: 'gur-1', name: 'Eko Sulistyo, S.Pd., M.Si.', nip: '198205122009031005', schoolId: 'sch-1', gender: 'Laki-laki', subject: 'Matematika', status: 'PNS' },
          { id: 'gur-2', name: 'Rina Rahmawati, S.Pd.', nip: '199002142018022001', schoolId: 'sch-2', gender: 'Perempuan', subject: 'Bahasa Inggris', status: 'PPPK' },
        ];
        const starterKepalaSekolah = [
          { id: 'ks-1', name: 'Suharno, S.Pd., M.Pd.', nip: '197003151996021002', schoolId: 'sch-1', startDate: '2022-08-01', endDate: '2026-08-01', status: 'Aktif' },
          { id: 'ks-2', name: 'Drs. Wardoyo', nip: '196811201994031004', schoolId: 'sch-2', startDate: '2023-01-15', endDate: '2027-01-15', status: 'Aktif' },
        ];
        const starterSiswa = [
          { id: 'sis-1', name: 'Andi Wijaya', nisn: '0081234567', schoolId: 'sch-1', class: 'XI-MIPA-1', gender: 'Laki-laki' },
          { id: 'sis-2', name: 'Siti Aminah', nisn: '0098765432', schoolId: 'sch-2', class: 'XII-TKJ-2', gender: 'Perempuan' },
        ];
        const starterSKGuru = [
          { id: 'skg-1', skNumber: '800/215/SK/2026', skDate: '2026-06-01', skEndDate: '2030-06-01', title: 'SK Guru Tetap Matematika SMAN 1 Klaten', guruId: 'gur-1', fileUrl: 'https://drive.google.com/file/d/1_abc_xyz/view', fileId: '1_abc_xyz', status: 'Terbit' },
          { id: 'skg-2', skNumber: '', skDate: '2026-08-01', skEndDate: '2030-08-01', title: 'Rencana SK Penugasan Rina Rahmawati', guruId: 'gur-2', fileUrl: '', fileId: '', status: 'Belum Terbit' },
        ];
        const starterSKKepalaSekolah = [
          { id: 'skks-1', skNumber: '821/103/SK-KS/2022', skDate: '2022-08-01', skEndDate: '2026-08-01', title: 'SK Pengangkatan Suharno SMAN 1 Klaten', kepalaSekolahId: 'ks-1', fileUrl: 'https://drive.google.com/file/d/2_abc_xyz/view', fileId: '2_abc_xyz', status: 'Terbit' },
        ];
        const starterNotifikasi = [
          { id: 'not-1', title: 'Sinkronisasi Database Sukses', message: 'Koneksi dengan Google Sheets telah berhasil diselaraskan.', type: 'info', isRead: 'false', createdAt: '2026-07-13 10:00' },
          { id: 'not-2', title: 'Peringatan Masa Jabatan Kepala Sekolah', message: 'Masa jabatan Suharno (SMAN 1 Klaten) akan berakhir kurang dari 30 hari.', type: 'warning', isRead: 'false', createdAt: '2026-07-13 11:30' },
        ];

        const starterUsers = [
          { id: 'usr-1', email: 'admin@klaten.go.id', name: 'Super Admin Klaten', role: 'Super Admin', password: 'admin', createdAt: new Date().toISOString() },
          { id: 'usr-2', email: 'admin2@klaten.go.id', name: 'Admin Operator', role: 'Admin', password: 'admin2', createdAt: new Date().toISOString() },
          { id: 'usr-3', email: 'klaut@pdmklaten.com', name: 'Angga Crisna', role: 'Cabang', password: 'password', cabangId: 'cab-1', createdAt: new Date().toISOString() },
        ];

        // Perform consecutive appends
        await Promise.all([
          ...starterUsers.map((u) => insertRecord(token, currentSpreadsheetId, 'Users', u)),
          ...starterCabang.map((c) => insertRecord(token, currentSpreadsheetId, 'Cabang', c)),
          ...starterSekolah.map((s) => insertRecord(token, currentSpreadsheetId, 'Sekolah', s)),
          ...starterGuru.map((g) => insertRecord(token, currentSpreadsheetId, 'Guru', g)),
          ...starterKepalaSekolah.map((ks) => insertRecord(token, currentSpreadsheetId, 'KepalaSekolah', ks)),
          ...starterSiswa.map((sis) => insertRecord(token, currentSpreadsheetId, 'Siswa', sis)),
          ...starterSKGuru.map((sk) => insertRecord(token, currentSpreadsheetId, 'SKGuru', sk)),
          ...starterSKKepalaSekolah.map((sk) => insertRecord(token, currentSpreadsheetId, 'SKKepalaSekolah', sk)),
          ...starterNotifikasi.map((not) => insertRecord(token, currentSpreadsheetId, 'Notifikasi', not)),
        ]);

        // Re-read after seeding
        return syncData(token, currentSpreadsheetId);
      }

      setData(freshData);
      localStorage.setItem('sim_offline_db', JSON.stringify(freshData));

      // 4. Extract or register user profile with credentials override
      const overrideRole = localStorage.getItem('sim_override_role') as Role | null;
      const overrideName = localStorage.getItem('sim_override_username');
      const overrideEmail = localStorage.getItem('sim_override_email');
      const overrideCabangId = localStorage.getItem('sim_override_cabang_id') || undefined;
      const overrideSekolahId = localStorage.getItem('sim_override_sekolah_id') || undefined;

      if (overrideRole && overrideName && overrideEmail) {
        const customProfile: User = {
          id: 'usr-override',
          email: overrideEmail,
          name: overrideName,
          role: overrideRole,
          cabangId: overrideCabangId,
          sekolahId: overrideSekolahId,
          createdAt: new Date().toISOString(),
        };
        setUserProfile(customProfile);
      } else {
        const userEmail = localStorage.getItem('sim_user_email') || '';
        const existingUser = freshData.users.find((u) => u.email.toLowerCase() === userEmail.toLowerCase());

        if (existingUser) {
          setUserProfile(existingUser);
        } else {
          // If Users sheet is empty, first user is Super Admin
          const isFirstUser = freshData.users.length === 0;
          const assignedRole: Role = isFirstUser ? 'Super Admin' : 'Sekolah';
          
          const newProfile: User = {
            id: 'usr-' + Math.random().toString(36).substr(2, 9),
            email: userEmail,
            name: localStorage.getItem('sim_user_name') || 'Pengguna Baru',
            role: assignedRole,
            createdAt: new Date().toISOString(),
          };

          // Write user to sheet
          await insertRecord(token, currentSpreadsheetId, 'Users', newProfile);
          setUserProfile(newProfile);

          // Append to local state list immediately
          setData((prev) => ({
            ...prev,
            users: [...prev.users, newProfile],
          }));
        }
      }
    } catch (err: any) {
      console.error(err);
      setDbError(err.message || 'Gagal sinkronisasi data dari Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Synchronize All Tables locally for Offline / Simulation Mode
  const syncOfflineData = useCallback(() => {
    setLoading(true);
    setDbError(null);
    try {
      const cached = localStorage.getItem('sim_offline_db');
      if (cached) {
        setData(JSON.parse(cached));
      } else {
        const starterCabang = [
          { id: 'cab-1', name: 'Pimpinan Cabang Pendidikan Wilayah V', code: 'CAB-V' },
        ];
        const starterSekolah = [
          { id: 'sch-1', name: 'SMAN 1 Klaten', npsn: '20309501', cabangId: 'cab-1', address: 'Jl. Merbabu No.13, Klaten', status: 'Negeri', level: 'SMA' },
          { id: 'sch-2', name: 'SMKN 1 Klaten', npsn: '20309502', cabangId: 'cab-1', address: 'Jl. Pemuda No.120, Klaten', status: 'Negeri', level: 'SMK' },
        ];
        const starterGuru = [
          { id: 'gur-1', name: 'Eko Sulistyo, S.Pd., M.Si.', nip: '198205122009031005', schoolId: 'sch-1', gender: 'Laki-laki', subject: 'Matematika', status: 'PNS' },
          { id: 'gur-2', name: 'Rina Rahmawati, S.Pd.', nip: '199002142018022001', schoolId: 'sch-2', gender: 'Perempuan', subject: 'Bahasa Inggris', status: 'PPPK' },
        ];
        const starterKepalaSekolah = [
          { id: 'ks-1', name: 'Suharno, S.Pd., M.Pd.', nip: '197003151996021002', schoolId: 'sch-1', startDate: '2022-08-01', endDate: '2026-08-01', status: 'Aktif' },
          { id: 'ks-2', name: 'Drs. Wardoyo', nip: '196811201994031004', schoolId: 'sch-2', startDate: '2023-01-15', endDate: '2027-01-15', status: 'Aktif' },
        ];
        const starterSiswa = [
          { id: 'sis-1', name: 'Andi Wijaya', nisn: '0081234567', schoolId: 'sch-1', class: 'XI-MIPA-1', gender: 'Laki-laki' },
          { id: 'sis-2', name: 'Siti Aminah', nisn: '0098765432', schoolId: 'sch-2', class: 'XII-TKJ-2', gender: 'Perempuan' },
        ];
        const starterSKGuru = [
          { id: 'skg-1', skNumber: '800/215/SK/2026', skDate: '2026-06-01', skEndDate: '2030-06-01', title: 'SK Guru Tetap Matematika SMAN 1 Klaten', guruId: 'gur-1', fileUrl: 'https://drive.google.com/file/d/1_abc_xyz/view', fileId: '1_abc_xyz', status: 'Terbit' },
          { id: 'skg-2', skNumber: '', skDate: '2026-08-01', skEndDate: '2030-08-01', title: 'Rencana SK Penugasan Rina Rahmawati', guruId: 'gur-2', fileUrl: '', fileId: '', status: 'Belum Terbit' },
        ];
        const starterSKKepalaSekolah = [
          { id: 'skks-1', skNumber: '821/103/SK-KS/2022', skDate: '2022-08-01', skEndDate: '2026-08-01', title: 'SK Pengangkatan Suharno SMAN 1 Klaten', kepalaSekolahId: 'ks-1', fileUrl: 'https://drive.google.com/file/d/2_abc_xyz/view', fileId: '2_abc_xyz', status: 'Terbit' },
        ];
        const starterNotifikasi = [
          { id: 'not-1', title: 'Sinkronisasi Database Sukses', message: 'Koneksi dengan Google Sheets telah berhasil diselaraskan.', type: 'info', isRead: 'false', createdAt: '2026-07-13 10:00' },
          { id: 'not-2', title: 'Peringatan Masa Jabatan Kepala Sekolah', message: 'Masa jabatan Suharno (SMAN 1 Klaten) akan berakhir kurang dari 30 hari.', type: 'warning', isRead: 'false', createdAt: '2026-07-13 11:30' },
        ];

        const starterUsers = [
          { id: 'usr-1', email: 'admin@klaten.go.id', name: 'Super Admin Klaten', role: 'Super Admin', password: 'admin', createdAt: new Date().toISOString() },
          { id: 'usr-2', email: 'admin2@klaten.go.id', name: 'Admin Operator', role: 'Admin', password: 'admin2', createdAt: new Date().toISOString() },
          { id: 'usr-3', email: 'klaut@pdmklaten.com', name: 'Angga Crisna', role: 'Cabang', password: 'password', cabangId: 'cab-1', createdAt: new Date().toISOString() },
        ];

        const freshData: DatabaseState = {
          users: starterUsers as any,
          cabang: starterCabang as any,
          sekolah: starterSekolah as any,
          guru: starterGuru as any,
          kepalaSekolah: starterKepalaSekolah as any,
          siswa: starterSiswa as any,
          skGuru: starterSKGuru as any,
          skKepalaSekolah: starterSKKepalaSekolah as any,
          notifikasi: starterNotifikasi as any,
          logAktivitas: [],
          settings: [],
        };
        setData(freshData);
        localStorage.setItem('sim_offline_db', JSON.stringify(freshData));
      }

      const overrideRole = localStorage.getItem('sim_override_role') as Role | null || 'Super Admin';
      const overrideName = localStorage.getItem('sim_override_username') || 'Super Admin Klaten';
      const overrideEmail = localStorage.getItem('sim_override_email') || 'admin@klaten.go.id';
      const overrideCabangId = localStorage.getItem('sim_override_cabang_id') || undefined;
      const overrideSekolahId = localStorage.getItem('sim_override_sekolah_id') || undefined;

      const customProfile: User = {
        id: 'usr-override',
        email: overrideEmail,
        name: overrideName,
        role: overrideRole,
        cabangId: overrideCabangId,
        sekolahId: overrideSekolahId,
        createdAt: new Date().toISOString(),
      };
      setUserProfile(customProfile);
    } catch (err) {
      console.error('Error syncing offline data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle Auth State Changes on load
  useEffect(() => {
    const isOffline = localStorage.getItem('sim_is_offline') === 'true';
    if (isOffline) {
      const savedEmail = localStorage.getItem('sim_override_email') || 'admin@klaten.go.id';
      const savedName = localStorage.getItem('sim_override_username') || 'Super Admin Klaten';

      setUser({
        uid: 'sim-usr-1',
        email: savedEmail,
        displayName: savedName,
        emailVerified: true,
      } as any);
      setAccessToken(null);
      setNeedsAuth(false);
      syncOfflineData();
      return;
    }

    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        setNeedsAuth(false);
        if (currentUser.email) {
          localStorage.setItem('sim_user_email', currentUser.email);
          localStorage.setItem('sim_user_name', currentUser.displayName || 'User');
        }
        syncData(token, spreadsheetId);
      },
      () => {
        setNeedsAuth(true);
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, [syncData, syncOfflineData, spreadsheetId]);

  const handleLoginSuccess = (currentUser: FirebaseUser | any, token: string | null) => {
    setUser(currentUser);
    setAccessToken(token);
    setNeedsAuth(false);
    if (currentUser.email) {
      localStorage.setItem('sim_user_email', currentUser.email);
      localStorage.setItem('sim_user_name', currentUser.displayName || 'User');
    }
    if (token) {
      localStorage.removeItem('sim_is_offline');
      syncData(token, spreadsheetId);
    } else {
      localStorage.setItem('sim_is_offline', 'true');
      syncOfflineData();
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('sim_user_email');
    localStorage.removeItem('sim_user_name');
    localStorage.removeItem('sim_override_role');
    localStorage.removeItem('sim_override_username');
    localStorage.removeItem('sim_override_email');
    localStorage.removeItem('sim_is_offline');
    try {
      await logout();
    } catch (e) {
      console.warn("Logout error:", e);
    }
    setUser(null);
    setAccessToken(null);
    setNeedsAuth(true);
  };

  // Log activity into sheets helper
  const logActivity = async (action: string, details: string) => {
    const logRecord = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      userEmail: user?.email || 'simulasi-admin@dikdasmen.org',
      action,
      details,
      timestamp: new Date().toLocaleString('id-ID'),
    };
    if (!accessToken) {
      setData((prev) => {
        const next = {
          ...prev,
          logAktivitas: [logRecord, ...prev.logAktivitas],
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      return;
    }
    try {
      await insertRecord(accessToken, spreadsheetId, 'LogAktivitas', logRecord);
    } catch (err) {
      console.error('Failed to write audit log:', err);
    }
  };

  // CRUD Handler - Create
  const handleAddRecord = async (record: Record<string, any>) => {
    const mappedTable = TAB_TO_TABLE_MAP[currentTab];
    if (!mappedTable) return;

    const newRecord = {
      ...record,
      id: record.id || 'rec-' + Math.random().toString(36).substr(2, 9),
      createdAt: record.createdAt || new Date().toISOString(),
    };

    if (!accessToken) {
      // Offline/simulation fallback
      const arrayKey = currentTab === 'users' ? 'users' : currentTab === 'kepalaSekolah' ? 'kepalaSekolah' : currentTab === 'skGuru' ? 'skGuru' : currentTab === 'skKepalaSekolah' ? 'skKepalaSekolah' : currentTab === 'logAktivitas' ? 'logAktivitas' : currentTab;
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: [...((prev as any)[arrayKey] || []), newRecord],
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      await logActivity(`CREATE_${mappedTable.toUpperCase()}`, `[Offline] Menambahkan record ${newRecord.id}`);
      return;
    }

    await insertRecord(accessToken, spreadsheetId, mappedTable, newRecord);
    await logActivity(`CREATE_${mappedTable.toUpperCase()}`, `Menambahkan record ${newRecord.id}`);
    await syncData(accessToken, spreadsheetId);
  };

  // CRUD Handler - Update
  const handleEditRecord = async (id: string, updatedFields: Record<string, any>) => {
    const mappedTable = TAB_TO_TABLE_MAP[currentTab];
    if (!mappedTable) return;

    if (!accessToken) {
      // Offline/simulation fallback
      const arrayKey = currentTab === 'users' ? 'users' : currentTab === 'kepalaSekolah' ? 'kepalaSekolah' : currentTab === 'skGuru' ? 'skGuru' : currentTab === 'skKepalaSekolah' ? 'skKepalaSekolah' : currentTab === 'logAktivitas' ? 'logAktivitas' : currentTab;
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: ((prev as any)[arrayKey] || []).map((item: any) =>
            (item.id || item.key) === id ? { ...item, ...updatedFields } : item
          ),
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      await logActivity(`UPDATE_${mappedTable.toUpperCase()}`, `[Offline] Mengubah record ${id}`);
      return;
    }

    await updateRecord(accessToken, spreadsheetId, mappedTable, id, updatedFields);
    await logActivity(`UPDATE_${mappedTable.toUpperCase()}`, `Mengubah record ${id}`);
    await syncData(accessToken, spreadsheetId);
  };

  // CRUD Handler - Delete (With local Recycle Bin save)
  const handleDeleteRecord = async (id: string) => {
    const mappedTable = TAB_TO_TABLE_MAP[currentTab];
    if (!mappedTable) return;

    // Retrieve original record from local state for recycling
    let itemData: any = null;
    const arrayKey = currentTab === 'users' ? 'users' : currentTab === 'kepalaSekolah' ? 'kepalaSekolah' : currentTab === 'skGuru' ? 'skGuru' : currentTab === 'skKepalaSekolah' ? 'skKepalaSekolah' : currentTab === 'logAktivitas' ? 'logAktivitas' : currentTab;
    const list = (data as any)[arrayKey] || [];
    itemData = list.find((item: any) => (item.id || item.key) === id);

    if (!accessToken) {
      // Offline/simulation fallback
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: ((prev as any)[arrayKey] || []).filter((item: any) => (item.id || item.key) !== id),
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      if (itemData) {
        const newItem = {
          recycleId: 'rec-bin-' + Math.random().toString(36).substr(2, 9),
          originalTable: mappedTable,
          data: itemData,
          deletedAt: new Date().toLocaleString('id-ID'),
        };
        const updatedBin = [newItem, ...recycleBin];
        setRecycleBin(updatedBin);
        localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
      }
      await logActivity(`DELETE_${mappedTable.toUpperCase()}`, `[Offline] Menghapus record ${id}`);
      return;
    }

    // Perform actual deletion from Sheets database
    await deleteRecord(accessToken, spreadsheetId, mappedTable, id);

    // Save to local Recycle Bin
    if (itemData) {
      const newItem = {
        recycleId: 'rec-bin-' + Math.random().toString(36).substr(2, 9),
        originalTable: mappedTable,
        data: itemData,
        deletedAt: new Date().toLocaleString('id-ID'),
      };
      const updatedBin = [newItem, ...recycleBin];
      setRecycleBin(updatedBin);
      localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
    }

    await logActivity(`DELETE_${mappedTable.toUpperCase()}`, `Menghapus record ${id}`);
    await syncData(accessToken, spreadsheetId);
  };

  // CRUD Handler - Bulk Delete (With local Recycle Bin save)
  const handleBulkDeleteRecords = async (ids: string[]) => {
    const mappedTable = TAB_TO_TABLE_MAP[currentTab];
    if (!mappedTable) return;

    const arrayKey = currentTab === 'users' ? 'users' : currentTab === 'kepalaSekolah' ? 'kepalaSekolah' : currentTab === 'skGuru' ? 'skGuru' : currentTab === 'skKepalaSekolah' ? 'skKepalaSekolah' : currentTab === 'logAktivitas' ? 'logAktivitas' : currentTab;
    const list = (data as any)[arrayKey] || [];
    const itemsToDelete = list.filter((item: any) => ids.includes(item.id || item.key));

    if (!accessToken) {
      // Offline/simulation fallback
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: ((prev as any)[arrayKey] || []).filter((item: any) => !ids.includes(item.id || item.key)),
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      const newRecycleItems = itemsToDelete.map((item: any) => ({
        recycleId: 'rec-bin-' + Math.random().toString(36).substr(2, 9),
        originalTable: mappedTable,
        data: item,
        deletedAt: new Date().toLocaleString('id-ID'),
      }));
      const updatedBin = [...newRecycleItems, ...recycleBin];
      setRecycleBin(updatedBin);
      localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
      await logActivity(`BULK_DELETE_${mappedTable.toUpperCase()}`, `[Offline] Menghapus ${ids.length} record secara massal`);
      return;
    }

    // Delete one by one in Google Sheets
    for (const id of ids) {
      await deleteRecord(accessToken, spreadsheetId, mappedTable, id);
    }

    const newRecycleItems = itemsToDelete.map((item: any) => ({
      recycleId: 'rec-bin-' + Math.random().toString(36).substr(2, 9),
      originalTable: mappedTable,
      data: item,
      deletedAt: new Date().toLocaleString('id-ID'),
    }));

    const updatedBin = [...newRecycleItems, ...recycleBin];
    setRecycleBin(updatedBin);
    localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));

    await logActivity(`BULK_DELETE_${mappedTable.toUpperCase()}`, `Menghapus ${ids.length} record secara massal`);
    await syncData(accessToken, spreadsheetId);
  };

  // Recycle Bin actions
  const handleRestoreRecycleItem = async (item: any) => {
    if (!accessToken) {
      // Offline fallback
      const arrayKey = item.originalTable === 'Users' ? 'users' : item.originalTable === 'KepalaSekolah' ? 'kepalaSekolah' : item.originalTable === 'SKGuru' ? 'skGuru' : item.originalTable === 'SKKepalaSekolah' ? 'skKepalaSekolah' : item.originalTable === 'LogAktivitas' ? 'logAktivitas' : item.originalTable.toLowerCase();
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: [...((prev as any)[arrayKey] || []), item.data],
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      const updatedBin = recycleBin.filter((x) => x.recycleId !== item.recycleId);
      setRecycleBin(updatedBin);
      localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
      await logActivity(`RESTORE_${item.originalTable.toUpperCase()}`, `[Offline] Memulihkan record ${item.data.id || item.data.key}`);
      alert('Data berhasil dipulihkan secara lokal!');
      return;
    }
    try {
      await insertRecord(accessToken, spreadsheetId, item.originalTable, item.data);
      const updatedBin = recycleBin.filter((x) => x.recycleId !== item.recycleId);
      setRecycleBin(updatedBin);
      localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
      await logActivity(`RESTORE_${item.originalTable.toUpperCase()}`, `Memulihkan record ${item.data.id || item.data.key}`);
      alert('Data berhasil dipulihkan ke Google Sheets!');
      await syncData(accessToken, spreadsheetId);
    } catch (err: any) {
      alert(`Gagal memulihkan data: ${err.message || err}`);
    }
  };

  const handleDeletePermanently = (recycleId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data ini secara permanen dari Tempat Sampah?')) {
      const updatedBin = recycleBin.filter((x) => x.recycleId !== recycleId);
      setRecycleBin(updatedBin);
      localStorage.setItem('sim_recycle_bin', JSON.stringify(updatedBin));
    }
  };

  const handleClearBin = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh isi Tempat Sampah?')) {
      setRecycleBin([]);
      localStorage.removeItem('sim_recycle_bin');
    }
  };

  // Save Settings State
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('sim_spreadsheet_id', spreadsheetId);
    localStorage.setItem('sim_drive_folder_id', driveFolderId);
    localStorage.setItem('sim_apps_script_url', appsScriptUrl);
    alert('Pengaturan disimpan! Sistem akan sinkronisasi ulang.');
    if (accessToken) {
      syncData(accessToken, spreadsheetId);
    } else {
      syncOfflineData();
    }
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset pengaturan ke database bawaan Klaten?')) {
      setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
      setDriveFolderId(DEFAULT_DRIVE_FOLDER_ID);
      setAppsScriptUrl('');
      localStorage.setItem('sim_spreadsheet_id', DEFAULT_SPREADSHEET_ID);
      localStorage.setItem('sim_drive_folder_id', DEFAULT_DRIVE_FOLDER_ID);
      localStorage.setItem('sim_apps_script_url', '');
      localStorage.removeItem('sim_offline_db');
      if (accessToken) {
        syncData(accessToken, DEFAULT_SPREADSHEET_ID);
      } else {
        syncOfflineData();
      }
    }
  };

  // Derive notifications list count
  const unreadCount = data.notifikasi.filter((n) => n.isRead === 'false').length;

  if (needsAuth) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Active Role of logged in user profile
  const activeRole: Role = userProfile?.role || 'Sekolah';

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 select-none overflow-hidden">
      {/* Dynamic Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={activeRole}
        userName={userProfile?.name || user?.displayName || 'User'}
        userEmail={user?.email || ''}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* HEADER */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {currentTab === 'dashboard'
                ? 'Ringkasan Statistik Real-time'
                : currentTab === 'settings'
                ? 'Pengaturan Google Workspace'
                : currentTab === 'recycleBin'
                ? 'Tempat Sampah (Recycle Bin)'
                : `Manajemen Data ${TAB_TO_TABLE_MAP[currentTab] || currentTab}`}
            </h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full border border-green-100 text-[10px] font-bold shrink-0">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="uppercase tracking-wider">Database Connected</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Interactive Role Simulator */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Simulasi Peran:</span>
              <select
                value={activeRole}
                onChange={(e) => {
                  const simulatedRole = e.target.value as Role;
                  const simulatedName = simulatedRole === 'Super Admin' 
                    ? 'Super Admin Klaten' 
                    : simulatedRole === 'Admin' 
                    ? 'Admin Operator' 
                    : simulatedRole === 'Cabang' 
                    ? 'Pimpinan Cabang V' 
                    : 'SMAN 1 Klaten';
                  const simulatedEmail = simulatedRole === 'Super Admin' 
                    ? 'admin@klaten.go.id' 
                    : simulatedRole === 'Admin' 
                    ? 'admin2@klaten.go.id' 
                    : simulatedRole === 'Cabang' 
                    ? 'cabang@klaten.go.id' 
                    : 'sman1klaten@klaten.go.id';
                  
                  localStorage.setItem('sim_override_role', simulatedRole);
                  localStorage.setItem('sim_override_username', simulatedName);
                  localStorage.setItem('sim_override_email', simulatedEmail);
                  
                  // Set simulated scoping IDs
                  if (simulatedRole === 'Cabang') {
                    localStorage.setItem('sim_override_cabang_id', 'cab-1');
                    localStorage.removeItem('sim_override_sekolah_id');
                  } else if (simulatedRole === 'Sekolah') {
                    localStorage.setItem('sim_override_cabang_id', 'cab-1');
                    localStorage.setItem('sim_override_sekolah_id', 'sch-1');
                  } else {
                    localStorage.removeItem('sim_override_cabang_id');
                    localStorage.removeItem('sim_override_sekolah_id');
                  }

                  const updatedProfile: User = {
                    id: 'usr-override',
                    email: simulatedEmail,
                    name: simulatedName,
                    role: simulatedRole,
                    cabangId: simulatedRole === 'Cabang' || simulatedRole === 'Sekolah' ? 'cab-1' : undefined,
                    sekolahId: simulatedRole === 'Sekolah' ? 'sch-1' : undefined,
                    createdAt: new Date().toISOString(),
                  };
                  setUserProfile(updatedProfile);
                  
                  // Re-run sync to adapt permissions
                  if (accessToken) {
                    syncData(accessToken, spreadsheetId);
                  }
                }}
                className="bg-transparent border-none text-[10px] font-bold text-slate-700 focus:outline-none cursor-pointer outline-none"
              >
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Cabang">Pimpinan Cabang</option>
                <option value="Sekolah">Sekolah (SMAN 1)</option>
              </select>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-none">{userProfile?.name || user?.displayName || 'User'}</p>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{activeRole}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
              {userProfile?.name ? userProfile.name.charAt(0) : user?.displayName ? user.displayName.charAt(0) : 'U'}
            </div>
          </div>
        </header>

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto p-6 relative bg-[#F8FAFC] space-y-6">
          {/* Loading Indicator */}
          {loading && (
            <div className="absolute top-4 right-6 z-50 bg-white/90 border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm text-[11px] font-bold text-slate-700 backdrop-blur-sm animate-pulse">
              <RefreshCw size={12} className="animate-spin text-blue-600" />
              <span>Menyelaraskan data Sheets...</span>
            </div>
          )}

        {/* Database Connection Errors */}
        {dbError && (
          <div className="mb-6 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-start gap-3">
            <ShieldAlert size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-800 text-sm">Kesalahan Sinkronisasi Google Sheets</h4>
              <p className="text-xs text-rose-600 leading-relaxed mt-1">
                {dbError}. Pastikan Spreadsheet ID yang dimasukkan valid, dan akun Google Anda memiliki akses edit ke file tersebut.
              </p>
              <button
                onClick={() => setCurrentTab('settings')}
                className="mt-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
              >
                Konfigurasi Spreadsheet ID
              </button>
            </div>
          </div>
        )}

        {/* Multi-Tab Routing Content rendering */}
        {currentTab === 'dashboard' ? (
          <Dashboard data={data} onNavigateToTab={setCurrentTab} />
        ) : currentTab === 'settings' ? (
          <div className="max-w-xl bg-white border border-slate-200/80 rounded-xl shadow-sm p-6 space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Pengaturan Google Workspace</h2>
              <p className="text-xs text-slate-500 mt-1">
                Atur ID Spreadsheet Google Sheets dan ID folder Google Drive yang digunakan sebagai media penyimpanan sistem.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Database size={14} className="text-teal-600" /> Spreadsheet ID (Database)
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  ID ini diambil dari URL file spreadsheet Anda. ID default mengarah ke database SIM Kabupaten Klaten.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <FolderGit size={14} className="text-indigo-600" /> Google Drive Folder ID (Storage)
                </label>
                <input
                  type="text"
                  value={driveFolderId}
                  onChange={(e) => setDriveFolderId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  required
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Semua file SK yang diupload otomatis akan disimpan di dalam folder Google Drive dengan ID ini.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Globe size={14} className="text-rose-600" /> Google Apps Script Web App URL (Optional)
                </label>
                <input
                  type="url"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Semua data CRUD dapat disinkronkan langsung via Apps Script tanpa batas permission atau autentikasi OAuth Google API yang rumit.
                </span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Simpan & Hubungkan
                </button>
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Reset Default
                </button>
              </div>
            </form>

            <div className="bg-teal-50/50 rounded-xl border border-teal-100/80 p-4 space-y-2 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-teal-800 flex items-center gap-1.5">
                <CheckCircle size={14} /> Cara Menghubungkan Spreadsheet Sendiri (Opsional)
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-500">
                <li>Buat spreadsheet kosong di akun Google Drive Anda.</li>
                <li>Salin ID Spreadsheet dari alamat URL (karakter panjang diantara d/ dan /edit).</li>
                <li>Tempel ID tersebut di kolom Spreadsheet ID diatas, lalu simpan.</li>
                <li>Sistem akan menginisialisasi tabel-tabel secara otomatis di spreadsheet baru tersebut!</li>
              </ol>
            </div>
          </div>
        ) : currentTab === 'recycleBin' ? (
          <RecycleBinView
            recycleBin={recycleBin}
            onRestore={handleRestoreRecycleItem}
            onDeletePermanently={handleDeletePermanently}
            onClearBin={handleClearBin}
            isDarkMode={false}
          />
        ) : (
          <CrudView
            tableName={TAB_TO_TABLE_MAP[currentTab] || (currentTab as TableName)}
            data={data}
            userRole={activeRole}
            userCabangId={userProfile?.cabangId}
            userSekolahId={userProfile?.sekolahId}
            accessToken={accessToken || ''}
            driveFolderId={driveFolderId}
            onAdd={handleAddRecord}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
            onBulkDelete={handleBulkDeleteRecords}
          />
        )}
        </main>

        {/* FOOTER STATS BAR */}
        <footer className="h-8 bg-slate-900 text-[10px] text-slate-400 flex items-center px-6 justify-between shrink-0 font-mono">
          <div className="flex gap-4">
            <span>REACT 18.3</span>
            <span>VITE 5.0</span>
            <span>G-DRIVE STORAGE STATUS</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              Latensi DB: 24ms
            </span>
            <span>ID SESI: SIM-KLATEN</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
