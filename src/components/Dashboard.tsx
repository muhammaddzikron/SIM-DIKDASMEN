import React, { useState, useMemo } from 'react';
import { DatabaseState, Role, Sekolah } from '../types';
import {
  School,
  Users as UsersIcon,
  GraduationCap,
  Users2,
  FileText,
  AlertTriangle,
  Clock,
  Calendar,
  Building,
  ShieldCheck,
  Edit2,
  MapPin,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Award,
  BookOpen,
  Compass,
  ArrowRightLeft,
  Activity,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  data: DatabaseState;
  onNavigateToTab: (tab: string) => void;
  userRole?: Role;
  userSekolahId?: string;
  userCabangId?: string;
}

export default function Dashboard({ data, onNavigateToTab, userRole, userSekolahId }: DashboardProps) {
  // Mode selection: default to userSekolahId if user is Sekolah role, otherwise '' (Ringkasan Kabupaten)
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>(() => {
    if (userRole === 'Sekolah' && userSekolahId) {
      return userSekolahId;
    }
    return '';
  });

  // Selected school object for Beranda Sekolah view
  const selectedSchool = useMemo<Sekolah | undefined>(() => {
    if (!selectedSchoolId) return undefined;
    return data.sekolah.find((s) => s.id === selectedSchoolId);
  }, [data.sekolah, selectedSchoolId]);

  // Cabang for selected school
  const cabangForSchool = useMemo(() => {
    if (!selectedSchool) return undefined;
    return data.cabang.find((c) => c.id === selectedSchool.cabangId);
  }, [data.cabang, selectedSchool]);

  // Teachers in selected school
  const schoolGuruList = useMemo(() => {
    if (!selectedSchoolId) return [];
    return data.guru.filter((g) => g.schoolId === selectedSchoolId);
  }, [data.guru, selectedSchoolId]);

  // Students in selected school
  const schoolSiswaList = useMemo(() => {
    if (!selectedSchoolId) return [];
    return data.siswa.filter((s) => s.schoolId === selectedSchoolId);
  }, [data.siswa, selectedSchoolId]);

  // Active Principal in selected school
  const activePrincipal = useMemo(() => {
    if (!selectedSchoolId) return undefined;
    return data.kepalaSekolah.find((k) => k.schoolId === selectedSchoolId && k.status === 'Aktif');
  }, [data.kepalaSekolah, selectedSchoolId]);

  // SK count for selected school
  const schoolSKCount = useMemo(() => {
    if (!selectedSchoolId) return 0;
    const guruIds = new Set(schoolGuruList.map((g) => g.id));
    const skgCount = data.skGuru.filter((sk) => guruIds.has(sk.guruId) && sk.status === 'Terbit').length;
    const skksCount = data.skKepalaSekolah.filter((sk) => {
      const ks = data.kepalaSekolah.find((k) => k.id === sk.kepalaSekolahId);
      return ks?.schoolId === selectedSchoolId && sk.status === 'Terbit';
    }).length;
    return skgCount + skksCount;
  }, [selectedSchoolId, schoolGuruList, data.skGuru, data.skKepalaSekolah, data.kepalaSekolah]);

  // Category Capability Details for selected school
  const selectedSchoolCategoryDetails = useMemo(() => {
    if (!selectedSchool) return null;
    const count = schoolSiswaList.length;
    let code = selectedSchool.categoryCapability || '';
    if (!code) {
      if (count < 100) code = 'UGD';
      else if (count < 400) code = 'RAWAT INAP';
      else if (count < 600) code = 'RAWAT JALAN';
      else code = 'SEHAT';
    }

    const u = code.toUpperCase();

    if (u.includes('UGD') || u === 'UGD') {
      return {
        code: 'UGD',
        title: '1. UGD',
        range: 'S/M Dibawah 100 Siswa',
        desc: 'Sekolah / Madrasah Menuju Rintisan',
        badgeClass: 'bg-rose-600 text-white font-extrabold shadow-xs',
        bannerBg: 'bg-rose-50 border-rose-200 text-rose-900',
        textAccent: 'text-rose-700 font-extrabold',
        dotBg: 'bg-rose-600',
      };
    } else if (u.includes('RAWAT INAP') || u === 'RAWAT INAP') {
      return {
        code: 'RAWAT INAP',
        title: '2. RAWAT INAP',
        range: 'S/M 100 - 400 Siswa',
        desc: 'Sekolah / Madrasah Mandiri',
        badgeClass: 'bg-emerald-600 text-white font-extrabold shadow-xs',
        bannerBg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
        textAccent: 'text-emerald-700 font-extrabold',
        dotBg: 'bg-emerald-600',
      };
    } else if (u.includes('RAWAT JALAN') || u === 'RAWAT JALAN') {
      return {
        code: 'RAWAT JALAN',
        title: '3. RAWAT JALAN',
        range: 'S/M 400 - 600 Siswa',
        desc: 'Sekolah / Madrasah Unggul',
        badgeClass: 'bg-blue-600 text-white font-extrabold shadow-xs',
        bannerBg: 'bg-blue-50 border-blue-200 text-blue-900',
        textAccent: 'text-blue-700 font-extrabold',
        dotBg: 'bg-blue-600',
      };
    } else if (u.includes('SEHAT') || u === 'SEHAT') {
      return {
        code: 'SEHAT',
        title: '4. SEHAT',
        range: 'S/M Diatas 600 Siswa',
        desc: 'Sekolah / Madrasah Premium',
        badgeClass: 'bg-purple-600 text-white font-extrabold shadow-xs',
        bannerBg: 'bg-purple-50 border-purple-200 text-purple-900',
        textAccent: 'text-purple-700 font-extrabold',
        dotBg: 'bg-purple-600',
      };
    }

    return {
      code: 'UGD',
      title: '1. UGD',
      range: 'S/M Dibawah 100 Siswa',
      desc: 'Sekolah / Madrasah Menuju Rintisan',
      badgeClass: 'bg-rose-600 text-white font-extrabold shadow-xs',
      bannerBg: 'bg-rose-50 border-rose-200 text-rose-900',
      textAccent: 'text-rose-700 font-extrabold',
      dotBg: 'bg-rose-600',
    };
  }, [selectedSchool, schoolSiswaList]);

  // Overall school category capability counts across all schools
  const overallCategoryCounts = useMemo(() => {
    let ugd = 0;
    let rawatInap = 0;
    let rawatJalan = 0;
    let sehat = 0;

    data.sekolah.forEach((s) => {
      const studentCount = data.siswa.filter((st) => st.schoolId === s.id && st.status !== 'Mutasi').length;
      let c = s.categoryCapability || '';
      if (!c) {
        if (studentCount < 100) c = 'UGD';
        else if (studentCount < 400) c = 'RAWAT INAP';
        else if (studentCount < 600) c = 'RAWAT JALAN';
        else c = 'SEHAT';
      }
      const u = c.toUpperCase();
      if (u.includes('UGD') || u === 'UGD') ugd++;
      else if (u.includes('RAWAT INAP') || u === 'RAWAT INAP') rawatInap++;
      else if (u.includes('RAWAT JALAN') || u === 'RAWAT JALAN') rawatJalan++;
      else if (u.includes('SEHAT') || u === 'SEHAT') sehat++;
      else ugd++;
    });

    return { ugd, rawatInap, rawatJalan, sehat };
  }, [data.sekolah, data.siswa]);

  // Global Stats calculations (Excluding Mutasi personnel)
  const totalSekolah = data.sekolah.length;
  const totalGuru = data.guru.filter((g) => g.status !== 'Mutasi').length;
  const totalTendik = (data.tendik || []).filter((t) => t.status !== 'Mutasi').length;
  const totalKepalaSekolah = data.kepalaSekolah.filter((k) => k.status !== 'Mutasi').length;
  const totalSiswa = data.siswa.filter((s) => s.status !== 'Mutasi').length;
  const totalMutasi = 
    data.guru.filter((g) => g.status === 'Mutasi').length +
    (data.tendik || []).filter((t) => t.status === 'Mutasi').length +
    data.kepalaSekolah.filter((k) => k.status === 'Mutasi').length +
    data.siswa.filter((s) => s.status === 'Mutasi').length;

  const totalSKTerbit = useMemo(() => {
    const skg = data.skGuru.filter((s) => s.status === 'Terbit').length;
    const skks = data.skKepalaSekolah.filter((s) => s.status === 'Terbit').length;
    return skg + skks;
  }, [data.skGuru, data.skKepalaSekolah]);

  const totalSKBelumTerbit = useMemo(() => {
    const skg = data.skGuru.filter((s) => s.status === 'Belum Terbit').length;
    const skks = data.skKepalaSekolah.filter((s) => s.status === 'Belum Terbit').length;
    return skg + skks;
  }, [data.skGuru, data.skKepalaSekolah]);

  // Reminder 1: Masa Jabatan Kepala Sekolah
  const principalReminders = useMemo(() => {
    const today = new Date('2026-07-13');
    return data.kepalaSekolah
      .filter((ks) => ks.status === 'Aktif')
      .map((ks) => {
        const endDate = new Date(ks.endDate);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const school = data.sekolah.find((s) => s.id === ks.schoolId);
        return {
          ...ks,
          schoolName: school?.name || 'Sekolah Tidak Diketahui',
          daysLeft: diffDays,
        };
      })
      .filter((ks) => ks.daysLeft <= 90)
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [data.kepalaSekolah, data.sekolah]);

  // Reminder 2: SK Belum Terbit list
  const pendingSKReminders = useMemo(() => {
    const list: { id: string; type: 'Guru' | 'Kepala Sekolah'; name: string; number: string; date: string }[] = [];
    
    data.skGuru
      .filter((s) => s.status === 'Belum Terbit')
      .forEach((s) => {
        const guru = data.guru.find((g) => g.id === s.guruId);
        list.push({
          id: s.id,
          type: 'Guru',
          name: guru?.name || 'Guru Tidak Diketahui',
          number: s.skNumber || 'Draft / Belum Ada No',
          date: s.skDate,
        });
      });

    data.skKepalaSekolah
      .filter((s) => s.status === 'Belum Terbit')
      .forEach((s) => {
        const ks = data.kepalaSekolah.find((k) => k.id === s.kepalaSekolahId);
        list.push({
          id: s.id,
          type: 'Kepala Sekolah',
          name: ks?.name || 'Kepala Sekolah Tidak Diketahui',
          number: s.skNumber || 'Draft / Belum Ada No',
          date: s.skDate,
        });
      });

    return list;
  }, [data.skGuru, data.skKepalaSekolah, data.guru, data.kepalaSekolah]);

  // Charts data preparation
  const schoolLevelData = useMemo(() => {
    const levels = { SD: 0, SMP: 0, SMA: 0, SMK: 0 };
    data.sekolah.forEach((s) => {
      if (s.level in levels) {
        levels[s.level as keyof typeof levels]++;
      }
    });
    return Object.entries(levels).map(([name, value]) => ({ name, value }));
  }, [data.sekolah]);

  const teacherStatusData = useMemo(() => {
    const statuses = { PNS: 0, PPPK: 0, GTT: 0, Honor: 0 };
    data.guru.forEach((g) => {
      if (g.status in statuses) {
        statuses[g.status as keyof typeof statuses]++;
      }
    });
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [data.guru]);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* View Switcher Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building className="text-blue-600" size={18} />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Pilih Beranda Sekolah / Tampilan:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSelectedSchoolId('')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              selectedSchoolId === ''
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-white border-emerald-500/30 shadow-md'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Ringkasan Seluruh Kabupaten
          </button>
          
          <select
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none cursor-pointer"
          >
            <option value="">-- Mode Beranda Sekolah --</option>
            {data.sekolah.map((s) => (
              <option key={s.id} value={s.id}>
                Beranda {s.name} ({s.level})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RENDER BERANDA SEKOLAH IF A SCHOOL IS SELECTED */}
      {selectedSchool ? (
        <div className="space-y-5 animate-fadeIn">
          {/* Cover & Title Banner */}
          <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-sm bg-white">
            <div 
              className="h-44 sm:h-52 w-full bg-cover bg-center relative"
              style={{
                backgroundImage: selectedSchool.bannerUrl 
                  ? `url('${selectedSchool.bannerUrl}')` 
                  : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)'
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/30 to-transparent" />
              
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <button
                  onClick={() => onNavigateToTab('sekolah')}
                  className="bg-white/90 hover:bg-white text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow flex items-center gap-1.5 backdrop-blur-sm transition-all cursor-pointer"
                >
                  <Edit2 size={13} className="text-blue-600" />
                  Edit Profil Sekolah
                </button>
              </div>
            </div>

            {/* School Logo & Title Header */}
            <div className="px-6 pb-5 pt-0 -mt-12 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white p-1.5 shadow-md border-2 border-white overflow-hidden shrink-0">
                  <img
                    src={selectedSchool.logoUrl || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10"}
                    alt={selectedSchool.name}
                    className="w-full h-full object-contain rounded-xl"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                      {selectedSchool.level}
                    </span>
                    <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                      {selectedSchool.status}
                    </span>
                    {selectedSchool.accreditation && (
                      <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase flex items-center gap-1">
                        <Award size={11} /> Akreditasi {selectedSchool.accreditation}
                      </span>
                    )}
                    {selectedSchool.curriculum && (
                      <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded tracking-wide uppercase">
                        {selectedSchool.curriculum}
                      </span>
                    )}
                    {selectedSchoolCategoryDetails && (
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded tracking-wide uppercase flex items-center gap-1 ${selectedSchoolCategoryDetails.badgeClass}`}>
                        <Activity size={12} /> {selectedSchoolCategoryDetails.title} • {selectedSchoolCategoryDetails.desc}
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {selectedSchool.name}
                  </h1>
                  <p className="text-xs text-slate-500 font-mono font-medium flex flex-wrap items-center gap-2 mt-0.5">
                    <span>NPSN: <strong>{selectedSchool.npsn}</strong></span>
                    <span>•</span>
                    <span>Pimpinan Cabang: {cabangForSchool?.name || 'Cabang Wilayah V'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Info & Contacts Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Alamat Sekolah</span>
                <p className="font-medium text-slate-800 leading-relaxed mt-0.5">{selectedSchool.address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2.5">
              <Phone size={16} className="text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Telepon & Kontak</span>
                <p className="font-medium text-slate-800 mt-0.5">{selectedSchool.phone || '-'}</p>
                {selectedSchool.email && (
                  <p className="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
                    <Mail size={12} /> {selectedSchool.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Globe size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-400 text-[10px] uppercase tracking-wider block">Website & Portal Resmi</span>
                {selectedSchool.website ? (
                  <a
                    href={selectedSchool.website.startsWith('http') ? selectedSchool.website : `https://${selectedSchool.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                  >
                    {selectedSchool.website} <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Belum diisi</span>
                )}
              </div>
            </div>
          </div>

          {/* Category Capability Card Banner */}
          {selectedSchoolCategoryDetails && (
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${selectedSchoolCategoryDetails.bannerBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-10 rounded-full ${selectedSchoolCategoryDetails.dotBg} shrink-0`} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      Kategori Kemampuan Sekolah / Madrasah Terbaru
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${selectedSchoolCategoryDetails.badgeClass}`}>
                      {selectedSchoolCategoryDetails.code}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-0.5">
                    {selectedSchoolCategoryDetails.title} &mdash; <span className={selectedSchoolCategoryDetails.textAccent}>{selectedSchoolCategoryDetails.desc}</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Kriteria Kapasitas: <strong>{selectedSchoolCategoryDetails.range}</strong> &bull; Total Siswa Aktif saat ini: <strong>{schoolSiswaList.length} Siswa</strong>
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <button
                  onClick={() => onNavigateToTab('sekolah')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  Edit Profil Sekolah
                </button>
              </div>
            </div>
          )}

          {/* Key Stats Grid for Selected School */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div onClick={() => onNavigateToTab('guru')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-500 cursor-pointer transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Guru Sekolah</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{schoolGuruList.length} <span className="text-xs font-normal text-slate-400">Guru</span></h3>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">Terdaftar di SIM</span>
            </div>

            <div onClick={() => onNavigateToTab('siswa')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 cursor-pointer transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Siswa Sekolah</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{schoolSiswaList.length} <span className="text-xs font-normal text-slate-400">Siswa</span></h3>
              <span className="text-[10px] text-blue-600 font-bold block mt-1">Aktif Belajar</span>
            </div>

            <div onClick={() => onNavigateToTab('kepalaSekolah')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-500 cursor-pointer transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kepala Sekolah</span>
              <h3 className="text-sm font-bold text-slate-800 mt-1 line-clamp-1">{activePrincipal?.name || 'Belum diisi'}</h3>
              <span className="text-[10px] text-indigo-600 font-bold block mt-1">{activePrincipal ? `Status: ${activePrincipal.status}` : '-'}</span>
            </div>

            <div onClick={() => onNavigateToTab('skGuru')} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-violet-500 cursor-pointer transition-all">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">SK Terbit</span>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{schoolSKCount} <span className="text-xs font-normal text-slate-400">SK</span></h3>
              <span className="text-[10px] text-violet-600 font-bold block mt-1">Dokumen Lengkap</span>
            </div>
          </div>

          {/* Profil & Sambutan + Visi & Misi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Profil & Sambutan */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <BookOpen className="text-blue-600" size={18} />
                <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Profil & Sambutan Sekolah</h3>
              </div>
              {selectedSchool.description ? (
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line font-normal">
                  {selectedSchool.description}
                </p>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Belum ada profil ringkas atau sambutan sekolah yang diisi. Klik tombol "Edit Profil Sekolah" untuk mengisi data profile sekolah ini.
                </div>
              )}
            </div>

            {/* Visi & Misi */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Compass className="text-emerald-600" size={18} />
                <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Visi & Misi Sekolah</h3>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 inline-block mb-1.5">
                  Visi
                </span>
                {selectedSchool.vision ? (
                  <blockquote className="p-3 bg-slate-50 rounded-xl border-l-4 border-emerald-500 text-xs font-semibold text-slate-800 italic leading-relaxed">
                    "{selectedSchool.vision}"
                  </blockquote>
                ) : (
                  <p className="text-xs text-slate-400 italic">Visi belum diisi.</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mb-1.5">
                  Misi
                </span>
                {selectedSchool.mission ? (
                  <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100 font-medium">
                    {selectedSchool.mission}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Misi belum diisi.</p>
                )}
              </div>
            </div>
          </div>

          {/* Teacher List Preview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users2 size={18} className="text-slate-700" />
                <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Daftar Guru di {selectedSchool.name}</h3>
              </div>
              <button
                onClick={() => onNavigateToTab('guru')}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Lihat Semua ({schoolGuruList.length}) →
              </button>
            </div>

            {schoolGuruList.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Belum ada data guru terdaftar di sekolah ini.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {schoolGuruList.slice(0, 6).map((g) => (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                      {g.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{g.name}</h4>
                      <p className="text-[10px] text-slate-500 truncate">{g.subject} • NIP: {g.nip}</p>
                      <span className="text-[9px] font-bold text-emerald-600 uppercase">{g.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* RENDER RINGKASAN SELURUH KABUPATEN */
        <div className="space-y-4">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-800 rounded-xl p-4 text-white border border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                Sistem Informasi Manajemen DIKDASMEN
              </h1>
              <p className="text-slate-300 text-xs mt-0.5 max-w-2xl">
                Selamat datang di portal analisis data Pendidikan Dasar & Menengah Kabupaten Klaten. 
                Semua data tersinkronisasi langsung dengan Google Sheets & Google Drive Anda.
              </p>
            </div>
            <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-bold font-mono text-slate-300 self-start sm:self-auto flex items-center gap-1.5">
              <Calendar size={12} className="text-blue-400" />
              <span>Senin, 13 Juli 2026</span>
            </div>
          </div>

          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <div 
              onClick={() => onNavigateToTab('sekolah')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Total Sekolah</span>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSekolah}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">SD, SMP, SMA, SMK</span>
              </div>
              <div className="bg-blue-50 p-2 rounded text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                <School size={18} />
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('kepalaSekolah')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Kepala Sekolah</span>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalKepalaSekolah}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Aktif di Kabupaten</span>
              </div>
              <div className="bg-indigo-50 p-2 rounded text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
                <GraduationCap size={18} />
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('guru')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Total Guru</span>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalGuru}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Aktif Bertugas</span>
              </div>
              <div className="bg-emerald-50 p-2 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                <Users2 size={18} />
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('siswa')}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-violet-500 hover:shadow-md transition-all cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Total Siswa</span>
                <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSiswa}</h3>
                <span className="text-[10px] text-slate-400 block mt-1">Siswa Aktif</span>
              </div>
              <div className="bg-violet-50 p-2 rounded text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
                <UsersIcon size={18} />
              </div>
            </div>

            <div 
              onClick={() => onNavigateToTab('mutasi')}
              className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs flex items-center justify-between hover:border-purple-500 hover:shadow-md transition-all cursor-pointer group col-span-2 lg:col-span-1"
            >
              <div>
                <span className="text-[10px] font-black text-purple-600 tracking-wider uppercase">Data Mutasi</span>
                <h3 className="text-2xl font-black text-purple-900 mt-0.5">{totalMutasi}</h3>
                <span className="text-[10px] text-purple-500 block mt-1">Kategori Mutasi</span>
              </div>
              <div className="bg-purple-100 p-2 rounded text-purple-700 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                <ArrowRightLeft size={18} />
              </div>
            </div>
          </div>

          {/* SK Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-emerald-600 tracking-wider uppercase">SK Sudah Terbit</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalSKTerbit} <span className="text-xs font-normal text-slate-400 font-mono">#SK-GURU</span></h3>
                <p className="text-[10px] text-slate-400 mt-1">Lengkap dokumen dan diupload ke Google Drive.</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded text-emerald-600 shrink-0">
                <FileText size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black text-amber-600 tracking-wider uppercase">SK Belum Terbit / Draft</span>
                <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalSKBelumTerbit} <span className="text-xs font-normal text-slate-400 font-mono">#PENDING</span></h3>
                <p className="text-[10px] text-slate-400 mt-1">Butuh proses melengkapi dokumen lampiran SK.</p>
              </div>
              <div className="p-2 bg-amber-50 rounded text-amber-600 shrink-0">
                <Clock size={20} />
              </div>
            </div>
          </div>

          {/* Categories Breakdown Section for All Schools */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-900 text-sm tracking-tight uppercase flex items-center gap-2">
                  <Activity size={16} className="text-purple-600" /> Kategori Kemampuan Sekolah / Madrasah Terbaru
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klasifikasi kemampuan {totalSekolah} Sekolah &amp; Madrasah berdasarkan daya dukung &amp; jumlah siswa.
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('sekolah')}
                className="self-start sm:self-auto px-3 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Kelola Profil Sekolah
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. UGD */}
              <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-black tracking-wider uppercase">
                      1. UGD
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-rose-950 mt-2">Menuju Rintisan</h4>
                  <p className="text-[11px] text-rose-700 font-medium mt-0.5">S/M Dibawah 100 Siswa</p>
                </div>
                <div className="mt-3 pt-2 border-t border-rose-200/60 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-rose-950">{overallCategoryCounts.ugd}</span>
                  <span className="text-[11px] font-bold text-rose-800">Sekolah / Madrasah</span>
                </div>
              </div>

              {/* 2. RAWAT INAP */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-black tracking-wider uppercase">
                      2. RAWAT INAP
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-emerald-950 mt-2">Sekolah Mandiri</h4>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5">S/M 100 - 400 Siswa</p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-emerald-950">{overallCategoryCounts.rawatInap}</span>
                  <span className="text-[11px] font-bold text-emerald-800">Sekolah / Madrasah</span>
                </div>
              </div>

              {/* 3. RAWAT JALAN */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-blue-600 text-white rounded text-[10px] font-black tracking-wider uppercase">
                      3. RAWAT JALAN
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-blue-950 mt-2">Sekolah Unggul</h4>
                  <p className="text-[11px] text-blue-700 font-medium mt-0.5">S/M 400 - 600 Siswa</p>
                </div>
                <div className="mt-3 pt-2 border-t border-blue-200/60 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-blue-950">{overallCategoryCounts.rawatJalan}</span>
                  <span className="text-[11px] font-bold text-blue-800">Sekolah / Madrasah</span>
                </div>
              </div>

              {/* 4. SEHAT */}
              <div className="p-3.5 bg-purple-50/80 border border-purple-200 rounded-xl relative overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-purple-600 text-white rounded text-[10px] font-black tracking-wider uppercase">
                      4. SEHAT
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-purple-950 mt-2">Sekolah Premium</h4>
                  <p className="text-[11px] text-purple-700 font-medium mt-0.5">S/M Diatas 600 Siswa</p>
                </div>
                <div className="mt-3 pt-2 border-t border-purple-200/60 flex items-baseline justify-between">
                  <span className="text-2xl font-black text-purple-950">{overallCategoryCounts.sehat}</span>
                  <span className="text-[11px] font-bold text-purple-800">Sekolah / Madrasah</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Reminders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Reminder Masa Jabatan Kepala Sekolah */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500 h-4 w-4 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Masa Jabatan Kepala Sekolah</h3>
                </div>
                <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-2 py-0.5 rounded border border-amber-200">
                  {principalReminders.length} Peringatan
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                {principalReminders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                    <ShieldCheck className="h-6 w-6 text-emerald-500 mb-1.5" />
                    <span className="text-[11px] font-medium">Semua Kepala Sekolah aman (&gt; 90 hari).</span>
                  </div>
                ) : (
                  principalReminders.map((ks) => (
                    <div key={ks.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-slate-800 text-[11px]">{ks.name}</h4>
                        <p className="text-slate-500 flex items-center gap-1 mt-0.5 text-[10px]">
                          <Building size={10} /> {ks.schoolName}
                        </p>
                        <p className="text-slate-400 mt-0.5 text-[10px]">Berakhir: {ks.endDate}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {ks.daysLeft < 0 ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[9px]">
                            Expired {Math.abs(ks.daysLeft)} hari
                          </span>
                        ) : ks.daysLeft === 0 ? (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold text-[9px]">
                            Hari Ini
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold text-[9px]">
                            {ks.daysLeft} hari lagi
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reminder SK Belum Terbit */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="text-blue-600 h-4 w-4 shrink-0" />
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Reminder Penerbitan SK (Draft)</h3>
                </div>
                <span className="bg-blue-50 text-blue-800 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-200">
                  {pendingSKReminders.length} Menunggu
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
                {pendingSKReminders.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs py-8">
                    <ShieldCheck className="h-6 w-6 text-emerald-500 mb-1.5" />
                    <span className="text-[11px] font-medium">Semua SK telah diterbitkan!</span>
                  </div>
                ) : (
                  pendingSKReminders.map((sk) => (
                    <div key={sk.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[9px] font-black uppercase inline-block mb-1">
                          {sk.type}
                        </span>
                        <h4 className="font-bold text-slate-800 text-[11px]">{sk.name}</h4>
                        <p className="text-slate-500 mt-0.5 text-[10px]">Rencana Tgl: {sk.date}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <button
                          onClick={() => onNavigateToTab(sk.type === 'Guru' ? 'skGuru' : 'skKepalaSekolah')}
                          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white font-bold py-1 px-2.5 rounded-md text-[9px] tracking-wide transition-all shadow-xs cursor-pointer border border-emerald-400/20 active:scale-[0.98]"
                        >
                          Terbitkan
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sekolah Level Distribution */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 mb-3">
                Distribusi Tingkat Sekolah (SD/SMP/SMA/SMK)
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                {totalSekolah === 0 ? (
                  <span className="text-[11px] text-slate-400">Tidak ada data sekolah untuk ditampilkan.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={schoolLevelData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={70}
                        fill="#3b82f6"
                        dataKey="value"
                      >
                        {schoolLevelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#4f46e5', '#10b981', '#a855f7'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Sekolah`]} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Teacher Status Distribution */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 mb-3">
                Status Kepegawaian Guru (PNS/PPPK/GTT/Honor)
              </h3>
              <div className="h-64 w-full flex items-center justify-center">
                {totalGuru === 0 ? (
                  <span className="text-[11px] text-slate-400">Tidak ada data guru untuk ditampilkan.</span>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={teacherStatusData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value) => [`${value} Guru`]} />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Bar dataKey="value" name="Jumlah Guru" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                        {teacherStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#4f46e5', '#10b981', '#a855f7'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
