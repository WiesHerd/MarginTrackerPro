import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ReferenceLine,
} from 'recharts';

type EquityPoint = { date: string; portfolioValue: number; benchmarkValue: number };
type PnLPoint = { tradeId: string; profitLoss: number; interest: number };
type MarginPoint = { date: string; marginUtilizationPercent: number };

const equityData: EquityPoint[] = [
  { date: '2025-01-02', portfolioValue: 100000, benchmarkValue: 100000 },
  { date: '2025-02-01', portfolioValue: 103500, benchmarkValue: 101200 },
  { date: '2025-03-01', portfolioValue: 108200, benchmarkValue: 103000 },
  { date: '2025-04-01', portfolioValue: 104700, benchmarkValue: 102800 },
  { date: '2025-05-01', portfolioValue: 112400, benchmarkValue: 105900 },
  { date: '2025-06-01', portfolioValue: 115800, benchmarkValue: 107100 },
];

const pnlData: PnLPoint[] = [
  { tradeId: 'T-101', profitLoss: 2400, interest: 120 },
  { tradeId: 'T-102', profitLoss: -900, interest: 85 },
  { tradeId: 'T-103', profitLoss: 1350, interest: 60 },
  { tradeId: 'T-104', profitLoss: -450, interest: 40 },
  { tradeId: 'T-105', profitLoss: 620, interest: 52 },
];

const marginData: MarginPoint[] = [
  { date: '2025-01-02', marginUtilizationPercent: 22 },
  { date: '2025-02-01', marginUtilizationPercent: 38 },
  { date: '2025-03-01', marginUtilizationPercent: 56 },
  { date: '2025-04-01', marginUtilizationPercent: 72 },
  { date: '2025-05-01', marginUtilizationPercent: 68 },
  { date: '2025-06-01', marginUtilizationPercent: 81 },
];

const currency = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 });

const percent = (n: number) => `${n.toFixed(0)}%`;

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl shadow-2xl p-5 bg-white/90 dark:bg-slate-800/50 border border-gray-200/50 dark:border-slate-700/50">
    <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
    <div className="w-full h-72">
      {children}
    </div>
  </div>
);

interface Props { embedded?: boolean }

const RechartsDashboard: React.FC<Props> = ({ embedded }) => {
  const Grid = (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equity Curve vs Benchmark */}
        <Card title="Equity Curve vs Benchmark">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={currency} tick={{ fontSize: 12, fill: '#6b7280' }} width={72} />
              <Tooltip formatter={(v: number) => currency(v)} labelClassName="text-xs" />
              <Legend verticalAlign="top" height={24} />
              <Line type="monotone" dataKey="portfolioValue" name="Portfolio" stroke="#10B981" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="benchmarkValue" name="Benchmark" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* P&L vs Interest by Trade */}
        <Card title="P&L vs Interest by Trade">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pnlData} stackOffset="sign" margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="tradeId" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={currency} tick={{ fontSize: 12, fill: '#6b7280' }} width={72} />
              <Tooltip formatter={(v: number) => currency(v)} labelClassName="text-xs" />
              <Legend verticalAlign="top" height={24} />
              <Bar dataKey="profitLoss" name="Profit/Loss" stackId="pnl"
                   fill="#10B981" stroke="#10B981" />
              <Bar dataKey="interest" name="Interest" stackId="pnl"
                   fill="#9CA3AF" stroke="#9CA3AF" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Margin Utilization Over Time */}
        <Card title="Margin Utilization Over Time">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={marginData} margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="utilGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tickFormatter={(v:number)=>`${v}%`} tick={{ fontSize: 12, fill: '#6b7280' }} width={56} domain={[0, 120]} />
              <Tooltip formatter={(v: number) => percent(v)} labelClassName="text-xs" />
              <Legend verticalAlign="top" height={24} />
              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '100% Max', fill: '#ef4444', fontSize: 11 }} />
              <Area type="monotone" dataKey="marginUtilizationPercent" name="Utilization"
                    stroke="#3B82F6" fill="url(#utilGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
  );

  if (embedded) {
    return Grid;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">{Grid}</div>
  );
};

export default RechartsDashboard;


