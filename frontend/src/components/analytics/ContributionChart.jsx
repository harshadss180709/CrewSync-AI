import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#6366f1","#8b5cf6","#06b6d4","#ec4899","#f59e0b","#10b981","#f43f5e"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-dark-800 border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-sm font-semibold text-white">{payload[0].name}</p>
      <p className="text-sm text-brand-400">{payload[0].value}%</p>
    </div>
  );
};

export default function ContributionChart({ contributions = [] }) {
  const data = contributions.map(c => ({
    name:  c.freelancer?.name || "Unknown",
    value: c.percentage || c.contributionPercentage || 0,
  })).filter(d => d.value > 0);

  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
      No contribution data yet
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
          paddingAngle={3} dataKey="value">
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]}
              stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          formatter={(value) => <span className="text-xs text-gray-400">{value}</span>}
          iconType="circle" iconSize={8}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
