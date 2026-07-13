import React from 'react';
import { RotateCcw, Trash2, ShieldAlert, Archive } from 'lucide-react';

interface RecycleBinViewProps {
  recycleBin: any[];
  onRestore: (item: any) => void;
  onDeletePermanently: (recycleId: string) => void;
  onClearBin: () => void;
  isDarkMode: boolean;
}

export default function RecycleBinView({
  recycleBin,
  onRestore,
  onDeletePermanently,
  onClearBin,
  isDarkMode,
}: RecycleBinViewProps) {
  return (
    <div className={`rounded-xl border p-6 space-y-6 animate-fadeIn ${
      isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
    }`}>
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-1">
        <div>
          <h2 className={`text-base font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            Tempat Sampah (Recycle Bin)
          </h2>
          <p className={`text-[11px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-400'}`}>
            Menampilkan data yang baru saja dihapus. Anda dapat memulihkan (Restore) data kembali ke Google Sheets.
          </p>
        </div>

        {recycleBin.length > 0 && (
          <button
            onClick={onClearBin}
            className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
          >
            <Trash2 size={14} /> Kosongkan Tempat Sampah
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className={`overflow-x-auto border rounded-xl ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b text-slate-600 font-semibold ${isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-[#F8FAFC] border-slate-100'}`}>
              <th className="py-2.5 px-3 w-10 text-center text-[10px] font-bold uppercase tracking-wider">No</th>
              <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">Tabel Asal</th>
              <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">Identitas / Nama Record</th>
              <th className="py-2.5 px-3 text-[10px] font-bold uppercase tracking-wider">Tanggal Dihapus</th>
              <th className="py-2.5 px-3 text-center w-28 text-[10px] font-bold uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
            {recycleBin.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-400">
                  <Archive className="h-6 w-6 mx-auto text-slate-300 mb-2" />
                  Tempat sampah kosong. Belum ada data yang dihapus.
                </td>
              </tr>
            ) : (
              recycleBin.map((item, idx) => {
                const innerData = item.data || {};
                const nameToDisplay = innerData.name || innerData.title || innerData.skNumber || innerData.key || 'Unnamed Record';
                const idToDisplay = innerData.id || innerData.key || '';

                return (
                  <tr key={item.recycleId} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/20 text-slate-300' : 'hover:bg-slate-50/50 text-slate-700'}`}>
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-blue-500 uppercase">{item.originalTable}</td>
                    <td className="py-2.5 px-3 leading-tight font-medium">
                      <div className="font-bold text-[11px]">{nameToDisplay}</div>
                      <div className="text-[9px] text-slate-500 font-mono mt-0.5">ID: {idToDisplay}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 font-medium text-[11px]">{item.deletedAt}</td>
                    <td className="py-2.5 px-3 text-center flex items-center justify-center gap-2">
                      <button
                        onClick={() => onRestore(item)}
                        className="flex items-center gap-1 py-1 px-2 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 rounded font-bold transition-colors cursor-pointer"
                        title="Restore"
                      >
                        <RotateCcw size={10} /> Restore
                      </button>
                      <button
                        onClick={() => onDeletePermanently(item.recycleId)}
                        className="flex items-center gap-1 py-1 px-2 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 rounded font-bold transition-colors cursor-pointer"
                        title="Delete Permanently"
                      >
                        <Trash2 size={10} /> Hapus
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={`p-4 rounded-lg flex items-start gap-2 text-xs leading-relaxed ${
        isDarkMode ? 'bg-slate-900/30 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-100 text-slate-500'
      }`}>
        <ShieldAlert size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <span>
          <strong>Informasi Keamanan:</strong> Data di tempat sampah disimpan secara lokal di browser Anda. Jika Anda memulihkannya, data akan otomatis dikirim kembali dan disimpan di database cloud Google Spreadsheet Anda.
        </span>
      </div>
    </div>
  );
}
