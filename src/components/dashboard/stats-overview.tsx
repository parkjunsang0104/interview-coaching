"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Video, CheckCircle2, Trophy, TrendingUp, Flame } from "lucide-react";

interface Props {
  totalCount: number;
  completedCount: number;
  avgScore: number | null;
  maxScore: number | null;
}

export function StatsOverview({ totalCount, completedCount, avgScore, maxScore }: Props) {
  const completionRate =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* 전체 면접 횟수 */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E8DFC4] p-6 shadow-sm">
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#FCF0D6] rounded-xl flex items-center justify-center">
              <Video className="w-5 h-5 text-[#B40023]" />
            </div>
            <span className="text-sm font-semibold text-gray-700">전체 면접</span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-5xl font-bold text-[#B40023] leading-none">
              {totalCount}
            </span>
            <span className="text-lg text-gray-500 mb-1">회</span>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
            <Flame className="w-3.5 h-3.5 text-[#B40023]" />
            <span>지금까지 진행한 모든 면접</span>
          </div>
        </div>
      </div>

      {/* 완료된 면접 - 도넛 차트 */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E8DFC4] p-6 shadow-sm">
        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-[#FCF0D6] rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#B40023]" />
              </div>
              <span className="text-sm font-semibold text-gray-700">완료된 면접</span>
            </div>

            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold text-[#B40023] leading-none">
                {completedCount}
              </span>
              <span className="text-lg text-gray-400 mb-1">/ {totalCount}회</span>
            </div>

            <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-500">
              <TrendingUp className="w-3.5 h-3.5 text-[#B40023]" />
              <span>완료율 {completionRate}%</span>
            </div>
          </div>

          {/* 도넛 차트 */}
          <div className="relative w-24 h-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                innerRadius="72%"
                outerRadius="100%"
                data={[{ value: completionRate, fill: "#B40023" }]}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis
                  type="number"
                  domain={[0, 100]}
                  angleAxisId={0}
                  tick={false}
                />
                <RadialBar
                  background={{ fill: "#FCF0D6" }}
                  dataKey="value"
                  cornerRadius={20}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-base font-bold text-[#B40023]">
                {completionRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 평균 / 최고 점수 */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-[#E8DFC4] p-6 shadow-sm">
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#FCF0D6] rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-[#B40023]" />
            </div>
            <span className="text-sm font-semibold text-gray-700">점수 요약</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 평균 */}
            <div className="bg-[#FCF0D6] rounded-xl p-3 border border-[#E8DFC4]">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1">
                평균
              </p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-[#B40023] leading-none">
                  {avgScore ?? "-"}
                </span>
                {avgScore !== null && <span className="text-xs text-gray-500 mb-0.5">점</span>}
              </div>
              {avgScore !== null && (
                <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B40023] rounded-full transition-all"
                    style={{ width: `${avgScore}%` }}
                  />
                </div>
              )}
            </div>

            {/* 최고 */}
            <div className="bg-[#FCF0D6] rounded-xl p-3 border border-[#E8DFC4]">
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                <Trophy className="w-2.5 h-2.5 text-[#B40023]" />
                최고
              </p>
              <div className="flex items-end gap-1">
                <span className="text-3xl font-bold text-[#B40023] leading-none">
                  {maxScore ?? "-"}
                </span>
                {maxScore !== null && <span className="text-xs text-gray-500 mb-0.5">점</span>}
              </div>
              {maxScore !== null && (
                <div className="mt-2 h-1 bg-white rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#B40023] rounded-full transition-all"
                    style={{ width: `${maxScore}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
