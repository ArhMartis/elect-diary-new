"use client";

import { useState, useEffect, useMemo } from "react";

interface GradeCalcProps {
  students: { id: string; fullName: string | null }[];
  subjects: { id: number; name: string }[];
  groupId: number;
}

function getQuarterByDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  if ((month === 10 && day >= 28) || (month === 11 && day <= 3)) return '2';
  if ((month === 12 && day >= 25) || (month === 1 && day <= 8)) return '3';
  if (month === 3 && day >= 24 && day <= 30) return '4';
  if (month === 9 || (month === 10 && day <= 27)) return '1';
  if ((month === 11 && day >= 4) || (month === 12 && day <= 24)) return '2';
  if ((month === 1 && day >= 9) || month === 2 || (month === 3 && day <= 23)) return '3';
  if ((month === 3 && day >= 31) || month === 4 || month === 5) return '4';
  return '1';
}

export default function ClassGradeCalculator({ students, subjects, groupId }: GradeCalcProps) {
  const [grades, setGrades] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    if (students.length === 0 || !groupId) { setLoading(false); return; }
    setLoading(true);

    fetch("/api/schedule?groupId=" + groupId)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setSchedule(data); })
      .catch(() => {});

    Promise.all(students.map(async (s) => {
      try {
        const res = await fetch("/api/grades?studentId=" + s.id);
        if (res.ok) return { id: s.id, grades: await res.json() };
      } catch {}
      return { id: s.id, grades: [] };
    })).then(results => {
      const map: Record<string, any[]> = {};
      results.forEach(r => { map[r.id] = r.grades; });
      setGrades(map);
      setLoading(false);
    });
  }, [students, groupId]);

  const activeSubjects = useMemo(() => {
    const scheduleIds = new Set<number>();
    schedule.forEach((s: any) => { if (s.subjectId) scheduleIds.add(s.subjectId); });
    return subjects.filter(s => scheduleIds.has(s.id));
  }, [subjects, schedule]);

  const subjectAverages = useMemo(() => {
    return activeSubjects.map(subj => {
      const qGrades: Record<string, number[]> = { '1': [], '2': [], '3': [], '4': [] };
      let currentAll: number[] = [];

      students.forEach(s => {
        const studentGrades = grades[s.id] || [];
        studentGrades.forEach((g: any) => {
          const val = Number(g.value);
          if (isNaN(val) || g.subjectId !== subj.id) return;
          currentAll.push(val);
          if (g.date) {
            const q = getQuarterByDate(g.date);
            if (qGrades[q]) qGrades[q].push(val);
          }
        });
      });

      const avg = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";
      return {
        subjectName: subj.name,
        q1: avg(qGrades['1']),
        q2: avg(qGrades['2']),
        q3: avg(qGrades['3']),
        q4: avg(qGrades['4']),
        current: avg(currentAll),
        count1: qGrades['1'].length,
        count2: qGrades['2'].length,
        count3: qGrades['3'].length,
        count4: qGrades['4'].length,
        countCurrent: currentAll.length,
      };
    });
  }, [activeSubjects, students, grades]);

  const classTotals = useMemo(() => {
    const qs = ['q1', 'q2', 'q3', 'q4', 'current'] as const;
    const result: Record<string, string> = {};
    for (const q of qs) {
      const nums = subjectAverages.map(s => parseFloat(s[q])).filter(n => !isNaN(n));
      result[q] = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "—";
    }
    return result;
  }, [subjectAverages]);

  if (students.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-indigo-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">📊</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Средний балл класса</h3>
          <p className="text-sm text-indigo-600">{students.length} учеников, {activeSubjects.length} предметов</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 font-medium">Загрузка оценок...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "I четверть", key: "q1", color: "from-blue-500 to-indigo-500" },
              { label: "II четверть", key: "q2", color: "from-purple-500 to-pink-500" },
              { label: "III четверть", key: "q3", color: "from-emerald-500 to-teal-500" },
              { label: "IV четверть", key: "q4", color: "from-amber-500 to-orange-500" },
              { label: "На данный момент", key: "current", color: "from-rose-500 to-red-500" },
            ].map(item => (
              <div key={item.key} className={"bg-gradient-to-br " + item.color + " rounded-xl p-4 shadow-md text-center"}>
                <div className="text-3xl font-black text-white">{classTotals[item.key]}</div>
                <div className="text-[11px] text-white/80 font-medium mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto rounded-xl border border-indigo-200">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Предмет</th>
                  <th className="px-2 py-2 text-center font-bold">I</th>
                  <th className="px-2 py-2 text-center font-bold">II</th>
                  <th className="px-2 py-2 text-center font-bold">III</th>
                  <th className="px-2 py-2 text-center font-bold">IV</th>
                  <th className="px-2 py-2 text-center font-bold bg-white/20">Текущий</th>
                </tr>
              </thead>
              <tbody>
                {subjectAverages.map((s, i) => (
                  <tr key={s.subjectName} className={i % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                    <td className="px-3 py-2 font-semibold text-gray-800 text-left">{s.subjectName}</td>
                    <td className="px-2 py-2 text-center font-bold text-blue-700">{s.q1}<span className="text-[9px] text-gray-400 font-normal ml-0.5">({s.count1})</span></td>
                    <td className="px-2 py-2 text-center font-bold text-purple-700">{s.q2}<span className="text-[9px] text-gray-400 font-normal ml-0.5">({s.count2})</span></td>
                    <td className="px-2 py-2 text-center font-bold text-emerald-700">{s.q3}<span className="text-[9px] text-gray-400 font-normal ml-0.5">({s.count3})</span></td>
                    <td className="px-2 py-2 text-center font-bold text-amber-700">{s.q4}<span className="text-[9px] text-gray-400 font-normal ml-0.5">({s.count4})</span></td>
                    <td className="px-2 py-2 text-center font-bold text-rose-700 bg-rose-50/50">{s.current}<span className="text-[9px] text-gray-400 font-normal ml-0.5">({s.countCurrent})</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
