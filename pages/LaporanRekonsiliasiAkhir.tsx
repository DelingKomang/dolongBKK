
import React, { useMemo } from 'react';
import type { BkuTransaction, BudgetItem } from '../types';
import { Printer } from 'lucide-react';

interface LaporanRekonsiliasiAkhirProps {
    bkuTransactions: BkuTransaction[];
    budgetItems: BudgetItem[];
}

interface ReportRow {
    id: string;
    kode: string;
    uraian: string;
    anggaran: number;
    realisasi: number;
    persentase: number;
}

const LaporanRekonsiliasiAkhir: React.FC<LaporanRekonsiliasiAkhirProps> = ({ bkuTransactions, budgetItems }) => {
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

    const { 
        pendapatanData, 
        belanjaRutinInsentifData,
        belanjaRutinOperasionalData,
        parhyanganData,
        pawonganData,
        palemahanData,
        totalPendapatan, 
        totalBelanjaRutin, 
        totalBelanjaProgram, 
        surplusDefisit 
    } = useMemo(() => {
        // 1. Calculate Realization from BKU (Grouped by Category Name)
        const realizationMap = {
            pendapatan: {} as Record<string, number>,
            belanja: {} as Record<string, number>
        };
        
        bkuTransactions.forEach(tx => {
            // Normalization: trim and lowercase for better matching
            const category = (tx.kategori || '').trim();
            if (!category) return;

            if (tx.penerimaan > 0) {
                 // Find matching budget key if any (case insensitive match)
                 realizationMap.pendapatan[category] = (realizationMap.pendapatan[category] || 0) + tx.penerimaan;
            }
            if (tx.pengeluaran > 0) {
                 realizationMap.belanja[category] = (realizationMap.belanja[category] || 0) + tx.pengeluaran;
            }
        });

        // 2. Generate Rows strictly from BudgetItems (No auto-inference from BKU)
        const generateRows = (type: 'pendapatan' | 'belanja-rutin-insentif' | 'belanja-rutin-operasional' | 'belanja-program-parhyangan' | 'belanja-program-pawongan' | 'belanja-program-palemahan'): ReportRow[] => {
            const rows: ReportRow[] = [];

            budgetItems
                .filter(item => item.type === type)
                .forEach(item => {
                    const categoryName = item.uraian.trim();
                    
                    // Determine which map to use
                    // Expenditures (both Rutin and Program) come from the 'belanja' map in BKU
                    const mapType = type === 'pendapatan' ? 'pendapatan' : 'belanja';

                    let realisasi = realizationMap[mapType][categoryName] || 0;
                    
                    // Fallback: try finding case-insensitive match in realization map if exact match fails
                    if (realisasi === 0) {
                         const key = Object.keys(realizationMap[mapType]).find(k => k.toLowerCase() === categoryName.toLowerCase());
                         if (key) realisasi = realizationMap[mapType][key];
                    }
                    
                    rows.push({
                        id: item.id,
                        kode: item.kode,
                        uraian: item.uraian,
                        anggaran: item.jumlah,
                        realisasi: realisasi,
                        persentase: item.jumlah > 0 ? (realisasi / item.jumlah) * 100 : 0,
                    });
                });

            // Sort alphabetically by description
            return rows.sort((a, b) => a.uraian.localeCompare(b.uraian));
        };

        const pendapatanData = generateRows('pendapatan');
        const belanjaRutinInsentifData = generateRows('belanja-rutin-insentif');
        const belanjaRutinOperasionalData = generateRows('belanja-rutin-operasional');
        
        // New Sub-categories for Program
        const parhyanganData = generateRows('belanja-program-parhyangan');
        const pawonganData = generateRows('belanja-program-pawongan');
        const palemahanData = generateRows('belanja-program-palemahan');

        // 3. Calculate Totals
        const createTotal = (data: ReportRow[], label: string) => data.reduce((acc, item) => ({
            id: `total-${label.replace(/\s+/g, '-').toLowerCase()}`,
            kode: '',
            uraian: label,
            anggaran: acc.anggaran + item.anggaran,
            realisasi: acc.realisasi + item.realisasi,
            persentase: 0
        }), { id: '', kode: '', uraian: '', anggaran: 0, realisasi: 0, persentase: 0 });
        
        const totalPendapatan = createTotal(pendapatanData, 'Total Pendapatan');
        if (totalPendapatan.anggaran > 0) {
            totalPendapatan.persentase = (totalPendapatan.realisasi / totalPendapatan.anggaran) * 100;
        }

        // Combine totals for Belanja Rutin (Insentif + Operasional)
        const totalInsentif = createTotal(belanjaRutinInsentifData, 'Subtotal Insentif');
        const totalOperasional = createTotal(belanjaRutinOperasionalData, 'Subtotal Operasional');
        
        const totalBelanjaRutin = {
            id: 'total-belanja-rutin',
            kode: '',
            uraian: 'Total Belanja Rutin',
            anggaran: totalInsentif.anggaran + totalOperasional.anggaran,
            realisasi: totalInsentif.realisasi + totalOperasional.realisasi,
            persentase: 0
        };
        if(totalBelanjaRutin.anggaran > 0) {
            totalBelanjaRutin.persentase = (totalBelanjaRutin.realisasi / totalBelanjaRutin.anggaran) * 100;
        }

        // Combine totals for Belanja Program (Parhyangan + Pawongan + Palemahan)
        const totalParhyangan = createTotal(parhyanganData, 'Subtotal Parhyangan');
        const totalPawongan = createTotal(pawonganData, 'Subtotal Pawongan');
        const totalPalemahan = createTotal(palemahanData, 'Subtotal Palemahan');

        const totalBelanjaProgram = {
             id: 'total-belanja-program',
             kode: '',
             uraian: 'Total Belanja Program',
             anggaran: totalParhyangan.anggaran + totalPawongan.anggaran + totalPalemahan.anggaran,
             realisasi: totalParhyangan.realisasi + totalPawongan.realisasi + totalPalemahan.realisasi,
             persentase: 0
        }
        if(totalBelanjaProgram.anggaran > 0) {
            totalBelanjaProgram.persentase = (totalBelanjaProgram.realisasi / totalBelanjaProgram.anggaran) * 100;
        }

        const totalBelanjaAllAnggaran = totalBelanjaRutin.anggaran + totalBelanjaProgram.anggaran;
        const totalBelanjaAllRealisasi = totalBelanjaRutin.realisasi + totalBelanjaProgram.realisasi;

        const surplusDefisit = {
            id: 'surplus',
            kode: '',
            uraian: 'Surplus / (Defisit)',
            anggaran: totalPendapatan.anggaran - totalBelanjaAllAnggaran,
            realisasi: totalPendapatan.realisasi - totalBelanjaAllRealisasi,
            persentase: 0
        };

        return { 
            pendapatanData, 
            belanjaRutinInsentifData,
            belanjaRutinOperasionalData,
            parhyanganData,
            pawonganData,
            palemahanData,
            totalPendapatan, 
            totalBelanjaRutin, 
            totalBelanjaProgram, 
            surplusDefisit 
        };
    }, [bkuTransactions, budgetItems]);


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

    const ReportTableBase: React.FC<{ data: ReportRow[] }> = ({ data }) => (
        <>
            {data.length === 0 ? (
                <tr>
                    <td colSpan={4} className="text-center py-2 text-gray-500 italic border-b border-gray-800">
                        - Tidak ada data -
                    </td>
                </tr>
            ) : (
                data.map((item) => (
                    <tr key={item.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="px-4 py-2 pl-8 text-white">
                            {item.uraian}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-300">{formatCurrency(item.anggaran)}</td>
                        <td className="px-4 py-2 text-right text-gray-300">{formatCurrency(item.realisasi)}</td>
                        <td className="px-4 py-2 text-right text-gray-300">{item.anggaran > 0 ? item.persentase.toFixed(2) : '0.00'}%</td>
                    </tr>
                ))
            )}
        </>
    );

    const ReportHeaderRow: React.FC<{ title: string }> = ({ title }) => (
         <tr className="bg-gray-800/50 font-semibold text-white">
            <td className="px-4 py-2" colSpan={4}>{title}</td>
        </tr>
    );

    const ReportTotalRow: React.FC<{ total: any }> = ({ total }) => (
        <tr className="bg-gray-800 font-bold text-white">
            <td className="px-4 py-2">{total.uraian}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(total.anggaran)}</td>
            <td className="px-4 py-2 text-right">{formatCurrency(total.realisasi)}</td>
            <td className="px-4 py-2 text-right">{total.persentase.toFixed(2)}%</td>
        </tr>
    );

    return (
        <div className="bg-gray-900 rounded-2xl p-8 shadow-lg border border-gray-800" id="printable-area">
            <style>{printStyles}</style>
            
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

            {/* MAIN TABLE */}
            <div className="mb-8">
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-gray-800">
                        <tr>
                            <th className="px-4 py-3 w-[35%]">Kategori Anggaran</th>
                            <th className="px-4 py-3 text-right">Anggaran (A)</th>
                            <th className="px-4 py-3 text-right">Realisasi (R)</th>
                            <th className="px-4 py-3 text-right">% (R/A)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* I. PENDAPATAN */}
                        <ReportHeaderRow title="I. PENDAPATAN" />
                        <ReportTableBase data={pendapatanData} />
                        <ReportTotalRow total={totalPendapatan} />

                        {/* II. BELANJA RUTIN */}
                        <ReportHeaderRow title="II. BELANJA RUTIN" />
                        
                        {/* 1. Insentif */}
                        <tr className="bg-gray-800/30 text-gray-200">
                            <td className="px-4 py-2 pl-6 italic font-medium" colSpan={4}>1. Insentif</td>
                        </tr>
                        <ReportTableBase data={belanjaRutinInsentifData} />

                        {/* 2. Operasional */}
                        <tr className="bg-gray-800/30 text-gray-200">
                            <td className="px-4 py-2 pl-6 italic font-medium" colSpan={4}>2. Operasional</td>
                        </tr>
                        <ReportTableBase data={belanjaRutinOperasionalData} />
                        
                        {/* Total Belanja Rutin */}
                        <ReportTotalRow total={totalBelanjaRutin} />


                        {/* III. BELANJA PROGRAM */}
                        <ReportHeaderRow title="III. BELANJA PROGRAM" />
                        
                         {/* 1. Baga Parhyangan */}
                         <tr className="bg-gray-800/30 text-gray-200">
                            <td className="px-4 py-2 pl-6 italic font-medium" colSpan={4}>1. Baga Parhyangan</td>
                        </tr>
                        <ReportTableBase data={parhyanganData} />

                         {/* 2. Baga Pawongan */}
                         <tr className="bg-gray-800/30 text-gray-200">
                            <td className="px-4 py-2 pl-6 italic font-medium" colSpan={4}>2. Baga Pawongan</td>
                        </tr>
                        <ReportTableBase data={pawonganData} />

                         {/* 3. Baga Palemahan */}
                         <tr className="bg-gray-800/30 text-gray-200">
                            <td className="px-4 py-2 pl-6 italic font-medium" colSpan={4}>3. Baga Palemahan</td>
                        </tr>
                        <ReportTableBase data={palemahanData} />

                        <ReportTotalRow total={totalBelanjaProgram} />

                    </tbody>
                </table>
                </div>
            </div>


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
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-gray-800 font-bold text-white">
                           <td className="px-4 py-2">{surplusDefisit.uraian}</td>
                           <td className="px-4 py-2 text-right">{formatCurrency(surplusDefisit.anggaran)}</td>
                           <td className="px-4 py-2 text-right">{formatCurrency(surplusDefisit.realisasi)}</td>
                           <td></td>
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
        </div>
    );
};

export default LaporanRekonsiliasiAkhir;