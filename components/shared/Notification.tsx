
import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const getStyle = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/50 text-green-300 border-green-800';
      case 'error':
        return 'bg-red-900/50 text-red-300 border-red-800';
      case 'info':
      default:
        return 'bg-blue-900/50 text-blue-300 border-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      case 'info': default: return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg mb-4 border ${getStyle()} animate-fade-in-up`}>
      <div className="flex items-center gap-3">
        {getIcon()}
        <span>{message}</span>
      </div>
      <button onClick={onClose} className="hover:opacity-75 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Notification;
