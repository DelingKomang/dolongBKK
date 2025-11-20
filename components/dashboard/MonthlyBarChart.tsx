import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MonthlyData } from '../../types';

interface MonthlyBarChartProps {
  data: MonthlyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const format = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    return (
      <div className="p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="label text-white font-bold">{`${label}`}</p>
        <p className="text-green-400">{`Penerimaan : ${format(payload[0].value)}`}</p>
        <p className="text-red-400">{`Realisasi : ${format(payload[1].value)}`}</p>
      </div>
    );
  }
  return null;
};


const MonthlyBarChart: React.FC<MonthlyBarChartProps> = ({ data }) => {
  const filteredData = data.filter(item => item.penerimaan > 0 || item.realisasi > 0);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart
          data={filteredData}
          margin={{
            top: 5,
            right: 20,
            left: 30,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis dataKey="name" stroke="#A0AEC0" fontSize={12} />
          <YAxis 
            stroke="#A0AEC0" 
            fontSize={12} 
            tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: "compact", compactDisplay: "short" }).format(value as number)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(113, 128, 150, 0.1)' }} />
          <Legend wrapperStyle={{fontSize: "14px"}} />
          <Bar dataKey="penerimaan" fill="#38A169" name="Penerimaan" radius={[4, 4, 0, 0]} />
          <Bar dataKey="realisasi" fill="#E53E3E" name="Realisasi" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyBarChart;