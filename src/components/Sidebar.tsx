import React from 'react';
import { Role } from '../types';
import {
  LayoutDashboard,
  Users,
  GitMerge,
  School,
  GraduationCap,
  Users2,
  FileText,
  Settings,
  Bell,
  LogOut,
  FolderOpen,
  UserCheck,
  ClipboardList,
  Trash2,
  Briefcase,
  ArrowRightLeft,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  userRole: Role;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  unreadCount: number;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  userRole,
  userName,
  userEmail,
  onLogout,
  unreadCount,
}: SidebarProps) {
  // Navigation tabs with roles access configuration
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'users',
      label: 'Manajemen User',
      icon: UserCheck,
      allowedRoles: ['Super Admin', 'Admin'],
    },
    {
      id: 'cabang',
      label: 'Pimpinan Cabang',
      icon: GitMerge,
      allowedRoles: ['Super Admin', 'Admin'],
    },
    {
      id: 'sekolah',
      label: 'Daftar & Profil Sekolah',
      icon: School,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'guru',
      label: 'Data Guru',
      icon: Users2,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'tendik',
      label: 'Tenaga Kependidikan',
      icon: Briefcase,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'kepalaSekolah',
      label: 'Kepala Sekolah',
      icon: GraduationCap,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'siswa',
      label: 'Data Siswa',
      icon: Users,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'mutasi',
      label: 'Data Mutasi',
      icon: ArrowRightLeft,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'skGuru',
      label: 'SK Guru',
      icon: FileText,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'skTendik',
      label: 'SK Tendik',
      icon: FileText,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'skKepalaSekolah',
      label: 'SK Kepala Sekolah',
      icon: FileText,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'notifikasi',
      label: 'Notifikasi',
      icon: Bell,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      id: 'logAktivitas',
      label: 'Log Aktivitas',
      icon: ClipboardList,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang'],
    },
    {
      id: 'recycleBin',
      label: 'Tempat Sampah',
      icon: Trash2,
      allowedRoles: ['Super Admin', 'Admin', 'Cabang', 'Sekolah'],
    },
    {
      id: 'settings',
      label: 'Pengaturan',
      icon: Settings,
      allowedRoles: ['Super Admin', 'Admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  return (
    <aside className="w-64 bg-gradient-to-b from-emerald-800 via-teal-900 to-sky-950 text-slate-100 flex flex-col border-r border-teal-700/40 shrink-0 h-screen sticky top-0 shadow-xl">
      {/* Brand Header */}
      <div className="p-5 border-b border-teal-700/30 flex items-center gap-3 bg-emerald-950/20">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10" 
          alt="Logo SIM DIKDASMEN" 
          className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 shrink-0 shadow-xs border border-emerald-300/30"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="font-bold text-white tracking-tight text-sm leading-none">SIM DIKDASMEN</h2>
          <p className="text-[9px] text-emerald-300/80 font-bold tracking-widest uppercase mt-1">Kabupaten Klaten</p>
        </div>
      </div>

      {/* User Information Profile summary */}
      <div className="px-5 py-3.5 border-b border-teal-700/30 bg-emerald-950/40 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-emerald-400/20 text-emerald-200 flex items-center justify-center font-black text-xs uppercase shrink-0 border border-emerald-400/30 shadow-xs">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-none">{userName || 'User'}</h4>
            <p className="text-[10px] text-emerald-200/70 truncate mt-1">{userEmail}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="bg-emerald-400/20 text-emerald-200 text-[9px] font-bold px-2 py-0.5 rounded border border-emerald-400/30">
            {userRole}
          </span>
          <button
            onClick={onLogout}
            className="text-emerald-300/70 hover:text-red-300 hover:bg-red-500/20 p-1 rounded transition-colors cursor-pointer"
            title="Keluar"
          >
            <LogOut size={12} />
          </button>
        </div>
      </div>

      {/* Menu items navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {filteredMenuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-950/40 border border-emerald-300/40'
                  : 'hover:bg-white/10 text-emerald-100/90 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent size={14} className={isActive ? 'text-white' : 'text-emerald-300/90'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-teal-700/30 text-center text-[9px] text-emerald-200/60 bg-emerald-950/30">
        <div>SIM DIKDASMEN © 2026</div>
        <div className="text-emerald-300/50 mt-0.5">Kabupaten Klaten • Workspace</div>
      </div>
    </aside>
  );
}
