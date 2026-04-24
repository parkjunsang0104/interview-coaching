"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, Search, User, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import {
  SCHOOLS,
  SCHOOL_CATEGORY_LABELS,
  ACTIVITY_CATEGORY_LABELS,
  type ActivityCategory,
  type SchoolCategory,
} from "@/lib/school-data";

interface Activity {
  category: ActivityCategory;
  title: string;
  description: string;
  period: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
}

const CATEGORIES: SchoolCategory[] = ["FOREIGN_LANGUAGE", "INTERNATIONAL", "AUTONOMOUS"];

export default function TeacherNewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [targetSchool, setTargetSchool] = useState("");
  const [motivation, setMotivation] = useState("");
  const [character, setCharacter] = useState("");
  const [selfDirected, setSelfDirected] = useState("");
  const [futurePlan, setFuturePlan] = useState("");
  const [activities, setActivities] = useState<Activity[]>([
    { category: "CLUB", title: "", description: "", period: "" },
  ]);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/dashboard/students");
        if (res.ok) {
          const data = await res.json();
          setStudents(data.students ?? []);
        }
      } catch {
        toast.error("학생 목록을 불러오지 못했습니다.");
      } finally {
        setStudentsLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (s) =>
      s.name.includes(searchQuery) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function addActivity() {
    if (activities.length >= 5) return;
    setActivities([...activities, { category: "CLUB", title: "", description: "", period: "" }]);
  }

  function removeActivity(idx: number) {
    setActivities(activities.filter((_, i) => i !== idx));
  }

  function updateActivity<K extends keyof Activity>(idx: number, field: K, value: Activity[K]) {
    setActivities(activities.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedStudent) {
      toast.error("학생을 선택해주세요.");
      return;
    }
    if (!targetSchool) {
      toast.error("지원 학교를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/teacher/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          targetSchool,
          motivation,
          character,
          selfDirected,
          futurePlan,
          activities,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "오류가 발생했습니다.");
        return;
      }

      toast.success(
        `${selectedStudent.name} 학생의 면접 세션이 생성되었습니다.`
      );
      router.push("/teacher/students");
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/teacher/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold">면접 세션 생성</h1>
        <p className="text-muted-foreground mt-1">
          학생을 선택하고 자기소개서를 입력하면, 학생 대시보드에서 면접을 시작할 수 있습니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 학생 선택 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              학생 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedStudent ? (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-red-600">
                      {selectedStudent.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedStudent.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-red-500" />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedStudent(null)}
                  className="text-xs text-gray-500"
                >
                  변경
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="이름 또는 이메일로 검색..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto border rounded-lg divide-y divide-gray-100">
                  {studentsLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      학생 목록을 불러오는 중...
                    </p>
                  ) : filteredStudents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">
                      {searchQuery ? "검색 결과가 없습니다." : "등록된 학생이 없습니다."}
                    </p>
                  ) : (
                    filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(s);
                          setSearchQuery("");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">{s.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.name}</p>
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 지원 학교 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">지원 학교</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>지원할 학교를 선택하세요 *</Label>
              <Select value={targetSchool} onValueChange={(v) => { if (v) setTargetSchool(v); }} required>
                <SelectTrigger>
                  <SelectValue placeholder="학교를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {CATEGORIES.map((cat) => (
                    <SelectGroup key={cat}>
                      <SelectLabel>{SCHOOL_CATEGORY_LABELS[cat]}</SelectLabel>
                      {SCHOOLS.filter((s) => s.category === cat).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.shortName} ({s.region})
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 자기소개서 내용 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">자기소개서 내용</CardTitle>
            <CardDescription>솔직하고 구체적으로 작성할수록 더 좋은 면접 질문이 생성됩니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="selfDirected">1. 자기주도학습 *</Label>
              <Textarea id="selfDirected" value={selfDirected} onChange={(e) => setSelfDirected(e.target.value)} placeholder="스스로 목표를 세우고 주도적으로 학습한 경험과 그 과정에서 배운 점" className="min-h-[100px]" required minLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">2. 지원동기 *</Label>
              <Textarea id="motivation" value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="이 학교에 지원하게 된 구체적인 동기와 이유" className="min-h-[100px]" required minLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="futurePlan">3. 입학 후 학업계획 및 졸업 후 계획 *</Label>
              <Textarea id="futurePlan" value={futurePlan} onChange={(e) => setFuturePlan(e.target.value)} placeholder="입학 후 학업 계획과 졸업 후 진로·장기 비전" className="min-h-[100px]" required minLength={10} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="character">4. 인성 *</Label>
              <Textarea id="character" value={character} onChange={(e) => setCharacter(e.target.value)} placeholder="배려, 나눔, 협력, 갈등 관리 등 인성을 보여주는 구체적 경험" className="min-h-[100px]" required minLength={10} />
            </div>
          </CardContent>
        </Card>

        {/* 주요 활동 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주요 활동 및 경험</CardTitle>
            <CardDescription>최대 5개의 주요 활동을 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">활동 {idx + 1}</span>
                  {activities.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeActivity(idx)} className="h-7 text-red-500 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">활동 유형 *</Label>
                    <Select
                      value={activity.category}
                      onValueChange={(v) => { if (v) updateActivity(idx, "category", v as ActivityCategory); }}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">기간 *</Label>
                    <Input value={activity.period} onChange={(e) => updateActivity(idx, "period", e.target.value)} placeholder="예: 2023.09 ~ 2024.02" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">활동명 *</Label>
                  <Input value={activity.title} onChange={(e) => updateActivity(idx, "title", e.target.value)} required />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">활동 내용 및 배운 점 *</Label>
                  <Textarea value={activity.description} onChange={(e) => updateActivity(idx, "description", e.target.value)} className="min-h-[80px]" required />
                </div>
                {idx < activities.length - 1 && <Separator />}
              </div>
            ))}
            {activities.length < 5 && (
              <Button type="button" variant="outline" size="sm" onClick={addActivity} className="w-full border-dashed">
                <Plus className="w-4 h-4 mr-2" />
                활동 추가 ({activities.length}/5)
              </Button>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading || !selectedStudent}>
          {loading ? "생성 중..." : selectedStudent ? `${selectedStudent.name} 학생의 면접 세션 생성` : "학생을 먼저 선택해주세요"}
        </Button>
      </form>
    </div>
  );
}
