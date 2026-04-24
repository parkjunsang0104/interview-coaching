"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Copy, KeyRound, Check } from "lucide-react";

export function InviteCodeSection({ academyId }: { academyId: string }) {
  const [code, setCode] = useState<string>("");
  const [academyName, setAcademyName] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/academies/${academyId}`);
        if (res.ok) {
          const data = await res.json();
          setCode(data.code ?? "");
          setAcademyName(data.name ?? "");
        }
      } catch {
        // silent
      }
    }
    load();
  }, [academyId]);

  function copyCode() {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("학원 코드가 복사되었습니다.");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-red-500" />
          학원 코드
        </CardTitle>
        <CardDescription>
          학생이 회원가입 시 이 코드를 입력하면 <span className="font-medium text-gray-700">{academyName}</span> 소속 학생으로 등록됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-red-50 to-red-50 rounded-xl border border-red-100">
          <div className="flex-1">
            <p className="text-[11px] text-red-500 font-medium uppercase tracking-wider mb-1">
              학원 고유 코드
            </p>
            <p className="text-2xl font-mono font-bold text-red-700 tracking-widest">
              {code || "—"}
            </p>
          </div>
          <Button
            onClick={copyCode}
            disabled={!code}
            variant="outline"
            size="sm"
            className="shrink-0 bg-white border-red-200 text-red-600 hover:bg-red-50"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                복사됨
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                복사
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-700 mb-1">학생 가입 안내 방법</p>
          <ol className="space-y-1 list-decimal list-inside">
            <li>학생에게 이 코드를 공유합니다</li>
            <li>학생이 <span className="font-mono text-red-600">/register</span> 페이지에서 코드와 함께 가입</li>
            <li>자동으로 학원 소속 학생으로 등록됨</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
