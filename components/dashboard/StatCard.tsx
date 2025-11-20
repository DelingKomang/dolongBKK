
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconBgColor, iconColor }) => {
  return (
    <div className="bg-gray-900 p-5 rounded-lg shadow-xl border border-gray-800 flex items-center space-x-4 transition-all duration-300 hover:shadow-teal-500/10 hover:border-teal-800">
      <div className={`p-3 rounded-full ${iconBgColor}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
