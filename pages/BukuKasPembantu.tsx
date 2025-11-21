
import React, { useState, useMemo, useRef } from 'react';
import BkpTable from '../components/bkp/BkpTable';
import type { BkpData } from '../types';
import Pagination from '../components/bku/Pagination';
import BkpFormModal from '../components/bkp/BkpFormModal';
import BkpNotaEditModal from '../components/bkp/BkpNotaEditModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { Plus, Search, Download, Upload, Printer } from 'lucide-react';
import Notification from '../components/shared/Notification';

declare const XLSX: any;

interface BukuKasPembantuProps {
  bkpData: BkpData[];
  onSubmit: (formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => void;
  onDelete: (id: string) => void;
}

const BukuKasPembantu: React.FC<BukuKasPembantuProps> = ({ bkpData, onSubmit, onDelete }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Standard Modal (New / Edit Penerimaan)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  
  // State for Nota Edit Modal (Edit Pengeluaran)
  const [isNotaEditModalOpen, setIsNotaEditModalOpen] = useState(false);
  
  const [editingEntry, setEditingEntry] = useState<BkpData | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 5;

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return bkpData;
    const lowerTerm = searchTerm.toLowerCase();
    return bkpData.filter(item => 
        item.uraian.toLowerCase().includes(lowerTerm) || 
        item.bukti.toLowerCase().includes(lowerTerm) ||
        (item.kategori && item.kategori.toLowerCase().includes(lowerTerm))
    );
  }, [bkpData, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  // Get Unique Categories for Dropdowns
  const uniqueCategories = useMemo(() => {
      const cats = new Set<string>();
      bkpData.forEach(item => {
          if(item.kategori) cats.add(item.kategori);
      });
      return Array.from(cats).sort();
  }, [bkpData]);
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };
  
  const handleOpenModalForNew = () => {
      setEditingEntry(null);
      setIsFormModalOpen(true);
  };

  const handleEdit = (id: string) => {
      const entry = bkpData.find(item => item.id === id);
      if (entry) {
          setEditingEntry(entry);
          // Logic: If Kredit > 0 (Pengeluaran), open the Nota Edit Modal
          if (entry.kredit > 0) {
              setIsNotaEditModalOpen(true);
          } else {
              // If Debet > 0 (Penerimaan) or new/mixed, use standard form
              setIsFormModalOpen(true);
          }
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

  const handleFormSubmit = (formData: Omit<BkpData, 'id' | 'saldo'>, id?: string) => {
      onSubmit(formData, id);
      setIsFormModalOpen(false);
      setIsNotaEditModalOpen(false); // Close both potential modals
      setEditingEntry(null);
  };

  // --- EXCEL EXPORT ---
  const handleExport = () => {
      if (typeof XLSX === 'undefined') {
          setNotification({ message: 'Library Excel belum dimuat.', type: 'error' });
          return;
      }
      const dataToExport = bkpData.map(item => ({
          Tanggal: item.tanggal,
          Bukti: item.bukti,
          Kategori: item.kategori || '',
          Uraian: item.uraian,
          Debet: item.debet,
          Kredit: item.kredit,
          Saldo: item.saldo
      }));

      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "BukuKasPembantu");
      XLSX.writeFile(wb, `BKP_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setNotification({ message: 'Data BKP berhasil diekspor.', type: 'success' });
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
                  if (row['Tanggal'] && row['Uraian']) {
                      let dateStr = '';
                      if (row['Tanggal'] instanceof Date) {
                          dateStr = row['Tanggal'].toISOString().split('T')[0];
                      } else {
                           const d = new Date(row['Tanggal']);
                           if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                      }

                      const newEntry: Omit<BkpData, 'id' | 'saldo'> = {
                          tanggal: dateStr || new Date().toISOString().split('T')[0],
                          bukti: row['Bukti'] || 'Imported',
                          kategori: row['Kategori'] || '',
                          uraian: row['Uraian'] || '',
                          debet: Number(row['Debet']) || 0,
                          kredit: Number(row['Kredit']) || 0
                      };
                      onSubmit(newEntry);
                      count++;
                  }
              });
              setNotification({ message: `${count} data berhasil diimpor ke BKP.`, type: 'success' });

          } catch (error: any) {
              setNotification({ message: `Gagal impor: ${error.message}`, type: 'error' });
          }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
  };

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-800 space-y-4" id="printable-area">
      {notification && (
         <div className="no-print">
            <Notification {...notification} onClose={() => setNotification(null)} />
         </div>
      )}
      
       {/* Print Only Header */}
       <div className="hidden print:block text-center mb-8 text-black border-b border-black pb-4">
            <h2 className="text-xl font-bold uppercase">BUKU KAS PEMBANTU (BKP)</h2>
            <p className="text-sm">Desa Adat Bacol Bigalow</p>
            <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
        <h2 className="text-xl font-semibold text-white">Buku Kas Pembantu</h2>
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
              <span className="hidden sm:inline">Buat Data BKP Baru</span>
            </button>
        </div>
      </div>

      <BkpTable data={paginatedData} onEdit={handleEdit} onDelete={handleDeleteClick} />
      
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print pt-4 border-t border-gray-800">
        <div className="w-full sm:w-auto">
            <Pagination
                currentPage={currentPage}
                totalPages={totalPages || 1}
                onPageChange={handlePageChange}
            />
        </div>
         <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300 shadow-lg"
        >
            <Printer size={18} />
            <span>Cetak BKP</span>
        </button>
      </div>

      <div className="no-print">
        <BkpFormModal 
            isOpen={isFormModalOpen}
            onClose={() => {
                setIsFormModalOpen(false);
                setEditingEntry(null);
            }}
            onSubmit={handleFormSubmit}
            entryToEdit={editingEntry}
            existingCategories={uniqueCategories}
        />
      </div>
      
      {/* Special Modal for Editing Expenses (Nota style) */}
      <div className="no-print">
        {editingEntry && (
            <BkpNotaEditModal 
                isOpen={isNotaEditModalOpen}
                onClose={() => {
                    setIsNotaEditModalOpen(false);
                    setEditingEntry(null);
                }}
                onSubmit={handleFormSubmit}
                entry={editingEntry}
                existingCategories={uniqueCategories}
            />
        )}
      </div>
      
      <div className="no-print">
        <ConfirmationModal
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={confirmDelete}
            title="Konfirmasi Hapus"
            message="Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini tidak dapat dibatalkan."
        />
      </div>
    </div>
  );
};

export default BukuKasPembantu;
