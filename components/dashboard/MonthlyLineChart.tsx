import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { MonthlyData } from '../../types';

interface MonthlyLineChartProps {
  data: MonthlyData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const format = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    return (
      <div className="p-2 bg-gray-800 border border-gray-700 rounded-md shadow-lg">
        <p className="label text-white font-bold">{`${label}`}</p>
        <p className="text-sky-400">{`Saldo : ${format(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};


const MonthlyLineChart: React.FC<MonthlyLineChartProps> = ({ data }) => {
  const filteredData = data.filter(item => item.penerimaan > 0 || item.realisasi > 0);
  const chartData = filteredData.map(d => ({ ...d, saldo: d.penerimaan - d.realisasi }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
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
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#4A5568', strokeWidth: 1 }}/>
          <Line type="monotone" dataKey="saldo" stroke="#38B2AC" strokeWidth={2} dot={{ r: 4, fill: '#38B2AC' }} activeDot={{ r: 8 }} name="Saldo"/>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyLineChart;