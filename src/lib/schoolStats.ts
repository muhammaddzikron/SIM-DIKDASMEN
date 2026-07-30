import { DatabaseState, Sekolah } from '../types';

export interface SchoolCalculatedStats {
  jumlahKeseluruhanSiswa: string;
  jumlahSiswaPerKelas: string;
  jumlahGtp: string;
  jumlahGttp: string;
  jumlahDpkPns: string;
  jumlahKeseluruhanGuru: string;
  jumlahKtp: string;
  jumlahKttp: string;
  jumlahKeseluruhanKaryawan: string;
  jumlahGuruSertifikasi: string;
  jumlahGuruInpassing: string;

  // Numerical counts
  siswaCount: number;
  guruCount: number;
  tendikCount: number;
  rombelCount: number;
}

export function getSchoolStats(
  school: (Partial<Sekolah> & { id?: string; npsn?: string; name?: string }) | undefined | null,
  data: DatabaseState
): SchoolCalculatedStats {
  if (!school) {
    return {
      jumlahKeseluruhanSiswa: '0',
      jumlahSiswaPerKelas: '0',
      jumlahGtp: '0',
      jumlahGttp: '0',
      jumlahDpkPns: '0',
      jumlahKeseluruhanGuru: '0',
      jumlahKtp: '0',
      jumlahKttp: '0',
      jumlahKeseluruhanKaryawan: '0',
      jumlahGuruSertifikasi: '0',
      jumlahGuruInpassing: '0',
      siswaCount: 0,
      guruCount: 0,
      tendikCount: 0,
      rombelCount: 0,
    };
  }

  const schoolId = school.id || '';
  const schoolNpsn = school.npsn || '';
  const schoolNameLower = (school.name || '').toLowerCase().trim();

  const isMatchingSchool = (item: any) => {
    if (!item) return false;
    if (item.schoolId) {
      if (item.schoolId === schoolId || (schoolNpsn && item.schoolId === schoolNpsn)) return true;
    }
    if (item.sekolah) {
      if (item.sekolah === schoolId || (schoolNpsn && item.sekolah === schoolNpsn)) return true;
      if (schoolNameLower && typeof item.sekolah === 'string' && item.sekolah.toLowerCase().trim() === schoolNameLower) return true;
    }
    return false;
  };

  // Filter lists (excluding Mutasi)
  const guruList = (data.guru || []).filter((g) => isMatchingSchool(g) && g.status !== 'Mutasi');
  const tendikList = (data.tendik || []).filter((t) => isMatchingSchool(t) && t.status !== 'Mutasi');
  const siswaList = (data.siswa || []).filter((s) => isMatchingSchool(s) && s.status !== 'Mutasi');

  // Siswa counts
  const siswaCount = siswaList.length;
  const classSet = new Set(siswaList.map((s) => s.class).filter(Boolean));
  const rombelCount = classSet.size;
  const avgSiswaPerKelas = rombelCount > 0 ? Math.round(siswaCount / rombelCount) : 0;
  
  let jumlahSiswaPerKelasStr = school.jumlahSiswaPerKelas || '';
  if (rombelCount > 0) {
    jumlahSiswaPerKelasStr = `${avgSiswaPerKelas} Siswa/Kelas (${rombelCount} Rombel)`;
  } else if (!jumlahSiswaPerKelasStr) {
    jumlahSiswaPerKelasStr = 'Rata-rata 28-32 Siswa';
  }

  // Guru counts
  const gtpCount = guruList.filter((g) => {
    const st = (g.status || '').toUpperCase();
    return st.includes('GTP') && !st.includes('GTTP');
  }).length;

  const gttpCount = guruList.filter((g) => {
    const st = (g.status || '').toUpperCase();
    return st.includes('GTTP') || st === 'GTT' || st.includes('HONOR');
  }).length;

  const dpkPnsCount = guruList.filter((g) => {
    const st = (g.status || '').toUpperCase();
    return st.includes('PNS') || st.includes('DPK');
  }).length;

  const guruCount = guruList.length;

  const guruSertifikasiCount = guruList.filter((g) => {
    const ppg = (g.hasPpg || '').toLowerCase();
    return ppg === 'sudah' || ppg === 'ya' || ppg.includes('sertifikasi') || Boolean(g.nrg);
  }).length;

  const guruInpassingCount = guruList.filter((g) => {
    const subj = (g.subject || '').toLowerCase();
    const st = (g.status || '').toLowerCase();
    return subj.includes('inpassing') || st.includes('inpassing');
  }).length;

  // Tendik / Karyawan counts
  const ktpCount = tendikList.filter((t) => {
    const st = (t.status || '').toUpperCase();
    return st.includes('KTP') && !st.includes('KTTP');
  }).length;

  const kttpCount = tendikList.filter((t) => {
    const st = (t.status || '').toUpperCase();
    return st.includes('KTTP') || st === 'PTT' || st.includes('HONOR');
  }).length;

  const tendikCount = tendikList.length;

  return {
    jumlahKeseluruhanSiswa: String(siswaCount),
    jumlahSiswaPerKelas: jumlahSiswaPerKelasStr,
    jumlahGtp: String(gtpCount),
    jumlahGttp: String(gttpCount),
    jumlahDpkPns: String(dpkPnsCount),
    jumlahKeseluruhanGuru: String(guruCount),
    jumlahKtp: String(ktpCount),
    jumlahKttp: String(kttpCount),
    jumlahKeseluruhanKaryawan: String(tendikCount),
    jumlahGuruSertifikasi: String(guruSertifikasiCount),
    jumlahGuruInpassing: String(guruInpassingCount),

    siswaCount,
    guruCount,
    tendikCount,
    rombelCount,
  };
}
