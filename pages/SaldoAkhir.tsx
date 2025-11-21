
import React, { useState, useMemo } from 'react';
import type { BkuTransaction } from '../types';
import Modal from '../components/shared/Modal';
import { Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { numberToWords, formatCurrency } from '../utils/formatter';

interface SaldoAkhirProps {
    bkuTransactions: BkuTransaction[];
    penyetoranPajak: number;
    setPenyetoranPajak: React.Dispatch<React.SetStateAction<number>>;
    saldoAwal: number;
    setSaldoAwal: React.Dispatch<React.SetStateAction<number>>;
}

interface CategorySummary {
    name: string;
    total: number;
}

interface SaldoSummary {
    saldoAwal: number;
    totalPenerimaan: number;
    totalPengeluaran: number;
    totalDebetKumulatif: number;
    totalKreditKumulatif: number;
    saldoAkhirKas: number;
    incomeByCategory: CategorySummary[];
    expenseByCategory: CategorySummary[];
}

const SaldoAkhir: React.FC<SaldoAkhirProps> = ({ bkuTransactions, penyetoranPajak, setPenyetoranPajak, saldoAwal, setSaldoAwal }) => {
    const [isPajakModalOpen, setIsPajakModalOpen] = useState(false);
    const [formPajak, setFormPajak] = useState<number | ''>('');

    const [isSaldoAwalModalOpen, setIsSaldoAwalModalOpen] = useState(false);
    const [formSaldoAwal, setFormSaldoAwal] = useState<number | ''>('');

    const summaryData = useMemo((): SaldoSummary => {
        const totalPenerimaan = bkuTransactions.reduce((sum, tx) => sum + tx.penerimaan, 0);
        const totalPengeluaran = bkuTransactions.reduce((sum, tx) => sum + tx.pengeluaran, 0);

        const totalDebetKumulatif = saldoAwal + totalPenerimaan;
        const totalKreditKumulatif = totalPengeluaran + penyetoranPajak;
        const saldoAkhirKas = totalDebetKumulatif - totalKreditKumulatif;

        // Aggregate Categories
        const incomeMap: Record<string, number> = {};
        const expenseMap: Record<string, number> = {};

        bkuTransactions.forEach(tx => {
            const categoryName = tx.kategori || 'Lain-lain';
            
            if (tx.penerimaan > 0) {
                incomeMap[categoryName] = (incomeMap[categoryName] || 0) + tx.penerimaan;
            }
            if (tx.pengeluaran > 0) {
                expenseMap[categoryName] = (expenseMap[categoryName] || 0) + tx.pengeluaran;
            }
        });

        const incomeByCategory = Object.entries(incomeMap)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total); // Sort highest first

        const expenseByCategory = Object.entries(expenseMap)
            .map(([name, total]) => ({ name, total }))
            .sort((a, b) => b.total - a.total);

        return {
            saldoAwal,
            totalPenerimaan,
            totalPengeluaran,
            totalDebetKumulatif,
            totalKreditKumulatif,
            saldoAkhirKas,
            incomeByCategory,
            expenseByCategory
        };

    }, [bkuTransactions, penyetoranPajak, saldoAwal]);
    
    const handleOpenPajakModal = () => {
        setFormPajak(penyetoranPajak > 0 ? penyetoranPajak : '');
        setIsPajakModalOpen(true);
    };

    const handleSavePajak = (e: React.FormEvent) => {
        e.preventDefault();
        setPenyetoranPajak(Number(formPajak) || 0);
        setIsPajakModalOpen(false);
    };

    const handleOpenSaldoAwalModal = () => {
        setFormSaldoAwal(saldoAwal > 0 ? saldoAwal : '');
        setIsSaldoAwalModalOpen(true);
    };

    const handleSaveSaldoAwal = (e: React.FormEvent) => {
        e.preventDefault();
        setSaldoAwal(Number(formSaldoAwal) || 0);
        setIsSaldoAwalModalOpen(false);
    };

    const terbilang = (num: number) => numberToWords(num) + ' Rupiah';

    // Helper Component for Detail Tables
    const DetailTable = ({ title, data, type }: { title: string, data: CategorySummary[], type: 'income' | 'expense' }) => (
        <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800 flex-1">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-full ${type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                    {type === 'income' ? <ArrowUpRight className="w-5 h-5 text-green-400" /> : <ArrowDownLeft className="w-5 h-5 text-red-400" />}
                </div>
                <h3 className="text-lg font-bold text-white">{title}</h3>
            </div>
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 w-10 text-center">No</th>
                            <th className="px-4 py-3">Kategori</th>
                            <th className="px-4 py-3 text-right">Jumlah</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-6 text-center text-gray-500 italic">
                                    Tidak ada data transaksi.
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => (
                                <tr key={idx} className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                    <td className="px-4 py-3 text-center">{idx + 1}</td>
                                    <td className="px-4 py-3 text-white font-medium">{item.name}</td>
                                    <td className={`px-4 py-3 text-right font-semibold ${type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                        {formatCurrency(item.total)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot className="bg-gray-800 font-bold text-white">
                        <tr>
                            <td colSpan={2} className="px-4 py-3 text-right">Total</td>
                            <td className="px-4 py-3 text-right">
                                {formatCurrency(data.reduce((sum, item) => sum + item.total, 0))}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            {/* Main Summary Table */}
            <div className="bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-800">
                <h2 className="text-2xl font-bold text-white mb-6">Rekapitulasi Saldo Akhir Kas</h2>
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-4 w-1/2">Uraian</th>
                                <th scope="col" className="px-6 py-4 text-right">Debet (Penerimaan)</th>
                                <th scope="col" className="px-6 py-4 text-right">Kredit (Pengeluaran)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="flex items-center justify-between">
                                        <span>Saldo Awal</span>
                                        <button onClick={handleOpenSaldoAwalModal} className="p-1 rounded-full text-sky-400 bg-sky-900/20 hover:bg-sky-900/40" title="Atur Saldo Awal Manual">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right text-green-400">{formatCurrency(summaryData.saldoAwal)}</td>
                                <td className="px-6 py-4 text-right">-</td>
                            </tr>
                            <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">Total Transaksi (Lihat BKU)</td>
                                <td className="px-6 py-4 text-right text-green-400 font-semibold">{formatCurrency(summaryData.totalPenerimaan)}</td>
                                <td className="px-6 py-4 text-right text-red-400 font-semibold">{formatCurrency(summaryData.totalPengeluaran)}</td>
                            </tr>
                            <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                                <td className="px-6 py-4 font-medium text-white">
                                    <div className="flex items-center justify-between">
                                        <span>Penyetoran Pajak</span>
                                        <button onClick={handleOpenPajakModal} className="p-1 rounded-full text-sky-400 bg-sky-900/20 hover:bg-sky-900/40" title="Tambah/Edit Nilai Pajak">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">-</td>
                                <td className="px-6 py-4 text-right text-red-400 font-semibold">{formatCurrency(penyetoranPajak)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="font-bold text-white">
                            <tr className="bg-gray-800 border-b border-t border-gray-700">
                                <td className="px-6 py-4">Total Debet Kumulatif</td>
                                <td className="px-6 py-4 text-right text-green-400">{formatCurrency(summaryData.totalDebetKumulatif)}</td>
                                <td className="px-6 py-4 text-right">-</td>
                            </tr>
                            <tr className="bg-gray-800 border-b border-gray-700">
                                <td className="px-6 py-4">Total Kredit Kumulatif</td>
                                <td className="px-6 py-4 text-right">-</td>
                                <td className="px-6 py-4 text-right text-red-400">{formatCurrency(summaryData.totalKreditKumulatif)}</td>
                            </tr>
                            <tr className="bg-teal-900/30 text-teal-300 border-t border-teal-800">
                                <td className="px-6 py-4 text-lg">Saldo Akhir Kas</td>
                                <td colSpan={2} className="px-6 py-4 text-right text-2xl tracking-tight">{formatCurrency(summaryData.saldoAkhirKas)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Detailed Category Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DetailTable 
                    title="Rincian Penerimaan per Kategori" 
                    data={summaryData.incomeByCategory} 
                    type="income" 
                />
                <DetailTable 
                    title="Rincian Pengeluaran per Kategori" 
                    data={summaryData.expenseByCategory} 
                    type="expense" 
                />
            </div>

            {/* Modals */}
            <Modal isOpen={isPajakModalOpen} onClose={() => setIsPajakModalOpen(false)} title="Ubah Nilai Penyetoran Pajak">
                <form onSubmit={handleSavePajak} className="space-y-4">
                    <div>
                        <label htmlFor="pajak-amount" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Total Penyetoran Pajak</label>
                        <input 
                            type="number" 
                            id="pajak-amount" 
                            value={formPajak}
                            onChange={(e) => setFormPajak(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
                            placeholder="0"
                            autoFocus
                        />
                        {Number(formPajak) > 0 && <p className="text-xs text-teal-400 mt-1 italic">{terbilang(Number(formPajak))}</p>}
                    </div>
                     <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsPajakModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>

             <Modal isOpen={isSaldoAwalModalOpen} onClose={() => setIsSaldoAwalModalOpen(false)} title="Atur Saldo Awal">
                <form onSubmit={handleSaveSaldoAwal} className="space-y-4">
                    <div>
                        <label htmlFor="saldo-awal-amount" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Saldo Awal</label>
                        <input 
                            type="number" 
                            id="saldo-awal-amount" 
                            value={formSaldoAwal}
                            onChange={(e) => setFormSaldoAwal(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" 
                            placeholder="0"
                            autoFocus
                        />
                         {Number(formSaldoAwal) > 0 && <p className="text-xs text-teal-400 mt-1 italic">{terbilang(Number(formSaldoAwal))}</p>}
                    </div>
                     <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsSaldoAwalModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-colors">Batal</button>
                        <button type="submit" className="px-4 py-2 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
                            Simpan
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SaldoAkhir;
