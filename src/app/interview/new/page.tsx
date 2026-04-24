"use client";

import { useState } from "react";
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
import { Plus, Trash2, ArrowLeft } from "lucide-react";
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

const CATEGORIES: SchoolCategory[] = ["FOREIGN_LANGUAGE", "INTERNATIONAL", "AUTONOMOUS"];

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [targetSchool, setTargetSchool] = useState("");
  const [motivation, setMotivation] = useState("");
  const [character, setCharacter] = useState("");
  const [selfDirected, setSelfDirected] = useState("");
  const [futurePlan, setFuturePlan] = useState("");
  const [activities, setActivities] = useState<Activity[]>([
    { category: "CLUB", title: "", description: "", period: "" },
  ]);

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
    if (!targetSchool) {
      toast.error("지원 학교를 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/personal-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      toast.success("자기소개서가 저장되었습니다. AI 질문을 생성합니다...");
      router.push(`/interview/${json.sessionId}/questions`);
    } catch {
      toast.error("오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/student/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        대시보드로
      </Link>
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <span className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <span className="font-medium text-red-500">자기소개서 입력</span>
          <span className="text-gray-300">›</span>
          <span>질문 생성</span>
          <span className="text-gray-300">›</span>
          <span>면접 진행</span>
          <span className="text-gray-300">›</span>
          <span>피드백</span>
        </div>
        <h1 className="text-2xl font-bold">자기소개서 입력</h1>
        <p className="text-muted-foreground mt-1">
          입력하신 내용을 바탕으로 AI가 맞춤 면접 질문을 생성합니다
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">자기소개서 내용</CardTitle>
            <CardDescription>
              솔직하고 구체적으로 작성할수록 더 좋은 면접 질문이 생성됩니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="selfDirected">1. 자기주도학습 *</Label>
              <Textarea
                id="selfDirected"
                value={selfDirected}
                onChange={(e) => setSelfDirected(e.target.value)}
                placeholder="스스로 목표를 세우고 주도적으로 학습한 경험과 그 과정에서 배운 점을 작성해주세요"
                className="min-h-[100px]"
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="motivation">2. 지원동기 *</Label>
              <Textarea
                id="motivation"
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="이 학교에 지원하게 된 구체적인 동기와 이유를 작성해주세요"
                className="min-h-[100px]"
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="futurePlan">3. 입학 후 학업계획 및 졸업 후 계획 *</Label>
              <Textarea
                id="futurePlan"
                value={futurePlan}
                onChange={(e) => setFuturePlan(e.target.value)}
                placeholder="입학 후 구체적인 학업 계획과 졸업 후 진로·장기 비전을 작성해주세요"
                className="min-h-[100px]"
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="character">4. 인성 *</Label>
              <Textarea
                id="character"
                value={character}
                onChange={(e) => setCharacter(e.target.value)}
                placeholder="배려, 나눔, 협력, 갈등 관리 등 인성을 보여주는 구체적 경험을 작성해주세요"
                className="min-h-[100px]"
                required
                minLength={10}
              />
            </div>
          </CardContent>
        </Card>

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
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeActivity(idx)}
                      className="h-7 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">활동 유형 *</Label>
                    <Select
                      value={activity.category}
                      onValueChange={(v) => {
                        if (v) updateActivity(idx, "category", v as ActivityCategory);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ACTIVITY_CATEGORY_LABELS).map(([k, label]) => (
                          <SelectItem key={k} value={k}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">기간 *</Label>
                    <Input
                      value={activity.period}
                      onChange={(e) => updateActivity(idx, "period", e.target.value)}
                      placeholder="예: 2023.09 ~ 2024.02"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">활동명 *</Label>
                  <Input
                    value={activity.title}
                    onChange={(e) => updateActivity(idx, "title", e.target.value)}
                    placeholder="예: 교내 영어 토론 대회"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">활동 내용 및 배운 점 *</Label>
                  <Textarea
                    value={activity.description}
                    onChange={(e) => updateActivity(idx, "description", e.target.value)}
                    placeholder="활동 내용, 역할, 성과, 배운 점을 구체적으로 작성해주세요"
                    className="min-h-[80px]"
                    required
                  />
                </div>
                {idx < activities.length - 1 && <Separator />}
              </div>
            ))}
            {activities.length < 5 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addActivity}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                활동 추가 ({activities.length}/5)
              </Button>
            )}
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? "저장 중..." : "AI 면접 질문 생성하기 →"}
        </Button>
      </form>
    </div>
  );
}
