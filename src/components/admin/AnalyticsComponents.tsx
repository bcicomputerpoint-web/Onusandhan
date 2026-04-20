import React from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Users, BookOpen, 
  CheckCircle, Clock, FileText, BarChart3, TrendingUp
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';

// 1. KPI Card
interface KpiCardProps {
  title: string;
  value: string | number;
  trend: number;
  icon: React.ElementType;
  description: string;
  color?: string;
}

export const AnalyticsKpiCard: React.FC<KpiCardProps> = ({ title, value, trend, icon: Icon, description, color = "indigo" }) => {
  const isPositive = trend >= 0;
  
  const colorMap: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100",
  };

  return (
    <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm hover:shadow-premium transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorMap[color] || colorMap.indigo} transition-transform group-hover:scale-110`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(trend)}%
        </div>
      </div>
      <div>
        <h3 className="text-slate-500 text-[13px] font-bold uppercase tracking-widest mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
        <p className="text-[12px] text-slate-400 font-medium mt-1">{description}</p>
      </div>
    </div>
  );
};

// 2. Trend Chart Card
export const TrendChartCard = ({ title, data, dataKey, color = "#6366f1" }: any) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[18px] font-bold text-slate-800 tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" /> {title}
        </h3>
        <select className="bg-slate-50 border-none rounded-xl px-4 py-2 text-[12px] font-bold text-slate-500 outline-none cursor-pointer">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Month</option>
        </select>
      </div>
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            />
            <Area 
              type="monotone" 
              dataKey={dataKey} 
              stroke={color} 
              strokeWidth={4}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 3. Simple Bar Chart Card
export const CoursePerformanceCard = ({ title, data }: any) => {
  return (
    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-premium h-full">
      <h3 className="text-[18px] font-bold text-slate-800 tracking-tight mb-8">{title}</h3>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis 
              type="category" 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              width={100}
              tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
            />
            <Tooltip 
               cursor={{ fill: 'transparent' }}
               contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="students" radius={[0, 8, 8, 0]} barSize={20}>
              {data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#a5b4fc'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// 4. Activity List
export const RecentAlertsPanel = ({ alerts }: any) => {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-premium overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-500" /> Action Required
        </h3>
        <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-widest">
           {alerts.length} High Priority
        </span>
      </div>
      <div className="p-2 space-y-1">
        {alerts.map((alert: any, idx: number) => (
          <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              alert.type === 'attendance' ? 'bg-orange-50 text-orange-500' : 'bg-rose-50 text-rose-500'
            }`}>
              {alert.type === 'attendance' ? <Users className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="text-[13px] font-bold text-slate-800 mb-0.5 group-hover:text-indigo-600 transition-colors">{alert.title}</h4>
              <p className="text-[11px] text-slate-400 font-medium">{alert.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 mt-1" />
          </div>
        ))}
      </div>
      <button className="w-full py-4 text-[12px] font-bold text-indigo-600 hover:bg-slate-50 border-t border-slate-100 uppercase tracking-widest transition-colors">
         Manage All Alerts
      </button>
    </div>
  );
};

const ChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
  </svg>
);

// 5. Analytics Table Component
export const AdminReportTable = ({ title, data, columns }: any) => {
  return (
    <div className="bg-white rounded-[32px] border border-slate-200 shadow-premium overflow-hidden">
      <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h3 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h3>
           <p className="text-[13px] text-slate-400 font-medium mt-1">Detailed performance breakdown for current period</p>
        </div>
        <div className="flex gap-2">
           <button className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-100">Export PDF</button>
           <button className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-[12px] font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">Export CSV</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col: string, i: number) => (
                <th key={i} className="px-8 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">{col}</th>
              ))}
              <th className="px-8 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] border-b border-slate-100">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                {Object.values(row).map((val: any, j: number) => (
                   <td key={j} className="px-8 py-5 border-b border-slate-50">
                     <span className={`text-[14px] font-bold ${typeof val === 'number' ? 'text-slate-500' : 'text-slate-800'}`}>
                        {val}
                     </span>
                   </td>
                ))}
                <td className="px-8 py-5 border-b border-slate-50 text-right">
                   <button className="text-[12px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
