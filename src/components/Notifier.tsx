"use client";
import { useEffect } from "react";
import { dday } from "@/lib/analyze";
import { getDB } from "@/lib/store";

/** 기한 알림: 앱을 열 때 하루 한 번, 3일 안 기한을 브라우저 알림으로 보여 준다 (알림 켬 + 권한 허용 시) */
export default function Notifier() {
  useEffect(() => {
    try {
      const db = getDB();
      if (!db.profile?.notify || typeof Notification === "undefined" || Notification.permission !== "granted") return;
      const today = new Date().toISOString().slice(0, 10);
      if (localStorage.getItem("redev-notified") === today) return;
      const soon = db.cases.flatMap((c) => c.schedules.filter((s) => !s.done).map((s) => ({ s, c })))
        .filter(({ s }) => { const d = dday(s.date); return d === "D-Day" || (d.startsWith("D-") && Number(d.slice(2)) <= 3); })
        .sort((a, b) => a.s.date.localeCompare(b.s.date));
      if (!soon.length) return;
      new Notification(`다가오는 기한 ${soon.length}건`, { body: soon.slice(0, 3).map(({ s, c }) => `${dday(s.date)} ${s.title} (${c.title})`).join("\n"), icon: "/icon.svg", tag: "redev-deadline" });
      localStorage.setItem("redev-notified", today);
    } catch { /* 알림을 지원하지 않는 기기 */ }
  }, []);
  return null;
}
