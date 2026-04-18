"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Plus, KeyRound } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
}

export function InviteCodeSection({ academyId }: { academyId: string }) {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  async function loadCodes() {
    const res = await fetch(`/api/academies/${academyId}/invite-codes`);
    const data = await res.json();
    setCodes(data.codes ?? []);
    setLoaded(true);
  }

  async function generateCode() {
    setLoading(true);
    try {
      const res = await fetch(`/api/academies/${academyId}/invite-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresInDays: 30 }),
      });
      const data = await res.json();
      toast.success(`초대 코드 생성: ${data.inviteCode.code}`);
      loadCodes();
    } catch {
      toast.error("코드 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    toast.success("초대 코드가 복사되었습니다.");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            학생 초대 코드
          </CardTitle>
          <div className="flex gap-2">
            {!loaded && (
              <Button variant="ghost" size="sm" onClick={loadCodes} className="text-xs h-7">
                목록 보기
              </Button>
            )}
            <Button size="sm" onClick={generateCode} disabled={loading} className="text-xs h-7">
              <Plus className="w-3 h-3 mr-1" />
              {loading ? "생성 중..." : "코드 생성"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!loaded ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            &quot;목록 보기&quot;를 클릭하면 기존 코드를 확인할 수 있습니다.
          </p>
        ) : codes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            발급된 초대 코드가 없습니다.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {codes.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <code className="text-sm font-mono font-bold">{c.code}</code>
                  <p className="text-xs text-muted-foreground">
                    만료: {new Date(c.expiresAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${c.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {c.status === "ACTIVE" ? "사용 가능" : c.status === "USED" ? "사용됨" : "만료"}
                  </Badge>
                  {c.status === "ACTIVE" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => copyCode(c.code)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
