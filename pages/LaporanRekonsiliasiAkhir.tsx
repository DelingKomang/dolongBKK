
import React, { useState, useMemo } from 'react';
import type { BkuTransaction, BudgetItem } from '../types';
import Modal from '../components/shared/Modal';
import Notification from '../components/shared/Notification';
import { Plus, Pencil, Trash2, AlertCircle, Printer } from 'lucide-react';
import { numberToWords } from '../utils/formatter';

interface LaporanRekonsiliasiAkhirProps {
    bkuTransactions: BkuTransaction[];
    budgetItems: BudgetItem[];
    setBudgetItems: React.Dispatch<React.SetStateAction<BudgetItem[]>>;
}

interface ReportRow {
    id: string;
    kode: string;
    uraian: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
    isAuto?: boolean; // Flag to indicate if this row came from BKU automatically
}

const LaporanRekonsiliasiAkhir: React.FC<LaporanRekonsiliasiAkhirProps> = ({ bkuTransactions, budgetItems, setBudgetItems }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
    const [modalType, setModalType] = useState<'pendapatan' | 'belanja'>('pendapatan');
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Form state
    const [formKategori, setFormKategori] = useState('');
    const [formJumlah, setFormJumlah] = useState<number | ''>('');

    const reportYear = useMemo(() => {
        if (bkuTransactions.length === 0) {
            return new Date().getFullYear();
        }
        const latestDate = bkuTransactions.reduce((latest, tx) => {
            const txDate = new Date(tx.tanggal);
            return txDate > latest ? txDate : latest;
        }, new Date(0));
        return latestDate.getFullYear();
    }, [bkuTransactions]);

    const { pendapatanData, belanjaData, totalPendapatan, totalBelanja, surplusDefisit } = useMemo(() => {
        // 1. Calculate Realization for ALL categories present in BKU
        const realizationMap = {
            pendapatan: {} as Record<string, number>,
            belanja: {} as Record<string, number>
        };
        
        bkuTransactions.forEach(tx => {
            const category = tx.kategori || 'Tanpa Kategori';
            if (tx.penerimaan > 0) {
                 realizationMap.pendapatan[category] = (realizationMap.pendapatan[category] || 0) + tx.penerimaan;
            }
            if (tx.pengeluaran > 0) {
                 realizationMap.belanja[category] = (realizationMap.belanja[category] || 0) + tx.pengeluaran;
            }
        });

        // 2. Function to merge Budget Items + Unbudgeted Realized Items
        const generateRows = (type: 'pendapatan' | 'belanja'): ReportRow[] => {
            const rows: ReportRow[] = [];
            const processedCategories = new Set<string>();

            // A. Add Existing Budget Items
            budgetItems
                .filter(item => item.type === type)
                .forEach(item => {
                    const categoryName = item.uraian;
                    const realisasi = realizationMap[type][categoryName] || 0;
                    rows.push({
                        id: item.id,
                        kode: item.kode,
                        uraian: categoryName,
                        anggaran: item.jumlah,
                        realisasi: realisasi,
                        persentase: item.jumlah > 0 ? (realisasi / item.jumlah) * 100 : 0,
                        isAuto: false
                    });
                    processedCategories.add(categoryName);
                });

            // B. Add Automatic Items (Exist in BKU but not in Budget)
            Object.entries(realizationMap[type]).forEach(([category, amount]) => {
                if (!processedCategories.has(category) && amount > 0) {
                    rows.push({
                        id: `auto-${type}-${category}`, // Temporary ID
                        kode: category,
                        uraian: category,
                        anggaran: 0, // No budget yet
                        realisasi: amount,
                        persentase: 0, // 0 budget
                        isAuto: true
                    });
                }
            });

            // Sort alphabetically
            return rows.sort((a, b) => a.uraian.localeCompare(b.uraian));
        };

        const pendapatanData = generateRows('pendapatan');
        const belanjaData = generateRows('belanja');

        // 3. Calculate Totals
        const createTotal = (data: ReportRow[], type: 'pendapatan' | 'belanja') => data.reduce((acc, item) => ({
            id: `total-${type}`,
            kode: '',
            uraian: `Total ${type === 'pendapatan' ? 'Pendapatan' : 'Belanja'}`,
            anggaran: acc.anggaran + item.anggaran,
            realisasi: acc.realisasi + item.realisasi,
            persentase: 0,
            isAuto: false
        }), { id: '', kode: '', uraian: '', anggaran: 0, realisasi: 0, persentase: 0, isAuto: false });
        
        const totalPendapatan = createTotal(pendapatanData, 'pendapatan');
        if (totalPendapatan.anggaran > 0) {
            totalPendapatan.persentase = (totalPendapatan.realisasi / totalPendapatan.anggaran) * 100;
        }

        const totalBelanja = createTotal(belanjaData, 'belanja');
        if(totalBelanja.anggaran > 0) {
            totalBelanja.persentase = (totalBelanja.realisasi / totalBelanja.anggaran) * 100;
        }

        const surplusDefisit = {
            id: 'surplus',
            kode: '',
            uraian: 'Surplus / (Defisit)',
            anggaran: totalPendapatan.anggaran - totalBelanja.anggaran,
            realisasi: totalPendapatan.realisasi - totalBelanja.realisasi,
            persentase: 0,
            isAuto: false
        };

        return { pendapatanData, belanjaData, totalPendapatan, totalBelanja, surplusDefisit };
    }, [bkuTransactions, budgetItems]);

    // Dropdown options
    const pendapatanKategoriOptions = useMemo(() => {
        const catSet = new Set<string>();
        bkuTransactions.filter(tx => tx.penerimaan > 0).forEach(tx => { if(tx.kategori) catSet.add(tx.kategori); });
        return Array.from(catSet).sort();
    }, [bkuTransactions]);

    const belanjaKategoriOptions = useMemo(() => {
        const catSet = new Set<string>();
        bkuTransactions.filter(tx => tx.pengeluaran > 0).forEach(tx => { if(tx.kategori) catSet.add(tx.kategori); });
        return Array.from(catSet).sort();
    }, [bkuTransactions]);


    const clearForm = () => {
        setFormKategori('');
        setFormJumlah('');
        setEditingItem(null);
    };

    const handleOpenModal = (type: 'pendapatan' | 'belanja', rowData: ReportRow | null = null) => {
        setModalType(type);
        if (rowData) {
            // Construct a BudgetItem-like object even if it's an auto-row
            const itemToEdit: BudgetItem = {
                id: rowData.id,
                kode: rowData.kode,
                uraian: rowData.uraian,
                jumlah: rowData.anggaran,
                type: type
            };
            setEditingItem(itemToEdit);
            setFormKategori(itemToEdit.uraian);
            setFormJumlah(itemToEdit.jumlah);
        } else {
            clearForm();
        }
        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!formKategori || formJumlah === '') {
            setNotification({ message: 'Semua field harus diisi.', type: 'error' });
            return;
        }

        // Determine if we are updating an existing real item, or creating a new one (from scratch or from auto-row)
        const isRealUpdate = editingItem && !editingItem.id.startsWith('auto-');

        if (isRealUpdate && editingItem) {
            // Update existing BudgetItem
            setBudgetItems(prev => prev.map(item => 
                item.id === editingItem.id 
                ? { ...item, kode: formKategori, uraian: formKategori, jumlah: Number(formJumlah) }
                : item
            ));
             setNotification({ message: 'Anggaran berhasil diperbarui.', type: 'success' });
        } else {
            // Create new BudgetItem (either brand new or converting an auto-row to real)
            const newItem: BudgetItem = {
                id: `${modalType}-${Date.now()}`,
                kode: formKategori, 
                uraian: formKategori, 
                jumlah: Number(formJumlah),
                type: modalType
            };
            setBudgetItems(prev => [...prev, newItem]);
            setNotification({ message: 'Anggaran berhasil ditambahkan.', type: 'success' });
        }
        
        setIsModalOpen(false);
    };
    
    const handleDelete = (idToDelete: string) => {
        if(idToDelete.startsWith('auto-')) {
            setNotification({ message: 'Item otomatis tidak dapat dihapus, hanya disembunyikan jika tidak ada transaksi.', type: 'error' });
            return;
        }
        if(window.confirm('Apakah Anda yakin ingin menghapus item anggaran ini?')) {
            setBudgetItems(currentBudgetItems => 
                currentBudgetItems.filter(item => item.id !== idToDelete)
            );
            setNotification({ message: 'Item anggaran telah dihapus.', type: 'success' });
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // Robust Styles for Printing
    const printStyles = `
      @media print {
        @page {
            size: auto;
            margin: 15mm;
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
        .text-white, .text-gray-300, .text-gray-400, .text-blue-200, .text-gray-500 {
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

        /* Remove badges backgrounds */
        [class*="bg-"] {
            background-color: transparent !important;
        }
        
        /* Table Specifics */
        table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 12px;
        }
        th, td {
            border: 1px solid black !important;
            padding: 4px 8px !important;
            color: black !important;
        }
        thead {
            display: table-header-group;
        }
        thead th {
             background-color: #f3f4f6 !important;
             -webkit-print-color-adjust: exact;
        }
        tfoot {
            display: table-footer-group;
        }
        tr {
            page-break-inside: avoid;
        }
        
        /* Layout resets */
        .overflow-x-auto {
            overflow: visible !important;
        }
        
        /* Signatures */
        .signature-section {
            page-break-inside: avoid;
            margin-top: 40px;
        }
      }
    `;

    const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    const terbilang = (num: number) => numberToWords(num) + ' Rupiah';

    const ReportTable: React.FC<{ title: string; data: ReportRow[]; total: ReportRow; type: 'pendapatan' | 'belanja' }> = ({ title, data, total, type }) => (
        <div className="mb-8">
            <div className="flex justify-between items-center mb-2 no-print">
                 <h3 className="text-lg font-bold text-white">{title}</h3>
                 <button onClick={() => handleOpenModal(type)} className="flex items-center gap-2 bg-sky-600 text-white font-semibold px-3 py-1 rounded-lg hover:bg-sky-700 transition-colors shadow-sm text-sm">
                    <Plus className="w-4 h-4"/>
                    <span>Buat Anggaran {type === 'pendapatan' ? 'Pendapatan' : 'Belanja'}</span>
                </button>
            </div>
            <h3 className="text-lg font-bold text-black hidden print:block mb-2">{title}</h3>
            
            <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-400">
                <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                    <tr>
                        <th className="px-4 py-3 w-[35%]">Kategori Anggaran</th>
                        <th className="px-4 py-3 text-right">Anggaran (A)</th>
                        <th className="px-4 py-3 text-right">Realisasi (R)</th>
                        <th className="px-4 py-3 text-right">% (R/A)</th>
                        <th className="px-4 py-3 text-center no-print">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="bg-gray-800/50 font-semibold text-white"><td className="px-4 py-2" colSpan={5}>{type === 'belanja' ? 'II. BELANJA' : 'I. PENDAPATAN'}</td></tr>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="text-center py-8 text-gray-500 italic">Belum ada data anggaran atau transaksi.</td>
                        </tr>
                    ) : (
                        data.map((item) => (
                            <tr key={item.id} className={`border-b border-gray-800 hover:bg-gray-800/50 ${item.isAuto ? 'bg-yellow-900/10' : ''}`}>
                                <td className="px-4 py-2 pl-8 text-white flex items-center gap-2">
                                    {item.uraian}
                                    {item.isAuto && <span className="text-[10px] bg-yellow-900 text-yellow-200 px-1 rounded border border-yellow-700 no-print">Auto</span>}
                                </td>
                                <td className="px-4 py-2 text-right text-gray-300">{formatCurrency(item.anggaran)}</td>
                                <td className="px-4 py-2 text-right text-gray-300">{formatCurrency(item.realisasi)}</td>
                                <td className="px-4 py-2 text-right text-gray-300">{item.anggaran > 0 ? item.persentase.toFixed(2) : '0.00'}%</td>
                                <td className="px-4 py-2 text-center no-print">
                                    <div className="flex justify-center items-center gap-2">
                                        <button 
                                            onClick={() => handleOpenModal(type, item)} 
                                            className={`p-1 ${item.isAuto ? 'text-yellow-400 hover:text-yellow-300' : 'text-sky-400 hover:text-sky-300'}`} 
                                            title={item.isAuto ? "Tetapkan Anggaran" : "Edit Anggaran"}
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                         {!item.isAuto && (
                                             <button onClick={() => handleDelete(item.id)} className="p-1 text-red-400 hover:text-red-300" title="Hapus">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                         )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    <tr className="bg-gray-800 font-bold text-white">
                        <td className="px-4 py-2">{total.uraian}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(total.anggaran)}</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(total.realisasi)}</td>
                        <td className="px-4 py-2 text-right">{total.persentase.toFixed(2)}%</td>
                        <td className="px-4 py-2 no-print"></td>
                    </tr>
                </tbody>
            </table>
            </div>
        </div>
    );
    
    return (
        <div className="bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-800" id="printable-area">
            <style>{printStyles}</style>
            {notification && (
                <div className="no-print">
                    <Notification {...notification} onClose={() => setNotification(null)} />
                </div>
            )}
            
            {/* Header with Print Button */}
            <div className="flex justify-between items-start mb-6 no-print">
                <div></div> {/* Spacer */}
                <button 
                    onClick={handlePrint} 
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 shadow-lg"
                >
                    <Printer size={20} />
                    <span>Cetak Laporan (PDF)</span>
                </button>
            </div>

            <div className="text-center mb-8 text-white">
                <h2 className="text-xl font-bold uppercase">Desa Adat Bacol Bigalow</h2>
                <h3 className="text-lg font-semibold">LAPORAN REALISASI ANGGARAN</h3>
                <p className="text-sm text-gray-400">Untuk Tahun yang Berakhir pada 31 Desember {reportYear}</p>
            </div>

            {/* Alert Info for Auto Rows */}
            <div className="mb-6 bg-blue-900/20 border border-blue-800 rounded-lg p-4 flex items-start gap-3 no-print">
                <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0"/>
                <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">Info Penggunaan:</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>Kategori yang digunakan di BKU akan otomatis muncul di tabel ini dengan label <span className="text-[10px] bg-yellow-900 text-yellow-200 px-1 rounded border border-yellow-700">Auto</span>.</li>
                        <li>Klik tombol <Pencil className="w-3 h-3 inline"/> pada baris Auto untuk menetapkan Anggaran (Budget) resminya.</li>
                    </ul>
                </div>
            </div>

            <ReportTable title="Tabel Pendapatan" data={pendapatanData} total={totalPendapatan} type="pendapatan" />
            <ReportTable title="Tabel Belanja" data={belanjaData} total={totalBelanja} type="belanja" />

            <div className="signature-section">
                <h3 className="text-lg font-bold text-white mb-2">Tabel Surplus/Defisit Anggaran</h3>
                <div className="overflow-x-auto">
                 <table className="w-full text-sm text-gray-300">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 w-[35%]">Uraian</th>
                            <th className="px-4 py-3 text-right">Anggaran (A)</th>
                            <th className="px-4 py-3 text-right">Realisasi (R)</th>
                            <th className="px-4 py-3 w-[10%]"></th>
                            <th className="px-4 py-3 w-[15%] no-print"></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-gray-800 font-bold text-white">
                           <td className="px-4 py-2">{surplusDefisit.uraian}</td>
                           <td className="px-4 py-2 text-right">{formatCurrency(surplusDefisit.anggaran)}</td>
                           <td className="px-4 py-2 text-right">{formatCurrency(surplusDefisit.realisasi)}</td>
                           <td></td>
                           <td className="no-print"></td>
                        </tr>
                    </tbody>
                </table>
                </div>
            </div>

            <div className="pt-16 text-sm text-gray-300 signature-section">
                 <div className="flex justify-end">
                    <div className="text-center">
                        <p>Basangalas, 31 Desember {reportYear}</p>
                    </div>
                 </div>
                <div className="grid grid-cols-2 gap-8 mt-4">
                    <div className="text-center">
                        <p>Mengetahui/Mengesahkan,</p>
                        <p className="mb-16">Bendesa Adat Bacol Bigalow</p>
                        <p className="font-bold underline">Gusde Bacol </p>
                    </div>
                     <div className="text-center">
                        <p>Dibuat oleh,</p>
                         <p className="mb-16">Juru Raksa</p>
                        <p className="font-bold underline">I Gede Bentar</p>
                    </div>
                </div>
            </div>
            
            <div className="no-print">
                <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${editingItem ? 'Edit/Tetapkan' : 'Buat'} Anggaran ${modalType === 'pendapatan' ? 'Pendapatan' : 'Belanja'}`}>
                    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
                        <div>
                            <label htmlFor="kategori" className="block text-sm font-medium text-gray-300 mb-1">Kategori Anggaran</label>
                            <input 
                                list={`${modalType}-list`}
                                id="kategori"
                                value={formKategori}
                                onChange={e => setFormKategori(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                                placeholder="Pilih atau ketik kategori..."
                                required
                            />
                            <datalist id={`${modalType}-list`}>
                                {modalType === 'pendapatan' 
                                    ? pendapatanKategoriOptions.map(opt => <option key={opt} value={opt}/>)
                                    : belanjaKategoriOptions.map(opt => <option key={opt} value={opt}/>)
                                }
                                <option value="Lain-lain" />
                            </datalist>
                            <p className="text-xs text-gray-400 mt-1">Kategori harus sama persis dengan BKU agar Realisasi terbaca otomatis.</p>
                        </div>
                        <div>
                            <label htmlFor="jumlah" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Anggaran</label>
                            <input type="number" id="jumlah" value={formJumlah} onChange={e => setFormJumlah(e.target.value === '' ? '' : Number(e.target.value))} required className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="0"/>
                            {Number(formJumlah) > 0 && <p className="text-xs text-teal-400 mt-1 italic">{terbilang(Number(formJumlah))}</p>}
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">Batal</button>
                            <button type="submit" className="px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 transition-colors shadow-sm">
                                Simpan Anggaran
                            </button>
                        </div>
                    </form>
                </Modal>
            </div>
        </div>
    );
};

export default LaporanRekonsiliasiAkhir;
