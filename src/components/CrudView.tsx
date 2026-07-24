import React, { useState, useRef, useMemo, useEffect } from 'react';
import { TableName, Role, DatabaseState } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  FileText,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  FileDown,
  Download,
  FileSpreadsheet,
  Printer,
  Upload,
  ArrowRightLeft,
} from 'lucide-react';
import { uploadFileToDrive } from '../lib/drive';

interface CrudViewProps {
  tableName: TableName;
  data: DatabaseState;
  userRole: Role;
  userCabangId?: string;
  userSekolahId?: string;
  accessToken: string;
  driveFolderId: string;
  onAdd: (record: Record<string, any>) => Promise<void>;
  onEdit: (id: string, record: Record<string, any>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  isDarkMode?: boolean;
}

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'textarea' | 'file' | 'password';
  options?: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}

export default function CrudView({
  tableName,
  data,
  userRole,
  userCabangId,
  userSekolahId,
  accessToken,
  driveFolderId,
  onAdd,
  onEdit,
  onDelete,
  onBulkDelete,
  isDarkMode = false,
}: CrudViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Selection state for Bulk Delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filter Mutasi vs Active for Personnel tables
  const [mutasiFilter, setMutasiFilter] = useState<'aktif' | 'mutasi'>('aktif');

  // CSV Import States
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLogs, setImportLogs] = useState<string[]>([]);

  // File Upload State
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{ name: string; url: string; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 8;

  const getFriendlyTableName = (name: string) => {
    if (name === 'SKGuru') return 'SK Guru';
    if (name === 'SKTendik' || name === 'SKTenagaKependidikan') return 'SK Tenaga Kependidikan';
    if (name === 'SKKepalaSekolah') return 'SK Kepala Sekolah';
    if (name === 'TenagaKependidikan') return 'Tenaga Kependidikan';
    if (name === 'Cabang') return 'Pimpinan Cabang';
    if (name === 'KepalaSekolah') return 'Kepala Sekolah';
    if (name === 'LogAktivitas') return 'Log Aktivitas';
    return name;
  };

  const getPageTitle = (name: string) => {
    if (name === 'SKGuru') return 'SK Guru';
    if (name === 'SKTendik' || name === 'SKTenagaKependidikan') return 'SK Tenaga Kependidikan';
    if (name === 'SKKepalaSekolah') return 'SK Kepala Sekolah';
    return `SIM ${getFriendlyTableName(name)}`;
  };

  // Clear selections on table, page, or search change
  useEffect(() => {
    setSelectedIds([]);
    setMutasiFilter('aktif');
  }, [tableName, searchQuery, currentPage]);

  // 1. Define Fields Configuration for each Table
  const fields = useMemo((): FormField[] => {
    switch (tableName) {
      case 'Users':
        return [
          { name: 'email', label: 'Email Google', type: 'text', placeholder: 'user@gmail.com', required: true },
          { name: 'name', label: 'Nama Lengkap', type: 'text', placeholder: 'Masukkan nama...', required: true },
          { name: 'password', label: 'Password Login', type: 'password', placeholder: 'Masukkan password...', required: true },
          {
            name: 'role',
            label: 'Hak Akses',
            type: 'select',
            required: true,
            options: [
              { value: 'Super Admin', label: 'Super Admin' },
              { value: 'Admin', label: 'Admin' },
              { value: 'Cabang', label: 'Pimpinan Cabang' },
              { value: 'Sekolah', label: 'Sekolah' },
            ],
          },
          {
            name: 'cabangId',
            label: 'Pimpinan Cabang (Khusus Cabang)',
            type: 'select',
            options: [
              { value: '', label: '-- Pilih Cabang --' },
              ...data.cabang.map((c) => ({ value: c.id, label: c.name })),
            ],
          },
          {
            name: 'sekolahId',
            label: 'Sekolah (Khusus Sekolah)',
            type: 'select',
            options: [
              { value: '', label: '-- Pilih Sekolah --' },
              ...data.sekolah.map((s) => ({ value: s.id, label: s.name })),
            ],
          },
        ];

      case 'Cabang':
        return [
          { name: 'name', label: 'Nama Pimpinan Cabang', type: 'text', placeholder: 'Misal: Pimpinan Cabang Wilayah V', required: true },
          { name: 'code', label: 'Kode Cabang', type: 'text', placeholder: 'Misal: CAB-V', required: true },
        ];

      case 'Sekolah':
        return [
          { name: 'name', label: 'Nama Sekolah/Madrasah (sesuai Referensi Data Kemendikdasmen)', type: 'text', placeholder: 'Misal: SD Muhammadiyah 1 Klaten', required: true },
          { name: 'npsn', label: 'NPSN', type: 'text', placeholder: 'Nomor NPSN...', required: true },
          {
            name: 'cabangId',
            label: 'Pimpinan Cabang',
            type: 'select',
            required: true,
            options: data.cabang.map((c) => ({ value: c.id, label: c.name })),
          },
          { name: 'address', label: 'Alamat Jalan Sekolah/Madrasah', type: 'textarea', placeholder: 'Jl. Pemuda No...', required: true },
          { name: 'rtRw', label: 'RT / RW', type: 'text', placeholder: 'Misal: 002 / 005' },
          { name: 'postalCode', label: 'Kode Pos', type: 'text', placeholder: 'Misal: 57411' },
          { name: 'kelurahan', label: 'Kelurahan / Desa', type: 'text', placeholder: 'Misal: Tonggalan' },
          { name: 'kecamatan', label: 'Kecamatan', type: 'text', placeholder: 'Misal: Klaten Tengah' },
          { name: 'kabupatenKota', label: 'Kabupaten / Kota', type: 'text', placeholder: 'Misal: Kabupaten Klaten' },
          {
            name: 'status',
            label: 'Status Sekolah',
            type: 'select',
            required: true,
            options: [
              { value: 'Swasta', label: 'Swasta' },
              { value: 'Negeri', label: 'Negeri' },
            ],
          },
          {
            name: 'level',
            label: 'Jenjang',
            type: 'select',
            required: true,
            options: [
              { value: 'SD', label: 'SD / MI' },
              { value: 'SMP', label: 'SMP / MTs' },
              { value: 'SMA', label: 'SMA / MA' },
              { value: 'SMK', label: 'SMK' },
            ],
          },
          { name: 'vision', label: 'Visi Sekolah/Madrasah', type: 'textarea', placeholder: 'Tulis visi sekolah...' },
          { name: 'mission', label: 'Misi Sekolah/Madrasah', type: 'textarea', placeholder: 'Tulis misi sekolah...' },
          {
            name: 'hasNib',
            label: 'Sudah Mempunyai NIB ?',
            type: 'select',
            options: [
              { value: 'Ya', label: 'Ya' },
              { value: 'Tidak', label: 'Tidak' },
            ],
          },
          { name: 'nib', label: 'Nomor NIB (Nomor Induk Berusaha)', type: 'text', placeholder: 'Tuliskan NIB jika ada...' },
          { name: 'email', label: 'Email Sekolah/Madrasah', type: 'text', placeholder: 'email@sekolah.sch.id' },
          { name: 'website', label: 'Web Sekolah/Madrasah', type: 'text', placeholder: 'https://sekolah.sch.id' },
          { name: 'phone', label: 'Nomor Telepon Sekolah/Madrasah', type: 'text', placeholder: 'Misal: (0272) 321520 / 08123456789' },
          {
            name: 'accreditation',
            label: 'Status Akreditasi / Nilai',
            type: 'select',
            options: [
              { value: 'A', label: 'A (Unggul / Sangat Baik)' },
              { value: 'B', label: 'B (Baik Sekali / Baik)' },
              { value: 'C', label: 'C (Cukup)' },
              { value: 'Unggul', label: 'Unggul (Standar Baru BAN-S/M)' },
              { value: 'Baik Sekali', label: 'Baik Sekali (Standar Baru BAN-S/M)' },
              { value: 'Baik', label: 'Baik (Standar Baru BAN-S/M)' },
              { value: 'Terakreditasi', label: 'Terakreditasi (Umum)' },
              { value: 'Proses Akreditasi', label: 'Dalam Proses Akreditasi / Re-Akreditasi' },
              { value: 'Belum Terakreditasi', label: 'Belum Terakreditasi / TT' },
            ],
          },
          { name: 'accreditationExpiryDate', label: 'Tanggal / Tahun Berakhir Status Akreditasi', type: 'date' },
          {
            name: 'categoryCapability',
            label: 'Kategori Kemampuan Sekolah / Madrasah',
            type: 'select',
            options: [
              { value: 'UGD', label: '1. UGD (> S/M Dibawah 100 Siswa) - Menuju Rintisan' },
              { value: 'RAWAT INAP', label: '2. RAWAT INAP (> S/M 100-400 Siswa) - Mandiri' },
              { value: 'RAWAT JALAN', label: '3. RAWAT JALAN (> S/M 400-600 Siswa) - Unggul' },
              { value: 'SEHAT', label: '4. SEHAT (> S/M Diatas 600 Siswa) - Premium' },
            ],
          },
          { name: 'skPendirianNumber', label: 'Nomor SK Pendirian Sekolah/Madrasah', type: 'text', placeholder: 'Nomor SK Pendirian...' },
          { name: 'skPendirianDate', label: 'Tanggal SK Pendirian', type: 'date' },
          { name: 'skIzinOperasional', label: 'SK Izin Operasional', type: 'text', placeholder: 'Nomor SK Izin Operasional...' },
          { name: 'skIzinOperasionalDate', label: 'Tanggal SK Izin Operasional', type: 'date' },
          { name: 'jumlahSiswaPerKelas', label: 'Jumlah Siswa Per Kelas', type: 'text', placeholder: 'Misal: Rata-rata 28-32 Siswa' },
          { name: 'jumlahKeseluruhanSiswa', label: 'Jumlah Keseluruhan Siswa', type: 'text', placeholder: 'Misal: 450' },
          { name: 'jumlahGtp', label: 'Jumlah GTP (Guru Tetap Persyarikatan)', type: 'text', placeholder: 'Misal: 15' },
          { name: 'jumlahGttp', label: 'Jumlah GTTP (Guru Tidak Tetap Persyarikatan)', type: 'text', placeholder: 'Misal: 5' },
          { name: 'jumlahKeseluruhanGuru', label: 'Jumlah Keseluruhan Guru', type: 'text', placeholder: 'Misal: 20' },
          { name: 'jumlahKtp', label: 'Jumlah KTP (Karyawan Tetap Persyarikatan)', type: 'text', placeholder: 'Misal: 4' },
          { name: 'jumlahKttp', label: 'Jumlah KTTP (Karyawan Tidak Tetap Persyarikatan)', type: 'text', placeholder: 'Misal: 2' },
          { name: 'jumlahKeseluruhanKaryawan', label: 'Jumlah Keseluruhan Karyawan', type: 'text', placeholder: 'Misal: 6' },
          { name: 'jumlahGuruSertifikasi', label: 'Jumlah Guru Bersertifikasi', type: 'text', placeholder: 'Misal: 12' },
          { name: 'jumlahGuruInpassing', label: 'Jumlah Guru Inpassing', type: 'text', placeholder: 'Misal: 3' },
          { name: 'jumlahDpkPns', label: 'Jumlah DPK / PNS', type: 'text', placeholder: 'Misal: 1' },
          { name: 'sosmed', label: 'Akun Sosmed Sekolah/Madrasah', type: 'text', placeholder: 'IG: @sdmuh1klaten | FB: SD Muh 1 Klaten' },
          { name: 'operatorName', label: 'Nama Lengkap Operator', type: 'text', placeholder: 'Nama lengkap operator sekolah...' },
          { name: 'operatorPhone', label: 'Nomor HP Operator', type: 'text', placeholder: '08123456789' },
          {
            name: 'curriculum',
            label: 'Kurikulum Operasional',
            type: 'select',
            options: [
              { value: 'Kurikulum Merdeka', label: 'Kurikulum Merdeka' },
              { value: 'Kurikulum 2013', label: 'Kurikulum 2013' },
              { value: 'Kurikulum Kombinasi', label: 'Kurikulum Kombinasi' },
            ],
          },
          { name: 'description', label: 'Profil Ringkas / Sambutan Kepala Sekolah', type: 'textarea', placeholder: 'Tuliskan deskripsi ringkas profil atau sambutan sekolah...' },
          { name: 'logoUrl', label: 'URL Logo / Lambang Sekolah', type: 'text', placeholder: 'https://...' },
          { name: 'bannerUrl', label: 'URL Foto Sampul / Gedung Sekolah', type: 'text', placeholder: 'https://...' },
        ];

      case 'Guru':
        return [
          { name: 'name', label: 'Nama Guru beserta Title / Gelar', type: 'text', placeholder: 'Nama lengkap beserta gelar (misal: Drs. Ahmad Dahlan, M.Pd)', required: true },
          { name: 'nipm', label: 'NIPM (Nomor Induk Pegawai Muhammadiyah)', type: 'text', placeholder: 'Isikan NIPM jika ada...' },
          {
            name: 'gender',
            label: 'Jenis Kelamin',
            type: 'select',
            required: true,
            options: [
              { value: 'Laki-laki', label: 'Laki-laki' },
              { value: 'Perempuan', label: 'Perempuan' },
            ],
          },
          { name: 'pobDob', label: 'Tempat, Tanggal Lahir', type: 'text', placeholder: 'Misal: Klaten, 15 Mei 1985' },
          {
            name: 'schoolId',
            label: 'Sekolah Tempat Bertugas',
            type: 'select',
            required: true,
            options: data.sekolah.map((s) => ({ value: s.id, label: s.name })),
          },
          {
            name: 'status',
            label: 'Status Guru',
            type: 'select',
            required: true,
            options: [
              { value: 'GTP', label: 'GTP (Guru Tetap Persyarikatan)' },
              { value: 'GTTP', label: 'GTTP (Guru Tidak Tetap Persyarikatan)' },
              { value: 'PNS', label: 'PNS / DPK' },
              { value: 'GTT', label: 'GTT' },
              { value: 'Honor', label: 'Honor Sekolah' },
              { value: 'Mutasi', label: 'Mutasi (Pindah / Keluar)' },
            ],
          },
          {
            name: 'guruType',
            label: 'Jenis Guru',
            type: 'select',
            options: [
              { value: 'Guru Kelas', label: 'Guru Kelas' },
              { value: 'Guru Mata Pelajaran', label: 'Guru Mata Pelajaran' },
            ],
          },
          { name: 'subject', label: 'Mata Pelajaran / Detail Kelas', type: 'text', placeholder: 'Misal: Matematika / Guru Kelas III', required: true },
          {
            name: 'hasPpg',
            label: 'Sudah PPG ?',
            type: 'select',
            options: [
              { value: 'Sudah', label: 'Sudah' },
              { value: 'Belum', label: 'Belum' },
            ],
          },
          { name: 'nuptk', label: 'NUPTK', type: 'text', placeholder: 'Isikan NUPTK...' },
          { name: 'nrg', label: 'NRG', type: 'text', placeholder: 'Isikan NRG (Nomor Registrasi Guru)...' },
          { name: 'nip', label: 'NIP (Nomor Induk Pegawai PNS/PPPK)', type: 'text', placeholder: 'Nomor NIP jika PNS/PPPK...' },
          { name: 'nbm', label: 'NBM (Nomor Baku Muhammadiyah)', type: 'text', placeholder: 'Isikan NBM...' },
          { name: 'skNumber', label: 'Nomor SK Pengangkatan', type: 'text', placeholder: 'Nomor SK Pengangkatan...' },
          { name: 'tmtAwal', label: 'TMT Awal Pengangkatan', type: 'date' },
          {
            name: 'education',
            label: 'Pendidikan Terakhir',
            type: 'select',
            options: [
              { value: 'S1', label: 'S1 (Sarjana)' },
              { value: 'S2', label: 'S2 (Magister)' },
              { value: 'S3', label: 'S3 (Doktor)' },
              { value: 'D3', label: 'D3 (Diploma)' },
              { value: 'SMA / SMK', label: 'SMA / SMK / MA' },
            ],
          },
          { name: 'educationProdi', label: 'Prodi Pendidikan Terakhir', type: 'text', placeholder: 'Misal: Pendidikan Bahasa Indonesia' },
          { name: 'address', label: 'Alamat Domisili (Jalan / Dusun)', type: 'textarea', placeholder: 'Tuliskan alamat domisili...' },
          { name: 'rtRw', label: 'RT / RW', type: 'text', placeholder: 'Misal: 001 / 003' },
          { name: 'postalCode', label: 'Kode Pos', type: 'text', placeholder: 'Misal: 57412' },
          { name: 'kelurahan', label: 'Kelurahan', type: 'text', placeholder: 'Misal: Gergunung' },
          { name: 'kecamatan', label: 'Kecamatan', type: 'text', placeholder: 'Misal: Klaten Utara' },
          { name: 'kabupatenKota', label: 'Kabupaten / Kota', type: 'text', placeholder: 'Misal: Kabupaten Klaten' },
          { name: 'phone', label: 'Nomor HP Aktif', type: 'text', placeholder: '08123456789' },
          {
            name: 'persyarikatanActivity',
            label: 'Keaktifan di Persyarikatan (Tingkatan keaktifan & Ortom)',
            type: 'text',
            placeholder: 'Misal: Ranting / Pemuda Muhammadiyah, Cabang / Aisyiyah, IPM, Tapak Suci, HW, dll.',
          },
        ];

      case 'TenagaKependidikan':
        return [
          { name: 'name', label: 'Nama Karyawan beserta Title / Gelar', type: 'text', placeholder: 'Nama lengkap beserta gelar...', required: true },
          { name: 'nipm', label: 'NIPM (Nomor Induk Pegawai Muhammadiyah)', type: 'text', placeholder: 'Isikan NIPM...' },
          { name: 'pobDob', label: 'Tempat, Tanggal Lahir', type: 'text', placeholder: 'Misal: Boyolali, 12 Agustus 1990' },
          {
            name: 'gender',
            label: 'Jenis Kelamin',
            type: 'select',
            required: true,
            options: [
              { value: 'Laki-laki', label: 'Laki-laki' },
              { value: 'Perempuan', label: 'Perempuan' },
            ],
          },
          {
            name: 'schoolId',
            label: 'Sekolah Tempat Bertugas',
            type: 'select',
            required: true,
            options: data.sekolah.map((s) => ({ value: s.id, label: s.name })),
          },
          {
            name: 'status',
            label: 'Status Karyawan',
            type: 'select',
            required: true,
            options: [
              { value: 'KTP', label: 'KTP (Karyawan Tetap Persyarikatan)' },
              { value: 'KTTP', label: 'KTTP (Karyawan Tidak Tetap Persyarikatan)' },
              { value: 'PNS', label: 'PNS / DPK' },
              { value: 'PTT', label: 'PTT (Pegawai Tidak Tetap)' },
              { value: 'Honor', label: 'Honor Sekolah' },
              { value: 'Mutasi', label: 'Mutasi (Pindah / Keluar)' },
            ],
          },
          {
            name: 'position',
            label: 'Jenis Karyawan / Jabatan',
            type: 'select',
            required: true,
            options: [
              { value: 'Staff Administrasi (TU)', label: 'Staff Administrasi (TU)' },
              { value: 'Operator Sekolah/Madrasah', label: 'Operator Sekolah/Madrasah' },
              { value: 'Penjaga Lab', label: 'Penjaga Lab' },
              { value: 'Petugas Perpus', label: 'Petugas Perpus' },
              { value: 'Office Boy', label: 'Office Boy' },
              { value: 'Petugas Keamanan', label: 'Petugas Keamanan' },
              { value: 'Tukang Kebun', label: 'Tukang Kebun' },
              { value: 'Penjaga', label: 'Penjaga Sekolah' },
              { value: 'Lainnya', label: 'Lainnya...' },
            ],
          },
          { name: 'nbm', label: 'NBM (Nomor Baku Muhammadiyah)', type: 'text', placeholder: 'Isikan NBM...' },
          { name: 'skNumber', label: 'Nomor SK Pengangkatan', type: 'text', placeholder: 'Nomor SK Pengangkatan...' },
          { name: 'tmtAwal', label: 'TMT Awal Pengangkatan', type: 'date' },
          {
            name: 'education',
            label: 'Pendidikan Terakhir',
            type: 'select',
            options: [
              { value: 'S1', label: 'S1 (Sarjana)' },
              { value: 'D3', label: 'D3 (Diploma)' },
              { value: 'SMA / SMK', label: 'SMA / SMK / MA' },
              { value: 'SMP', label: 'SMP / MTs' },
              { value: 'SD', label: 'SD / MI' },
            ],
          },
          { name: 'educationProdi', label: 'Prodi Pendidikan Terakhir', type: 'text', placeholder: 'Misal: Manajemen / Informatika / IPA' },
          { name: 'address', label: 'Alamat Domisili (Jalan / Dusun)', type: 'textarea', placeholder: 'Tuliskan alamat domisili...' },
          { name: 'rtRw', label: 'RT / RW', type: 'text', placeholder: 'Misal: 002 / 004' },
          { name: 'postalCode', label: 'Kode Pos', type: 'text', placeholder: 'Misal: 57413' },
          { name: 'kelurahan', label: 'Kelurahan', type: 'text', placeholder: 'Misal: Buntalan' },
          { name: 'kecamatan', label: 'Kecamatan', type: 'text', placeholder: 'Misal: Klaten Tengah' },
          { name: 'kabupatenKota', label: 'Kabupaten / Kota', type: 'text', placeholder: 'Misal: Kabupaten Klaten' },
          { name: 'phone', label: 'Nomor HP', type: 'text', placeholder: '08123456789' },
          {
            name: 'persyarikatanActivity',
            label: 'Keaktifan di Persyarikatan (Tingkatan keaktifan & Ortom)',
            type: 'text',
            placeholder: 'Misal: Ranting / Pemuda Muhammadiyah, Aisyiyah, HW, Kokam, dll.',
          },
        ];

      case 'KepalaSekolah':
        return [
          { name: 'name', label: 'Nama Lengkap Kepala beserta Title / Gelar', type: 'text', placeholder: 'Nama lengkap beserta gelar...', required: true },
          { name: 'nipm', label: 'NIPM (Nomor Induk Pegawai Muhammadiyah)', type: 'text', placeholder: 'Isikan NIPM...' },
          { name: 'pobDob', label: 'Tempat, Tanggal Lahir', type: 'text', placeholder: 'Misal: Klaten, 10 Januari 1978' },
          { name: 'phone', label: 'Nomor HP Aktif', type: 'text', placeholder: '08123456789' },
          { name: 'periodNumber', label: 'Periode Kepala yang ke berapa', type: 'text', placeholder: 'Misal: Periode Ke-1 / Periode Ke-2' },
          {
            name: 'schoolId',
            label: 'Sekolah Tempat Bertugas',
            type: 'select',
            required: true,
            options: data.sekolah.map((s) => ({ value: s.id, label: s.name })),
          },
          { name: 'startDate', label: 'TMT SK Kepala Sekolah/Madrasah', type: 'date', required: true },
          { name: 'endDate', label: 'Tanggal Berakhir Jabatan Kepala sesuai SK', type: 'date', required: true },
          { name: 'nuptk', label: 'NUPTK', type: 'text', placeholder: 'Isikan NUPTK...' },
          { name: 'nuks', label: 'NUKS (Nomor Unik Kepala Sekolah)', type: 'text', placeholder: 'Isikan NUKS...' },
          {
            name: 'serdikStatus',
            label: 'Sudah / Belum Mempunyai Serdik',
            type: 'select',
            options: [
              { value: 'Sudah', label: 'Sudah Mempunyai Serdik' },
              { value: 'Belum', label: 'Belum Mempunyai Serdik' },
            ],
          },
          {
            name: 'status',
            label: 'Status Kepegawaian',
            type: 'select',
            required: true,
            options: [
              { value: 'GTY', label: 'GTY (Guru Tetap Yayasan / Persyarikatan)' },
              { value: 'PNS', label: 'PNS / DPK' },
              { value: 'Aktif', label: 'Aktif Menjabat' },
              { value: 'Selesai', label: 'Selesai Masa Jabatan' },
              { value: 'Cuti', label: 'Cuti' },
              { value: 'Mutasi', label: 'Mutasi (Pindah / Keluar)' },
            ],
          },
        ];

      case 'Siswa':
        return [
          { name: 'name', label: 'Nama Lengkap Siswa', type: 'text', placeholder: 'Nama lengkap siswa...', required: true },
          {
            name: 'gender',
            label: 'Jenis Kelamin',
            type: 'select',
            required: true,
            options: [
              { value: 'Laki-laki', label: 'Laki-laki' },
              { value: 'Perempuan', label: 'Perempuan' },
            ],
          },
          { name: 'nisn', label: 'NISN', type: 'text', placeholder: 'Nomor NISN...', required: true },
          { name: 'pobDob', label: 'Tempat, Tanggal Lahir', type: 'text', placeholder: 'Misal: Klaten, 05 April 2012' },
          {
            name: 'schoolId',
            label: 'Sekolah',
            type: 'select',
            required: true,
            options: data.sekolah.map((s) => ({ value: s.id, label: s.name })),
          },
          { name: 'class', label: 'Kelas', type: 'text', placeholder: 'Misal: VII-A, X-MIPA-1...', required: true },
          { name: 'address', label: 'Alamat Domisili (Jalan / Dusun)', type: 'textarea', placeholder: 'Tuliskan alamat domisili...' },
          { name: 'rtRw', label: 'RT / RW', type: 'text', placeholder: 'Misal: 001 / 002' },
          { name: 'postalCode', label: 'Kode Pos', type: 'text', placeholder: 'Misal: 57411' },
          { name: 'kelurahan', label: 'Kelurahan / Desa', type: 'text', placeholder: 'Kelurahan...' },
          { name: 'kecamatan', label: 'Kecamatan', type: 'text', placeholder: 'Kecamatan...' },
          { name: 'kabupatenKota', label: 'Kabupaten / Kota', type: 'text', placeholder: 'Kabupaten / Kota...' },
          {
            name: 'status',
            label: 'Status Siswa',
            type: 'select',
            required: true,
            options: [
              { value: 'Aktif', label: 'Aktif' },
              { value: 'Lulus', label: 'Lulus' },
              { value: 'Mutasi', label: 'Mutasi (Pindah / Keluar)' },
            ],
          },
        ];

      case 'SKGuru':
        return [
          { name: 'skNumber', label: 'Nomor SK', type: 'text', placeholder: 'Nomor SK Resmi...', required: true },
          { name: 'skDate', label: 'Tanggal SK Terbit', type: 'date', required: true },
          { name: 'skEndDate', label: 'Tanggal SK Selesai', type: 'date', required: true },
          { name: 'title', label: 'Perihal SK', type: 'text', placeholder: 'Misal: SK Pengangkatan Guru Tetap...', required: true },
          {
            name: 'guruId',
            label: 'Penerima Guru',
            type: 'select',
            required: true,
            options: data.guru.map((g) => ({ value: g.id, label: g.name })),
          },
          {
            name: 'status',
            label: 'Status Penerbitan',
            type: 'select',
            required: true,
            options: [
              { value: 'Terbit', label: 'Terbit' },
              { value: 'Belum Terbit', label: 'Belum Terbit' },
            ],
          },
          { name: 'fileUrl', label: 'Link File SK (Terupload otomatis)', type: 'file' },
        ];

      case 'SKTenagaKependidikan':
        return [
          { name: 'skNumber', label: 'Nomor SK', type: 'text', placeholder: 'Nomor SK Resmi...', required: true },
          { name: 'skDate', label: 'Tanggal SK Terbit', type: 'date', required: true },
          { name: 'skEndDate', label: 'Tanggal SK Selesai', type: 'date', required: true },
          { name: 'title', label: 'Perihal SK', type: 'text', placeholder: 'Misal: SK Pengangkatan Tenaga Kependidikan...', required: true },
          {
            name: 'tendikId',
            label: 'Penerima Tenaga Kependidikan',
            type: 'select',
            required: true,
            options: (data.tendik || []).map((t) => ({ value: t.id, label: `${t.name} (${t.position || 'Tendik'})` })),
          },
          {
            name: 'status',
            label: 'Status Penerbitan',
            type: 'select',
            required: true,
            options: [
              { value: 'Terbit', label: 'Terbit' },
              { value: 'Belum Terbit', label: 'Belum Terbit' },
            ],
          },
          { name: 'fileUrl', label: 'Link File SK (Terupload otomatis)', type: 'file' },
        ];

      case 'SKKepalaSekolah':
        return [
          { name: 'skNumber', label: 'Nomor SK', type: 'text', placeholder: 'Nomor SK Resmi...', required: true },
          { name: 'skDate', label: 'Tanggal SK Terbit', type: 'date', required: true },
          { name: 'skEndDate', label: 'Tanggal SK Selesai', type: 'date', required: true },
          { name: 'title', label: 'Perihal SK', type: 'text', placeholder: 'Misal: SK Pengangkatan Kepala Sekolah...', required: true },
          {
            name: 'kepalaSekolahId',
            label: 'Penerima Kepala Sekolah',
            type: 'select',
            required: true,
            options: data.kepalaSekolah.map((ks) => ({ value: ks.id, label: ks.name })),
          },
          {
            name: 'status',
            label: 'Status Penerbitan',
            type: 'select',
            required: true,
            options: [
              { value: 'Terbit', label: 'Terbit' },
              { value: 'Belum Terbit', label: 'Belum Terbit' },
            ],
          },
          { name: 'fileUrl', label: 'Link File SK (Terupload otomatis)', type: 'file' },
        ];

      case 'Notifikasi':
        return [
          { name: 'title', label: 'Judul Notifikasi', type: 'text', placeholder: 'Masukkan judul...', required: true },
          { name: 'message', label: 'Pesan', type: 'textarea', placeholder: 'Isi pesan...', required: true },
          {
            name: 'type',
            label: 'Tipe',
            type: 'select',
            required: true,
            options: [
              { value: 'info', label: 'Info' },
              { value: 'warning', label: 'Peringatan' },
              { value: 'error', label: 'Penting / Error' },
            ],
          },
          {
            name: 'isRead',
            label: 'Sudah Dibaca',
            type: 'select',
            required: true,
            options: [
              { value: 'false', label: 'Belum Dibaca' },
              { value: 'true', label: 'Sudah Dibaca' },
            ],
          },
        ];

      case 'Setting':
        return [
          { name: 'key', label: 'Kunci Pengaturan', type: 'text', placeholder: 'Kunci...', required: true },
          { name: 'value', label: 'Nilai Pengaturan', type: 'textarea', placeholder: 'Nilai...', required: true },
        ];

      default:
        return [];
    }
  }, [tableName, data]);

  // 2. Data Filtering based on Role-Based Access Controls
  const allScopedList = useMemo(() => {
    switch (tableName) {
      case 'Users':
        return data.users;
      case 'Cabang':
        return data.cabang;
      case 'Sekolah':
        if (userRole === 'Sekolah' && userSekolahId) {
          return data.sekolah.filter((s) => s.id === userSekolahId);
        }
        if (userRole === 'Cabang' && userCabangId) {
          return data.sekolah.filter((s) => s.cabangId === userCabangId);
        }
        return data.sekolah;
      case 'Guru':
        // Multi-tenant filtering
        if (userRole === 'Sekolah' && userSekolahId) {
          return data.guru.filter((g) => g.schoolId === userSekolahId);
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          return data.guru.filter((g) => schoolIdsInCabang.has(g.schoolId));
        }
        return data.guru;
      case 'TenagaKependidikan':
        if (userRole === 'Sekolah' && userSekolahId) {
          return (data.tendik || []).filter((t) => t.schoolId === userSekolahId);
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          return (data.tendik || []).filter((t) => schoolIdsInCabang.has(t.schoolId));
        }
        return data.tendik || [];
      case 'KepalaSekolah':
        if (userRole === 'Sekolah' && userSekolahId) {
          return data.kepalaSekolah.filter((ks) => ks.schoolId === userSekolahId);
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          return data.kepalaSekolah.filter((ks) => schoolIdsInCabang.has(ks.schoolId));
        }
        return data.kepalaSekolah;
      case 'Siswa':
        if (userRole === 'Sekolah' && userSekolahId) {
          return data.siswa.filter((s) => s.schoolId === userSekolahId);
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          return data.siswa.filter((s) => schoolIdsInCabang.has(s.schoolId));
        }
        return data.siswa;
      case 'SKGuru':
        if (userRole === 'Sekolah' && userSekolahId) {
          const teacherIds = new Set(data.guru.filter((g) => g.schoolId === userSekolahId).map((g) => g.id));
          return data.skGuru.filter((s) => teacherIds.has(s.guruId));
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          const teacherIds = new Set(data.guru.filter((g) => schoolIdsInCabang.has(g.schoolId)).map((g) => g.id));
          return data.skGuru.filter((s) => teacherIds.has(s.guruId));
        }
        return data.skGuru;
      case 'SKTenagaKependidikan':
        if (userRole === 'Sekolah' && userSekolahId) {
          const tendikIds = new Set((data.tendik || []).filter((t) => t.schoolId === userSekolahId).map((t) => t.id));
          return (data.skTendik || []).filter((s) => tendikIds.has(s.tendikId));
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          const tendikIds = new Set((data.tendik || []).filter((t) => schoolIdsInCabang.has(t.schoolId)).map((t) => t.id));
          return (data.skTendik || []).filter((s) => tendikIds.has(s.tendikId));
        }
        return data.skTendik || [];
      case 'SKKepalaSekolah':
        if (userRole === 'Sekolah' && userSekolahId) {
          const ksIds = new Set(data.kepalaSekolah.filter((k) => k.schoolId === userSekolahId).map((k) => k.id));
          return data.skKepalaSekolah.filter((s) => ksIds.has(s.kepalaSekolahId));
        }
        if (userRole === 'Cabang' && userCabangId) {
          const schoolIdsInCabang = new Set(data.sekolah.filter((s) => s.cabangId === userCabangId).map((s) => s.id));
          const ksIds = new Set(data.kepalaSekolah.filter((k) => schoolIdsInCabang.has(k.schoolId)).map((k) => k.id));
          return data.skKepalaSekolah.filter((s) => ksIds.has(s.kepalaSekolahId));
        }
        return data.skKepalaSekolah;
      case 'Notifikasi':
        return data.notifikasi;
      case 'LogAktivitas':
        return data.logAktivitas;
      case 'Setting':
        return data.settings;
      default:
        return [];
    }
  }, [tableName, data, userRole, userCabangId, userSekolahId]);

  // Counts for Personnel Tables (Aktif vs Mutasi)
  const mutasiCounts = useMemo(() => {
    if (['Guru', 'TenagaKependidikan', 'KepalaSekolah', 'Siswa'].includes(tableName)) {
      const active = allScopedList.filter((item: any) => item.status !== 'Mutasi').length;
      const mutasi = allScopedList.filter((item: any) => item.status === 'Mutasi').length;
      return { active, mutasi };
    }
    return { active: allScopedList.length, mutasi: 0 };
  }, [allScopedList, tableName]);

  // Final rawList according to mutasiFilter
  const rawList = useMemo(() => {
    if (['Guru', 'TenagaKependidikan', 'KepalaSekolah', 'Siswa'].includes(tableName)) {
      if (mutasiFilter === 'mutasi') {
        return allScopedList.filter((item: any) => item.status === 'Mutasi');
      }
      return allScopedList.filter((item: any) => item.status !== 'Mutasi');
    }
    return allScopedList;
  }, [allScopedList, tableName, mutasiFilter]);

  // 3. Search Filtration
  const filteredList = useMemo(() => {
    if (!searchQuery) return rawList;
    const query = searchQuery.toLowerCase();
    return rawList.filter((item: any) =>
      Object.values(item).some((val) => String(val).toLowerCase().includes(query))
    );
  }, [rawList, searchQuery]);

  // 4. Pagination
  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredList, currentPage]);

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;

  // 5. Open Modal (Add)
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormError(null);
    setUploadedFileInfo(null);
    
    // Set smart defaults
    const defaults: Record<string, any> = {};
    fields.forEach((f) => {
      if (f.type === 'select') {
        defaults[f.name] = f.options?.[0]?.value || '';
      } else {
        defaults[f.name] = '';
      }
    });

    // Enforce tenant defaults
    if (userRole === 'Cabang' && userCabangId) {
      if (defaults.hasOwnProperty('cabangId')) defaults.cabangId = userCabangId;
    }
    if (userRole === 'Sekolah' && userSekolahId) {
      if (defaults.hasOwnProperty('schoolId')) defaults.schoolId = userSekolahId;
      if (defaults.hasOwnProperty('sekolahId')) defaults.sekolahId = userSekolahId;
    }

    setFormData(defaults);
    setIsModalOpen(true);
  };

  // 6. Open Modal (Edit)
  const handleOpenEdit = (item: any) => {
    setEditingId(item.id || item.key); // Supports Key-Value settings too
    setFormError(null);
    setUploadedFileInfo(
      item.fileUrl
        ? { name: 'Dokumen Terupload', url: item.fileUrl, id: item.fileId || '' }
        : null
    );
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // 7. Form Field Changes
  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 8. Custom Drag and Drop File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadProgress(true);
    setFormError(null);

    try {
      const res = await uploadFileToDrive(accessToken, driveFolderId, file);
      setUploadedFileInfo({ name: file.name, url: res.fileUrl, id: res.fileId });
      setFormData((prev) => ({
        ...prev,
        fileUrl: res.fileUrl,
        fileId: res.fileId,
      }));
    } catch (err: any) {
      setFormError(`Gagal upload ke Drive: ${err.message || err}`);
    } finally {
      setUploadProgress(false);
    }
  };

  // 9. Save Form (Submit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      if (editingId) {
        await onEdit(editingId, formData);
      } else {
        await onAdd(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data.');
    } finally {
      setFormLoading(false);
    }
  };

  // 10. Delete Record with MANDATORY Detailed Confirmation Dialog
  const handleDeleteClick = async (item: any) => {
    const recordId = item.id || item.key;
    const nameToDisplay = item.name || item.title || item.skNumber || item.key;

    // Strict safety confirmation dialog as per Workspace integrations instructions
    const msg = `Apakah Anda yakin ingin MENGHAPUS record berikut?\n\nTabel: ${tableName}\nNama/Identitas: ${nameToDisplay}\nID: ${recordId}\n\nTindakan ini bersifat permanen dan akan menghapus baris data di Google Spreadsheet Anda.`;
    
    if (window.confirm(msg)) {
      try {
        await onDelete(recordId);
      } catch (err: any) {
        alert(`Gagal menghapus record: ${err.message || err}`);
      }
    }
  };

  // 10.1. Bulk Delete Click Handler
  const handleBulkDeleteClick = async () => {
    if (!onBulkDelete) return;
    if (window.confirm(`Apakah Anda yakin ingin MENGHAPUS ${selectedIds.length} data terpilih secara massal?\n\nTindakan ini akan memindahkan seluruh data terpilih ke Tempat Sampah local dan menghapus baris dari Google Sheets.`)) {
      try {
        setFormLoading(true);
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
        alert(`Sukses menghapus ${selectedIds.length} data secara massal!`);
      } catch (err: any) {
        alert(`Gagal menghapus massal: ${err.message || err}`);
      } finally {
        setFormLoading(false);
      }
    }
  };

  // 10.2. Export to Excel (CSV)
  const handleExportCSV = () => {
    if (filteredList.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }
    const headers = Object.keys(tableHeaders);
    const headerLabels = Object.values(tableHeaders);
    
    const csvRows = [];
    csvRows.push(headerLabels.join(',')); // Headers row
    
    for (const item of filteredList) {
      const rowValues = headers.map(header => {
        let val = item[header];
        if (header === 'cabangId') {
          const cab = data.cabang.find((c) => c.id === val);
          val = cab ? cab.name : val;
        } else if (header === 'schoolId') {
          const sch = data.sekolah.find((s) => s.id === val);
          val = sch ? sch.name : val;
        } else if (header === 'guruId') {
          const gur = data.guru.find((g) => g.id === val);
          val = gur ? gur.name : val;
        } else if (header === 'tendikId') {
          const tnd = (data.tendik || []).find((t) => t.id === val);
          val = tnd ? tnd.name : val;
        } else if (header === 'kepalaSekolahId') {
          const ks = data.kepalaSekolah.find((k) => k.id === val);
          val = ks ? ks.name : val;
        }
        const stringVal = val === undefined || val === null ? '' : String(val);
        const escaped = stringVal.replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(rowValues.join(','));
    }
    
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SIM_DIKDASMEN_${tableName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 10.3. Download CSV Template Helper
  const handleDownloadTemplate = () => {
    let templateContent = '';
    let filename = '';
    if (tableName === 'Sekolah') {
      templateContent = 'npsn,name,level,status,address\n20309501,SMAN 1 Klaten,SMA,Negeri,Jl. Merbabu No.13 Klaten\n20309502,SMKN 1 Klaten,SMK,Negeri,Jl. Pemuda No.120 Klaten\n';
      filename = 'template_sekolah.csv';
    } else if (tableName === 'Guru') {
      templateContent = 'nipm,name,schoolId,gender,subject,status\n198205122009031005,Eko Sulistyo S.Pd,sch-1,Laki-laki,Matematika,PNS\n199002142018022001,Rina Rahmawati S.Pd,sch-2,Perempuan,Bahasa Inggris,PPPK\n';
      filename = 'template_guru.csv';
    } else if (tableName === 'TenagaKependidikan') {
      templateContent = 'nipm,name,schoolId,gender,position,status\n198504102010011008,Bambang Prasetyo S.Kom,sch-1,Laki-laki,Kepala Tata Usaha,PNS\n199208152020012015,Dewi Lestari A.Md,sch-2,Perempuan,Pustakawan,PPPK\n';
      filename = 'template_tenaga_kependidikan.csv';
    } else if (tableName === 'Siswa') {
      templateContent = 'nisn,name,schoolId,class,gender\n0081234567,Andi Wijaya,sch-1,XI-MIPA-1,Laki-laki\n0098765432,Siti Aminah,sch-2,XII-TKJ-2,Perempuan\n';
      filename = 'template_siswa.csv';
    }
    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 10.4. Parse & Import CSV
  const handleImportCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImporting(true);
    setImportError(null);
    setImportLogs(['Mulai membaca berkas CSV...']);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        if (!text) throw new Error('File kosong atau rusak.');

        const lines = text.split(/\r?\n/);
        if (lines.length < 2) throw new Error('File tidak memiliki baris data.');

        const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        
        const recordsToImport: any[] = [];
        const logs: string[] = [];

        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = parseCSVLine(line);
          const record: Record<string, any> = {};

          headers.forEach((header, index) => {
            const val = values[index] || '';
            if (header === 'npsn' || header === 'nip' || header === 'nipm' || header === 'nisn') {
              record['nip'] = val;
              if (header === 'npsn') record['npsn'] = val;
              if (header === 'nisn') record['nisn'] = val;
            } else if (header === 'nama' || header === 'name') {
              record['name'] = val;
            } else if (header === 'jenjang' || header === 'level') {
              record['level'] = val;
            } else if (header === 'status') {
              record['status'] = val;
            } else if (header === 'alamat' || header === 'address') {
              record['address'] = val;
            } else if (header === 'sekolah' || header === 'schoolid') {
              record['schoolId'] = val;
            } else if (header === 'gender' || header === 'jenis kelamin') {
              record['gender'] = val;
            } else if (header === 'mapel' || header === 'subject') {
              record['subject'] = val;
            } else if (header === 'jabatan' || header === 'position' || header === 'tugas') {
              record['position'] = val;
            } else if (header === 'kelas' || header === 'class') {
              record['class'] = val;
            } else {
              record[header] = val;
            }
          });

          record.id = 'imp-' + Math.random().toString(36).substr(2, 9);
          record.createdAt = new Date().toISOString();

          // Validation
          if (tableName === 'Sekolah') {
            if (!record.npsn || !record.name) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NPSN & Nama Sekolah wajib ada)`);
              continue;
            }
            const dup = data.sekolah.find(s => s.npsn === record.npsn);
            if (dup) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NPSN "${record.npsn}" ganda dengan Sekolah "${dup.name}")`);
              continue;
            }
            if (!record.cabangId) record.cabangId = data.cabang[0]?.id || 'cab-1';
            if (!record.status) record.status = 'Negeri';
            if (!record.level) record.level = 'SMA';
          } else if (tableName === 'Guru') {
            if (!record.nip || !record.name) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NIPM / NUPTK & Nama Guru wajib ada)`);
              continue;
            }
            const dup = data.guru.find(g => g.nip === record.nip);
            if (dup) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NIPM / NUPTK "${record.nip}" ganda dengan Guru "${dup.name}")`);
              continue;
            }
            if (!record.schoolId) record.schoolId = data.sekolah[0]?.id || 'sch-1';
            if (!record.gender) record.gender = 'Laki-laki';
            if (!record.status) record.status = 'PNS';
          } else if (tableName === 'TenagaKependidikan') {
            const identifier = record.nipm || record.nip;
            if (!identifier || !record.name) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NIPM / NIK & Nama wajib ada)`);
              continue;
            }
            const dup = (data.tendik || []).find(t => (t.nipm && t.nipm === identifier) || (t.nip && t.nip === identifier));
            if (dup) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NIPM / NIK "${identifier}" ganda dengan Tendik "${dup.name}")`);
              continue;
            }
            if (!record.schoolId) record.schoolId = data.sekolah[0]?.id || 'sch-1';
            if (!record.gender) record.gender = 'Laki-laki';
            if (!record.position) record.position = 'Staff TU';
            if (!record.status) record.status = 'PNS';
          } else if (tableName === 'Siswa') {
            if (!record.nisn || !record.name) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NISN & Nama Siswa wajib ada)`);
              continue;
            }
            const dup = data.siswa.find(s => s.nisn === record.nisn);
            if (dup) {
              logs.push(`⚠️ Baris ${i + 1}: Lewati (NISN "${record.nisn}" ganda dengan Siswa "${dup.name}")`);
              continue;
            }
            if (!record.schoolId) record.schoolId = data.sekolah[0]?.id || 'sch-1';
            if (!record.class) record.class = 'XI';
            if (!record.gender) record.gender = 'Laki-laki';
          }

          recordsToImport.push(record);
        }

        if (recordsToImport.length === 0) {
          throw new Error('Tidak ada baris data baru yang valid untuk diimpor. Periksa log validasi.');
        }

        logs.push(`Memproses ${recordsToImport.length} baris data ke Google Sheets...`);
        setImportLogs([...logs]);

        for (const rec of recordsToImport) {
          await onAdd(rec);
        }

        logs.push(`✔️ Sukses mengimpor ${recordsToImport.length} data!`);
        setImportLogs([...logs]);
        alert(`Berhasil mengimpor ${recordsToImport.length} data!`);
        setIsImportModalOpen(false);
        setImportFile(null);
      } catch (err: any) {
        setImportError(err.message || 'Gagal memproses file CSV.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(importFile);
  };

  // 10.5. Selection Helpers
  const isAllSelected = paginatedList.length > 0 && paginatedList.every(item => selectedIds.includes(item.id || item.key));
  
  const handleSelectAll = () => {
    if (isAllSelected) {
      const paginatedItemIds = paginatedList.map(item => item.id || item.key);
      setSelectedIds(prev => prev.filter(id => !paginatedItemIds.includes(id)));
    } else {
      const paginatedItemIds = paginatedList.map(item => item.id || item.key);
      setSelectedIds(prev => Array.from(new Set([...prev, ...paginatedItemIds])));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Render Display Helpers
  const renderValue = (item: any, key: string) => {
    const val = item[key];
    if (!val) return '-';

    // Relation Mapping
    if (key === 'cabangId') {
      const cab = data.cabang.find((c) => c.id === val);
      return cab ? cab.name : val;
    }
    if (key === 'schoolId') {
      const sch = data.sekolah.find((s) => s.id === val);
      return sch ? sch.name : val;
    }
    if (key === 'guruId') {
      const gur = data.guru.find((g) => g.id === val);
      return gur ? gur.name : val;
    }
    if (key === 'tendikId') {
      const tnd = (data.tendik || []).find((t) => t.id === val);
      return tnd ? tnd.name : val;
    }
    if (key === 'kepalaSekolahId') {
      const ks = data.kepalaSekolah.find((k) => k.id === val);
      return ks ? ks.name : val;
    }
    if (key === 'password') {
      return '••••••••';
    }

    // Date fields formatting
    if (key === 'startDate' || key === 'endDate' || key === 'skDate' || key === 'skEndDate') {
      try {
        const dateObj = new Date(val);
        if (!isNaN(dateObj.getTime())) {
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          return `${day}-${month}-${year}`;
        }
      } catch (err) {
        // Fallback to original
      }
    }

    // Link/URL styling
    if (key === 'fileUrl') {
      return (
        <a
          href={val}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1.5 text-xs inline-flex"
        >
          <FileDown size={14} /> View File
        </a>
      );
    }

    if (key === 'categoryCapability') {
      const v = String(val || '').toUpperCase();
      if (v.includes('UGD') || v === 'UGD') {
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white shadow-xs">
            1. UGD
          </span>
        );
      } else if (v.includes('RAWAT INAP') || v === 'RAWAT INAP') {
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shadow-xs">
            2. RAWAT INAP
          </span>
        );
      } else if (v.includes('RAWAT JALAN') || v === 'RAWAT JALAN') {
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-blue-600 text-white shadow-xs">
            3. RAWAT JALAN
          </span>
        );
      } else if (v.includes('SEHAT') || v === 'SEHAT') {
        return (
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black bg-purple-600 text-white shadow-xs">
            4. SEHAT
          </span>
        );
      }
      return <span className="text-slate-400 font-mono text-[11px]">-</span>;
    }

    // Status Styling
    if (key === 'status') {
      let badgeClass = 'bg-slate-100 text-slate-700';
      if (val === 'Aktif' || val === 'Terbit' || val === 'Negeri') {
        badgeClass = 'bg-teal-100 text-teal-800 font-bold';
      } else if (val === 'Selesai' || val === 'Belum Terbit' || val === 'Swasta' || val === 'Lulus') {
        badgeClass = 'bg-amber-100 text-amber-800 font-semibold';
      } else if (val === 'Cuti') {
        badgeClass = 'bg-rose-100 text-rose-800';
      } else if (val === 'Mutasi') {
        badgeClass = 'bg-purple-100 text-purple-800 font-bold border border-purple-200';
      }
      return <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${badgeClass}`}>{val || 'Aktif'}</span>;
    }

    return String(val);
  };

  // Table header labels
  const tableHeaders = useMemo(() => {
    switch (tableName) {
      case 'Users':
        return { name: 'Nama', email: 'Email', role: 'Peran', password: 'Password', cabangId: 'Cabang', sekolahId: 'Sekolah' };
      case 'Cabang':
        return { name: 'Nama Cabang', code: 'Kode' };
      case 'Sekolah':
        return { name: 'Nama Sekolah', npsn: 'NPSN', cabangId: 'Pimpinan Cabang', status: 'Status', level: 'Jenjang', accreditation: 'Akreditasi', categoryCapability: 'Kategori S/M', phone: 'Kontak' };
      case 'Guru':
        return { name: 'Nama Guru', nip: 'NIPM / NUPTK', schoolId: 'Sekolah', subject: 'Mapel', status: 'Status' };
      case 'TenagaKependidikan':
        return { name: 'Nama Tendik', nip: 'NIPM / NIK', schoolId: 'Sekolah', position: 'Jabatan/Tugas', status: 'Status' };
      case 'KepalaSekolah':
        return { name: 'Nama Kepala', nip: 'NIPM / NIP', schoolId: 'Sekolah', startDate: 'Mulai', endDate: 'Selesai', status: 'Status' };
      case 'Siswa':
        return { name: 'Nama Siswa', nisn: 'NISN', schoolId: 'Sekolah', class: 'Kelas', gender: 'Gender', status: 'Status' };
      case 'SKGuru':
        return { guruId: 'Nama Lengkap dan Gelar', skNumber: 'No SK', skDate: 'Tanggal SK Terbit', skEndDate: 'Tanggal SK Selesai', fileUrl: 'Dokumen SK', status: 'Status SK' };
      case 'SKTenagaKependidikan':
        return { tendikId: 'Nama Lengkap dan Gelar', skNumber: 'No SK', skDate: 'Tanggal SK Terbit', skEndDate: 'Tanggal SK Selesai', fileUrl: 'Dokumen SK', status: 'Status SK' };
      case 'SKKepalaSekolah':
        return { kepalaSekolahId: 'Nama Lengkap dan Gelar', skNumber: 'No SK', skDate: 'Tanggal SK Terbit', skEndDate: 'Tanggal SK Selesai', fileUrl: 'Dokumen SK', status: 'Status SK' };
      case 'Notifikasi':
        return { title: 'Judul', message: 'Isi Notifikasi', type: 'Tipe', isRead: 'Dibaca' };
      case 'LogAktivitas':
        return { userEmail: 'Oleh Email', action: 'Aksi', details: 'Detail', timestamp: 'Waktu' };
      case 'Setting':
        return { key: 'Kunci Pengaturan', value: 'Isi Nilai' };
      default:
        return {};
    }
  }, [tableName]);

  return (
    <div className={`p-6 space-y-6 rounded-xl border transition-all animate-fadeIn ${
      isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
    }`}>
      {/* Title & Actions */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 mb-1 ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <h2 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            {getPageTitle(tableName)}
          </h2>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Menampilkan {filteredList.length} total data dalam tabel {getFriendlyTableName(tableName)}.
          </p>
        </div>

        {/* Toolbar Button Actions */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {/* Print/Cetak Button */}
          <button
            onClick={() => window.print()}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Cetak tabel laporan"
          >
            <Printer size={13} /> Cetak
          </button>

          {/* Export to Excel (CSV) */}
          <button
            onClick={handleExportCSV}
            className={`text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isDarkMode 
                ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Ekspor data ke format CSV/Excel"
          >
            <FileSpreadsheet size={13} /> Ekspor Excel
          </button>

          {/* Import from Excel/CSV (Only for Guru, TenagaKependidikan, Siswa, Sekolah) */}
          {['Guru', 'TenagaKependidikan', 'Siswa', 'Sekolah'].includes(tableName) && (
            <button
              onClick={() => {
                setImportError(null);
                setImportLogs([]);
                setImportFile(null);
                setIsImportModalOpen(true);
              }}
              className={`text-xs font-bold px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer border ${
                isDarkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200' 
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="Unggah data dari file Excel/CSV"
            >
              <Upload size={13} /> Impor Excel
            </button>
          )}

          {/* Read-only check for Activity Logs & Notifications */}
          {tableName !== 'LogAktivitas' && tableName !== 'Notifikasi' && (
            <button
              onClick={handleOpenAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus size={14} /> Tambah {getFriendlyTableName(tableName)}
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search size={14} />
            </span>
            <input
              type="text"
              placeholder="Cari data..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className={`w-full pl-8 pr-3 py-1.5 rounded-md text-xs transition-all outline-none border ${
                isDarkMode 
                  ? 'bg-slate-800 border-slate-700 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Sub-tab toggle for Personnel Mutasi */}
          {['Guru', 'TenagaKependidikan', 'KepalaSekolah', 'Siswa'].includes(tableName) && (
            <div className={`flex items-center gap-1 p-0.5 rounded-lg border text-xs font-semibold ${
              isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => {
                  setMutasiFilter('aktif');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  mutasiFilter === 'aktif'
                    ? isDarkMode ? 'bg-slate-700 text-white font-bold shadow-xs' : 'bg-white text-slate-800 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span>Data Utama</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  mutasiFilter === 'aktif' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {mutasiCounts.active}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMutasiFilter('mutasi');
                  setCurrentPage(1);
                }}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                  mutasiFilter === 'mutasi'
                    ? 'bg-purple-600 text-white font-bold shadow-xs'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <ArrowRightLeft size={12} />
                <span>Data Mutasi</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  mutasiFilter === 'mutasi' ? 'bg-purple-800 text-purple-100' : 'bg-purple-100 text-purple-800 font-bold'
                }`}>
                  {mutasiCounts.mutasi}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Bulk Action Button (Show if items are checked) */}
        {selectedIds.length > 0 && onBulkDelete && (
          <button
            onClick={handleBulkDeleteClick}
            className="bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs animate-fadeIn"
          >
            <Trash2 size={13} /> Hapus Terpilih ({selectedIds.length} Data)
          </button>
        )}

        <div className="text-[10px] text-slate-400 font-bold font-mono ml-auto tracking-wider uppercase hidden md:block">
          Database: Google Sheets (Live)
        </div>
      </div>

      {/* Mutasi Filter Banner Notice */}
      {['Guru', 'TenagaKependidikan', 'KepalaSekolah', 'Siswa'].includes(tableName) && mutasiFilter === 'mutasi' && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 p-3 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle size={16} className="text-purple-600 shrink-0" />
          <div>
            <span className="font-bold">Kategori Khusus Data Mutasi:</span> Menampilkan {filteredList.length} data berstatus Mutasi. Data ini dipisahkan dari pencarian & rekap laporan umum. Anda dapat mengubah status data kembali menjadi Aktif / PNS untuk memulihkannya.
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className={`overflow-x-auto border rounded-xl ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b font-semibold ${
              isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-[#F8FAFC] border-slate-100 text-slate-600'
            }`}>
              {/* Checkbox column header (Disabled for Logs) */}
              {tableName !== 'LogAktivitas' ? (
                <th className="py-2.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                  />
                </th>
              ) : (
                <th className="py-2.5 px-3 w-10 text-center text-[10px] font-bold uppercase tracking-wider">No</th>
              )}

              {Object.keys(tableHeaders).map((key) => (
                <th key={key} className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">
                  {tableHeaders[key as keyof typeof tableHeaders]}
                </th>
              ))}
              {tableName !== 'LogAktivitas' && (
                <th className="py-2.5 px-3 text-center w-24 text-[10px] font-bold uppercase tracking-wider">Aksi</th>
              )}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {paginatedList.length === 0 ? (
              <tr>
                <td colSpan={Object.keys(tableHeaders).length + 2} className="p-12 text-center text-slate-400">
                  <AlertCircle className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                  Belum ada data tersedia.
                </td>
              </tr>
            ) : (
              paginatedList.map((item: any, idx) => {
                const globalIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                const itemId = item.id || item.key;
                const isChecked = selectedIds.includes(itemId);

                return (
                  <tr 
                    key={itemId || idx} 
                    className={`transition-colors ${
                      isChecked 
                        ? (isDarkMode ? 'bg-blue-950/20' : 'bg-blue-50/30') 
                        : ''
                    } ${
                      isDarkMode ? 'hover:bg-slate-800/20 text-slate-300 border-slate-800' : 'hover:bg-slate-50/50 text-slate-700 border-slate-100'
                    }`}
                  >
                    {/* Checkbox column cell */}
                    {tableName !== 'LogAktivitas' ? (
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectRow(itemId)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
                        />
                      </td>
                    ) : (
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">{globalIndex}</td>
                    )}

                    {Object.keys(tableHeaders).map((key) => (
                      <td key={key} className="py-2 px-3 leading-tight font-medium text-[11px]">
                        {renderValue(item, key)}
                      </td>
                    ))}

                    {tableName !== 'LogAktivitas' && (
                      <td className="py-2 px-3 text-center flex items-center justify-center gap-1.5 print:hidden">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-500/10 rounded transition-colors cursor-pointer"
                          title="Ubah"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
                          className="p-1 text-rose-600 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      <div className={`flex items-center justify-between border-t pt-4 print:hidden ${
        isDarkMode ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <span className="text-xs text-slate-400 font-medium">
          Halaman <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{currentPage}</strong> dari{' '}
          <strong className={isDarkMode ? 'text-white' : 'text-slate-800'}>{totalPages}</strong> ({filteredList.length} data)
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={`p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
              isDarkMode 
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={`p-2 border rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer ${
              isDarkMode 
                ? 'border-slate-700 hover:bg-slate-800 text-slate-300' 
                : 'border-slate-200 hover:bg-slate-50 text-slate-600'
            }`}
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* CSV Import Excel Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl border max-w-lg w-full max-h-[85vh] flex flex-col animate-slideUp ${
            isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <div className={`p-5 border-b flex items-center justify-between rounded-t-2xl ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="text-emerald-500" size={18} />
                <h3 className="font-bold text-sm md:text-base">
                  Impor Excel / CSV ({tableName})
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleImportCSV} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-xl space-y-2 text-xs">
                <p className="font-bold">Panduan Impor Data Massal:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-300 leading-relaxed">
                  <li>Unduh file template resmi di bawah ini.</li>
                  <li>Isi data sekolah/guru/siswa dengan aplikasi Excel.</li>
                  <li>Ekspor sebagai format CSV (Comma Separated Values).</li>
                  <li>Unggah file CSV Anda di sini dan sistem akan memvalidasi duplikasi secara otomatis!</li>
                </ol>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-2 text-emerald-300 hover:text-emerald-100 font-bold underline flex items-center gap-1 cursor-pointer"
                >
                  <Download size={12} /> Unduh Template CSV Resmi ({tableName})
                </button>
              </div>

              {importError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-start gap-2 leading-relaxed">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 block">Pilih Berkas CSV / Excel</label>
                <input
                  type="file"
                  accept=".csv,.txt"
                  required
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className={`w-full text-xs font-medium border rounded-lg p-2 ${
                    isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                />
              </div>

              {importLogs.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">Log Proses Impor:</span>
                  <div className="p-3 bg-slate-950 text-slate-300 font-mono text-[10px] rounded-lg max-h-36 overflow-y-auto space-y-1">
                    {importLogs.map((log, idx) => (
                      <div key={idx} className={log.includes('✔️') ? 'text-green-400' : log.includes('⚠️') ? 'text-amber-400 font-bold' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className={`pt-4 border-t flex items-center justify-end gap-3 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                      Memproses...
                    </>
                  ) : (
                    'Mulai Impor Massal'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Update Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-xl border max-w-lg w-full max-h-[90vh] flex flex-col animate-slideUp ${
            isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            {/* Modal Header */}
            <div className={`p-6 border-b flex items-center justify-between rounded-t-2xl ${
              isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-100'
            }`}>
              <h3 className="font-bold text-sm md:text-base">
                {editingId ? 'Ubah' : 'Tambah'} {getFriendlyTableName(tableName)}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-lg flex items-center gap-2 leading-relaxed">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {fields.map((field) => {
                // If the field is 'fileUrl' and we're in SK table, render a beautiful Google Drive drag & drop area
                if (field.type === 'file') {
                  return (
                    <div key={field.name} className="space-y-1">
                      <label className="text-xs font-semibold block text-slate-400">
                        Dokumen SK Resmi (Upload ke Google Drive)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*,.doc,.docx"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      
                      {uploadedFileInfo ? (
                        <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs font-semibold text-emerald-400">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText size={18} className="text-emerald-400" />
                            <span className="truncate">{uploadedFileInfo.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={uploadedFileInfo.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-400 hover:text-emerald-200 flex items-center gap-1 font-bold underline"
                            >
                              <Eye size={12} /> View
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedFileInfo(null);
                                handleInputChange('fileUrl', '');
                                handleInputChange('fileId', '');
                              }}
                              className="text-rose-500 hover:text-rose-400 font-bold"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : uploadProgress ? (
                        <div className="p-6 bg-slate-800 border-2 border-slate-700 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 text-xs">
                          <div className="h-6 w-6 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                          <span className="text-slate-300 font-bold">Sedang upload ke Google Drive Anda...</span>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="p-6 bg-slate-800 hover:bg-slate-800/80 border-2 border-slate-700 border-dashed rounded-xl flex flex-col items-center justify-center space-y-2 cursor-pointer transition-colors"
                        >
                          <UploadCloud size={32} className="text-slate-400" />
                          <span className="text-xs font-bold text-slate-300">Klik untuk upload file SK</span>
                          <span className="text-[10px] text-slate-500">Mendukung PDF, Word, Gambar (Otomatis masuk folder Drive)</span>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={field.name} className="space-y-1">
                    <label className={`text-xs font-bold block ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </label>

                    {field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        required={field.required}
                        className={`w-full border rounded-lg p-2 text-xs font-medium focus:ring-2 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-850 border-slate-700 text-white focus:ring-blue-500/20' 
                            : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500/20'
                        }`}
                      >
                        {field.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={3}
                        className={`w-full border rounded-lg p-2 text-xs font-medium focus:ring-2 outline-none transition-all resize-none ${
                          isDarkMode 
                            ? 'bg-slate-850 border-slate-700 text-white focus:ring-blue-500/20' 
                            : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500/20'
                        }`}
                      />
                    ) : (
                      <input
                        type={field.type === 'date' ? 'date' : field.type === 'password' ? 'password' : 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        placeholder={field.placeholder}
                        required={field.required}
                        className={`w-full border rounded-lg p-2 text-xs font-medium focus:ring-2 outline-none transition-all ${
                          isDarkMode 
                            ? 'bg-slate-850 border-slate-700 text-white focus:ring-blue-500/20' 
                            : 'bg-white border-slate-200 text-slate-800 focus:ring-blue-500/20'
                        }`}
                      />
                    )}
                  </div>
                );
              })}

              {/* Modal Actions */}
              <div className={`pt-6 border-t flex items-center justify-end gap-3 ${
                isDarkMode ? 'border-slate-800' : 'border-slate-100'
              }`}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className={`text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                    isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading || uploadProgress}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
