
import React, { useState, useMemo, useRef } from 'react';
import type { JuDisplayRow, BkuData, BkpData } from '../types';
import { formatCurrency, formatDate, numberToWords } from '../utils/formatter';
import { Search, Plus, Trash2, Save, ArrowDownLeft, ArrowUpRight, Download, FileSpreadsheet, Upload, BookOpen, Printer } from 'lucide-react';
import Notification from '../components/shared/Notification';
import Modal from '../components/shared/Modal';

declare const XLSX: any;

interface BukuBesarProps {
    entries: JuDisplayRow[];
    bkuData: BkuData[];
    onSubmit: (formData: Omit<BkuData, 'id' | 'saldo'>, id?: string) => void;
    onBkpSubmit: (formData: Omit<BkpData, 'id' | 'saldo'>) => void;
    onDelete: (id: string) => void;
}

// Helper type for pending BKU transaction waiting for Receipt/Note input
interface PendingTransaction extends Omit<BkuData, 'id' | 'saldo'> {
    id?: string;
    targetName: string; // Dari / Kepada
}

// Helper for Nota Items
interface NotaItem {
    id: string;
    itemName: string;
    qty: number;
    price: number;
    total: number;
}

// Standard Reference for Village Account Codes (Permendagri 20)
const REFERENSI_REKENING = [
    { code: '022.22.1', name: 'Bantuan Keuangan dari APBD Provinsi' },
    { code: '022.22.2', name: 'Bantuan Keuangan dari APBD Kab/Kota' },
    { code: '5.1.1.01', name: 'Insentif Kelian Adat' },
    { code: '5.1.1.02', name: 'Insentif Prajuru Adat' },
    { code: '5.1.1.03', name: 'Insentif Admin Adat' },
    { code: '5.1.1.04', name: 'Jaminan Sosial Prajuru Adat' },
    { code: '5.1.2.01', name: 'Belanja Alat Tulis Kantor (ATK)' },
    { code: '5.1.2.02', name: 'Belanja Benda Pos & Materai' },
    { code: '5.1.2.03', name: 'Belanja Alat Listrik & Elektronik' },
    { code: '5.1.2.04', name: 'Belanja Peralatan Kebersihan' },
    { code: '5.1.2.05', name: 'Belanja Cetak & Penggandaan' },
    { code: '5.1.2.06', name: 'Belanja Makan & Minum Rapat' },
    { code: '5.1.2.07', name: 'Belanja Pakaian Dinas & Atribut' },
    { code: '5.1.2.08', name: 'Belanja Perjalanan Dinas' },
    { code: '5.1.2.09', name: 'Belanja Pemeliharaan Gedung & Kantor' },
    { code: '5.1.3.01', name: 'Belanja Pecalang' },
    { code: '5.1.3.02', name: 'Belanja Pakis' },
    { code: '5.1.3.03', name: 'Belanja Modal Gedung & Bangunan' },
    { code: '5.1.3.04', name: 'Belanja Modal Jalan, Irigasi & Jaringan' },
    { code: '5.1.4.01', name: 'Belanja Tak Terduga' },
    { code: '6.1.1.01', name: 'Penerimaan Pembiayaan' },
    { code: '6.2.1.01', name: 'Pengeluaran Pembiayaan' }
];

const BukuBesar: React.FC<BukuBesarProps> = ({ entries, bkuData, onSubmit, onBkpSubmit, onDelete }) => {
    // --- LEDGER VIEW STATE ---
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');

    // --- INPUT FORM STATE (MAIN) ---
    const [isInputModalOpen, setIsInputModalOpen] = useState(false);
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [formKode, setFormKode] = useState('');
    const [formKategori, setFormKategori] = useState(''); // New Kategori State
    const [formType, setFormType] = useState<'Penerimaan' | 'Pembayaran'>('Penerimaan');
    const [formDescManual, setFormDescManual] = useState('');
    const [formTarget, setFormTarget] = useState(''); // Dari / Kepada
    const [formAmount, setFormAmount] = useState<number | ''>('');
    
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- POST-SUBMISSION STATES (KWITANSI / NOTA) ---
    const [pendingTx, setPendingTx] = useState<PendingTransaction | null>(null);
    
    // Kwitansi State
    const [isKwitansiModalOpen, setIsKwitansiModalOpen] = useState(false);
    const [kwitansiGuna, setKwitansiGuna] = useState('');
    
    // Nota State
    const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
    const [notaBukti, setNotaBukti] = useState('');
    const [notaItems, setNotaItems] = useState<NotaItem[]>([
        { id: '1', itemName: '', qty: 1, price: 0, total: 0 }
    ]);

    // --- DERIVED DATA ---

    // Combine static standard codes with any custom codes used in history
    const availableCodes = useMemo(() => {
        const map = new Map<string, string>();
        
        // 1. Add Standard Codes
        REFERENSI_REKENING.forEach(ref => {
            map.set(ref.code, ref.name);
        });

        // 2. Add codes from history (BKU) if not exists
        bkuData.forEach(b => {
            if (b.kode && !map.has(b.kode)) {
                map.set(b.kode, 'Kode Historis');
            }
        });

        return Array.from(map.entries())
            .map(([code, name]) => ({ code, name }))
            .sort((a, b) => a.code.localeCompare(b.code));
    }, [bkuData]);

    // Identify selected code description for feedback
    const selectedCodeDescription = useMemo(() => {
        if(!formKode) return '';
        // Try to match exact code
        const cleanCode = formKode.split(' - ')[0].trim();
        const found = availableCodes.find(c => c.code === cleanCode);
        return found ? found.name : '';
    }, [formKode, availableCodes]);

    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        bkuData.forEach(b => b.kategori && cats.add(b.kategori));
        return Array.from(cats).sort();
    }, [bkuData]);

    const generatedUraian = useMemo(() => {
        if (!formDescManual) return '...';
        const prefix = formType === 'Penerimaan' ? 'Penerimaan' : 'Belanja';
        const connector = formType === 'Penerimaan' ? 'Dari' : 'Kepada';
        const targetStr = formTarget ? formTarget : '...';
        return `${prefix} ${formDescManual} ${connector} ${targetStr}`;
    }, [formType, formDescManual, formTarget]);

    // --- HANDLERS ---

    const handleOpenModal = () => {
        setFormDate(new Date().toISOString().split('T')[0]);
        setFormKode('');
        setFormKategori('');
        setFormDescManual('');
        setFormTarget('');
        setFormAmount('');
        setIsInputModalOpen(true);
    }

    // 1. MAIN FORM SUBMIT (PREPARE ONLY)
    const handleBkuSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formDescManual || !formAmount || !formTarget) {
            setNotification({ message: 'Harap lengkapi semua data input.', type: 'error' });
            return;
        }

        const numericAmount = Number(formAmount);
        
        // Clean the code (remove description if selected from dropdown)
        const cleanKode = formKode.split(' - ')[0].trim();

        const newData: Omit<BkuData, 'id' | 'saldo'> = {
            tanggal: formDate,
            kode: cleanKode,
            kategori: formKategori, // Save Kategori to BKU
            uraian: generatedUraian,
            penerimaan: formType === 'Penerimaan' ? numericAmount : 0,
            pengeluaran: formType === 'Pembayaran' ? numericAmount : 0,
        };

        // Prepare next step
        const tempTx: PendingTransaction = {
            ...newData,
            targetName: formTarget
        };
        setPendingTx(tempTx);
        setIsInputModalOpen(false);

        // Trigger next modal
        if (formType === 'Penerimaan') {
            // Prepare Kwitansi
            setKwitansiGuna(formDescManual); // Default
            setIsKwitansiModalOpen(true);
        } else {
            // Prepare Nota
            setNotaBukti('');
            setNotaItems([{ id: '1', itemName: '', qty: 1, price: 0, total: 0 }]);
            setIsNotaModalOpen(true);
        }
    };

    // 2. KWITANSI SUBMIT (BKU + BKP + EXCEL)
    const handleKwitansiSubmit = () => {
        if (!pendingTx) return;

        // 1. Save to BKU (Commit Transaction)
        onSubmit(pendingTx);

        // 2. Save to BKP
        const bkpEntry: Omit<BkpData, 'id' | 'saldo'> = {
            tanggal: pendingTx.tanggal,
            bukti: 'KW-' + Date.now().toString().slice(-4),
            uraian: `Penerimaan dari ${pendingTx.targetName} untuk ${kwitansiGuna}`,
            kategori: pendingTx.kategori, // Use Kategori (NOT Kode)
            debet: pendingTx.penerimaan,
            kredit: 0
        };
        onBkpSubmit(bkpEntry);

        // 3. Export Excel (Disabled auto download)
        // exportKwitansiToExcel(bkpEntry, pendingTx.penerimaan);

        setNotification({ message: 'Data berhasil disimpan ke BKU & BKP.', type: 'success' });
        setIsKwitansiModalOpen(false);
        setPendingTx(null);
    };

    // 3. NOTA SUBMIT (BKU + BKP + EXCEL)
    const handleNotaSubmit = () => {
        if (!pendingTx) return;

        const totalNota = notaItems.reduce((sum, item) => sum + item.total, 0);
        
        // Validation: Sum must match BKU amount
        if (totalNota !== pendingTx.pengeluaran) {
            setNotification({ 
                message: `Total Nota (${formatCurrency(totalNota)}) tidak sesuai dengan input awal (${formatCurrency(pendingTx.pengeluaran)}).`, 
                type: 'error' 
            });
            return;
        }

        // 1. Save to BKU (Commit Transaction)
        onSubmit(pendingTx);

        // 2. Save EACH item to BKP (Detailed)
        // Using for...of to ensure clean iteration, though sync calls rely on App.tsx fixing race conditions
        for (const item of notaItems) {
            if(item.itemName && item.total > 0) {
                 const bkpEntry: Omit<BkpData, 'id' | 'saldo'> = {
                    tanggal: pendingTx.tanggal,
                    bukti: notaBukti || 'NOTA-' + Date.now().toString().slice(-4),
                    // Combine itemName with details for complete record
                    uraian: `${item.itemName} (${item.qty} x ${item.price})`, 
                    kategori: pendingTx.kategori, // Use Kategori (NOT Kode)
                    debet: 0,
                    kredit: item.total
                };
                onBkpSubmit(bkpEntry);
            }
        }

        // 3. Export Excel (Disabled auto download)
        // exportNotaToExcel(notaItems, pendingTx, notaBukti);

        setNotification({ message: 'Semua rincian Nota berhasil disimpan ke BKP & BKU.', type: 'success' });
        setIsNotaModalOpen(false);
        setPendingTx(null);
    };

    const handlePrint = () => {
        window.print();
    };

    // --- EXCEL FUNCTIONS (DOCUMENTS) ---

    const exportKwitansiToExcel = (data: any, amount: number) => {
        if (typeof XLSX === 'undefined') return;
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["KWITANSI TANDA TERIMA"],
            [""],
            ["No. Bukti", data.bukti],
            ["Tanggal", formatDate(data.tanggal)],
            ["Telah Terima Dari", pendingTx?.targetName],
            ["Uang Sejumlah", formatCurrency(amount)],
            ["Terbilang", numberToWords(amount) + " Rupiah"],
            ["Untuk Pembayaran", kwitansiGuna],
            [""],
            ["", "", "Penerima"],
            ["", "", ""],
            ["", "", "Bendahara Desa"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Kwitansi");
        XLSX.writeFile(wb, `Kwitansi_${data.bukti}.xlsx`);
    };

    const exportNotaToExcel = (items: NotaItem[], tx: PendingTransaction, bukti: string) => {
        if (typeof XLSX === 'undefined') return;
        const wb = XLSX.utils.book_new();
        const wsData = [
            ["NOTA BELANJA"],
            ["No. Bukti", bukti],
            ["Tanggal", formatDate(tx.tanggal)],
            ["Kepada", tx.targetName],
            [""],
            ["No", "Nama Barang", "Qty", "Harga Satuan", "Jumlah"],
            ...items.map((item, idx) => [
                idx + 1, item.itemName, item.qty, item.price, item.total
            ]),
            ["", "", "", "TOTAL", items.reduce((a,b) => a + b.total, 0)]
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "Nota");
        XLSX.writeFile(wb, `Nota_${bukti || 'Draft'}.xlsx`);
    };
    
    // --- EXCEL EXPORT / IMPORT (MAIN DATA) ---
     const handleExportData = () => {
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
      XLSX.utils.book_append_sheet(wb, ws, "BukuBesar");
      XLSX.writeFile(wb, `BukuBesar_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
      setNotification({ message: 'Data Buku Besar berhasil diekspor.', type: 'success' });
    };
    
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

    // --- NOTA ITEM HELPERS ---
    const updateNotaItem = (index: number, field: keyof NotaItem, value: any) => {
        const newItems = [...notaItems];
        const item = newItems[index];
        (item as any)[field] = value;
        
        if (field === 'qty' || field === 'price') {
            item.total = item.qty * item.price;
        }
        setNotaItems(newItems);
    };

    const addNotaItem = () => {
        setNotaItems([...notaItems, { id: Date.now().toString(), itemName: '', qty: 1, price: 0, total: 0 }]);
    };

    const removeNotaItem = (index: number) => {
        if (notaItems.length > 1) {
            const newItems = [...notaItems];
            newItems.splice(index, 1);
            setNotaItems(newItems);
        }
    };

    const notaTotal = notaItems.reduce((acc, item) => acc + item.total, 0);


    // --- LEDGER VIEW LOGIC (Existing) ---
    const ledgerData = useMemo(() => {
        if (!selectedAccount) return [];
        const filtered = entries.filter(entry => entry.kodeRekening === selectedAccount);
        filtered.sort((a, b) => {
            const dateA = new Date(a.date || 0).getTime();
            const dateB = new Date(b.date || 0).getTime();
            if (dateA !== dateB) return dateA - dateB;
            return (a.idTransaksi || '').localeCompare(b.idTransaksi || '');
        });
        const firstDigit = selectedAccount.charAt(0);
        const isCreditNormal = ['2', '3', '4'].includes(firstDigit);
        let runningBalance = 0;
        return filtered.map(row => {
            if (isCreditNormal) runningBalance += (row.kredit - row.debet);
            else runningBalance += (row.debet - row.kredit);
            return { ...row, saldo: runningBalance };
        });
    }, [entries, selectedAccount]);

    const displayLedgerData = useMemo(() => {
        if (!ledgerSearchTerm) return ledgerData;
        return ledgerData.filter(row => 
            row.uraian.toLowerCase().includes(ledgerSearchTerm.toLowerCase()) ||
            (row.idTransaksi && row.idTransaksi.toLowerCase().includes(ledgerSearchTerm.toLowerCase()))
        );
    }, [ledgerData, ledgerSearchTerm]);

    const recentBkuData = useMemo(() => {
        return [...bkuData].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 10);
    }, [bkuData]);

    const parseRowData = (uraian: string, type: 'Penerimaan' | 'Pembayaran') => {
        const connector = type === 'Penerimaan' ? 'Dari' : 'Kepada';
        const regexTarget = new RegExp(`${connector}\\s+(.*)$`, 'i');
        const matchTarget = uraian.match(regexTarget);
        const target = matchTarget ? matchTarget[1] : '-';
        const regexDesc = new RegExp(`^(.*?)\\s+${connector}`, 'i');
        const matchDesc = uraian.match(regexDesc);
        const cleanDesc = matchDesc ? matchDesc[1] : uraian;
        return { target, cleanDesc };
    };

    // Specific Styles for printing the modals
    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            /* Display Kwitansi if printing */
            #print-kwitansi, #print-kwitansi * {
                visibility: visible;
            }
            #print-kwitansi {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background-color: #fff9c4 !important; /* Force yellow background */
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 20px;
                margin: 0;
                z-index: 9999;
            }

            /* Display Nota if printing */
            #print-nota, #print-nota * {
                visibility: visible;
            }
            #print-nota {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background-color: white !important;
                padding: 20px;
                margin: 0;
                z-index: 9999;
            }
            
            /* Hide buttons in print view */
            .no-print-modal {
                display: none !important;
            }
        }
    `;

    return (
        <div className="space-y-8">
            <style>{printStyles}</style>
            {notification && <Notification {...notification} onClose={() => setNotification(null)} />}

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-800">
                <div>
                     <h2 className="text-xl font-bold text-white">Input Data Buku Besar</h2>
                     <p className="text-gray-400 text-sm">Tambahkan transaksi baru (Otomatis masuk BKU & BKP).</p>
                </div>
                <div className="flex gap-2">
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-lg"
                      title="Export Data Buku Besar"
                    >
                      <Download size={20} />
                    </button>

                     <button
                      onClick={handleImportClick}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 shadow-lg"
                      title="Import Data Excel ke Buku Besar"
                    >
                      <Upload size={20} />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls" className="hidden" />

                    <button 
                        onClick={handleOpenModal}
                        className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg"
                    >
                        <Plus size={20} />
                        <span>Tambah Transaksi</span>
                    </button>
                </div>
            </div>

            {/* --- TABLE SECTION --- */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-800">
                <h3 className="text-lg font-bold text-white mb-4">Daftar Transaksi Terkini</h3>
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-800 text-white">
                            <tr>
                                <th className="px-6 py-3">Tanggal</th>
                                <th className="px-6 py-3">Jenis</th>
                                <th className="px-6 py-3">Kategori</th>
                                <th className="px-6 py-3">Uraian</th>
                                <th className="px-6 py-3 text-right">Jumlah</th>
                                <th className="px-6 py-3">Dari/Kepada</th>
                                <th className="px-6 py-3 text-center">Status</th>
                                <th className="px-6 py-3 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentBkuData.map((item) => {
                                const isPenerimaan = item.penerimaan > 0;
                                const type = isPenerimaan ? 'Penerimaan' : 'Pembayaran';
                                const amount = isPenerimaan ? item.penerimaan : item.pengeluaran;
                                const { target, cleanDesc } = parseRowData(item.uraian, type as any);

                                return (
                                    <tr key={item.id} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.tanggal)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isPenerimaan ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {isPenerimaan ? <ArrowUpRight size={12}/> : <ArrowDownLeft size={12}/>}
                                                {type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{item.kategori || '-'}</td>
                                        <td className="px-6 py-4 text-white font-medium max-w-xs truncate" title={item.uraian}>
                                            {cleanDesc}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${isPenerimaan ? 'text-green-400' : 'text-red-400'}`}>
                                            {formatCurrency(amount)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-300">{target}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="px-2 py-1 bg-teal-900/30 text-teal-400 border border-teal-800 rounded-md text-xs font-semibold">
                                                Sukses
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => onDelete(item.id)} 
                                                className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1.5 rounded transition-colors"
                                                title="Hapus dari BKU"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                             {recentBkuData.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-8 text-gray-500 italic">
                                        Belum ada transaksi yang ditambahkan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- 1. MODAL INPUT BKU (MAIN) --- */}
            <Modal 
                isOpen={isInputModalOpen} 
                onClose={() => setIsInputModalOpen(false)} 
                title="Input Transaksi Baru"
                className="max-w-4xl"
            >
                 <form onSubmit={handleBkuSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Tanggal Transaksi</label>
                                <input 
                                    type="date" 
                                    value={formDate} 
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Jenis Transaksi</label>
                                <select 
                                    value={formType}
                                    onChange={(e) => setFormType(e.target.value as 'Penerimaan' | 'Pembayaran')}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                >
                                    <option value="Penerimaan">Penerimaan (Debet)</option>
                                    <option value="Pembayaran">Pembayaran/Belanja (Kredit)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kategori</label>
                                <input 
                                    list="kategori-list-modal"
                                    value={formKategori}
                                    onChange={(e) => setFormKategori(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Pilih atau ketik kategori..."
                                    required
                                />
                                <datalist id="kategori-list-modal">
                                    {availableCategories.map(cat => <option key={cat} value={cat} />)}
                                </datalist>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Kode Rekening (Disimpan ke BKU saja)</label>
                                <input 
                                    list="kode-list-modal"
                                    value={formKode}
                                    onChange={(e) => setFormKode(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                    placeholder="Contoh: 5.1.2.01"
                                    required
                                    autoComplete="off"
                                />
                                <datalist id="kode-list-modal">
                                    {availableCodes.map(item => (
                                        <option key={item.code} value={`${item.code} - ${item.name}`} />
                                    ))}
                                </datalist>
                                
                                {/* Keterangan Kode Display */}
                                <div className="mt-2 p-2 bg-gray-900/50 rounded border border-gray-700 text-sm min-h-[2.5rem] flex items-center gap-2">
                                    <BookOpen size={16} className="text-teal-400"/>
                                    {selectedCodeDescription ? (
                                        <span className="text-teal-300 font-medium">{selectedCodeDescription}</span>
                                    ) : (
                                        <span className="text-gray-500 italic">Keterangan kode akan muncul di sini...</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {formType === 'Penerimaan' ? 'Uraian Penerimaan' : 'Uraian Belanja'}
                                </label>
                                <div className="flex items-center">
                                    <span className="bg-gray-600 text-gray-300 px-3 py-2 rounded-l-lg border border-r-0 border-gray-500 text-sm whitespace-nowrap">
                                        {formType === 'Penerimaan' ? 'Penerimaan' : 'Belanja'}
                                    </span>
                                    <input 
                                        type="text" 
                                        value={formDescManual}
                                        onChange={(e) => setFormDescManual(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-r-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder={formType === 'Penerimaan' ? "Contoh: Bansos" : "Contoh: ATK"}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {formType === 'Penerimaan' ? 'Diterima Dari' : 'Dibayarkan Kepada'}
                                </label>
                                <div className="flex items-center">
                                    <span className="bg-gray-600 text-gray-300 px-3 py-2 rounded-l-lg border border-r-0 border-gray-500 text-sm whitespace-nowrap">
                                        {formType === 'Penerimaan' ? 'Dari' : 'Kepada'}
                                    </span>
                                    <input 
                                        type="text" 
                                        value={formTarget}
                                        onChange={(e) => setFormTarget(e.target.value)}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-r-lg px-4 py-2 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Jumlah Nominal</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                    <input 
                                        type="number" 
                                        value={formAmount}
                                        onChange={(e) => setFormAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white font-mono text-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                                {formAmount !== '' && (
                                    <p className="text-sm text-teal-400 italic mt-1 bg-teal-900/20 p-1 rounded">
                                        {numberToWords(Number(formAmount)) + ' Rupiah'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 text-sm flex items-start gap-3">
                        <div className="p-2 bg-blue-900/30 rounded-full text-blue-400">
                            <Search size={20} />
                        </div>
                        <div className="flex-1">
                            <span className="text-gray-400 block mb-1 font-medium">Preview BKU:</span>
                            <p className="text-white font-mono text-lg break-words">{generatedUraian}</p>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                        <button type="button" onClick={() => setIsInputModalOpen(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg">Batal</button>
                        <button type="submit" className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg">
                            <Save size={18} />
                            <span>Lanjut</span>
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- 2. MODAL KWITANSI (PENERIMAAN) --- */}
            <Modal
                isOpen={isKwitansiModalOpen}
                onClose={() => { setIsKwitansiModalOpen(false); setPendingTx(null); }}
                title="Bukti Kwitansi Penerimaan"
                className="max-w-5xl"
            >
                <div id="print-kwitansi" className="bg-[#fff9c4] text-black p-6 rounded-lg shadow-inner border-2 border-gray-300 font-serif relative">
                     {/* Decoration */}
                    <div className="absolute top-0 left-0 w-full h-4 bg-stripes-gray opacity-20 no-print-modal"></div>

                    <div className="text-center mb-6 border-b-2 border-black pb-2">
                        <h2 className="text-3xl font-bold uppercase tracking-widest">Kwitansi</h2>
                        <p className="text-sm">No. Bukti: Auto</p>
                    </div>

                    <div className="space-y-4 text-lg">
                         <div className="flex">
                            <span className="w-40 font-semibold">Telah Terima Dari</span>
                            <span className="flex-1 border-b border-dotted border-black px-2">{pendingTx?.targetName}</span>
                        </div>
                        <div className="flex">
                            <span className="w-40 font-semibold">Uang Sejumlah</span>
                            <span className="flex-1 border-b border-dotted border-black px-2 font-bold bg-gray-100/50">
                                {formatCurrency(pendingTx?.penerimaan)}
                            </span>
                        </div>
                         <div className="flex">
                            <span className="w-40 font-semibold">Terbilang</span>
                            <span className="flex-1 border-b border-dotted border-black px-2 italic text-sm">
                                {numberToWords(pendingTx?.penerimaan || 0)} Rupiah
                            </span>
                        </div>
                        <div className="flex items-start">
                            <span className="w-40 font-semibold pt-1">Untuk Pembayaran</span>
                            <textarea 
                                value={kwitansiGuna}
                                onChange={(e) => setKwitansiGuna(e.target.value)}
                                className="flex-1 bg-transparent border border-black p-2 text-sm focus:outline-none"
                                rows={2}
                            ></textarea>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end text-center">
                        <div className="w-1/3">
                            <p className="mb-16">{formatDate(pendingTx?.tanggal || '')}</p>
                            <p className="font-bold border-b border-black inline-block min-w-[150px]">Bendahara</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
                    >
                        <Printer size={18} />
                        <span>Print Kwitansi</span>
                    </button>
                    <button 
                        onClick={handleKwitansiSubmit}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg shadow-md"
                    >
                        <Save size={18} />
                        <span>Simpan</span>
                    </button>
                </div>
            </Modal>

            {/* --- 3. MODAL NOTA (PENGELUARAN) --- */}
            <Modal
                isOpen={isNotaModalOpen}
                onClose={() => { setIsNotaModalOpen(false); setPendingTx(null); }}
                title="Input Nota Belanja"
                className="max-w-4xl"
            >
                <div className="space-y-4">
                    <div id="print-nota" className="bg-white text-black p-6 rounded-lg shadow border border-gray-300">
                        <div className="flex justify-between items-start mb-4 border-b border-gray-300 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-black">NOTA BELANJA</h2>
                                <p className="text-sm text-gray-800">Kepada: {pendingTx?.targetName}</p>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center justify-end gap-2 mb-2">
                                    <span className="text-sm font-semibold text-black">No. Bukti:</span>
                                    <input 
                                        type="text" 
                                        value={notaBukti} 
                                        onChange={e => setNotaBukti(e.target.value)} 
                                        placeholder="Nomor Nota"
                                        className="border border-gray-400 bg-white text-black px-2 py-1 rounded text-sm w-32 focus:border-blue-500 focus:ring-0"
                                    />
                                </div>
                                <p className="text-sm text-black">{formatDate(pendingTx?.tanggal || '')}</p>
                            </div>
                        </div>

                        <table className="w-full text-sm border-collapse border border-gray-400">
                            <thead>
                                <tr className="bg-gray-200 text-black">
                                    <th className="border border-gray-400 p-2 w-10">No</th>
                                    <th className="border border-gray-400 p-2">Nama Barang (Uraian)</th>
                                    <th className="border border-gray-400 p-2 w-20">Qty</th>
                                    <th className="border border-gray-400 p-2 w-32">Harga</th>
                                    <th className="border border-gray-400 p-2 w-32">Jumlah</th>
                                    <th className="border border-gray-400 p-2 w-10 no-print-modal"></th>
                                </tr>
                            </thead>
                            <tbody className="text-black">
                                {notaItems.map((item, idx) => (
                                    <tr key={item.id}>
                                        <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                                        <td className="border border-gray-400 p-2">
                                            <input 
                                                type="text" 
                                                value={item.itemName}
                                                onChange={e => updateNotaItem(idx, 'itemName', e.target.value)}
                                                className="w-full p-1 border-b border-transparent focus:border-blue-500 outline-none bg-transparent text-black"
                                                placeholder="Nama Barang..."
                                            />
                                        </td>
                                        <td className="border border-gray-400 p-2">
                                            <input 
                                                type="number" 
                                                value={item.qty}
                                                onChange={e => updateNotaItem(idx, 'qty', Number(e.target.value))}
                                                className="w-full p-1 text-center outline-none bg-transparent text-black"
                                            />
                                        </td>
                                        <td className="border border-gray-400 p-2">
                                             <input 
                                                type="number" 
                                                value={item.price}
                                                onChange={e => updateNotaItem(idx, 'price', Number(e.target.value))}
                                                className="w-full p-1 text-right outline-none bg-transparent text-black"
                                            />
                                        </td>
                                        <td className="border border-gray-400 p-2 text-right font-semibold">
                                            {formatCurrency(item.total)}
                                        </td>
                                        <td className="border border-gray-400 p-2 text-center no-print-modal">
                                            <button onClick={() => removeNotaItem(idx)} className="text-red-500 hover:text-red-700">
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="text-black">
                                <tr className="bg-gray-100 font-bold">
                                    <td colSpan={4} className="border border-gray-400 p-2 text-right">TOTAL</td>
                                    <td className="border border-gray-400 p-2 text-right">{formatCurrency(notaTotal)}</td>
                                    <td className="border border-gray-400 no-print-modal"></td>
                                </tr>
                            </tfoot>
                        </table>
                        
                         <div className="mt-2 flex justify-between items-center no-print-modal">
                            <button onClick={addNotaItem} className="text-sm text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                                <Plus size={14}/> Tambah Baris
                            </button>
                            
                            {/* Validation Message */}
                            <div className={`text-sm px-3 py-1 rounded font-medium ${notaTotal === (pendingTx?.pengeluaran || 0) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {notaTotal === (pendingTx?.pengeluaran || 0) 
                                    ? "Total Sesuai dengan BKU" 
                                    : `Selisih: ${formatCurrency((pendingTx?.pengeluaran || 0) - notaTotal)} (Target: ${formatCurrency(pendingTx?.pengeluaran)})`
                                }
                            </div>
                        </div>
                    </div>

                     <div className="flex justify-end gap-3 pt-4">
                        <button 
                            onClick={handlePrint}
                            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors"
                        >
                            <Printer size={18} />
                            <span>Print Nota</span>
                        </button>
                        <button 
                            onClick={handleNotaSubmit}
                            className={`flex items-center gap-2 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all ${notaTotal === (pendingTx?.pengeluaran || 0) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-500 cursor-not-allowed opacity-50'}`}
                            disabled={notaTotal !== (pendingTx?.pengeluaran || 0)}
                        >
                            <Save size={18} />
                            <span>Simpan</span>
                        </button>
                    </div>
                </div>
            </Modal>


            {/* --- LEGACY LEDGER VIEW --- */}
            <div className="bg-gray-900 p-6 rounded-xl shadow-xl border border-gray-800 mt-8 opacity-90">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Buku Besar (Filter Kode Rekening)</h2>
                        <p className="text-gray-400 text-sm">Lihat rincian per kode rekening berdasarkan Jurnal Umum.</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <select 
                            value={selectedAccount} 
                            onChange={(e) => setSelectedAccount(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                            <option value="">-- Pilih Kode Rekening --</option>
                            {availableCodes.map(item => (
                                <option key={item.code} value={item.code}>{item.code} - {item.name}</option>
                            ))}
                        </select>
                    </div>
                     <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="Cari dalam ledger..." 
                            value={ledgerSearchTerm}
                            onChange={(e) => setLedgerSearchTerm(e.target.value)}
                            disabled={!selectedAccount}
                            className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                        />
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {selectedAccount ? (
                    <div className="space-y-4">
                         <div className="flex justify-between items-center bg-teal-900/10 p-3 rounded-lg border border-teal-900/30">
                            <div>
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Akun Terpilih</span>
                                <p className="text-lg font-bold text-teal-400">{selectedAccount}</p>
                            </div>
                             <div className="text-right">
                                <span className="text-gray-400 text-xs uppercase tracking-wider">Saldo Akhir</span>
                                <p className="text-lg font-bold text-white">
                                    {ledgerData.length > 0 
                                        ? formatCurrency(ledgerData[ledgerData.length - 1].saldo) 
                                        : formatCurrency(0)
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto rounded-lg border border-gray-700">
                            <table className="w-full text-sm text-left text-gray-400">
                                <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3">Tanggal</th>
                                        <th className="px-6 py-3">ID</th>
                                        <th className="px-6 py-3 w-1/3">Uraian</th>
                                        <th className="px-6 py-3 text-right">Debet</th>
                                        <th className="px-6 py-3 text-right">Kredit</th>
                                        <th className="px-6 py-3 text-right">Saldo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayLedgerData.map((row, idx) => (
                                        <tr key={`${row.rowId}-${idx}`} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">{row.date ? formatDate(row.date) : '-'}</td>
                                            <td className="px-6 py-4">{row.idTransaksi}</td>
                                            <td className="px-6 py-4 text-white">{row.uraian}</td>
                                            <td className="px-6 py-4 text-right text-green-400">{row.debet > 0 ? formatCurrency(row.debet) : '-'}</td>
                                            <td className="px-6 py-4 text-right text-red-400">{row.kredit > 0 ? formatCurrency(row.kredit) : '-'}</td>
                                            <td className="px-6 py-4 text-right font-medium text-white">{formatCurrency(row.saldo)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-800 rounded-lg">
                        Pilih Kode Rekening untuk melihat mutasi.
                    </div>
                )}
            </div>
        </div>
    );
};

export default BukuBesar;
