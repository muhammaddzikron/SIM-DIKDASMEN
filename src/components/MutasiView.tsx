import React, { useState, useMemo } from 'react';
import { DatabaseState, Role } from '../types';
import {
  ArrowRightLeft,
  Search,
  School,
  RefreshCw,
  Trash2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Users2,
  Briefcase,
  GraduationCap,
  Users,
} from 'lucide-react';

interface MutasiViewProps {
  data: DatabaseState;
  userRole: Role;
  userCabangId?: string;
  userSekolahId?: string;
  onEditRecord: (tableName: string, id: string, updatedFields: Record<string, any>) => Promise<void>;
  onDeleteRecord: (tableName: string, id: string) => Promise<void>;
  isDarkMode?: boolean;
}

export default function MutasiView({
  data,
  userRole,
  userCabangId,
  userSekolahId,
  onEditRecord,
  onDeleteRecord,
  isDarkMode = false,
}: MutasiViewProps) {
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Guru' | 'TenagaKependidikan' | 'KepalaSekolah' | 'Siswa'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(userSekolahId || '');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Accessible Schools based on Role
  const accessibleSchools = useMemo(() => {
    if (userRole === 'Sekolah' && userSekolahId) {
      return data.sekolah.filter((s) => s.id === userSekolahId);
    }
    if (userRole === 'Cabang' && userCabangId) {
      return data.sekolah.filter((s) => s.cabangId === userCabangId);
    }
    return data.sekolah;
  }, [data.sekolah, userRole, userCabangId, userSekolahId]);

  // Aggregate all mutated records across Guru, Tendik, KepalaSekolah, Siswa
  const allMutatedRecords = useMemo(() => {
    const list: {
      id: string;
      tableName: 'Guru' | 'TenagaKependidikan' | 'KepalaSekolah' | 'Siswa';
      typeLabel: string;
      name: string;
      identifier: string; // NIPM / NISN
      schoolId: string;
      schoolName: string;
      subInfo: string;
      status: string;
      originalData: any;
    }[] = [];

    const schoolMap = new Map(data.sekolah.map((s) => [s.id, s.name]));

    // 1. Guru
    data.guru.forEach((g) => {
      if (g.status === 'Mutasi') {
        list.push({
          id: g.id,
          tableName: 'Guru',
          typeLabel: 'Guru',
          name: g.name,
          identifier: g.nip || '-',
          schoolId: g.schoolId,
          schoolName: schoolMap.get(g.schoolId) || 'Sekolah Tidak Diketahui',
          subInfo: `Mapel: ${g.subject || '-'}`,
          status: g.status,
          originalData: g,
        });
      }
    });

    // 2. Tenaga Kependidikan
    (data.tendik || []).forEach((t) => {
      if (t.status === 'Mutasi') {
        list.push({
          id: t.id,
          tableName: 'TenagaKependidikan',
          typeLabel: 'Tenaga Kependidikan',
          name: t.name,
          identifier: t.nip || '-',
          schoolId: t.schoolId,
          schoolName: schoolMap.get(t.schoolId) || 'Sekolah Tidak Diketahui',
          subInfo: `Jabatan: ${t.position || '-'}`,
          status: t.status,
          originalData: t,
        });
      }
    });

    // 3. Kepala Sekolah
    data.kepalaSekolah.forEach((k) => {
      if (k.status === 'Mutasi') {
        list.push({
          id: k.id,
          tableName: 'KepalaSekolah',
          typeLabel: 'Kepala Sekolah',
          name: k.name,
          identifier: k.nip || '-',
          schoolId: k.schoolId,
          schoolName: schoolMap.get(k.schoolId) || 'Sekolah Tidak Diketahui',
          subInfo: `Periode: ${k.startDate || '-'} s/d ${k.endDate || '-'}`,
          status: k.status,
          originalData: k,
        });
      }
    });

    // 4. Siswa
    data.siswa.forEach((s) => {
      if (s.status === 'Mutasi') {
        list.push({
          id: s.id,
          tableName: 'Siswa',
          typeLabel: 'Siswa',
          name: s.name,
          identifier: s.nisn || '-',
          schoolId: s.schoolId,
          schoolName: schoolMap.get(s.schoolId) || 'Sekolah Tidak Diketahui',
          subInfo: `Kelas: ${s.class || '-'}`,
          status: s.status,
          originalData: s,
        });
      }
    });

    return list;
  }, [data.guru, data.tendik, data.kepalaSekolah, data.siswa, data.sekolah]);

  // Filter list by school, category, search
  const filteredList = useMemo(() => {
    return allMutatedRecords.filter((item) => {
      // School filter
      if (userRole === 'Sekolah' && userSekolahId && item.schoolId !== userSekolahId) {
        return false;
      }
      if (userRole === 'Cabang' && userCabangId) {
        const schoolIds = new Set(accessibleSchools.map((s) => s.id));
        if (!schoolIds.has(item.schoolId)) return false;
      }
      if (selectedSchoolId && item.schoolId !== selectedSchoolId) {
        return false;
      }

      // Category filter
      if (activeCategory !== 'Semua' && item.tableName !== activeCategory) {
        return false;
      }

      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          item.identifier.toLowerCase().includes(q) ||
          item.schoolName.toLowerCase().includes(q) ||
          item.subInfo.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allMutatedRecords, userRole, userSekolahId, userCabangId, accessibleSchools, selectedSchoolId, activeCategory, searchQuery]);

  // Handle restore (change status from Mutasi back to Aktif or PNS)
  const handleRestore = async (item: typeof allMutatedRecords[0]) => {
    setRestoringId(item.id);
    setActionSuccess(null);
    try {
      let defaultRestoredStatus = 'Aktif';
      if (item.tableName === 'Guru' || item.tableName === 'TenagaKependidikan') {
        defaultRestoredStatus = 'PNS';
      }
      await onEditRecord(item.tableName, item.id, { status: defaultRestoredStatus });
      setActionSuccess(`Status ${item.name} (${item.typeLabel}) berhasil dipulihkan menjadi status ${defaultRestoredStatus}.`);
    } catch (err) {
      console.error('Failed to restore mutasi status:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const counts = useMemo(() => {
    const guru = allMutatedRecords.filter((i) => i.tableName === 'Guru').length;
    const tendik = allMutatedRecords.filter((i) => i.tableName === 'TenagaKependidikan').length;
    const ks = allMutatedRecords.filter((i) => i.tableName === 'KepalaSekolah').length;
    const siswa = allMutatedRecords.filter((i) => i.tableName === 'Siswa').length;
    return { guru, tendik, ks, siswa, total: allMutatedRecords.length };
  }, [allMutatedRecords]);

  return (
    <div className={`p-6 space-y-6 rounded-xl border transition-all animate-fadeIn ${
      isDarkMode ? 'bg-[#111827] border-slate-800 text-white' : 'bg-white border-slate-200/80 shadow-sm text-slate-900'
    }`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 text-purple-700 rounded-lg">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-slate-800">
                Arsip & Kategori Khusus Data Mutasi
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Mengelola data pegawai & siswa yang berstatus Mutasi. Data ini secara otomatis dipisahkan dari laporan & pencarian umum.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-full text-xs font-bold flex items-center gap-1.5">
            <AlertCircle size={14} /> Total {counts.total} Mutasi
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Categories Tabs & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCategory('Semua')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'Semua'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({counts.total})
          </button>
          <button
            onClick={() => setActiveCategory('Guru')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'Guru'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users2 size={13} /> Guru ({counts.guru})
          </button>
          <button
            onClick={() => setActiveCategory('TenagaKependidikan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'TenagaKependidikan'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Briefcase size={13} /> Tendik ({counts.tendik})
          </button>
          <button
            onClick={() => setActiveCategory('KepalaSekolah')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'KepalaSekolah'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap size={13} /> Kepala Sekolah ({counts.ks})
          </button>
          <button
            onClick={() => setActiveCategory('Siswa')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeCategory === 'Siswa'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users size={13} /> Siswa ({counts.siswa})
          </button>
        </div>

        {/* Search & School dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {/* School Selector */}
          {userRole !== 'Sekolah' && (
            <div className="relative">
              <select
                value={selectedSchoolId}
                onChange={(e) => setSelectedSchoolId(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 py-1.5 px-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500/20"
              >
                <option value="">Semua Sekolah</option>
                {accessibleSchools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative w-full sm:w-48">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400">
              <Search size={13} />
            </span>
            <input
              type="text"
              placeholder="Cari nama, NIPM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>

      {/* Table List */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider font-bold text-slate-500">
              <th className="p-3">Kategori</th>
              <th className="p-3">Nama Lengkap</th>
              <th className="p-3">NIPM / NIK / NISN</th>
              <th className="p-3">Asal Sekolah</th>
              <th className="p-3">Keterangan / Jabatan</th>
              <th className="p-3">Status</th>
              {userRole !== 'Cabang' && <th className="p-3 text-right">Aksi & Pemulihan</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredList.length === 0 ? (
              <tr>
                <td colSpan={userRole === 'Cabang' ? 6 : 7} className="text-center p-8 text-slate-400 text-xs font-medium">
                  {searchQuery || selectedSchoolId || activeCategory !== 'Semua'
                    ? 'Tidak ada data mutasi yang cocok dengan filter.'
                    : 'Belum ada data pegawai atau siswa yang berstatus Mutasi.'}
                </td>
              </tr>
            ) : (
              filteredList.map((item) => (
                <tr key={`${item.tableName}-${item.id}`} className="hover:bg-purple-50/30 transition-colors">
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {item.typeLabel}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900">{item.name}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600">{item.identifier}</td>
                  <td className="p-3 font-medium text-slate-700">{item.schoolName}</td>
                  <td className="p-3 text-slate-500">{item.subInfo}</td>
                  <td className="p-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 uppercase tracking-wider">
                      Mutasi
                    </span>
                  </td>
                  {userRole !== 'Cabang' && (
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                        title="Pulihkan status pegawai/siswa ini menjadi Aktif"
                      >
                        <RefreshCw size={12} className={restoringId === item.id ? 'animate-spin' : ''} />
                        Pulihkan Status
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Apakah Anda yakin ingin menghapus permanen data mutasi ${item.name}?`)) {
                            onDeleteRecord(item.tableName, item.id);
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-md text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Hapus data"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
