"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cloudReady, useSession } from "@/lib/cloud";
import { BottomNav, Loading, Sidebar } from "@/components/ui";

/** 앱 전체 문지기: 로그인 전에는 로그인·회원가입 화면만 보여 준다. 로그인하면 홈·마이페이지 등 모든 화면이 열린다. */
const OPEN = ["/auth", "/join"]; // 로그인·초대 화면
const PUBLIC = ["/", "/search", "/laws"]; // 비회원도 열람 가능
const under = (path: string, list: string[]) => list.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`))); // 로그인 전에도 열리는 화면 (초대 링크는 /join에서 로그인으로 이어짐)

export default function AuthShell({ children }: { children: ReactNode }) {
  const session = useSession();
  const path = usePathname() || "/";
  const router = useRouter();
  const bare = cloudReady && under(path, OPEN); // 로그인 화면 자체
  const open = !cloudReady || bare || under(path, PUBLIC);
  const blocked = !open && !session;
  useEffect(() => {
    if (!open && session === null) router.replace(`/auth?next=${encodeURIComponent(path)}`);
  }, [open, session, path, router]);

  if (blocked) return <div className="grid min-h-screen place-items-center"><Loading>{session === undefined ? "로그인 상태 확인 중" : "로그인 화면으로 이동 중"}</Loading></div>;
  return (
    <>
      {bare && !session ? <div className="min-w-0">{children}</div> : (
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      )}
      {!(bare && !session) && <BottomNav />}
    </>
  );
}
