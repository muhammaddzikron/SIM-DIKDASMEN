export type Role = 'Super Admin' | 'Admin' | 'Cabang' | 'Sekolah';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  password?: string;
  cabangId?: string; // Empty for Super Admin/Admin
  sekolahId?: string; // Empty for other than Sekolah
  createdAt: string;
}

export interface Cabang {
  id: string;
  name: string;
  code: string;
}

export interface Sekolah {
  id: string;
  name: string;
  npsn: string;
  cabangId: string;
  address: string;
  status: 'Negeri' | 'Swasta';
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
}

export interface Guru {
  id: string;
  name: string;
  nip: string;
  schoolId: string;
  gender: 'Laki-laki' | 'Perempuan';
  subject: string;
  status: 'PNS' | 'PPPK' | 'GTT' | 'Honor';
}

export interface KepalaSekolah {
  id: string;
  name: string;
  nip: string;
  schoolId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'Aktif' | 'Selesai' | 'Cuti';
}

export interface Siswa {
  id: string;
  name: string;
  nisn: string;
  schoolId: string;
  class: string;
  gender: 'Laki-laki' | 'Perempuan';
}

export interface SKGuru {
  id: string;
  skNumber: string;
  skDate: string; // YYYY-MM-DD
  skEndDate?: string; // YYYY-MM-DD
  title: string;
  guruId: string;
  fileUrl: string;
  fileId: string;
  status: 'Terbit' | 'Belum Terbit';
}

export interface SKKepalaSekolah {
  id: string;
  skNumber: string;
  skDate: string; // YYYY-MM-DD
  skEndDate?: string; // YYYY-MM-DD
  title: string;
  kepalaSekolahId: string;
  fileUrl: string;
  fileId: string;
  status: 'Terbit' | 'Belum Terbit';
}

export interface Notifikasi {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  isRead: 'true' | 'false';
  createdAt: string;
}

export interface LogAktivitas {
  id: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface Setting {
  key: string;
  value: string;
}

export interface DatabaseState {
  users: User[];
  cabang: Cabang[];
  sekolah: Sekolah[];
  guru: Guru[];
  kepalaSekolah: KepalaSekolah[];
  siswa: Siswa[];
  skGuru: SKGuru[];
  skKepalaSekolah: SKKepalaSekolah[];
  notifikasi: Notifikasi[];
  logAktivitas: LogAktivitas[];
  settings: Setting[];
}

export type TableName =
  | 'Users'
  | 'Cabang'
  | 'Sekolah'
  | 'Guru'
  | 'KepalaSekolah'
  | 'Siswa'
  | 'SKGuru'
  | 'SKKepalaSekolah'
  | 'Notifikasi'
  | 'LogAktivitas'
  | 'Setting';
