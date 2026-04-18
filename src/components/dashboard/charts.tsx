"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartData {
  name: string;
  종합: number;
  내용: number;
  논리: number;
  완성도: number;
  표현력: number;
}

export function DashboardCharts({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(value) => [typeof value === "number" ? `${value}점` : String(value)]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="종합" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
        <Line type="monotone" dataKey="내용" stroke="#16a34a" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        <Line type="monotone" dataKey="논리" stroke="#9333ea" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        <Line type="monotone" dataKey="완성도" stroke="#ea580c" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
        <Line type="monotone" dataKey="표현력" stroke="#0891b2" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
