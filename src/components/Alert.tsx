import React from 'react';

interface AlertProps {
  message: string;
  type: 'error' | 'success';
}

const Alert: React.FC<AlertProps> = ({ message, type }) => {
  if (!message) return null;

  const styles = type === 'error' 
    ? 'bg-red-50 text-red-700 border-red-200' 
    : 'bg-emerald-50 text-emerald-700 border-emerald-200';

  return (
    <div className={`p-4 rounded-lg border text-sm font-medium mb-4 ${styles}`}>
      {message}
    </div>
  );
};

export default Alert;