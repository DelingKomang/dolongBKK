
import React, { useState, useMemo, useRef } from 'react';
import BkuTable from '../components/bku/BkuTable';
import type { BkuData } from '../types';
import Pagination from '../components/bku/Pagination';
import BkuFormModal from '../components/bku/BkuFormModal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import { Plus, Search, Download, Upload, Printer } from 'lucide-react';
import Notification from '../components/shared/Notification';

declare const XLSX: any;

interface BukuKasUmumProps {
  bkuData: BkuData[];
  onSubmit: (formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => void;
  onDelete: (id: string) => void;
  onReplace: (data: BkuData[]) => void;
}

const BukuKasUmum: React.FC<BukuKasUmumProps> = ({ bkuData, onSubmit, onDelete, onReplace }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BkuData | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Import state
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
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
      if (file) {
          setPendingFile(file);
          setIsImportConfirmOpen(true);
      }
      e.target.value = '';
  };

  const confirmImport = () => {
      if (!pendingFile) return;

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

              const newEntries: BkuData[] = [];
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

                      const newEntry: BkuData = {
                          id: `bku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                          tanggal: dateStr || new Date().toISOString().split('T')[0],
                          kode: row['Kode'] || '00.00',
                          kategori: row['Kategori'] || '',
                          uraian: row['Uraian'] || '',
                          penerimaan: Number(row['Penerimaan']) || 0,
                          pengeluaran: Number(row['Pengeluaran']) || 0,
                          saldo: 0 // Will be recalculated
                      };
                      newEntries.push(newEntry);
                  }
              });
              
              if(newEntries.length > 0) {
                  onReplace(newEntries);
                  setNotification({ message: `${newEntries.length} data berhasil diimpor dan menggantikan data lama.`, type: 'success' });
              } else {
                  setNotification({ message: 'Tidak ada data valid ditemukan dalam file Excel.', type: 'error' });
              }

          } catch (error: any) {
              setNotification({ message: `Gagal impor: ${error.message}`, type: 'error' });
          } finally {
              setIsImportConfirmOpen(false);
              setPendingFile(null);
          }
      };
      reader.readAsArrayBuffer(pendingFile);
  };

  const handlePrint = () => {
      window.print();
  };

  const printStyles = `
      @media print {
        @page {
            size: landscape;
            margin: 10mm;
        }
        body * {
            visibility: hidden;
        }
        html, body, #root {
            height: auto !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
        }
        #printable-area {
            visibility: visible;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background-color: white !important;
            color: black !important;
            display: block !important;
        }
        #printable-area * {
            visibility: visible;
        }
        
        /* Hide Non-Print elements */
        .no-print {
            display: none !important;
        }

        /* Typography & Colors Overrides */
        .text-white, .text-gray-300, .text-gray-400, .text-blue-200, .text-gray-500, .text-green-400, .text-red-400, .text-sky-400, .text-teal-400 {
            color: black !important;
        }
        .bg-gray-900, .bg-gray-800, .bg-gray-700, .bg-gray-800\/50, .bg-blue-900\/20 {
            background-color: transparent !important;
            border: none !important;
            color: black !important;
            box-shadow: none !important;
        }
        .border-gray-800, .border-gray-700, .border-blue-800 {
            border-color: #000 !important;
        }
        
        /* Table Specifics */
        table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 10px;
        }
        th, td {
            border: 1px solid black !important;
            padding: 4px 6px !important;
            color: black !important;
        }
        thead th {
             background-color: #f3f4f6 !important;
             -webkit-print-color-adjust: exact;
             color: black !important;
        }
        tr {
            page-break-inside: avoid;
        }
        
        .overflow-x-auto {
            overflow: visible !important;
        }
        
        /* Signatures */
        .signature-section {
            display: flex !important;
            justify-content: space-between;
            margin-top: 30px;
            page-break-inside: avoid;
        }
      }
    `;

  return (
    <div className="bg-gray-900 p-4 sm:p-6 rounded-lg shadow-xl border border-gray-800 space-y-4" id="printable-area">
      <style>{printStyles}</style>
      {notification && (
        <div className="no-print">
            <Notification {...notification} onClose={() => setNotification(null)} />
        </div>
      )}
      
      {/* Print Only Header */}
      <div className="hidden print:block text-center mb-6 text-black border-b border-black pb-4">
            <h2 className="text-xl font-bold uppercase">BUKU KAS UMUM (BKU)</h2>
            <p className="text-sm">Desa Adat Bacol Bigalow</p>
            <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 no-print">
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
            <span>Cetak BKU</span>
        </button>
      </div>
      
      {/* Signature Section for Print */}
      <div className="hidden signature-section text-black text-sm">
          <div className="text-center w-1/3">
              <p>Mengetahui,</p>
              <p className="mb-16">Bendesa Adat</p>
              <p className="font-bold underline">Gusde Bacol</p>
          </div>
          <div className="text-center w-1/3">
              <p>Basangalas, {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p className="mb-16">Juru Raksa</p>
              <p className="font-bold underline">I Gede Bentar</p>
          </div>
      </div>

      <div className="no-print">
        <BkuFormModal 
            isOpen={isModalOpen}
            onClose={() => {
                setIsModalOpen(false);
                setEditingEntry(null);
            }}
            onSubmit={handleFormSubmit}
            entryToEdit={editingEntry}
        />
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

       {/* Import Confirmation Modal */}
       <div className="no-print">
        <ConfirmationModal
            isOpen={isImportConfirmOpen}
            onClose={() => { setIsImportConfirmOpen(false); setPendingFile(null); }}
            onConfirm={confirmImport}
            title="Konfirmasi Impor Data"
            message="Apakah Anda yakin ingin mengimpor data ini? Tindakan ini akan MENGGANTIKAN semua data BKU yang ada saat ini. Pastikan Anda telah mem-backup data sebelumnya jika diperlukan."
        />
      </div>
    </div>
  );
};

export default BukuKasUmum;
