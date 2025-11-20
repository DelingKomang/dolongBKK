
import React, { useState, useMemo, useRef } from 'react';
import BkuTable from '../components/bku/BkuTable';
import type { BkuData } from '../types';
import Pagination from '../components/bku/Pagination';
import BkuFormModal from '../components/bku/BkuFormModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { Plus, Search, Download, Upload } from 'lucide-react';
import Notification from '../components/shared/Notification';

declare const XLSX: any;

interface BukuKasUmumProps {
  bkuData: BkuData[];
  onSubmit: (formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => void;
  onDelete: (id: string) => void;
}

const BukuKasUmum: React.FC<BukuKasUmumProps> = ({ bkuData, onSubmit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BkuData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 5;

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return bkuData;
    const lowerTerm = searchTerm.toLowerCase();
    return bkuData.filter(item => 
        item.uraian.toLowerCase().includes(lowerTerm) || 
        item.kode.toLowerCase().includes(lowerTerm)
    );
  }, [bkuData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    // Use filteredData instead of bkuData
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset to first page on search
  };
  
  const handleOpenModalForNew = () => {
      setEditingEntry(null);
      setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
      const entry = bkuData.find(item => item.id === id);
      if (entry) {
          setEditingEntry(entry);
          setIsModalOpen(true);
      }
  };
  
  const handleDeleteClick = (id: string) => {
      setDeletingId(id);
      setIsConfirmModalOpen(true);
  };
  
  const confirmDelete = () => {
    if (deletingId) {
      onDelete(deletingId);
    }
    setDeletingId(null);
    setIsConfirmModalOpen(false);
  };

  const handleFormSubmit = (formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => {
      onSubmit(formData, id);
      setIsModalOpen(false);
      setEditingEntry(null);
  };

  // --- EXCEL EXPORT ---
  const handleExport = () => {
      if (typeof XLSX === 'undefined') {
          setNotification({ message: 'Library Excel belum dimuat.', type: 'error' });
          return;
      }
      const dataToExport = bkuData.map(item => ({
          Tanggal: item.tanggal,
          Kode: item.kode,
          Kategori: item.kategori || '',
          Uraian: item.uraian,
          Penerimaan: item.penerimaan,
          Pengeluaran: item.pengeluaran,
          Saldo: item.saldo
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BukuKasUmum");
      XLSX.writeFile(wb, `BKU_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setNotification({ message: 'Data BKU berhasil diekspor.', type: 'success' });
  };

  // --- EXCEL IMPORT ---
  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (typeof XLSX === 'undefined') {
          setNotification({ message: 'Library Excel belum dimuat.', type: 'error' });
          return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const data = new Uint8Array(evt.target?.result as ArrayBuffer);
              const workbook = XLSX.read(data, { type: 'array', cellDates: true });
              const sheetName = workbook.SheetNames[0];
              const worksheet = workbook.Sheets[sheetName];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);

              let count = 0;
              jsonData.forEach((row: any) => {
                  // Basic validation
                  if (row['Tanggal'] && row['Uraian']) {
                      let dateStr = '';
                      if (row['Tanggal'] instanceof Date) {
                          dateStr = row['Tanggal'].toISOString().split('T')[0];
                      } else {
                           // Try to parse string or number date
                           const d = new Date(row['Tanggal']);
                           if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                      }

                      const newEntry: Omit<BkuData, 'id' | 'saldo'> = {
                          tanggal: dateStr || new Date().toISOString().split('T')[0],
                          kode: row['Kode'] || '00.00',
                          kategori: row['Kategori'] || '',
                          uraian: row['Uraian'] || '',
                          penerimaan: Number(row['Penerimaan']) || 0,
                          pengeluaran: Number(row['Pengeluaran']) || 0
                      };
                      onSubmit(newEntry);
                      count++;
                  }
              });
              setNotification({ message: `${count} data berhasil diimpor ke BKU.`, type: 'success' });

          } catch (error: any) {
              setNotification({ message: `Gagal impor: ${error.message}`, type: 'error' });
          }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-800 space-y-4">
      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-semibold text-white">Buku Kas Umum</h2>
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
            <div className="relative w-full sm:w-64">
                <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300"
              title="Export Excel"
            >
              <Download size={20} />
            </button>

             <button
              onClick={handleImportClick}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg transition-colors duration-300"
              title="Import Excel"
            >
              <Upload size={20} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

            <button
              onClick={handleOpenModalForNew}
              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Buat Data Baru</span>
            </button>
        </div>
      </div>

      <BkuTable data={paginatedData} onEdit={handleEdit} onDelete={handleDeleteClick} />
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages || 1}
        onPageChange={handlePageChange}
      />

      <BkuFormModal 
        isOpen={isModalOpen}
        onClose={() => {
            setIsModalOpen(false);
            setEditingEntry(null);
        }}
        onSubmit={handleFormSubmit}
        entryToEdit={editingEntry}
      />
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message="Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default BukuKasUmum;
