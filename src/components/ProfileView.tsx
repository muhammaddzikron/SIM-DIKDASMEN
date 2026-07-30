import React, { useState, useEffect } from 'react';
import { User, Role, DatabaseState } from '../types';
import {
  User as UserIcon,
  Shield,
  Key,
  Mail,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Building,
  School,
  Info,
} from 'lucide-react';

interface ProfileViewProps {
  userProfile: User | null;
  userRole: Role;
  data: DatabaseState;
  onUpdateProfile: (updatedData: {
    name: string;
    username: string;
    email: string;
    password?: string;
  }) => Promise<void>;
}

export default function ProfileView({
  userProfile,
  userRole,
  data,
  onUpdateProfile,
}: ProfileViewProps) {
  // Find matching entity details if applicable
  const matchedCabang = userProfile?.cabangId
    ? data.cabang.find((c) => c.id === userProfile.cabangId)
    : null;

  const matchedSekolah = userProfile?.sekolahId
    ? data.sekolah.find((s) => s.id === userProfile.sekolahId)
    : null;

  // Derive initial username from profile or matched entity
  const initialUsername =
    userProfile?.username ||
    matchedCabang?.username ||
    matchedSekolah?.username ||
    (matchedSekolah?.npsn ? matchedSekolah.npsn : '') ||
    (matchedCabang?.code ? matchedCabang.code.toLowerCase() : '') ||
    (userProfile?.email ? userProfile.email.split('@')[0] : 'user');

  const [name, setName] = useState(userProfile?.name || '');
  const [username, setUsername] = useState(initialUsername);
  const [email, setEmail] = useState(userProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setEmail(userProfile.email || '');
      
      const currentU =
        userProfile.username ||
        matchedCabang?.username ||
        matchedSekolah?.username ||
        (matchedSekolah?.npsn ? matchedSekolah.npsn : '') ||
        (matchedCabang?.code ? matchedCabang.code.toLowerCase() : '') ||
        (userProfile.email ? userProfile.email.split('@')[0] : 'user');

      setUsername(currentU);
    }
  }, [userProfile, matchedCabang, matchedSekolah]);

  const isAdmin = userRole === 'Super Admin' || userRole === 'Admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (password && password !== confirmPassword) {
      setErrorMessage('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }

    if (password && password.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    setLoading(true);
    try {
      await onUpdateProfile({
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password: password.trim() ? password.trim() : undefined,
      });

      setSuccessMessage('Profil dan password berhasil diperbarui!');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Profile Header Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-sky-900 rounded-2xl p-6 text-white shadow-lg border border-teal-700/50 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 opacity-10">
          <UserIcon size={180} />
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center text-3xl font-black text-white shadow-inner uppercase shrink-0">
            {name ? name.charAt(0) : 'U'}
          </div>

          <div className="text-center sm:text-left space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="bg-emerald-400/25 text-emerald-200 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-300/30 uppercase tracking-wide">
                {userRole}
              </span>
              {matchedCabang && (
                <span className="bg-teal-400/25 text-teal-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-teal-300/30 truncate max-w-[200px]">
                  {matchedCabang.name}
                </span>
              )}
              {matchedSekolah && (
                <span className="bg-sky-400/25 text-sky-100 text-[10px] font-bold px-2.5 py-0.5 rounded-md border border-sky-300/30 truncate max-w-[200px]">
                  {matchedSekolah.name}
                </span>
              )}
            </div>

            <h1 className="text-xl font-bold tracking-tight text-white truncate">{name || 'Pengguna SIM'}</h1>
            <p className="text-xs text-emerald-100/90 flex items-center justify-center sm:justify-start gap-1">
              <Mail size={13} className="shrink-0" />
              <span className="truncate">{email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <Check size={18} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs animate-fadeIn">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Shield size={18} className="text-teal-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-800">Pengaturan Profil & Sandi Akun</h2>
            <p className="text-[11px] text-slate-500">Perbarui informasi profil dan kata sandi akses login Anda</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Section: Informational Profile Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Display Name Field */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                Nama Lengkap / Instansi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon size={15} />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="Nama Pengguna"
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Username Akses Login
                </label>
                {!isAdmin && (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                    Khusus Admin
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <UserIcon size={15} />
                </span>
                <input
                  type="text"
                  required
                  readOnly={!isAdmin}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg text-xs font-semibold outline-none transition-all ${
                    isAdmin
                      ? 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500'
                      : 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                  }`}
                  placeholder="Username login"
                />
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1">
                <Info size={11} className="shrink-0 text-slate-400" />
                {isAdmin
                  ? 'Sebagai Admin, Anda dapat mengubah username akun ini.'
                  : 'Username telah dibuatkan oleh Admin dan hanya dapat diubah melalui Super Admin.'}
              </p>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Email Resmi
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail size={15} />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  placeholder="email@pdmklaten.com"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Section: Password Update */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key size={14} className="text-amber-600" /> Ubah Kata Sandi (Opsional)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Biarkan kosong jika Anda tidak bermaksud mengubah kata sandi saat ini.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Password Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password baru..."
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
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

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Ulangi Password Baru
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock size={15} />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru..."
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional details depending on Role */}
          {(matchedCabang || matchedSekolah) && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                {matchedCabang ? <Building size={14} className="text-teal-600" /> : <School size={14} className="text-sky-600" />}
                Instansi Terkait
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                {matchedCabang && (
                  <>
                    <div><span className="text-slate-400">Pimpinan Cabang:</span> <strong>{matchedCabang.name}</strong></div>
                    <div><span className="text-slate-400">Kode Cabang:</span> <strong>{matchedCabang.code}</strong></div>
                  </>
                )}
                {matchedSekolah && (
                  <>
                    <div><span className="text-slate-400">Nama Sekolah:</span> <strong>{matchedSekolah.name}</strong></div>
                    <div><span className="text-slate-400">NPSN:</span> <strong>{matchedSekolah.npsn}</strong></div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:via-teal-700 hover:to-sky-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md hover:shadow-lg transition-all text-xs cursor-pointer flex items-center gap-2 border border-emerald-400/20 active:scale-98 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                  Menyimpan Profil...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Simpan Perubahan Profil
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
