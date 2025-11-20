
import React from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { Transaction } from '../../types';

interface RecentActivityProps {
  transactions: Transaction[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ transactions }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-white">Aktivitas Terkini</h3>
      <div className="space-y-3">
        {transactions.map(tx => (
          <div key={tx.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${tx.type === 'Penerimaan' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                {tx.type === 'Penerimaan' ? (
                  <ArrowUpRight className="h-5 w-5 text-green-400" />
                ) : (
                  <ArrowDownLeft className="h-5 w-5 text-red-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{tx.description}</p>
                <p className="text-xs text-gray-400">{tx.category}</p>
              </div>
            </div>
            <p className={`font-semibold ${tx.type === 'Penerimaan' ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(tx.amount)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;
