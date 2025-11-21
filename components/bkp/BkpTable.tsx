
import React from 'react';
import { BkpData } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatter';
import { Pencil, Trash2 } from 'lucide-react';

interface BkpTableProps {
  data: BkpData[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const BkpTable: React.FC<BkpTableProps> = ({ data, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left text-gray-400">
        <thead className="text-xs text-gray-300 uppercase bg-gray-800">
          <tr>
            <th scope="col" className="px-4 py-3">Tanggal</th>
            <th scope="col" className="px-4 py-3">Bukti Transaksi</th>
            <th scope="col" className="px-4 py-3">Uraian</th>
            <th scope="col" className="px-4 py-3">Kategori</th>
            <th scope="col" className="px-4 py-3 text-right">Debet (Penerimaan)</th>
            <th scope="col" className="px-4 py-3 text-right">Kredit (Pengeluaran)</th>
            <th scope="col" className="px-4 py-3 text-right">Saldo</th>
            <th scope="col" className="px-4 py-3 text-center no-print">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50 align-top">
              <td className="px-4 py-4 whitespace-nowrap">{formatDate(item.tanggal)}</td>
              <td className="px-4 py-4">{item.bukti}</td>
              <td className="px-4 py-4 text-white" style={{ wordBreak: 'break-word', minWidth: '250px', whiteSpace: 'normal' }}>{item.uraian}</td>
              <td className="px-4 py-4">
                <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs border border-gray-700">
                    {item.kategori || '-'}
                </span>
              </td>
              <td className="px-4 py-4 text-right text-green-400">{formatCurrency(item.debet)}</td>
              <td className="px-4 py-4 text-right text-red-400">{formatCurrency(item.kredit)}</td>
              <td className="px-4 py-4 text-right text-white font-medium">{formatCurrency(item.saldo)}</td>
              <td className="px-4 py-4 text-center no-print">
                 <div className="flex justify-center items-center gap-2">
                    <button onClick={() => onEdit(item.id)} className="text-sky-400 hover:text-sky-300 p-1 rounded-md hover:bg-sky-500/10 transition-colors" title="Edit">
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-300 p-1 rounded-md hover:bg-red-500/10 transition-colors" title="Hapus">
                        <Trash2 size={16} />
                    </button>
                 </div>
              </td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center py-8 text-gray-500">
                Tidak ada data.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default BkpTable;
