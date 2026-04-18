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
  SelectItem,
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

interface Activity {
  title: string;
  description: string;
  period: string;
}

export default function NewInterviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schoolType, setSchoolType] = useState("");
  const [motivation, setMotivation] = useState("");
  const [strengths, setStrengths] = useState("");
  const [weaknesses, setWeaknesses] = useState("");
  const [activities, setActivities] = useState<Activity[]>([
    { title: "", description: "", period: "" },
  ]);

  function addActivity() {
    if (activities.length >= 3) return;
    setActivities([...activities, { title: "", description: "", period: "" }]);
  }

  function removeActivity(idx: number) {
    setActivities(activities.filter((_, i) => i !== idx));
  }

  function updateActivity(idx: number, field: keyof Activity, value: string) {
    setActivities(activities.map((a, i) => (i === idx ? { ...a, [field]: value } : a)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!schoolType) {
      toast.error("지원 학교 유형을 선택해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/personal-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolType,
          motivation,
          strengths,
          weaknesses,
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
          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
          <span className="font-medium text-blue-600">자기소개서 입력</span>
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
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>지원 학교 유형 *</Label>
              <Select value={schoolType} onValueChange={(v) => { if (v) setSchoolType(v); }} required>
                <SelectTrigger>
                  <SelectValue placeholder="지원하는 학교 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FOREIGN_LANGUAGE">외국어고등학교 (외고)</SelectItem>
                  <SelectItem value="INTERNATIONAL">국제고등학교 (국제고)</SelectItem>
                  <SelectItem value="AUTONOMOUS">자율형사립고 (자사고)</SelectItem>
                  <SelectItem value="SCIENCE_GIFTED">과학영재학교</SelectItem>
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
              <Label htmlFor="motivation">지원 동기 *</Label>
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
              <Label htmlFor="strengths">장점 *</Label>
              <Textarea
                id="strengths"
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="자신의 강점과 장점을 구체적인 사례와 함께 작성해주세요"
                className="min-h-[100px]"
                required
                minLength={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weaknesses">단점 (극복 과정 포함) *</Label>
              <Textarea
                id="weaknesses"
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                placeholder="단점과 이를 극복하기 위한 노력을 솔직하게 작성해주세요"
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
            <CardDescription>최대 3개의 주요 활동을 입력해주세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    활동 {idx + 1}
                  </span>
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
                    <Label className="text-xs">활동명 *</Label>
                    <Input
                      value={activity.title}
                      onChange={(e) => updateActivity(idx, "title", e.target.value)}
                      placeholder="예: 교내 영어 토론 대회"
                      required
                    />
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
            {activities.length < 3 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addActivity}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                활동 추가 ({activities.length}/3)
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
