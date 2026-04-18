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
} from "lucide-react";

const studentNav = [
  { href: "/student/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/interview/new", label: "새 면접 시작", icon: Video },
  { href: "/student/sessions", label: "면접 기록", icon: History },
];

const teacherNav = [
  { href: "/teacher/dashboard", label: "대시보드", icon: BarChart3 },
  { href: "/teacher/students", label: "학생 관리", icon: Users },
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
    <aside className="w-60 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">면</span>
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">면접 코치</p>
            {academyName && (
              <p className="text-xs text-muted-foreground leading-tight">
                {academyName}
              </p>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              {userName.charAt(0)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {role === "STUDENT" ? "학생" : role === "TEACHER" ? "교사" : "관리자"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          <LogOut className="w-3 h-3" />
          로그아웃
        </button>
      </div>
    </aside>
  );
}
