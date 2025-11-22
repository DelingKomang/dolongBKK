
import React, { useState, useMemo, useRef } from 'react';
import type { JuDisplayRow } from '../types';
import { numberToWords, formatDate } from '../utils/formatter';
import Modal from '../components/shared/Modal';
import ConfirmationModal from '../components/shared/ConfirmationModal';
import Spinner from '../components/shared/Spinner';
import Notification from '../components/shared/Notification';
import { Plus, Search, ChevronLeft, ChevronRight, Upload, Download, Printer } from 'lucide-react';

declare const XLSX: any;

const JU_COLUMNS = [
    { key: 'date', label: 'Tanggal' },
    { key: 'idTransaksi', label: 'ID Transaksi' },
    { key: 'kodeRekening', label: 'Kode Rekening' },
    { key: 'uraian', label: 'Uraian' },
    { key: 'debet', label: 'Debet (Rp)' },
    { key: 'kredit', label: 'Kredit (Rp)' },
];

const ITEMS_PER_PAGE = 9;

interface JurnalUmumProps {
    entries: JuDisplayRow[];
    setEntries: React.Dispatch<React.SetStateAction<JuDisplayRow[]>>;
}

const JurnalUmum: React.FC<JurnalUmumProps> = ({ entries, setEntries }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setModalOpen] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    // Import state
    const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const importFileRef = useRef<HTMLInputElement>(null);
    
    // Form State
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formKodeRekening, setFormKodeRekening] = useState('');
    const [formUraianDebet, setFormUraianDebet] = useState('');
    const [formUraianKredit, setFormUraianKredit] = useState('');
    const [formAmount, setFormAmount] = useState<number | ''>('');
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    
    const filteredEntries = useMemo(() => {
        if (!searchTerm) return entries;
        const transactionIds = new Set<string>();
        entries.forEach(entry => {
             if (entry.idTransaksi && (
                entry.idTransaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.uraian.toLowerCase().includes(searchTerm.toLowerCase()) ||
                entry.kodeRekening?.toLowerCase().includes(searchTerm.toLowerCase())
            )) {
                transactionIds.add(entry.idTransaksi);
            }
        });
        return entries.filter(entry => entry.idTransaksi && transactionIds.has(entry.idTransaksi));
    }, [entries, searchTerm]);

    const pageCount = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE) || 1;

    const paginatedEntries = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEntries.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredEntries, currentPage]);
    
    const clearForm = () => {
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormKodeRekening('');
        setFormUraianDebet('');
        setFormUraianKredit('');
        setFormAmount('');
    };

    const handleOpenModal = () => {
        clearForm();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setModalOpen(true);
        }, 500);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = Number(formAmount) || 0;
        if (amount <= 0 || !formUraianDebet || !formUraianKredit || !formKodeRekening) {
            setNotification({ message: 'Harap lengkapi semua field.', type: 'error' });
            return;
        }

        const date = new Date(formDate);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dailyCount = entries.filter(tx => tx.date === formDate && tx.rowType === 'debet').length + 1;
        const idTransaksi = `JU-${month}${day}-${String(dailyCount).padStart(3, '0')}`;
        
        const newDebetRow: JuDisplayRow = {
            rowId: `${idTransaksi}-1`, idTransaksi, date: formDate, kodeRekening: formKodeRekening, uraian: formUraianDebet, debet: amount, kredit: 0, rowType: 'debet'
        };
        const newKreditRow: JuDisplayRow = {
            rowId: `${idTransaksi}-2`, idTransaksi, uraian: formUraianKredit, debet: 0, kredit: amount, rowType: 'kredit'
        };
        const newMemoRow: JuDisplayRow = {
            rowId: `${idTransaksi}-3`, idTransaksi, uraian: `(Pencatatan ${formUraianDebet})`, debet: 0, kredit: 0, rowType: 'memo'
        };
        
        const newEntries = [...entries, newDebetRow, newKreditRow, newMemoRow];
        setEntries(newEntries);
        setModalOpen(false);
        setNotification({ message: 'Jurnal baru berhasil disimpan.', type: 'success' });
        
        const newTotalPages = Math.ceil(newEntries.length / ITEMS_PER_PAGE);
        setCurrentPage(newTotalPages);
    };
    
     const handleExport = () => {
        if (typeof XLSX === 'undefined') {
             setNotification({ message: 'Library Excel belum dimuat.', type: 'error' });
             return;
        }

        if(filteredEntries.length === 0) {
            setNotification({ message: 'Tidak ada data untuk diekspor.', type: 'info' });
            return;
        }
        const dataToExport = filteredEntries.map(entry => ({
            Tanggal: entry.date || '',
            'ID Transaksi': entry.idTransaksi || '',
            'Kode Rekening': entry.kodeRekening || '',
            Uraian: entry.uraian,
            Debet: entry.debet,
            Kredit: entry.kredit
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "JurnalUmum");
        XLSX.writeFile(workbook, `Export_JU_${new Date().toISOString().split('T')[0]}.xlsx`);
        setNotification({ message: 'Data Jurnal berhasil diekspor.', type: 'success' });
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setPendingFile(file);
            setIsImportConfirmOpen(true);
        }
        event.target.value = '';
    };

    const confirmImport = () => {
         if (!pendingFile) return;
         if (typeof XLSX === 'undefined') {
             setNotification({ message: 'Library Excel belum dimuat.', type: 'error' });
             return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet);

                const newRows: JuDisplayRow[] = [];
                json.forEach((row, index) => {
                    const requiredCols = ['Tanggal', 'Kode Rekening', 'Uraian Debet', 'Uraian Kredit', 'Jumlah'];
                    for (const col of requiredCols) {
                        if (!row[col]) throw new Error(`Baris ${index + 2}: Kolom '${col}' tidak ditemukan atau kosong.`);
                    }
                    
                    const date = new Date(row['Tanggal']);
                    const dateStr = date.toISOString().split('T')[0];
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dailyCount = (index + 1); // Reset counter logic if replacing
                    const idTransaksi = `JU-${month}${day}-${String(dailyCount).padStart(3, '0')}`;
                    const amount = Number(row['Jumlah']);
                    const uraianDebet = String(row['Uraian Debet']);

                    newRows.push({ rowId: `${idTransaksi}-1`, idTransaksi, date: dateStr, kodeRekening: String(row['Kode Rekening']), uraian: uraianDebet, debet: amount, kredit: 0, rowType: 'debet' });
                    newRows.push({ rowId: `${idTransaksi}-2`, idTransaksi, uraian: String(row['Uraian Kredit']), debet: 0, kredit: amount, rowType: 'kredit' });
                    newRows.push({ rowId: `${idTransaksi}-3`, idTransaksi, uraian: `(Pencatatan ${uraianDebet})`, debet: 0, kredit: 0, rowType: 'memo' });
                });
                
                if(newRows.length > 0) {
                     setEntries(newRows);
                     setNotification({ message: `${json.length} jurnal berhasil diimpor dan menggantikan data lama.`, type: 'success' });
                } else {
                     setNotification({ message: 'Tidak ada data valid ditemukan.', type: 'error' });
                }

            } catch (error: any) {
                setNotification({ message: `Gagal mengimpor file: ${error.message}`, type: 'error' });
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

    const formatCurrency = (amount: number) => {
        return amount > 0 ? new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0
        }).format(amount) : '-';
    };

    const terbilang = (num: number) => numberToWords(num) + ' Rupiah';

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
            {isLoading && <Spinner />}
            {notification && (
                <div className="no-print">
                    <Notification {...notification} onClose={() => setNotification(null)} />
                </div>
            )}
            <input type="file" ref={importFileRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

            {/* Print Only Header */}
            <div className="hidden print:block text-center mb-6 text-black border-b border-black pb-4">
                 <h2 className="text-xl font-bold uppercase">Buku Jurnal Umum</h2>
                 <p className="text-sm">Desa Adat Bacol Bigalow</p>
                 <p className="text-xs mt-1">Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 no-print">
                <div>
                    <h2 className="text-2xl font-bold text-white">Jurnal Umum</h2>
                    <p className="text-gray-400">Catatan kronologis semua transaksi keuangan.</p>
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                    <button onClick={handleOpenModal} className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md">
                        <Plus className="w-5 h-5"/> <span>Buat Jurnal Baru</span>
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 no-print">
                 <p className="text-sm text-gray-400 hidden sm:block">
                    <span className="font-semibold text-sky-400">Tip Impor:</span> Kolom Excel: Tanggal, Kode Rekening, Uraian Debet, Uraian Kredit, Jumlah.
                </p>
                <div className="relative w-full sm:w-64">
                    <input type="text" placeholder="Cari di Jurnal..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                        <tr>
                            {JU_COLUMNS.map(col => (
                                <th key={col.key} scope="col" className="px-6 py-3">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedEntries.length === 0 ? (
                            <tr className="bg-gray-900 border-b border-gray-800">
                                <td colSpan={JU_COLUMNS.length} className="px-6 py-12 text-center text-gray-500">
                                    <p className="font-semibold text-lg">Tidak Ada Data Jurnal</p>
                                    <p className="mt-1">Silakan buat jurnal baru untuk memulai pencatatan.</p>
                                </td>
                            </tr>
                        ) : (
                             paginatedEntries.map(entry => (
                                <tr key={entry.rowId} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">{entry.rowType === 'debet' ? formatDate(entry.date!) : ''}</td>
                                    <td className="px-6 py-4">{entry.rowType === 'debet' ? entry.idTransaksi : ''}</td>
                                    <td className="px-6 py-4">{entry.rowType === 'debet' ? entry.kodeRekening : ''}</td>
                                    <td className={`px-6 py-4 font-medium ${entry.rowType === 'kredit' ? 'pl-12 text-gray-300' : 'text-white'} ${entry.rowType === 'memo' ? 'italic text-gray-500' : ''}`}>
                                       <div className="min-w-[200px] break-words">{entry.uraian}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right text-green-400">{entry.debet > 0 ? formatCurrency(entry.debet) : '-'}</td>
                                    <td className="px-6 py-4 text-right text-red-400">{entry.kredit > 0 ? formatCurrency(entry.kredit) : '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 no-print">
                 <div className="flex gap-2 order-2 sm:order-1">
                    <button onClick={() => importFileRef.current?.click()} className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-md text-sm">
                        <Upload className="w-4 h-4"/> <span>Impor Excel</span>
                    </button>
                    <button onClick={handlePrint} className="flex items-center justify-center gap-2 bg-teal-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors shadow-md text-sm">
                        <Printer className="w-4 h-4"/> <span>Cetak</span>
                    </button>
                    <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md text-sm">
                        <Download className="w-4 h-4"/> <span>Ekspor Excel</span>
                    </button>
                </div>

                <div className="flex items-center gap-4 order-1 sm:order-2">
                    <span className="text-sm text-gray-400">Halaman {currentPage} dari {pageCount}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 text-white"><ChevronLeft className="w-5 h-5"/></button>
                        <span className="font-semibold text-white px-2">{currentPage}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(pageCount, p + 1))} disabled={currentPage === pageCount} className="p-2 bg-gray-800 rounded-md hover:bg-gray-700 disabled:opacity-50 text-white"><ChevronRight className="w-5 h-5"/></button>
                    </div>
                </div>
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
                <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title="Jurnal Umum">
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-1">Tanggal Transaksi</label>
                            <input type="date" id="date" value={formDate} onChange={e => setFormDate(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"/>
                            </div>
                            <div>
                                <label htmlFor="id" className="block text-sm font-medium text-gray-300 mb-1">ID Transaksi (Otomatis)</label>
                                <input type="text" id="id" value={`JU-${formDate.substring(5,7)}${formDate.substring(8,10)}-...`} readOnly className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-500 rounded-lg cursor-not-allowed"/>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="kodeRekening" className="block text-sm font-medium text-gray-300 mb-1">Kode Rekening</label>
                            <input type="text" id="kodeRekening" value={formKodeRekening} onChange={e => setFormKodeRekening(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., 5.1.2.03"/>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                            <label htmlFor="uraianDebet" className="block text-sm font-medium text-gray-300 mb-1">Uraian Debet</label>
                            <input type="text" id="uraianDebet" value={formUraianDebet} onChange={e => setFormUraianDebet(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., Beban Gaji"/>
                            </div>
                            <div>
                            <label htmlFor="uraianKredit" className="block text-sm font-medium text-gray-300 mb-1">Uraian Kredit</label>
                            <input type="text" id="uraianKredit" value={formUraianKredit} onChange={e => setFormUraianKredit(e.target.value)} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="e.g., Kas di Kas Daerah"/>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="debet" className="block text-sm font-medium text-gray-300 mb-1">Debet (Rp)</label>
                                <input type="number" id="debet" value={formAmount} onChange={e => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="0"/>
                            </div>
                            <div>
                                <label htmlFor="kredit" className="block text-sm font-medium text-gray-300 mb-1">Kredit (Rp)</label>
                                <input type="number" id="kredit" value={formAmount} readOnly className="w-full px-3 py-2 bg-gray-800 border border-gray-700 text-gray-500 rounded-lg cursor-not-allowed" placeholder="0"/>
                            </div>
                        </div>
                        
                        <div>
                            {Number(formAmount) > 0 && <p className="text-sm text-teal-400 mt-1 italic">{terbilang(Number(formAmount))}</p>}
                        </div>

                        <div className="p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                            <p className="text-sm font-semibold text-gray-300">Preview Pencatatan:</p>
                            <p className="text-sm text-white italic">{` (Pencatatan ${formUraianDebet || '...'})`}</p>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm">Simpan Jurnal</button>
                        </div>
                    </form>
                </Modal>
            </div>

             {/* Import Confirmation Modal */}
            <div className="no-print">
                <ConfirmationModal
                    isOpen={isImportConfirmOpen}
                    onClose={() => { setIsImportConfirmOpen(false); setPendingFile(null); }}
                    onConfirm={confirmImport}
                    title="Konfirmasi Impor Data"
                    message="Apakah Anda yakin ingin mengimpor data ini? Tindakan ini akan MENGGANTIKAN semua data Jurnal Umum yang ada saat ini. Pastikan Anda telah mem-backup data sebelumnya jika diperlukan."
                />
            </div>
        </div>
    );
};

export default JurnalUmum;
