import React, { useMemo } from 'react';
import { DollarSign, TrendingDown, Wallet } from 'lucide-react';
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
  const summaryData = useMemo(() => {
    const totalRevenue = bkuData.reduce((acc, item) => acc + item.penerimaan, 0);
    const totalExpenses = bkuData.reduce((acc, item) => acc + item.pengeluaran, 0);
    const balance = bkuData.length > 0 ? bkuData[bkuData.length - 1].saldo : 0;
    return { totalRevenue, totalExpenses, balance };
  }, [bkuData]);

  const monthlyChartData: MonthlyData[] = useMemo(() => {
    const monthly: { [key: string]: { penerimaan: number; realisasi: number } } = {};
    bkuData.forEach(item => {
      const month = new Date(item.tanggal).toLocaleString('id-ID', { month: 'short', year: 'numeric' });
      if (!monthly[month]) {
        monthly[month] = { penerimaan: 0, realisasi: 0 };
      }
      monthly[month].penerimaan += item.penerimaan;
      monthly[month].realisasi += item.pengeluaran;
    });

    return Object.entries(monthly).map(([name, values]) => ({ name, ...values })).slice(-12); // Last 12 months
  }, [bkuData]);

  const revenueCategoryData: CategoryData[] = useMemo(() => {
    const categories: { [key: string]: number } = {};
    bkuData.forEach(item => {
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
  }, [bkuData]);

  const expenseCategoryData: CategoryData[] = useMemo(() => {
      const categories: { [key: string]: number } = {};
      bkuData.forEach(item => {
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
  }, [bkuData]);
  
  const allTransactions: Transaction[] = useMemo(() => 
    bkuData.flatMap(item => {
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
  , [bkuData]);

  const recentTransactions = allTransactions.slice(0, 5);
  const topTransactions = [...allTransactions].sort((a,b) => b.amount - a.amount).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Total Penerimaan" 
          value={formatCurrency(summaryData.totalRevenue)} 
          icon={DollarSign}
          iconBgColor="bg-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard 
          title="Total Realisasi" 
          value={formatCurrency(summaryData.totalExpenses)} 
          icon={TrendingDown}
          iconBgColor="bg-red-500/20"
          iconColor="text-red-400"
        />
        <StatCard 
          title="Saldo Akhir" 
          value={formatCurrency(summaryData.balance)} 
          icon={Wallet}
          iconBgColor="bg-sky-500/20"
          iconColor="text-sky-400"
        />
      </div>

      {/* Main Charts - Stacked Vertically */}
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
         <h3 className="text-lg font-semibold mb-4 text-white">Ringkasan Bulanan</h3>
         <MonthlyBarChart data={monthlyChartData} />
      </div>
      <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
         <h3 className="text-lg font-semibold mb-4 text-white">Pergerakan Saldo Bulanan</h3>
         <MonthlyLineChart data={monthlyChartData} />
      </div>
      
      {/* Pie Charts - Side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CategoryDonutChart title="Penerimaan per Kategori" data={revenueCategoryData} />
          <CategoryDonutChart title="Realisasi per Kategori" data={expenseCategoryData} />
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