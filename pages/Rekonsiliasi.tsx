
import React, { useMemo } from 'react';
import type { BkuTransaction, BkpTransaction } from '../types';
import { formatCurrency } from '../utils/formatter';

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
    const summaryData = useMemo((): ReconciliationSummary | null => {
        if (bkuTransactions.length === 0 || bkpTransactions.length === 0) return null;

        const sortedBku = [...bkuTransactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        const sortedBkp = [...bkpTransactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
        
        const firstTxBku = sortedBku[0];
        const lastTxBku = sortedBku[sortedBku.length - 1];
        const lastTxBkp = sortedBkp[sortedBkp.length - 1];

        const saldoAwal = firstTxBku.saldo - firstTxBku.penerimaan + firstTxBku.pengeluaran;
        const totalPenerimaanBku = sortedBku.reduce((sum, tx) => sum + tx.penerimaan, 0);
        const totalPengeluaranBku = sortedBku.reduce((sum, tx) => sum + tx.pengeluaran, 0);
        const jumlahDanaDikelola = saldoAwal + totalPenerimaanBku;
        const saldoAkhirBku = lastTxBku.saldo;
        const saldoAkhirBkp = lastTxBkp.saldo;
        
        // Mock values for real cash to demonstrate functionality
        // In a real app, these might be inputs
        const kasTunai = 2550000;
        const kasDiBank = saldoAkhirBku - kasTunai; 
        const totalSaldoRiil = kasTunai + kasDiBank;
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
    }, [bkuTransactions, bkpTransactions]);
    
    if (!summaryData) {
        return (
             <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800 text-center">
                <h2 className="text-2xl font-bold text-white">Rekonsiliasi</h2>
                <p className="text-gray-400 mt-2">Data tidak cukup untuk melakukan rekonsiliasi.</p>
            </div>
        )
    }

    const isBkpMatch = summaryData.saldoAkhirBku === summaryData.saldoAkhirBkp;

    return (
         <div className="bg-gray-900 rounded-lg p-6 shadow-xl border border-gray-800">
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
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50"><td className="px-6 py-4">Kas Tunai Di Juru Raksa</td><td className="px-6 py-4 text-right text-white">{formatCurrency(summaryData.kasTunai)}</td></tr>
                        <tr className="bg-gray-900 border-b border-gray-800 hover:bg-gray-800/50"><td className="px-6 py-4">Kas di Bank (Sesuai Rekening Koran)</td><td className="px-6 py-4 text-right text-white">{formatCurrency(summaryData.kasDiBank)}</td></tr>
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
