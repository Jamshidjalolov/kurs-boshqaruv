import { DataTable } from "./DataTable";
import { AttendanceNotes } from "@/components/common/AttendanceNotes";
import { StatusBadge } from "@/components/common/StatusBadge";
import type { AttendanceEntry } from "@/types/domain";

interface AttendanceTableProps {
  rows: AttendanceEntry[];
}

function formatAttendanceDate(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function formatAttendanceWeekday(value: string) {
  return new Intl.DateTimeFormat("uz-UZ", {
    weekday: "long"
  }).format(new Date(`${value}T12:00:00`));
}

function formatHomeworkScore(score?: number | null) {
  return typeof score === "number" ? `${score}%` : "Baholanmagan";
}

function formatDailyGrade(grade?: number | null) {
  return typeof grade === "number" ? `${grade} baho` : "Baholanmagan";
}

export function AttendanceTable({ rows }: AttendanceTableProps) {
  return (
    <DataTable
      title="Davomat arxivi"
      description="Sana, guruh va holat kesimida saqlangan davomat yozuvlari."
      rows={rows}
      mobileCardTitle={(row) => row.studentName}
      columns={[
        {
          key: "student",
          header: "O'quvchi",
          render: (row) => (
            <div>
              <div className="font-semibold text-slate-900 dark:text-white">{row.studentName}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">Attendance log</div>
            </div>
          )
        },
        {
          key: "group",
          header: "Guruh",
          render: (row) => (
            <span className="inline-flex rounded-full border border-border/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {row.group}
            </span>
          )
        },
        {
          key: "date",
          header: "Sana",
          render: (row) => (
            <div>
              <div className="font-medium text-slate-900 dark:text-white">{formatAttendanceDate(row.date)}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatAttendanceWeekday(row.date)}</div>
            </div>
          )
        },
        {
          key: "topic",
          header: "Mavzu",
          render: (row) => (
            <div className="rounded-2xl border border-border/70 bg-slate-50/90 px-3 py-2 text-sm text-slate-600 dark:bg-slate-900/70 dark:text-slate-300">
              {row.lessonTopic ?? "Mavzu kiritilmagan"}
            </div>
          )
        },
        { key: "status", header: "Holat", render: (row) => <StatusBadge status={row.status} /> },
        {
          key: "homework",
          header: "Uy vazifasi",
          render: (row) => (
            <span className="inline-flex rounded-full border border-border/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {formatHomeworkScore(row.homeworkScore)}
            </span>
          )
        },
        {
          key: "daily-grade",
          header: "Kunlik baho",
          render: (row) => (
            <span className="inline-flex rounded-full border border-border/80 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
              {formatDailyGrade(row.dailyGrade)}
            </span>
          )
        },
        {
          key: "comment",
          header: "Izoh",
          render: (row) => (
            <AttendanceNotes comment={row.comment} homeworkComment={row.homeworkComment} dailyGradeComment={row.dailyGradeComment} />
          )
        }
      ]}
    />
  );
}
