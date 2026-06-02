"use client";

import { useState, useMemo } from "react";

interface GradeGoalCalcProps {
  grades: any[];
  subjects: { name: string }[];
  studentName: string;
}

export default function GradeGoalCalculator({ grades, subjects, studentName }: GradeGoalCalcProps) {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [targetGrade, setTargetGrade] = useState("");
  const [futureGrades, setFutureGrades] = useState<number[]>([10]);

  const subjectGrades = useMemo(() => {
    if (!selectedSubject) return [];
    const subjectNames = new Set(
      subjects.filter(s => s.name.toLowerCase().includes(selectedSubject.toLowerCase())).map(s => s.name)
    );
    return grades
      .filter(g => {
        if (!g.date) return false;
        const gName = (g.subjectName || "").toLowerCase();
        const sName = selectedSubject.toLowerCase();
        return gName === sName || (gName.includes(sName) && subjectNames.size > 0);
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [grades, selectedSubject, subjects]);

  const currentAvg = useMemo(() => {
    const nums = subjectGrades.map(g => Number(g.value)).filter(n => !isNaN(n));
    return nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length) : 0;
  }, [subjectGrades]);

  const currentCount = subjectGrades.filter(g => !isNaN(Number(g.value))).length;

  const result = useMemo(() => {
    const target = Number(targetGrade);
    if (!target || isNaN(target) || target < 1 || target > 10 || subjectGrades.length === 0) return null;

    const nums = subjectGrades.map(g => Number(g.value)).filter(n => !isNaN(n));
    const sum = nums.reduce((a, b) => a + b, 0);
    const count = nums.length;
    const current = sum / count;
    const effectiveTarget = target - 0.5; // Спорная оценка: 8.5 = 9 в пользу ученика

    if (futureGrades.length === 0) {
      const results: { grade: number; needed: number }[] = [];
      for (let grade = 1; grade <= 10; grade++) {
        // (sum + grade * x) / (count + x) >= effectiveTarget
        const diff = effectiveTarget * count - sum;
        const perGrade = grade - effectiveTarget;
        if (perGrade > 0) {
          const needed = Math.ceil(diff / perGrade);
          if (needed > 0 && needed <= 50) results.push({ grade, needed });
        } else if (perGrade === 0 && diff <= 0) {
          results.push({ grade, needed: 0 });
        }
      }
      return { type: "count", current, target, effectiveTarget, currentCount, results: results.slice(0, 10) };
    }

    const futureSum = futureGrades.reduce((a, b) => a + b, 0);
    const futureCount = futureGrades.length;
    const totalSum = sum + futureSum;
    const totalCount = count + futureCount;
    const newAvg = totalSum / totalCount;

    return {
      type: "specific",
      current,
      target,
      currentCount,
      futureGrades: [...futureGrades],
      newAvg,
      willReach: newAvg >= effectiveTarget,
      gap: effectiveTarget - newAvg,
      effectiveTarget,
    };
  }, [subjectGrades, targetGrade, futureGrades]);

  const allSubjectNames = useMemo(() => {
    const set = new Set<string>();
    grades.forEach(g => { if (g.subjectName) set.add(g.subjectName); });
    subjects.forEach(s => { if (s.name) set.add(s.name); });
    return Array.from(set).sort();
  }, [grades, subjects]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl shadow-lg p-6 border border-indigo-100 mt-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg">🎯</div>
        <div>
          <h3 className="text-xl font-bold text-gray-900 tracking-tight">Калькулятор оценок</h3>
          <p className="text-sm text-indigo-600">Сколько нужно получить, чтобы достичь желаемого балла</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Выберите предмет</label>
            <select
              value={selectedSubject}
              onChange={e => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white text-gray-900 font-medium text-sm"
            >
              <option value="">— Выберите предмет —</option>
              {allSubjectNames.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {selectedSubject && (
            <>
              <div className="bg-white rounded-xl p-4 border border-indigo-200">
                <div className="text-sm text-gray-500">Текущий средний балл</div>
                <div className="text-3xl font-black text-indigo-700">{currentCount > 0 ? currentAvg.toFixed(2) : "—"}</div>
                <div className="text-xs text-gray-400 mt-0.5">На основе {currentCount} оценок</div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Желаемый балл (от 1 до 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  value={targetGrade}
                  onChange={e => setTargetGrade(e.target.value)}
                  placeholder="Например: 9"
                  className="w-full px-4 py-2.5 border-2 border-indigo-200 rounded-xl focus:border-indigo-500 focus:outline-none bg-white text-gray-900 font-medium text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Какие оценки планируете получить? (добавьте несколько)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {futureGrades.map((g, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                      {g}
                      <button
                        onClick={() => setFutureGrades(prev => prev.filter((_, j) => j !== i))}
                        className="text-indigo-400 hover:text-red-500 leading-none"
                      >✕</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(n => (
                    <button
                      key={n}
                      onClick={() => setFutureGrades(prev => [...prev, n])}
                      className="w-8 h-8 rounded-lg bg-white border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-100 hover:border-indigo-400 transition-all"
                    >
                      {n}
                    </button>
                  ))}
                </div>
                {futureGrades.length > 0 && (
                  <button
                    onClick={() => setFutureGrades([10])}
                    className="mt-1 text-xs text-gray-400 hover:text-red-500 underline"
                  >
                    Сбросить
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div>
          {result && (
            <div className="bg-white rounded-xl p-5 border-2 border-indigo-200 h-full">
              <h4 className="font-bold text-indigo-800 mb-3">Результат</h4>
              <ResultDisplay result={result} />
            </div>
          )}

          {!result && selectedSubject && (
            <div className="bg-white rounded-xl p-5 border-2 border-dashed border-gray-200 h-full flex items-center justify-center">
              <p className="text-gray-400 text-sm text-center">
                Выберите желаемый балл<br />для расчёта
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: any }) {
  const r = result;
  return (
    <>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-3 bg-indigo-50 rounded-xl">
          <div className="text-xs text-gray-500">Текущий</div>
          <div className="text-xl font-black text-indigo-700">{r.current.toFixed(2)}</div>
        </div>
        <div className="text-center p-3 bg-emerald-50 rounded-xl">
          <div className="text-xs text-gray-500">Цель</div>
          <div className="text-xl font-black text-emerald-700">{r.target}</div>
          <div className="text-[10px] text-emerald-600 mt-0.5">достаточно {(r.target - 0.5).toFixed(1)} (спорная)</div>
        </div>
      </div>

      {r.type === "count" && r.results && r.results.length > 0 && (
        <div>
          <p className="text-sm text-gray-600 mb-2">Сколько нужно получить оценок каждого номинала:</p>
          <div className="space-y-1.5">
            {r.results.map((res: any) => (
              <div key={res.grade} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className="text-sm font-bold text-gray-700">Получать по {res.grade} баллов</span>
                <span className="text-sm font-extrabold text-indigo-600">нужно {res.needed} шт.</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.type === "specific" && (
        <div>
          <div className="text-center p-4 rounded-xl mb-3" style={{backgroundColor: r.willReach ? '#ecfdf5' : '#fef2f2'}}>
            <div className="text-xs text-gray-500">Новый средний после {r.futureGrades?.length || 0} оценок</div>
            <div className="text-2xl font-black" style={{color: r.willReach ? '#059669' : '#dc2626'}}>
              {r.newAvg?.toFixed(2)}
            </div>
            <div className="text-xs font-medium mt-1" style={{color: r.willReach ? '#059669' : '#dc2626'}}>
              {r.willReach ? "✅ Цель достижима!" : `❌ Не хватает ${Math.abs(r.gap).toFixed(2)} балла`}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
