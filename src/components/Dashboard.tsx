import React, { useMemo } from 'react';
import { DatabaseState, KepalaSekolah, SKGuru, SKKepalaSekolah } from '../types';
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
}

export default function Dashboard({ data, onNavigateToTab }: DashboardProps) {
  // Stats calculations
  const totalSekolah = data.sekolah.length;
  const totalGuru = data.guru.length;
  const totalKepalaSekolah = data.kepalaSekolah.length;
  const totalSiswa = data.siswa.length;

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
  // Less than 90 days from today (July 13, 2026) or already ended
  const principalReminders = useMemo(() => {
    const today = new Date('2026-07-13'); // Today's date as per context
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

  const COLORS = ['#0f766e', '#0369a1', '#6d28d9', '#b91c1c'];

  return (
    <div className="space-y-4 animate-fadeIn">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          onClick={() => onNavigateToTab('sekolah')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
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
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer group"
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
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Total Guru</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalGuru}</h3>
            <span className="text-[10px] text-slate-400 block mt-1">Ratio 1:17 Siswa</span>
          </div>
          <div className="bg-emerald-50 p-2 rounded text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
            <Users2 size={18} />
          </div>
        </div>

        <div 
          onClick={() => onNavigateToTab('siswa')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:border-violet-500 hover:shadow-md transition-all cursor-pointer group"
        >
          <div>
            <span className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Total Siswa</span>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{totalSiswa}</h3>
            <span className="text-[10px] text-slate-400 block mt-1">Aktif TA 2024/2025</span>
          </div>
          <div className="bg-violet-50 p-2 rounded text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors shrink-0">
            <UsersIcon size={18} />
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
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-[9px] tracking-wide transition-colors cursor-pointer"
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
  );
}
