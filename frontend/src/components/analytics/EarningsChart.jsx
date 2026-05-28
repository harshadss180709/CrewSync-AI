import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">${payload[0]?.value?.toLocaleString()}</p>
    </div>
  );
};

export default function EarningsChart({ data = [] }) {
  const chartData = data.map(d => ({
    month: MONTHS[(d._id?.month || 1) - 1],
    amount: d.total || d.amount || 0,
  }));

  // Pad with zeros if less than 6 points
  while (chartData.length < 6) {
    chartData.unshift({ month: MONTHS[Math.max(0, chartData.length)], amount: 0 });
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false}
          tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2}
          fill="url(#earningsGrad)" dot={{ fill: "#6366f1", strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: "#818cf8" }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
