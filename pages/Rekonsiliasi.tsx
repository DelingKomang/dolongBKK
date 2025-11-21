
import React, { useMemo, useState } from 'react';
import type { BkuTransaction, BkpTransaction } from '../types';
import { formatCurrency, numberToWords } from '../utils/formatter';

interface RekonsiliasiProps {
    bkuTransactions: BkuTransaction[];
    bkpTransactions: BkpTransaction[];
}

interface ReconciliationSummary {
    saldoAwal: number;
    totalPenerimaanBku: number;
    jumlahDanaDikelola: number;
    totalPengeluaranBku: number;
    saldoAkhirBku: number;
    saldoAkhirBkp: number;
    kasTunai: number;
    kasDiBank: number;
    totalSaldoRiil: number;
    selisih: number;
}

const Rekonsiliasi: React.FC<RekonsiliasiProps> = ({ bkuTransactions, bkpTransactions }) => {
    // Manual Inputs State
    const [inputKasTunai, setInputKasTunai] = useState<number | ''>('');
    const [inputKasBank, setInputKasBank] = useState<number | ''>('');

    const summaryData = useMemo((): ReconciliationSummary | null => {
        // Use 0 if no data provided yet to avoid crashes, allow inputs to work even with empty data
        const sortedBku = [...bkuTransactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        const sortedBkp = [...bkpTransactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        
        let saldoAwal = 0;
        let totalPenerimaanBku = 0;
        let totalPengeluaranBku = 0;
        let saldoAkhirBku = 0;
        let saldoAkhirBkp = 0;

        if (bkuTransactions.length > 0) {
            const firstTxBku = sortedBku[0];
            const lastTxBku = sortedBku[sortedBku.length - 1];
            saldoAwal = firstTxBku.saldo - firstTxBku.penerimaan + firstTxBku.pengeluaran;
            totalPenerimaanBku = sortedBku.reduce((sum, tx) => sum + tx.penerimaan, 0);
            totalPengeluaranBku = sortedBku.reduce((sum, tx) => sum + tx.pengeluaran, 0);
            saldoAkhirBku = lastTxBku.saldo;
        }

        if (bkpTransactions.length > 0) {
             const lastTxBkp = sortedBkp[sortedBkp.length - 1];
             saldoAkhirBkp = lastTxBkp.saldo;
        }

        const jumlahDanaDikelola = saldoAwal + totalPenerimaanBku;
        
        // Real Values from Inputs
        const kasTunai = Number(inputKasTunai) || 0;
        const kasDiBank = Number(inputKasBank) || 0;
        const totalSaldoRiil = kasTunai + kasDiBank;
        
        // Selisih = Saldo BKU - Saldo Riil (Positive means missing money/defisit, Negative means surplus)
        // Standard reconciliation: Book Balance - Physical Balance
        const selisih = saldoAkhirBku - totalSaldoRiil;

        return {
            saldoAwal,
            totalPenerimaanBku,
            jumlahDanaDikelola,
            totalPengeluaranBku,
            saldoAkhirBku,
            saldoAkhirBkp,
            kasTunai,
            kasDiBank,
            totalSaldoRiil,
            selisih,
        };
    }, [bkuTransactions, bkpTransactions, inputKasTunai, inputKasBank]);
    
    if (!summaryData) {
         // Initial render fallback if needed
         return null;
    }

    const isBkpMatch = summaryData.saldoAkhirBku === summaryData.saldoAkhirBkp;
    
    const terbilang = (val: number | '') => {
        const num = Number(val) || 0;
        return num > 0 ? numberToWords(num) + ' Rupiah' : '';
    }

    return (
         <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800 animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-6">Laporan Rekonsiliasi</h2>
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                        <tr>
                            <th scope="col" className="px-6 py-4 w-2/3">Uraian</th>
                            <th scope="col" className="px-6 py-4 text-right">Jumlah (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50"><td className="px-6 py-4 font-semibold text-white">A. Saldo Awal</td><td className="px-6 py-4 text-right text-white">{formatCurrency(summaryData.saldoAwal)}</td></tr>
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50"><td className="px-6 py-4">B. Total Penerimaan (Debet BKU)</td><td className="px-6 py-4 text-right text-green-400">{formatCurrency(summaryData.totalPenerimaanBku)}</td></tr>
                        <tr className="bg-gray-800/50 border-b border-gray-800 font-bold"><td className="px-6 py-4 text-white">C. Jumlah Dana Dikelola (A+B)</td><td className="px-6 py-4 text-right text-white">{formatCurrency(summaryData.jumlahDanaDikelola)}</td></tr>
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50"><td className="px-6 py-4">D. Total Pengeluaran (Kredit BKU)</td><td className="px-6 py-4 text-right text-red-400">{formatCurrency(summaryData.totalPengeluaranBku)}</td></tr>
                        <tr className="bg-gray-800/50 border-b border-gray-800 font-bold"><td className="px-6 py-4 text-white">E. Saldo Akhir Menurut BKU (C-D)</td><td className="px-6 py-4 text-right text-teal-400">{formatCurrency(summaryData.saldoAkhirBku)}</td></tr>
                        
                        <tr className="bg-gray-900 h-8"><td colSpan={2}></td></tr>

                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="px-6 py-4 flex items-center justify-between">
                                <span>Saldo Menurut BKP (Wajib Sama dengan E)</span> 
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${isBkpMatch ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800' : 'bg-red-900/30 text-red-400 border border-red-800'}`}>
                                    {isBkpMatch ? 'COCOK' : 'TIDAK COCOK'}
                                </span>
                            </td>
                            <td className={`px-6 py-4 text-right font-semibold ${!isBkpMatch ? 'text-red-400' : 'text-white'}`}>{formatCurrency(summaryData.saldoAkhirBkp)}</td>
                        </tr>

                        {/* INPUT ROW: KAS TUNAI */}
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="px-6 py-4 align-top">
                                <span className="block mt-2">Kas Tunai Di Juru Raksa</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                    <input 
                                        type="number" 
                                        value={inputKasTunai} 
                                        onChange={(e) => setInputKasTunai(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-right w-48 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 italic">{formatCurrency(Number(inputKasTunai))}</span>
                                    <span className="text-[10px] text-teal-400/70 italic max-w-[250px]">{terbilang(inputKasTunai)}</span>
                                </div>
                            </td>
                        </tr>

                        {/* INPUT ROW: KAS BANK */}
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50">
                            <td className="px-6 py-4 align-top">
                                <span className="block mt-2">Kas di Bank (Sesuai Rekening Koran)</span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <div className="flex flex-col items-end gap-1">
                                    <input 
                                        type="number" 
                                        value={inputKasBank} 
                                        onChange={(e) => setInputKasBank(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-white text-right w-48 focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="0"
                                    />
                                    <span className="text-xs text-gray-500 italic">{formatCurrency(Number(inputKasBank))}</span>
                                    <span className="text-[10px] text-teal-400/70 italic max-w-[250px]">{terbilang(inputKasBank)}</span>
                                </div>
                            </td>
                        </tr>

                        <tr className="bg-gray-800/50 border-b border-gray-800 font-bold"><td className="px-6 py-4 text-white">Total Saldo Akhir Riil (F)</td><td className="px-6 py-4 text-right text-white">{formatCurrency(summaryData.totalSaldoRiil)}</td></tr>

                        <tr className="bg-gray-900 h-8"><td colSpan={2}></td></tr>
                        
                        <tr className={`font-bold text-lg ${summaryData.selisih === 0 ? 'bg-emerald-900/20 text-emerald-400 border-t border-emerald-800' : 'bg-red-900/20 text-red-400 border-t border-red-800'}`}>
                            <td className="px-6 py-4">Selisih (E-F)</td>
                            <td className="px-6 py-4 text-right tracking-tight">{formatCurrency(summaryData.selisih)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Rekonsiliasi;
