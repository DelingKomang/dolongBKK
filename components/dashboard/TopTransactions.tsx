
import React from 'react';
import type { Transaction } from '../../types';

interface TopTransactionsProps {
  transactions: Transaction[];
}

const TopTransactions: React.FC<TopTransactionsProps> = ({ transactions }) => {
    const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-xl border border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-white">Top 5 Transaksi Terbesar</h3>
      <ul className="space-y-3">
        {transactions.map((tx, index) => (
          <li key={tx.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-800">
            <div className="flex items-center space-x-4">
              <span className="text-lg font-bold text-teal-400">{index + 1}</span>
              <div>
                <p className="font-medium text-white">{tx.description}</p>
                <p className={`text-xs ${tx.type === 'Penerimaan' ? 'text-green-500' : 'text-red-500'}`}>{tx.type}</p>
              </div>
            </div>
            <p className="font-semibold text-white">
              {formatCurrency(tx.amount)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TopTransactions;
