"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  Trophy,
  Users,
} from "lucide-react";

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string; // ISO
  totalSessions: number;
  completedSessions: number;
  latestInterviewAt: string | null; // ISO or null
  avgScore: number | null;
  maxScore: number | null;
}

type SortKey = "name" | "latest" | "avg" | "max" | "total";
type SortDir = "asc" | "desc";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "latest", label: "최신 면접순" },
  { value: "avg", label: "평균 점수순" },
  { value: "max", label: "최고 점수순" },
  { value: "total", label: "면접 횟수순" },
  { value: "name", label: "이름순" },
];

export function StudentsList({ students }: { students: StudentRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("latest");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? students.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.email.toLowerCase().includes(q)
        )
      : [...students];

    const num = (a: number | null) => (a === null ? -Infinity : a);
    const time = (s: string | null) => (s ? new Date(s).getTime() : 0);

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name, "ko");
          break;
        case "latest":
          cmp = time(a.latestInterviewAt) - time(b.latestInterviewAt);
          break;
        case "avg":
          cmp = num(a.avgScore) - num(b.avgScore);
          break;
        case "max":
          cmp = num(a.maxScore) - num(b.maxScore);
          break;
        case "total":
          cmp = a.totalSessions - b.totalSessions;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [students, query, sortKey, sortDir]);

  async function handleDelete(id: string, name: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/teacher/students/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "삭제에 실패했습니다.");
        return;
      }
      toast.success(`${name} 학생을 삭제했습니다.`);
      router.refresh();
    } catch {
      toast.error("오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* 필터 & 정렬 바 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-pink-300" />
          <Input
            placeholder="이름 또는 이메일 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 border-pink-100 focus-visible:ring-pink-300"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortKey} onValueChange={(v) => { if (v) setSortKey(v as SortKey); }}>
            <SelectTrigger className="w-44 border-pink-100">
              <ArrowUpDown className="w-3.5 h-3.5 mr-1 text-pink-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            className="border-pink-100 text-pink-500 hover:bg-pink-50"
            title={sortDir === "asc" ? "오름차순" : "내림차순"}
          >
            {sortDir === "asc" ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* 결과 개수 */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
        <Users className="w-3.5 h-3.5 text-pink-400" />
        <span>
          {filtered.length}명
          {query && ` (전체 ${students.length}명 중)`}
        </span>
      </div>

      {/* 학생 목록 */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 bg-pink-50/30 rounded-xl border border-dashed border-pink-200">
          <Users className="w-10 h-10 mx-auto mb-3 text-pink-300" />
          <p className="text-sm text-muted-foreground">
            {query ? "검색 결과가 없습니다" : "등록된 학생이 없습니다"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="group flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all"
            >
              {/* 아바타 */}
              <div className="w-11 h-11 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-pink-700">
                  {s.name.charAt(0)}
                </span>
              </div>

              {/* 기본 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-semibold text-gray-800 truncate">{s.name}</p>
                  {!s.isActive && (
                    <Badge className="text-[10px] bg-red-100 text-red-700 border-0">
                      비활성
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  최근 면접:{" "}
                  {s.latestInterviewAt
                    ? new Date(s.latestInterviewAt).toLocaleDateString("ko-KR")
                    : "없음"}
                </p>
              </div>

              {/* 면접 통계 */}
              <div className="hidden md:grid grid-cols-3 gap-5 text-center shrink-0">
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {s.totalSessions}
                  </p>
                  <p className="text-[10px] text-muted-foreground">총 면접</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-pink-600">
                    {s.avgScore !== null ? s.avgScore : "-"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">평균</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-orange-600 flex items-center justify-center gap-0.5">
                    {s.maxScore !== null ? (
                      <>
                        <Trophy className="w-3 h-3 mb-0.5" />
                        {s.maxScore}
                      </>
                    ) : (
                      "-"
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">최고</p>
                </div>
              </div>

              {/* 액션 */}
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/teacher/students/${s.id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs border-pink-200 text-pink-600 hover:bg-pink-50"
                  >
                    상세
                  </Button>
                </Link>

                <AlertDialog>
                  <AlertDialogTrigger
                    disabled={deletingId === s.id}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>학생 삭제</AlertDialogTitle>
                      <AlertDialogDescription>
                        <span className="font-semibold text-gray-800">{s.name}</span> 학생을
                        정말 삭제하시겠습니까?
                        <br />
                        면접 기록과 모든 관련 데이터가 함께 삭제되며, 복구할 수 없습니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(s.id, s.name)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
