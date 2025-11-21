
import React, { useMemo, useState, useEffect } from 'react';
import { DollarSign, TrendingDown, Wallet, Calendar, Filter } from 'lucide-react';
import type { BkuData, MonthlyData, CategoryData, Transaction } from '../types';
import StatCard from '../components/dashboard/StatCard';
import MonthlyBarChart from '../components/dashboard/MonthlyBarChart';
import MonthlyLineChart from '../components/dashboard/MonthlyLineChart';
import CategoryDonutChart from '../components/dashboard/CategoryDonutChart';
import RecentActivity from '../components/dashboard/RecentActivity';
import TopTransactions from '../components/dashboard/TopTransactions';
import { formatCurrency } from '../utils/formatter';

interface DashboardProps {
  bkuData: BkuData[];
}

const Dashboard: React.FC<DashboardProps> = ({ bkuData }) => {
  // Get unique years from data, default to current year
  const availableYears = useMemo(() => {
      const years = new Set<number>();
      years.add(new Date().getFullYear()); // Always include current year
      bkuData.forEach(item => {
          const d = new Date(item.tanggal);
          if (!isNaN(d.getTime())) {
              years.add(d.getFullYear());
          }
      });
      return Array.from(years).sort((a, b) => b - a);
  }, [bkuData]);

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Filter data based on selected year
  const filteredBkuData = useMemo(() => {
      return bkuData.filter(item => {
          const d = new Date(item.tanggal);
          return !isNaN(d.getTime()) && d.getFullYear() === selectedYear;
      });
  }, [bkuData, selectedYear]);

  // --- STATS (Derived from Filtered Data) ---
  const summaryData = useMemo(() => {
    const totalRevenue = filteredBkuData.reduce((acc, item) => acc + item.penerimaan, 0);
    const totalExpenses = filteredBkuData.reduce((acc, item) => acc + item.pengeluaran, 0);
    
    // Balance calculation needs to consider:
    // 1. If viewing current year: Show actual current running balance (latest BKU entry).
    // 2. If viewing past year: Show balance at end of that year.
    // However, for simplicity in this dashboard view, we usually show the net result of the year 
    // or the cumulative balance up to that point. 
    // Let's show the Surplus/Deficit for the selected year and the End Balance of that specific year.
    
    let balance = 0;
    // Find the last transaction of the selected year to get the running balance at that time
    // Sort filtered data by date
    const sortedFiltered = [...filteredBkuData].sort((a,b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    if (sortedFiltered.length > 0) {
        balance = sortedFiltered[sortedFiltered.length - 1].saldo;
    } else {
        // If no data for selected year, look for the last transaction of previous years to get opening balance?
        // For now, 0 is safer if no transactions exist in that year.
        balance = 0; 
    }

    return { totalRevenue, totalExpenses, balance };
  }, [filteredBkuData]);

  // --- CHARTS (Derived from Filtered Data) ---
  const monthlyChartData: MonthlyData[] = useMemo(() => {
    const monthly: { [key: string]: { penerimaan: number; realisasi: number } } = {};
    
    // Initialize all months for the selected year to ensure chart looks complete
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    monthNames.forEach(m => {
        const key = `${m} ${selectedYear}`;
        monthly[key] = { penerimaan: 0, realisasi: 0 };
    });

    filteredBkuData.forEach(item => {
      const monthIndex = new Date(item.tanggal).getMonth();
      const key = `${monthNames[monthIndex]} ${selectedYear}`;
      if (monthly[key]) {
          monthly[key].penerimaan += item.penerimaan;
          monthly[key].realisasi += item.pengeluaran;
      }
    });

    return Object.entries(monthly).map(([name, values]) => ({ name, ...values }));
  }, [filteredBkuData, selectedYear]);

  const revenueCategoryData: CategoryData[] = useMemo(() => {
    const categories: { [key: string]: number } = {};
    filteredBkuData.forEach(item => {
      if (item.penerimaan > 0) {
        const category = item.kategori || 'Lain-lain'; 
        if (!categories[category]) {
            categories[category] = 0;
        }
        categories[category] += item.penerimaan;
      }
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);
  }, [filteredBkuData]);

  const expenseCategoryData: CategoryData[] = useMemo(() => {
      const categories: { [key: string]: number } = {};
      filteredBkuData.forEach(item => {
        if (item.pengeluaran > 0) {
            const category = item.kategori || 'Lain-lain';
            if (!categories[category]) {
                categories[category] = 0;
            }
            categories[category] += item.pengeluaran;
        }
      });

      return Object.entries(categories)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value);
  }, [filteredBkuData]);
  
  const allTransactions: Transaction[] = useMemo(() => 
    filteredBkuData.flatMap(item => {
        const transactions: Transaction[] = [];
        if (item.penerimaan > 0) {
            transactions.push({
                id: `${item.id}-p`,
                date: item.tanggal,
                description: item.uraian,
                amount: item.penerimaan,
                type: 'Penerimaan',
                category: item.kategori || 'Pendapatan',
            });
        }
        if (item.pengeluaran > 0) {
            transactions.push({
                id: `${item.id}-k`,
                date: item.tanggal,
                description: item.uraian,
                amount: item.pengeluaran,
                type: 'Realisasi',
                category: item.kategori || 'Belanja',
            });
        }
        return transactions;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  , [filteredBkuData]);

  const recentTransactions = allTransactions.slice(0, 5);
  const topTransactions = [...allTransactions].sort((a,b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-lg">
          <div className="flex items-center gap-2">
             <div className="bg-teal-500/20 p-2 rounded-full">
                <TrendingDown className="h-6 w-6 text-teal-400" />
             </div>
             <div>
                 <h2 className="text-lg font-bold text-white">Ikhtisar Keuangan</h2>
                 <p className="text-sm text-gray-400">Tahun Anggaran {selectedYear}</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <label htmlFor="year-select" className="text-sm text-gray-300">Tahun:</label>
                  <select
                    id="year-select"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                      {availableYears.map(year => (
                          <option key={year} value={year} className="bg-gray-800">{year}</option>
                      ))}
                  </select>
              </div>
          </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title={`Total Penerimaan (${selectedYear})`} 
          value={formatCurrency(summaryData.totalRevenue)} 
          icon={DollarSign}
          iconBgColor="bg-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard 
          title={`Total Realisasi (${selectedYear})`} 
          value={formatCurrency(summaryData.totalExpenses)} 
          icon={TrendingDown}
          iconBgColor="bg-red-500/20"
          iconColor="text-red-400"
        />
        <StatCard 
          title="Saldo Akhir (Per hari ini)" 
          value={formatCurrency(summaryData.balance)} 
          icon={Wallet}
          iconBgColor="bg-sky-500/20"
          iconColor="text-sky-400"
        />
      </div>

      {/* Main Charts - Stacked Vertically */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
         <h3 className="text-lg font-semibold mb-4 text-white">Ringkasan Bulanan {selectedYear}</h3>
         <MonthlyBarChart data={monthlyChartData} />
      </div>
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
         <h3 className="text-lg font-semibold mb-4 text-white">Pergerakan Saldo {selectedYear}</h3>
         <MonthlyLineChart data={monthlyChartData} />
      </div>
      
      {/* Pie Charts - Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDonutChart title={`Penerimaan per Kategori (${selectedYear})`} data={revenueCategoryData} />
          <CategoryDonutChart title={`Realisasi per Kategori (${selectedYear})`} data={expenseCategoryData} />
      </div>

      {/* Details Lists - Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <RecentActivity transactions={recentTransactions} />
         <TopTransactions transactions={topTransactions} />
      </div>
    </div>
  );
};

export default Dashboard;
