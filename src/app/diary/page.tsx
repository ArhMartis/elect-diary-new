"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DiaryPage() {
  const router = useRouter();
  const [showSelectModal, setShowSelectModal] = useState(true);
  const [classes, setClasses] = useState<{id: number, name: string}[]>([]);
  const [students, setStudents] = useState<{id: string, fullName: string}[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | "">("");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [selectedStudentName, setSelectedStudentName] = useState<string>("");
  const [selectedClassName, setSelectedClassName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await fetch("/api/classes");
        const data = await response.json();
        if (Array.isArray(data)) {
          setClasses(data);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading classes:", error);
        setIsLoading(false);
      }
    };
    loadClasses();
  }, []);

  useEffect(() => {
    const loadStudents = async () => {
      if (!selectedClassId) {
        setStudents([]);
        return;
      }
      try {
        const response = await fetch(`/api/students?classId=${selectedClassId}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setStudents(data);
        } else {
          setStudents([]);
        }
      } catch (error) {
        console.error("Error loading students:", error);
        setStudents([]);
      }
    };
    loadStudents();
  }, [selectedClassId]);

  const handleContinue = () => {
    if (selectedStudentId) {
      setShowSelectModal(false);
    }
  };

  const handleBack = () => {
    router.push("/admin");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-800 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Top bar */}
      <div className="bg-white shadow-md border-b border-emerald-200">
        <div className="max-w-[210mm] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
            >
              ← Back
            </button>
            <button
              onClick={() => setShowSelectModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all font-medium"
            >
              ✏ Select Student
            </button>
          </div>
          {selectedStudentId && (
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              ✓ Selected: {selectedStudentName}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showSelectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🎓</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Select Student</h2>
              <p className="text-gray-600 text-sm">Choose class and student for diary</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  const classId = Number(e.target.value);
                  setSelectedClassId(classId);
                  const cls = classes.find(c => c.id === classId);
                  setSelectedClassName(cls?.name || "");
                }}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 bg-white text-gray-800"
              >
                <option value="">-- Select class --</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Student</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  const studentId = e.target.value;
                  setSelectedStudentId(studentId);
                  const student = students.find(s => s.id === studentId);
                  setSelectedStudentName(student?.fullName || "");
                }}
                disabled={!selectedClassId}
                className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:border-emerald-500 disabled:bg-gray-100 text-gray-800"
              >
                <option value="">-- Select student --</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>{student.fullName}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleContinue}
              disabled={!selectedStudentId}
              className="w-full px-6 py-4 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Diary content */}
      {!showSelectModal && selectedStudentId && (
        <div className="max-w-[210mm] mx-auto bg-white shadow-xl my-4 rounded-xl overflow-hidden">
          <div className="p-12 bg-gradient-to-b from-amber-50/50 to-white">
            <div className="text-center mb-10">
              <div className="text-4xl mb-2">🎓</div>
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 mb-2">
                Student Diary
              </h2>
              <p className="text-gray-500 text-sm">Official document</p>
            </div>
            
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-emerald-100">
              <h3 className="font-bold text-emerald-800 mb-6">📝 Basic Information</h3>
              <table className="w-full">
                <tbody>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900 w-2/5">Student:</td>
                    <td className="py-4 text-gray-800 font-medium">{selectedStudentName}</td>
                  </tr>
                  <tr className="border-b border-emerald-50">
                    <td className="py-4 font-semibold text-gray-900">Class:</td>
                    <td className="py-4 text-gray-800 font-medium">{selectedClassName}</td>
                  </tr>
                  <tr>
                    <td className="py-4 font-semibold text-gray-900">School:</td>
                    <td className="py-4 text-gray-800 font-medium">Zhlabin Secondary School No. 22</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
