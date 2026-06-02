"use client";

import { useState, useEffect, useMemo } from "react";

interface GradeCalcProps {
  students: { id: string; fullName: string | null }[];
  subjects: { id: number; name: string }[];
}

export default function ClassGradeCalculator({ students, subjects }: GradeCalcProps) {
  const [grades, setGrades] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedQuarter, setSelectedQuarter] = useState("1");

  useEffect(() => {
    if (students.length === 0) { setLoading(false); return; }
    setLoading(true);
    Promise.all(students.map(async (s) => {
      try {
        const res = await fetch(`/api/grades?studentId=${s.id}`);
        if (res.ok) return { id: s.id, grades: await res.json() };
      } catch {}
      return { id: s.id, grades: [] };
    })).then(results => {
      const map: Record<string, any[]> = {};
      results.forEach(r => { map[r.id] = r.grades; });
      setGrades(map);
      setLoading(false);
    });
  }, [students]);

  const currentAcademicYear = useMemo(() => {
    const now = new Date();
    const y = now.getMonth() < 8 ? now.getFullYear() - 1 : now.getFullYear();
    return `${y}/${y + 1}`;
  }, []);

  // Map subjectId to subject name
  const subjectMap = useMemo(() => {
    const m = new Map<number, string>();
    subjects.forEach(s => m.set(s.id, s.name));
    return m;
  }, [subjects]);

  // Compute averages
  type StudentAvg = { id: string; name: string; q1: string; q2: string; q3: string; q4: string; current: string };
  const studentAverages: StudentAvg[] = useMemo(() => {
    return students.map(s => {
      const studentGrades = grades[s.id] || [];
      
      const qGrades: Record<string, number[]> = { q1: [], q2: [], q3: [], q4: [] };
      let currentAll: number[] = [];

      studentGrades.forEach((g: any) => {
        const val = Number(g.value);
        if (isNaN(val)) return;
        currentAll.push(val);
        if (g.date) {
          const d = new Date(g.date);
          const month = d.getMonth() + 1;
          const day = d.getDate();
          let q = '1';
          if ((month === 10 && day >= 28) || (month === 11 && day <= 3)) q = '2';
          else if ((month === 12 && day >= 25) || (month === 1 && day <= 8)) q = '3';
          else if ((month === 3 && day >= 24 && day <= 30)) q = '4';
          else if (month === 9 || (month === 10 && day <= 27)) q = '1';
          else if ((month === 11 && day >= 4) || (month === 12 && day <= 24)) q = '2';
          else if ((month === 1 && day >= 9) || month === 2 || (month === 3 && day <= 23)) q = '3';
          else if ((month === 3 && day >= 31) || month === 4 || month === 5) q = '4';
          if (qGrades[`q${q}`]) qGrades[`q${q}`].push(val);
        }
      });

      const avg = (arr: number[]) => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : "—";
      return {
        id: s.id,
        name: s.fullName || "—",
        q1: avg(qGrades.q1),
        q2: avg(qGrades.q2),
        q3: avg(qGrades.q3),
        q4: avg(qGrades.q4),
        current: avg(currentAll),
      };
    });
  }, [students, grades]);

  // Class averages
  const classAverages = useMemo(() => {
    const qs = ['q1', 'q2', 'q3', 'q4', 'current'] as const;
    const result: Record<string, string> = {};
    for (const q of qs) {
      const nums = studentAverages.map(s => parseFloat(s[q])).filter(n => !isNaN(n));
      result[q] = nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : "—";
    }
    return result;
  }, [studentAverages]);

  if (students.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-indigo-100">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">📊</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Средний балл класса</h3>
          <p className="text-sm text-indigo-600">{students.length} учеников</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400 font-medium">Загрузка оценок...</div>
      ) : (
        <>
          {/* Class averages */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: "I четверть", key: "q1", color: "from-blue-500 to-indigo-500" },
              { label: "II четверть", key: "q2", color: "from-purple-500 to-pink-500" },
              { label: "III четверть", key: "q3", color: "from-emerald-500 to-teal-500" },
              { label: "IV четверть", key: "q4", color: "from-amber-500 to-orange-500" },
              { label: "На данный момент", key: "current", color: "from-rose-500 to-red-500" },
            ].map(item => (
              <div key={item.key} className={`bg-gradient-to-br ${item.color} rounded-xl p-4 shadow-md text-center`}>
                <div className="text-3xl font-black text-white">{classAverages[item.key]}</div>
                <div className="text-[11px] text-white/80 font-medium mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Student list with averages */}
          <div className="overflow-x-auto rounded-xl border border-indigo-200">
            <table className="w-full text-xs">
              <thead className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-bold">Ученик</th>
                  <th className="px-2 py-2 text-center font-bold">I</th>
                  <th className="px-2 py-2 text-center font-bold">II</th>
                  <th className="px-2 py-2 text-center font-bold">III</th>
                  <th className="px-2 py-2 text-center font-bold">IV</th>
                  <th className="px-2 py-2 text-center font-bold bg-white/20">Текущий</th>
                </tr>
              </thead>
              <tbody>
                {studentAverages.map((s, i) => (
                  <tr key={s.id} className={i % 2 === 0 ? "bg-white" : "bg-indigo-50"}>
                    <td className="px-3 py-2 font-semibold text-gray-800 text-left">{s.name}</td>
                    <td className="px-2 py-2 text-center font-bold text-indigo-700">{s.q1}</td>
                    <td className="px-2 py-2 text-center font-bold text-purple-700">{s.q2}</td>
                    <td className="px-2 py-2 text-center font-bold text-emerald-700">{s.q3}</td>
                    <td className="px-2 py-2 text-center font-bold text-amber-700">{s.q4}</td>
                    <td className="px-2 py-2 text-center font-bold text-rose-700 bg-rose-50/50">{s.current}</td>
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
