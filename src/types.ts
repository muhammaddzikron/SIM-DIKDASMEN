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
  name: string; // Nama Sekolah/Madrasah sesuai Referensi Data Kemendikdasmen
  npsn: string;
  cabangId: string;
  address: string;
  rtRw?: string;
  postalCode?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupatenKota?: string;
  status: 'Negeri' | 'Swasta';
  level: 'SD' | 'SMP' | 'SMA' | 'SMK';
  phone?: string;
  email?: string;
  website?: string;
  accreditation?: 'A' | 'B' | 'C' | 'Unggul' | 'Baik Sekali' | 'Baik' | 'Terakreditasi' | 'Proses Akreditasi' | 'Belum Terakreditasi' | string;
  accreditationExpiryDate?: string;
  categoryCapability?: 'UGD' | 'RAWAT INAP' | 'RAWAT JALAN' | 'SEHAT' | string;
  hasNib?: 'Ya' | 'Tidak' | string;
  nib?: string;
  skPendirianNumber?: string;
  skPendirianDate?: string;
  skIzinOperasional?: string;
  skIzinOperasionalDate?: string;
  jumlahSiswaPerKelas?: string;
  jumlahKeseluruhanSiswa?: string;
  jumlahGtp?: string;
  jumlahGttp?: string;
  jumlahKeseluruhanGuru?: string;
  jumlahKtp?: string;
  jumlahKttp?: string;
  jumlahKeseluruhanKaryawan?: string;
  jumlahGuruSertifikasi?: string;
  jumlahGuruInpassing?: string;
  jumlahDpkPns?: string;
  sosmed?: string;
  operatorName?: string;
  operatorPhone?: string;
  curriculum?: string;
  vision?: string;
  mission?: string;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface Guru {
  id: string;
  name: string; // Nama Guru beserta title
  nipm?: string; // NIPM (Nomor Induk Pegawai Muhammadiyah)
  gender: 'Laki-laki' | 'Perempuan';
  pobDob?: string; // Tempat Tanggal Lahir
  schoolId: string;
  status: 'GTP' | 'GTTP' | 'PNS' | 'GTT' | 'Honor' | 'Mutasi' | string;
  guruType?: 'Guru Kelas' | 'Guru Mata Pelajaran' | string;
  subject: string; // Detail Kelas / Mata Pelajaran
  hasPpg?: 'Sudah' | 'Belum' | string;
  nuptk?: string;
  nrg?: string;
  nip: string; // NIP
  nbm?: string; // NBM
  skNumber?: string; // Nomor SK Pengangkatan
  tmtAwal?: string; // TMT Awal Pengangkatan
  education?: string; // Pendidikan Terakhir
  educationProdi?: string; // Prodi Pendidikan Terakhir
  address?: string; // Alamat Domisili
  rtRw?: string;
  postalCode?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupatenKota?: string;
  phone?: string; // Nomor HP Aktif
  persyarikatanActivity?: string; // Keaktifan di Persyarikatan (Tingkatan & Ortom)
}

export interface TenagaKependidikan {
  id: string;
  name: string; // Nama Karyawan beserta title
  nipm?: string; // NIPM
  nip?: string; // NIP / NIK
  pobDob?: string; // Tempat Tanggal Lahir
  gender: 'Laki-laki' | 'Perempuan';
  schoolId: string;
  status: 'KTP' | 'KTTP' | 'PNS' | 'GTT' | 'Honor' | 'PTT' | 'Mutasi' | string;
  position: string; // Jenis Karyawan (TU, Operator, Perpus, Penjaga, OB, Keamanan, Tukang Kebun, Lainnya)
  nbm?: string;
  skNumber?: string;
  tmtAwal?: string;
  education?: string;
  educationProdi?: string;
  address?: string;
  rtRw?: string;
  postalCode?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupatenKota?: string;
  phone?: string;
  persyarikatanActivity?: string;
}

export interface KepalaSekolah {
  id: string;
  name: string; // Nama Lengkap Kepala beserta title
  nipm?: string; // NIPM
  pobDob?: string; // Tempat Tanggal Lahir
  phone?: string; // Nomor HP
  periodNumber?: string; // Periode Kepala ke-berapa
  nip: string;
  schoolId: string;
  startDate: string; // TMT SK Kepala Sekolah/Madrasah (YYYY-MM-DD)
  endDate: string; // Tanggal Berakhir Jabatan Kepala (YYYY-MM-DD)
  nuptk?: string;
  nuks?: string;
  serdikStatus?: 'Sudah' | 'Belum' | string;
  status: 'GTY' | 'PNS' | 'Aktif' | 'Selesai' | 'Cuti' | 'Mutasi' | string;
}

export interface Siswa {
  id: string;
  name: string; // Nama Siswa
  gender: 'Laki-laki' | 'Perempuan';
  nisn: string;
  pobDob?: string; // Tempat Tanggal Lahir
  schoolId: string;
  class: string;
  address?: string;
  rtRw?: string;
  postalCode?: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupatenKota?: string;
  status?: 'Aktif' | 'Lulus' | 'Mutasi' | string;
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
  status: 'Terbit' | 'Belum Terbit' | 'Ditolak' | string;
  submissionType?: 'Baru' | 'Lama' | string;
  nbmUrl?: string;
  ijazahUrl?: string;
  skLamaUrl?: string;
}

export interface SKTenagaKependidikan {
  id: string;
  skNumber: string;
  skDate: string; // YYYY-MM-DD
  skEndDate?: string; // YYYY-MM-DD
  title: string;
  tendikId: string;
  fileUrl: string;
  fileId: string;
  status: 'Terbit' | 'Belum Terbit' | 'Ditolak' | string;
  submissionType?: 'Baru' | 'Lama' | string;
  nbmUrl?: string;
  ijazahUrl?: string;
  skLamaUrl?: string;
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
  status: 'Terbit' | 'Belum Terbit' | 'Ditolak' | string;
  submissionType?: 'Baru' | 'Lama' | string;
  nbmUrl?: string;
  ijazahUrl?: string;
  skLamaUrl?: string;
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
  tendik: TenagaKependidikan[];
  kepalaSekolah: KepalaSekolah[];
  siswa: Siswa[];
  skGuru: SKGuru[];
  skTendik: SKTenagaKependidikan[];
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
  | 'TenagaKependidikan'
  | 'KepalaSekolah'
  | 'Siswa'
  | 'SKGuru'
  | 'SKTenagaKependidikan'
  | 'SKKepalaSekolah'
  | 'Notifikasi'
  | 'LogAktivitas'
  | 'Setting';
