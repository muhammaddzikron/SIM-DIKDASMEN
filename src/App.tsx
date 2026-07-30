import React, { useState, useEffect, useCallback } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { initAuth, logout } from './lib/firebase';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_APPS_SCRIPT_URL,
  initializeDatabase,
  readTable,
  readAllTables,
  insertRecord,
  updateRecord,
  deleteRecord,
} from './lib/sheets';
import { APPS_SCRIPT_CODE } from './lib/appsScriptCode';
import { DEFAULT_DRIVE_FOLDER_ID } from './lib/drive';
import { DatabaseState, TableName, User, Role } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CrudView from './components/CrudView';
import RecycleBinView from './components/RecycleBinView';
import MutasiView from './components/MutasiView';
import {
  ShieldAlert,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Database,
  FolderGit,
  Globe,
  SlidersHorizontal,
  UserCheck,
  Code,
  Copy,
  Check,
  ExternalLink,
  X,
  Zap,
} from 'lucide-react';

const TAB_TO_TABLE_MAP: Record<string, TableName> = {
  users: 'Users',
  cabang: 'Cabang',
  sekolah: 'Sekolah',
  guru: 'Guru',
  tendik: 'TenagaKependidikan',
  kepalaSekolah: 'KepalaSekolah',
  siswa: 'Siswa',
  skGuru: 'SKGuru',
  skTendik: 'SKTenagaKependidikan',
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
    return localStorage.getItem('sim_apps_script_url') || DEFAULT_APPS_SCRIPT_URL;
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
    tendik: [],
    kepalaSekolah: [],
    siswa: [],
    skGuru: [],
    skTendik: [],
    skKepalaSekolah: [],
    notifikasi: [],
    logAktivitas: [],
    settings: [],
  });

  // User Profile configuration state (Role & Tenant scoping)
  const [userProfile, setUserProfile] = useState<User | null>(null);

  // Apps Script modal and connection test states
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Synchronize All Tables from Google Sheets
  const syncData = useCallback(async (token: string, currentSpreadsheetId: string) => {
    setLoading(true);
    setDbError(null);
    try {
      // 1. Initialize sheets if any are missing
      await initializeDatabase(token, currentSpreadsheetId);

      // 2. Try fast readAll via Apps Script first
      let freshData: DatabaseState | null = await readAllTables(token, currentSpreadsheetId);

      if (!freshData) {
        // Fallback: Read all tables in parallel via readTable
        const [
          users,
          cabang,
          sekolah,
          guru,
          tendik,
          kepalaSekolah,
          siswa,
          skGuru,
          skTendik,
          skKepalaSekolah,
          notifikasi,
          logAktivitas,
          settings,
        ] = await Promise.all([
          readTable<any>(token, currentSpreadsheetId, 'Users'),
          readTable<any>(token, currentSpreadsheetId, 'Cabang'),
          readTable<any>(token, currentSpreadsheetId, 'Sekolah'),
          readTable<any>(token, currentSpreadsheetId, 'Guru'),
          readTable<any>(token, currentSpreadsheetId, 'TenagaKependidikan'),
          readTable<any>(token, currentSpreadsheetId, 'KepalaSekolah'),
          readTable<any>(token, currentSpreadsheetId, 'Siswa'),
          readTable<any>(token, currentSpreadsheetId, 'SKGuru'),
          readTable<any>(token, currentSpreadsheetId, 'SKTenagaKependidikan'),
          readTable<any>(token, currentSpreadsheetId, 'SKKepalaSekolah'),
          readTable<any>(token, currentSpreadsheetId, 'Notifikasi'),
          readTable<any>(token, currentSpreadsheetId, 'LogAktivitas'),
          readTable<any>(token, currentSpreadsheetId, 'Setting'),
        ]);

        freshData = {
          users,
          cabang,
          sekolah,
          guru,
          tendik,
          kepalaSekolah,
          siswa,
          skGuru,
          skTendik,
          skKepalaSekolah,
          notifikasi,
          logAktivitas,
          settings,
        };
      }

      // 3. Seed starter data if database is entirely empty (no schools found)
      if (freshData.sekolah.length === 0 && freshData.cabang.length === 0) {
        console.log('Seeding starter database values...');
        const starterCabang = [
          { id: 'cab-1', name: 'Pimpinan Cabang Pendidikan Wilayah V', code: 'CAB-V', username: 'cabang5', password: 'password', defaultEmail: 'klaut@pdmklaten.com' },
        ];
        const starterSekolah = [
          {
            id: 'sch-1',
            name: 'SMAN 1 Klaten',
            npsn: '20309501',
            cabangId: 'cab-1',
            username: 'sman1klaten',
            password: 'password',
            address: 'Jl. Merbabu No.13, Klaten Jawa Tengah',
            status: 'Negeri',
            level: 'SMA',
            phone: '(0272) 321520',
            email: 'sman1klaten@sch.id',
            website: 'https://sman1klaten.sch.id',
            accreditation: 'A',
            curriculum: 'Kurikulum Merdeka',
            vision: 'Terwujudnya Lulusan yang Bertaqwa, Cerdas, Berkarakter Pancasila, Unggul dalam Prestasi dan Berwawasan Global.',
            mission: '1. Menyelenggarakan pembelajaran berkualitas berbasis teknologi.\n2. Mengembangkan bakat, minat, dan potensi siswa secara optimal.\n3. Membiasakan budaya tertib, disiplin, dan berakhlak mulia.',
            description: 'Selamat datang di Portal Resmi SMAN 1 Klaten. Kami berkomitmen untuk memberikan pendidikan menengah atas terbaik yang berfokus pada pembentukan karakter, prestasi akademik, dan kesiapan siswa.',
            logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10',
            bannerUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80'
          },
          {
            id: 'sch-2',
            name: 'SMKN 1 Klaten',
            npsn: '20309502',
            cabangId: 'cab-1',
            address: 'Jl. Pemuda No.120, Klaten Jawa Tengah',
            status: 'Negeri',
            level: 'SMK',
            phone: '(0272) 321456',
            email: 'info@smkn1klaten.sch.id',
            website: 'https://smkn1klaten.sch.id',
            accreditation: 'A',
            curriculum: 'Kurikulum Merdeka',
            vision: 'Menjadi Sekolah Menengah Kejuruan Unggul, Menghasilkan Lulusan Kompeten, Berkarakter, dan Siap Kerja.',
            mission: '1. Membekali siswa dengan keterampilan vokasi sesuai kebutuhan industri.\n2. Menjalin kerja sama luas dengan DUDI.\n3. Menanamkan jiwa kewirausahaan (entrepreneurship).',
            description: 'SMKN 1 Klaten merupakan pusat keunggulan pendidikan kejuruan di Kabupaten Klaten yang melahirkan tenaga kerja terampil dan siap bersaing.',
            logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10',
            bannerUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80'
          },
        ];
        const starterGuru = [
          { id: 'gur-1', name: 'Eko Sulistyo, S.Pd., M.Si.', nip: '198205122009031005', schoolId: 'sch-1', gender: 'Laki-laki', subject: 'Matematika', status: 'PNS' },
          { id: 'gur-2', name: 'Rina Rahmawati, S.Pd.', nip: '199002142018022001', schoolId: 'sch-2', gender: 'Perempuan', subject: 'Bahasa Inggris', status: 'PPPK' },
        ];
        const starterTendik = [
          { id: 'tnd-1', name: 'Bambang Prasetyo, S.Kom.', nip: '198504102010011008', schoolId: 'sch-1', gender: 'Laki-laki', position: 'Kepala Tata Usaha', status: 'PNS' },
          { id: 'tnd-2', name: 'Dewi Lestari, A.Md.', nip: '199208152020012015', schoolId: 'sch-2', gender: 'Perempuan', position: 'Pustakawan', status: 'PPPK' },
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
        const starterSKTendik = [
          { id: 'skt-1', skNumber: '800/310/SK-TU/2026', skDate: '2026-06-01', skEndDate: '2030-06-01', title: 'SK Pengangkatan Kepala Tata Usaha SMAN 1 Klaten', tendikId: 'tnd-1', fileUrl: 'https://drive.google.com/file/d/3_abc_xyz/view', fileId: '3_abc_xyz', status: 'Terbit' },
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
          ...starterTendik.map((t) => insertRecord(token, currentSpreadsheetId, 'TenagaKependidikan', t)),
          ...starterKepalaSekolah.map((ks) => insertRecord(token, currentSpreadsheetId, 'KepalaSekolah', ks)),
          ...starterSiswa.map((sis) => insertRecord(token, currentSpreadsheetId, 'Siswa', sis)),
          ...starterSKGuru.map((sk) => insertRecord(token, currentSpreadsheetId, 'SKGuru', sk)),
          ...starterSKTendik.map((sk) => insertRecord(token, currentSpreadsheetId, 'SKTenagaKependidikan', sk)),
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
          { id: 'cab-1', name: 'Pimpinan Cabang Pendidikan Wilayah V', code: 'CAB-V', username: 'cabang5', password: 'password', defaultEmail: 'klaut@pdmklaten.com' },
        ];
        const starterSekolah = [
          {
            id: 'sch-1',
            name: 'SMAN 1 Klaten',
            npsn: '20309501',
            cabangId: 'cab-1',
            username: 'sman1klaten',
            password: 'password',
            address: 'Jl. Merbabu No.13, Klaten Jawa Tengah',
            status: 'Negeri',
            level: 'SMA',
            phone: '(0272) 321520',
            email: 'sman1klaten@sch.id',
            website: 'https://sman1klaten.sch.id',
            accreditation: 'A',
            curriculum: 'Kurikulum Merdeka',
            vision: 'Terwujudnya Lulusan yang Bertaqwa, Cerdas, Berkarakter Pancasila, Unggul dalam Prestasi dan Berwawasan Global.',
            mission: '1. Menyelenggarakan pembelajaran berkualitas berbasis teknologi.\n2. Mengembangkan bakat, minat, dan potensi siswa secara optimal.\n3. Membiasakan budaya tertib, disiplin, dan berakhlak mulia.',
            description: 'Selamat datang di Portal Resmi SMAN 1 Klaten. Kami berkomitmen untuk memberikan pendidikan menengah atas terbaik yang berfokus pada pembentukan karakter, prestasi akademik, dan kesiapan siswa.',
            logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10',
            bannerUrl: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1200&auto=format&fit=crop&q=80'
          },
          {
            id: 'sch-2',
            name: 'SMKN 1 Klaten',
            npsn: '20309502',
            cabangId: 'cab-1',
            address: 'Jl. Pemuda No.120, Klaten Jawa Tengah',
            status: 'Negeri',
            level: 'SMK',
            phone: '(0272) 321456',
            email: 'info@smkn1klaten.sch.id',
            website: 'https://smkn1klaten.sch.id',
            accreditation: 'A',
            curriculum: 'Kurikulum Merdeka',
            vision: 'Menjadi Sekolah Menengah Kejuruan Unggul, Menghasilkan Lulusan Kompeten, Berkarakter, dan Siap Kerja.',
            mission: '1. Membekali siswa dengan keterampilan vokasi sesuai kebutuhan industri.\n2. Menjalin kerja sama luas dengan DUDI.\n3. Menanamkan jiwa kewirausahaan (entrepreneurship).',
            description: 'SMKN 1 Klaten merupakan pusat keunggulan pendidikan kejuruan di Kabupaten Klaten yang melahirkan tenaga kerja terampil dan siap bersaing.',
            logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10',
            bannerUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200&auto=format&fit=crop&q=80'
          },
        ];
        const starterGuru = [
          { id: 'gur-1', name: 'Eko Sulistyo, S.Pd., M.Si.', nip: '198205122009031005', schoolId: 'sch-1', gender: 'Laki-laki', subject: 'Matematika', status: 'PNS' },
          { id: 'gur-2', name: 'Rina Rahmawati, S.Pd.', nip: '199002142018022001', schoolId: 'sch-2', gender: 'Perempuan', subject: 'Bahasa Inggris', status: 'PPPK' },
        ];
        const starterTendik = [
          { id: 'tnd-1', name: 'Bambang Prasetyo, S.Kom.', nip: '198504102010011008', schoolId: 'sch-1', gender: 'Laki-laki', position: 'Kepala Tata Usaha', status: 'PNS' },
          { id: 'tnd-2', name: 'Dewi Lestari, A.Md.', nip: '199208152020012015', schoolId: 'sch-2', gender: 'Perempuan', position: 'Pustakawan', status: 'PPPK' },
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
        const starterSKTendik = [
          { id: 'skt-1', skNumber: '800/310/SK-TU/2026', skDate: '2026-06-01', skEndDate: '2030-06-01', title: 'SK Pengangkatan Kepala Tata Usaha SMAN 1 Klaten', tendikId: 'tnd-1', fileUrl: 'https://drive.google.com/file/d/3_abc_xyz/view', fileId: '3_abc_xyz', status: 'Terbit' },
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
          tendik: starterTendik as any,
          kepalaSekolah: starterKepalaSekolah as any,
          siswa: starterSiswa as any,
          skGuru: starterSKGuru as any,
          skTendik: starterSKTendik as any,
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

    const newRecord: any = {
      ...record,
      id: record.id || 'rec-' + Math.random().toString(36).substr(2, 9),
      createdAt: record.createdAt || new Date().toISOString(),
    };

    // Auto-create Cabang user account if adding a new Cabang
    let newCabangUser: User | null = null;
    if (mappedTable === 'Cabang') {
      const codeClean = (newRecord.code || 'cab').toLowerCase().replace(/[^a-z0-9]/g, '');
      const userEmail = record.defaultEmail || `cabang.${codeClean}@pdmklaten.com`;
      const userPassword = record.defaultPassword || 'cabang123';
      newCabangUser = {
        id: 'usr-cab-' + Math.random().toString(36).substr(2, 9),
        email: userEmail,
        name: newRecord.name,
        role: 'Cabang' as Role,
        password: userPassword,
        cabangId: newRecord.id,
        createdAt: new Date().toISOString(),
      };
    }

    if (!accessToken) {
      // Offline/simulation fallback
      const arrayKey = currentTab === 'users' ? 'users' : currentTab === 'kepalaSekolah' ? 'kepalaSekolah' : currentTab === 'skGuru' ? 'skGuru' : currentTab === 'skKepalaSekolah' ? 'skKepalaSekolah' : currentTab === 'logAktivitas' ? 'logAktivitas' : currentTab;
      setData((prev) => {
        const next = {
          ...prev,
          [arrayKey]: [...((prev as any)[arrayKey] || []), newRecord],
          users: newCabangUser ? [...prev.users, newCabangUser] : prev.users,
        };
        localStorage.setItem('sim_offline_db', JSON.stringify(next));
        return next;
      });
      await logActivity(`CREATE_${mappedTable.toUpperCase()}`, `[Offline] Menambahkan record ${newRecord.id}`);
      return;
    }

    await insertRecord(accessToken, spreadsheetId, mappedTable, newRecord);
    if (newCabangUser) {
      try {
        await insertRecord(accessToken, spreadsheetId, 'Users', newCabangUser);
      } catch (err) {
        console.error('Gagal membuat akun user Cabang:', err);
      }
    }
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
    alert('Pengaturan disimpan! Sistem akan melakukan sinkronisasi dengan Google Sheets.');
    if (accessToken) {
      syncData(accessToken, spreadsheetId);
    } else {
      syncData('', spreadsheetId);
    }
  };

  const handleTestAppsScriptConnection = async () => {
    if (!appsScriptUrl) {
      alert('Mohon masukkan URL Google Apps Script Web App terlebih dahulu.');
      return;
    }
    setTestingConnection(true);
    try {
      const res = await fetch(`${appsScriptUrl}?action=ping`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success') {
          alert('✅ KONEKSI BERHASIL!\n\nGoogle Apps Script merespons dengan baik dan terhubung ke spreadsheet Google Sheets!');
        } else {
          alert(`⚠️ Apps Script merespons tetapi mengembalikan status error: ${json.error || 'Unknown error'}`);
        }
      } else {
        alert(`❌ Gagal terhubung ke Apps Script (HTTP Status ${res.status}). Pastikan "Who has access" diset ke "Anyone" (Siapa saja).`);
      }
    } catch (err: any) {
      alert(`❌ Gagal terhubung ke Apps Script: ${err.message || err}\n\nPastikan Web App di-deploy dengan opsi:\n- Execute as: Me (Saya)\n- Who has access: Anyone (Siapa Saja)`);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleCopyAppsScriptCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset pengaturan ke database bawaan Klaten?')) {
      setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
      setDriveFolderId(DEFAULT_DRIVE_FOLDER_ID);
      setAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
      localStorage.setItem('sim_spreadsheet_id', DEFAULT_SPREADSHEET_ID);
      localStorage.setItem('sim_drive_folder_id', DEFAULT_DRIVE_FOLDER_ID);
      localStorage.setItem('sim_apps_script_url', DEFAULT_APPS_SCRIPT_URL);
      localStorage.removeItem('sim_offline_db');
      syncData(accessToken || '', DEFAULT_SPREADSHEET_ID);
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
        userEmail={userProfile?.email || user?.email || ''}
        onLogout={handleLogout}
        unreadCount={unreadCount}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* HEADER */}
        <header className="min-h-[56px] py-2 bg-white border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between px-3 sm:px-6 gap-2.5 sm:gap-4 shrink-0 z-10 shadow-2xs">
          <div className="flex items-center justify-between md:justify-start gap-2 sm:gap-3 flex-wrap">
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
          
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 flex-wrap">
            {/* Interactive Role Simulator */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/90 rounded-lg p-1.5 sm:px-2.5 sm:py-1.5 shadow-2xs transition-all max-w-full flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <SlidersHorizontal size={13} className="text-emerald-600 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase tracking-tight">
                  Simulasi<span className="hidden xs:inline"> Peran</span>:
                </span>
                <select
                  value={activeRole}
                  onChange={(e) => {
                    const simulatedRole = e.target.value as Role;
                    let simulatedName = '';
                    let simulatedEmail = '';
                    let simulatedCabangId: string | undefined = undefined;
                    let simulatedSekolahId: string | undefined = undefined;

                    if (simulatedRole === 'Super Admin') {
                      simulatedName = 'Super Admin Klaten';
                      simulatedEmail = 'admin@klaten.go.id';
                    } else if (simulatedRole === 'Admin') {
                      simulatedName = 'Admin Operator';
                      simulatedEmail = 'admin2@klaten.go.id';
                    } else if (simulatedRole === 'Cabang') {
                      const curCab = data.cabang.find((c) => c.id === userProfile?.cabangId) || data.cabang[0];
                      simulatedCabangId = curCab?.id || 'cab-1';
                      simulatedName = curCab?.name || 'Pimpinan Cabang Wilayah V';
                      simulatedEmail = `cabang.${simulatedCabangId}@klaten.go.id`;
                    } else if (simulatedRole === 'Sekolah') {
                      const curSch = data.sekolah.find((s) => s.id === userProfile?.sekolahId) || data.sekolah[0];
                      simulatedSekolahId = curSch?.id || 'sch-1';
                      simulatedCabangId = curSch?.cabangId || 'cab-1';
                      simulatedName = curSch?.name || 'SMAN 1 Klaten';
                      simulatedEmail = curSch?.email || 'sman1klaten@klaten.go.id';
                    }
                    
                    localStorage.setItem('sim_override_role', simulatedRole);
                    localStorage.setItem('sim_override_username', simulatedName);
                    localStorage.setItem('sim_override_email', simulatedEmail);
                    
                    if (simulatedCabangId) {
                      localStorage.setItem('sim_override_cabang_id', simulatedCabangId);
                    } else {
                      localStorage.removeItem('sim_override_cabang_id');
                    }

                    if (simulatedSekolahId) {
                      localStorage.setItem('sim_override_sekolah_id', simulatedSekolahId);
                    } else {
                      localStorage.removeItem('sim_override_sekolah_id');
                    }

                    const updatedProfile: User = {
                      id: 'usr-override',
                      email: simulatedEmail,
                      name: simulatedName,
                      role: simulatedRole,
                      cabangId: simulatedCabangId,
                      sekolahId: simulatedSekolahId,
                      createdAt: new Date().toISOString(),
                    };
                    setUserProfile(updatedProfile);
                    
                    if (accessToken) {
                      syncData(accessToken, spreadsheetId);
                    }
                  }}
                  className="bg-white sm:bg-transparent border border-slate-200 sm:border-none text-[11px] sm:text-xs font-bold text-slate-900 rounded sm:rounded-none px-1.5 py-0.5 focus:outline-none cursor-pointer outline-none hover:text-emerald-700 transition-colors"
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Admin">Admin</option>
                  <option value="Cabang">Pimpinan Cabang</option>
                  <option value="Sekolah">Sekolah (Terdaftar)</option>
                </select>
              </div>

              {/* Sub-selector for Sekolah when Role === 'Sekolah' */}
              {activeRole === 'Sekolah' && (
                <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-300/80 min-w-0 max-w-full">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-emerald-700 uppercase tracking-tight shrink-0">
                    Sekolah:
                  </span>
                  <select
                    value={userProfile?.sekolahId || (data.sekolah[0]?.id ?? 'sch-1')}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedSch = data.sekolah.find((s) => s.id === selectedId);
                      if (selectedSch) {
                        const simName = selectedSch.name;
                        const simEmail = selectedSch.email || `${selectedSch.id}@dikdasmen.org`;
                        const simCab = selectedSch.cabangId || 'cab-1';

                        localStorage.setItem('sim_override_role', 'Sekolah');
                        localStorage.setItem('sim_override_username', simName);
                        localStorage.setItem('sim_override_email', simEmail);
                        localStorage.setItem('sim_override_sekolah_id', selectedSch.id);
                        localStorage.setItem('sim_override_cabang_id', simCab);

                        const updatedProfile: User = {
                          id: 'usr-override',
                          email: simEmail,
                          name: simName,
                          role: 'Sekolah',
                          cabangId: simCab,
                          sekolahId: selectedSch.id,
                          createdAt: new Date().toISOString(),
                        };
                        setUserProfile(updatedProfile);

                        if (accessToken) {
                          syncData(accessToken, spreadsheetId);
                        }
                      }
                    }}
                    className="bg-white sm:bg-transparent border border-emerald-300 sm:border-none text-[11px] sm:text-xs font-extrabold text-emerald-950 rounded sm:rounded-none px-1.5 py-0.5 max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-[220px] md:max-w-[280px] truncate focus:outline-none cursor-pointer"
                  >
                    {data.sekolah.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sub-selector for Cabang when Role === 'Cabang' */}
              {activeRole === 'Cabang' && data.cabang.length > 0 && (
                <div className="flex items-center gap-1 sm:gap-1.5 pl-1.5 sm:pl-2 border-l border-slate-300/80 min-w-0 max-w-full">
                  <span className="text-[10px] sm:text-[11px] font-extrabold text-teal-700 uppercase tracking-tight shrink-0">
                    Cabang:
                  </span>
                  <select
                    value={userProfile?.cabangId || (data.cabang[0]?.id ?? 'cab-1')}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedCab = data.cabang.find((c) => c.id === selectedId);
                      if (selectedCab) {
                        const simName = selectedCab.name;
                        const simEmail = `pimpinan.${selectedCab.id}@dikdasmen.org`;

                        localStorage.setItem('sim_override_role', 'Cabang');
                        localStorage.setItem('sim_override_username', simName);
                        localStorage.setItem('sim_override_email', simEmail);
                        localStorage.setItem('sim_override_cabang_id', selectedCab.id);
                        localStorage.removeItem('sim_override_sekolah_id');

                        const updatedProfile: User = {
                          id: 'usr-override',
                          email: simEmail,
                          name: simName,
                          role: 'Cabang',
                          cabangId: selectedCab.id,
                          createdAt: new Date().toISOString(),
                        };
                        setUserProfile(updatedProfile);

                        if (accessToken) {
                          syncData(accessToken, spreadsheetId);
                        }
                      }
                    }}
                    className="bg-white sm:bg-transparent border border-teal-300 sm:border-none text-[11px] sm:text-xs font-extrabold text-teal-950 rounded sm:rounded-none px-1.5 py-0.5 max-w-[130px] min-[400px]:max-w-[180px] sm:max-w-[220px] md:max-w-[280px] truncate focus:outline-none cursor-pointer"
                  >
                    {data.cabang.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden min-[480px]:block">
                <p className="text-xs font-bold text-slate-800 leading-none truncate max-w-[150px]">{userProfile?.name || user?.displayName || 'User'}</p>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">{activeRole}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center font-black text-slate-700 text-xs uppercase shrink-0">
                {userProfile?.name ? userProfile.name.charAt(0) : user?.displayName ? user.displayName.charAt(0) : 'U'}
              </div>
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
          <Dashboard
            data={data}
            onNavigateToTab={setCurrentTab}
            userRole={activeRole}
            userSekolahId={userProfile?.sekolahId}
            userCabangId={userProfile?.cabangId}
          />
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

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe size={14} className="text-rose-600" /> Google Apps Script Web App URL
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowScriptModal(true)}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Code size={13} /> Lihat & Salin Code.gs Lengkap
                  </button>
                </label>
                <input
                  type="url"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold font-mono text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>
                    Sinkronisasi data otomatis lintas perangkat tanpa batasan OAuth Google.
                  </span>
                  <button
                    type="button"
                    onClick={handleTestAppsScriptConnection}
                    disabled={testingConnection}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  >
                    {testingConnection ? <RefreshCw size={11} className="animate-spin" /> : <Zap size={11} />}
                    {testingConnection ? 'Testing...' : 'Tes Koneksi'}
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-all shadow-md border border-emerald-400/20 active:scale-[0.98]"
                >
                  Simpan & Hubungkan
                </button>
                <button
                  type="button"
                  onClick={() => setShowScriptModal(true)}
                  className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors border border-teal-200 flex items-center gap-1.5"
                >
                  <Code size={14} /> Salin Code.gs
                </button>
                <button
                  type="button"
                  onClick={handleResetSettings}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Reset Default
                </button>
              </div>
            </form>

            <div className="bg-teal-50/50 rounded-xl border border-teal-100/80 p-4 space-y-2 text-xs text-slate-600 leading-relaxed">
              <h4 className="font-bold text-teal-800 flex items-center gap-1.5">
                <CheckCircle size={14} /> Cara Memperbarui Apps Script (Agar Dapat Diakses dari Perangkat Lain)
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                <li>Klik tombol <strong className="text-teal-700 font-bold">"Salin Code.gs"</strong> di atas.</li>
                <li>Buka Spreadsheet Google Anda &gt; Menu <strong className="text-slate-800">Ekstensi (Extensions)</strong> &gt; <strong className="text-slate-800">Apps Script</strong>.</li>
                <li>Hapus semua isi kode bawaan, lalu <strong className="text-slate-800">Paste (Tempel)</strong> kode yang sudah disalin.</li>
                <li>Klik <strong className="text-slate-800">Terapkan (Deploy)</strong> &gt; <strong className="text-slate-800">Terapkan sebagai web app (New deployment)</strong>.</li>
                <li>Atur <strong className="text-teal-800 font-bold">Jalankan sebagai: Saya (Me)</strong> dan <strong className="text-teal-800 font-bold">Yang memiliki akses: Siapa saja (Anyone)</strong>.</li>
                <li>Salin URL Web App yang dihasilkan (berakhiran <code className="bg-teal-100 px-1 rounded text-teal-900 font-mono">/exec</code>) lalu simpan di kolom Web App URL di atas.</li>
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
        ) : currentTab === 'mutasi' ? (
          <MutasiView
            data={data}
            userRole={activeRole}
            userCabangId={userProfile?.cabangId}
            userSekolahId={userProfile?.sekolahId}
            onEditRecord={async (tableName, id, updatedFields) => {
              // Map TAB name or TableName
              const targetTable = TAB_TO_TABLE_MAP[tableName] || (tableName as TableName);
              // Set currentTab momentarily for handleEditRecord if needed, or call update logic directly
              const currentTable = TAB_TO_TABLE_MAP[currentTab] || (currentTab as TableName);
              // Handle update
              const activeSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
              await updateRecord(accessToken || '', activeSpreadsheetId, targetTable, id, updatedFields);
              const reloadedData = await syncData(accessToken || '', activeSpreadsheetId);
              setData(reloadedData);
              localStorage.setItem('sim_offline_db', JSON.stringify(reloadedData));
            }}
            onDeleteRecord={async (tableName, id) => {
              const targetTable = TAB_TO_TABLE_MAP[tableName] || (tableName as TableName);
              const activeSpreadsheetId = spreadsheetId || DEFAULT_SPREADSHEET_ID;
              await deleteRecord(accessToken || '', activeSpreadsheetId, targetTable, id);
              const reloadedData = await syncData(accessToken || '', activeSpreadsheetId);
              setData(reloadedData);
              localStorage.setItem('sim_offline_db', JSON.stringify(reloadedData));
            }}
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

      {/* APPS SCRIPT CODE MODAL OVERLAY */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-900 text-white">
              <div className="flex items-center gap-2.5">
                <Code className="text-emerald-300" size={20} />
                <div>
                  <h3 className="font-bold text-sm text-white">Kode Google Apps Script Lengkap (Code.gs)</h3>
                  <p className="text-[11px] text-emerald-200">Salin kode ini ke Apps Script pada Google Spreadsheet Anda</p>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-emerald-200 hover:text-white hover:bg-emerald-800 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
              {/* Instructions Callout */}
              <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3.5 text-amber-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" /> Langkah Penting Deployment Google Apps Script:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-amber-800">
                  <li>Buka spreadsheet Google Anda &gt; Menu <strong>Ekstensi</strong> &gt; <strong>Apps Script</strong>.</li>
                  <li>Hapus kode bawaan dan tempel (paste) seluruh isi kode di bawah ini.</li>
                  <li>Klik tombol <strong>Terapkan (Deploy)</strong> &gt; <strong>Terapkan sebagai web app</strong>.</li>
                  <li>Atur <strong>Jalankan sebagai: Saya (Me)</strong> dan <strong>Yang memiliki akses: Siapa saja (Anyone)</strong>.</li>
                  <li>Salin Web App URL yang berakhiran <code className="bg-amber-100 px-1 rounded font-mono text-amber-900">/exec</code> lalu tempelkan pada kolom Pengaturan aplikasi ini.</li>
                </ol>
              </div>

              {/* Code Actions Header */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Code size={14} className="text-teal-600" /> Script Code.gs (250+ Baris)
                </span>
                <button
                  onClick={handleCopyAppsScriptCode}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all shadow-sm cursor-pointer active:scale-95"
                >
                  {copySuccess ? <Check size={14} /> : <Copy size={14} />}
                  {copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Kode ke Clipboard'}
                </button>
              </div>

              {/* Code display block */}
              <div className="relative">
                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto max-h-[350px] overflow-y-auto select-text border border-slate-800">
                  <code>{APPS_SCRIPT_CODE}</code>
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Siap menghubungkan perangkat lain secara real-time.
              </span>
              <button
                onClick={() => setShowScriptModal(false)}
                className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition-colors"
              >
                Tutup Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
