import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { Role } from '../types';

interface LoginProps {
  onLoginSuccess: (user: any, token: string | null) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Pre-seed offline database if not present, so default users are immediately available
  useEffect(() => {
    if (!localStorage.getItem('sim_offline_db')) {
      const starterUsers = [
        { id: 'usr-1', email: 'admin@klaten.go.id', name: 'Super Admin Klaten', role: 'Super Admin', password: 'admin', createdAt: new Date().toISOString() },
        { id: 'usr-2', email: 'admin2@klaten.go.id', name: 'Admin Operator', role: 'Admin', password: 'admin2', createdAt: new Date().toISOString() },
        { id: 'usr-3', email: 'klaut@pdmklaten.com', name: 'Angga Crisna', role: 'Cabang', password: 'password', cabangId: 'cab-1', createdAt: new Date().toISOString() },
      ];
      const starterCabang = [
        { id: 'cab-1', name: 'Pimpinan Cabang Pendidikan Wilayah V', code: 'CAB-V' },
      ];
      const starterSekolah = [
        { id: 'sch-1', name: 'SMAN 1 Klaten', npsn: '20309501', cabangId: 'cab-1', address: 'Jl. Merbabu No.13, Klaten', status: 'Negeri', level: 'SMA' },
        { id: 'sch-2', name: 'SMKN 1 Klaten', npsn: '20309502', cabangId: 'cab-1', address: 'Jl. Pemuda No.120, Klaten', status: 'Negeri', level: 'SMK' },
      ];
      const freshData = {
        users: starterUsers,
        cabang: starterCabang,
        sekolah: starterSekolah,
        guru: [],
        kepalaSekolah: [],
        siswa: [],
        skGuru: [],
        skKepalaSekolah: [],
        notifikasi: [],
        logAktivitas: [],
        settings: [],
      };
      localStorage.setItem('sim_offline_db', JSON.stringify(freshData));
    }
  }, []);

  // Load saved username if remember me was active
  useEffect(() => {
    const saved = localStorage.getItem('sim_saved_username');
    const remember = localStorage.getItem('sim_remember_me') === 'true';
    if (remember && saved) {
      setUsername(saved);
      setRememberMe(true);
    }
  }, []);

  const handlePresetFill = (presetUser: string, presetPass: string) => {
    setUsername(presetUser);
    setPassword(presetPass);
    setError(null);
  };

  const validateUser = (u: string, p: string) => {
    const cleanU = u.trim().toLowerCase();
    const cleanP = p.trim();

    // Check cached db
    try {
      const cached = localStorage.getItem('sim_offline_db');
      if (cached) {
        const db = JSON.parse(cached);
        if (db && Array.isArray(db.users)) {
          const matched = db.users.find(
            (usr: any) =>
              usr &&
              ((usr.email && usr.email.toLowerCase() === cleanU) ||
               (usr.name && usr.name.toLowerCase() === cleanU) ||
               (usr.id && usr.id.toLowerCase() === cleanU) ||
               (cleanU === 'admin' && (usr.role === 'Super Admin' || usr.email === 'admin@klaten.go.id'))) &&
              (usr.password ? usr.password === cleanP : cleanP === 'admin')
          );
          if (matched) {
            return {
              role: (matched.role || 'Super Admin') as Role,
              name: matched.name || 'Super Admin Klaten',
              email: matched.email || 'admin@klaten.go.id',
              cabangId: matched.cabangId || '',
              sekolahId: matched.sekolahId || '',
            };
          }
        }
      }
    } catch (e) {
      console.error('Error reading offline db:', e);
    }

    // Default hardcoded credentials fallback
    if (cleanU === 'admin' && cleanP === 'admin') {
      return { role: 'Super Admin' as Role, name: 'Super Admin Klaten', email: 'admin@klaten.go.id', cabangId: '', sekolahId: '' };
    }
    if (cleanU === 'admin2' && cleanP === 'admin2') {
      return { role: 'Admin' as Role, name: 'Admin Operator', email: 'admin2@klaten.go.id', cabangId: '', sekolahId: '' };
    }

    return null;
  };

  const handleLogin = (uInput: string, pInput: string) => {
    setError(null);
    const u = uInput.trim();
    const p = pInput.trim();

    if (!u || !p) {
      setError('Username dan Password wajib diisi.');
      return;
    }

    const creds = validateUser(u, p);
    if (!creds) {
      setError('Username atau Password salah. Gunakan Username: admin & Password: admin');
      return;
    }

    localStorage.setItem('sim_is_offline', 'true');
    localStorage.setItem('sim_override_role', creds.role);
    localStorage.setItem('sim_override_username', creds.name);
    localStorage.setItem('sim_override_email', creds.email);
    if (creds.cabangId) {
      localStorage.setItem('sim_override_cabang_id', creds.cabangId);
    } else {
      localStorage.removeItem('sim_override_cabang_id');
    }
    if (creds.sekolahId) {
      localStorage.setItem('sim_override_sekolah_id', creds.sekolahId);
    } else {
      localStorage.removeItem('sim_override_sekolah_id');
    }

    if (rememberMe && u) {
      localStorage.setItem('sim_remember_me', 'true');
      localStorage.setItem('sim_saved_username', u);
    } else {
      localStorage.removeItem('sim_remember_me');
      localStorage.removeItem('sim_saved_username');
    }

    const loggedInUser = {
      uid: 'usr-' + Math.random().toString(36).substring(2, 9),
      email: creds.email,
      displayName: creds.name,
      photoURL: null,
      emailVerified: true,
    };

    onLoginSuccess(loggedInUser, null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 px-6 py-10 text-center text-white relative">
          <div className="absolute top-4 right-4 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="flex justify-center mb-3">
            <div className="bg-white p-1 rounded-2xl border border-white/20 shadow-md flex items-center justify-center">
              <img 
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10" 
                alt="Logo SIM DIKDASMEN" 
                className="h-14 w-14 object-contain rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight">SIM DIKDASMEN</h1>
          <p className="text-emerald-100 text-xs mt-1 font-medium">Kabupaten Klaten</p>
          <div className="mt-3.5 inline-block bg-white/15 text-white text-[10px] px-2.5 py-1 rounded-full border border-white/25 backdrop-blur-xs font-semibold">
            Sistem Informasi Manajemen Terpadu
          </div>
        </div>

        {/* Login Form Body */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-base font-bold text-slate-800">Masuk ke Sistem</h2>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <User size={14} />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 block">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock size={14} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-9 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center">
              <input
                id="remember_me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer h-3.5 w-3.5"
              />
              <label htmlFor="remember_me" className="ml-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                Ingat Saya
              </label>
            </div>



            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white font-bold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer text-xs flex items-center justify-center gap-1.5 disabled:opacity-50 border border-emerald-400/20 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="h-4.5 w-4.5 border-2 border-slate-300 border-t-white rounded-full animate-spin"></div>
                  Memproses Masuk...
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </button>

            {/* Forgot Password link under submit button */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Lupa Password?
              </button>
            </div>
          </form>

          <div className="border-t border-slate-100 pt-4 text-center">
            <span className="text-[10px] text-slate-400 font-mono tracking-wider">
              SIM DIKDASMEN v1.0 - © MPI PDM Klaten
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 max-w-sm w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex justify-center">
              <div className="bg-blue-50 p-3 rounded-full border border-blue-100">
                <Info size={28} className="text-blue-600" />
              </div>
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-bold text-sm md:text-base text-slate-800">Pemulihan Kata Sandi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Untuk alasan keamanan, pemulihan akun dan reset kata sandi tidak dapat dilakukan secara mandiri.
              </p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-[11px] text-slate-600 border border-slate-200/60 leading-relaxed">
              Silakan hubungi <strong>Dinas Pendidikan & Kebudayaan Kabupaten Klaten (Seksi SIM Dikdasmen)</strong> atau administrator utama Anda untuk melakukan penggantian sandi baru.
            </div>
            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-lg text-xs cursor-pointer transition-colors"
            >
              Mengerti & Kembali
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
