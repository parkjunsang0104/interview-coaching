"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  History,
  Users,
  BarChart3,
  Video,
  LogOut,
  Sparkles,
} from "lucide-react";

const studentNav = [
  { href: "/student/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/interview/new", label: "새 면접 시작", icon: Video },
  { href: "/student/sessions", label: "면접 기록", icon: History },
];

const teacherNav = [
  { href: "/teacher/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/teacher/students", label: "학생 관리", icon: Users },
  { href: "/teacher/interview/new", label: "면접 시작", icon: Video },
];

interface SidebarProps {
  role: string;
  userName: string;
  academyName?: string;
}

export function Sidebar({ role, userName, academyName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "STUDENT" ? studentNav : teacherNav;

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-[#E8DFC4] flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#B40023] rounded-xl flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-[#FCF0D6]" />
          </div>
          <div>
            <p className="font-bold text-base leading-tight text-gray-800">면접 코치</p>
            {academyName && (
              <p className="text-xs text-[#B40023] leading-tight mt-0.5">
                {academyName}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-[#B40023] text-[#FCF0D6] shadow-sm"
                  : "text-gray-600 hover:bg-[#FCF0D6] hover:text-[#B40023]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#E8DFC4]">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 bg-[#FCF0D6] border border-[#E8DFC4] rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-[#B40023]">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-[#B40023]">
              {role === "STUDENT" ? "학생" : role === "TEACHER" ? "교사" : "관리자"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-[#B40023] transition-colors py-1.5"
        >
          <LogOut className="w-3 h-3" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
