import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../../utils/formatting';

interface KPICardProps {
  title: string;
  value: number;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  isDarkMode: boolean;
  format: 'currency' | 'percentage' | 'number';
  subtitle?: string;
  change?: number;
  changeFormat?: 'currency' | 'percentage';
}

const KPICard: React.FC<KPICardProps> = React.memo(({
  title,
  value,
  trend,
  icon: Icon,
  isDarkMode,
  format,
  subtitle,
  change,
  changeFormat = 'currency'
}) => {
  const formatValue = (val: number): string => {
    switch (format) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toFixed(2);
      default:
        return val.toString();
    }
  };

  const formatChange = (val: number): string => {
    switch (changeFormat) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toString();
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') {
      return isDarkMode ? 'text-emerald-400' : 'text-emerald-600';
    } else if (trend === 'down') {
      return isDarkMode ? 'text-red-400' : 'text-red-600';
    }
    return isDarkMode ? 'text-slate-400' : 'text-gray-600';
  };

  const getTrendBg = () => {
    if (trend === 'up') {
      return isDarkMode 
        ? 'bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border-emerald-500/20'
        : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200';
    } else if (trend === 'down') {
      return isDarkMode 
        ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border-red-500/20'
        : 'bg-gradient-to-br from-red-50 to-red-100 border-red-200';
    }
    return isDarkMode 
      ? 'bg-slate-800/50 border-slate-700/50'
      : 'bg-white border-gray-200';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${getTrendBg()}`}>
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-12 translate-x-12 transition-all duration-300 ${
        trend === 'up' 
          ? (isDarkMode ? 'bg-emerald-500/10' : 'bg-emerald-500/20')
          : trend === 'down'
          ? (isDarkMode ? 'bg-red-500/10' : 'bg-red-500/20')
          : (isDarkMode ? 'bg-slate-500/10' : 'bg-gray-500/20')
      }`}></div>

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            trend === 'up' 
              ? 'bg-emerald-500/20' 
              : trend === 'down'
              ? 'bg-red-500/20'
              : 'bg-gray-500/20'
          }`}>
            <Icon className={`h-6 w-6 ${getTrendColor()}`} />
          </div>
          
          {trend !== 'neutral' && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              trend === 'up' 
                ? (isDarkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700')
                : (isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700')
            }`}>
              <TrendIcon className="h-3 w-3" />
              {change !== undefined && (
                <span>{change >= 0 ? '+' : ''}{formatChange(change)}</span>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className={`text-sm font-medium transition-all duration-300 ${
            isDarkMode ? 'text-slate-400' : 'text-gray-600'
          }`}>
            {title}
          </p>
          
          <p className={`text-3xl font-bold transition-all duration-300 ${getTrendColor()}`}>
            {formatValue(value)}
          </p>
          
          {subtitle && (
            <p className={`text-xs transition-all duration-300 ${
              isDarkMode ? 'text-slate-500' : 'text-gray-500'
            }`}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});

KPICard.displayName = 'KPICard';

export default KPICard;



