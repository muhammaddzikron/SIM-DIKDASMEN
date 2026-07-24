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
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col border-r border-slate-800 shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <img 
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRP5MZnPQfHQJ-iyzCfpVwYvy015zX_XJyvJUAAoMWLpf15sJSkm0lqh4M&s=10" 
          alt="Logo SIM DIKDASMEN" 
          className="w-9 h-9 object-contain rounded-lg bg-white p-0.5 shrink-0"
          referrerPolicy="no-referrer"
        />
        <div>
          <h2 className="font-bold text-white tracking-tight text-sm leading-none">SIM DIKDASMEN</h2>
          <p className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">Kabupaten Klaten</p>
        </div>
      </div>

      {/* User Information Profile summary */}
      <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/20">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs uppercase shrink-0 border border-blue-500/10">
            {userName ? userName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate leading-none">{userName || 'User'}</h4>
            <p className="text-[10px] text-slate-500 truncate mt-1">{userEmail}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between">
          <span className="bg-blue-500/10 text-blue-400 text-[9px] font-bold px-2 py-0.5 rounded border border-blue-500/20">
            {userRole}
          </span>
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
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
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'hover:bg-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <IconComponent size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-800 text-center text-[9px] text-slate-500 bg-slate-950/10">
        <div>SIM DIKDASMEN © 2026</div>
        <div className="text-slate-600 mt-0.5">Kabupaten Klaten • Workspace</div>
      </div>
    </aside>
  );
}
