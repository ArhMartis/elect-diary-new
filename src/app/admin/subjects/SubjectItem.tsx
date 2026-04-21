"use client";

import { assignTeacherToSubject, removeTeacherFromSubject, updateSubject, deleteSubject } from "./actions";

interface Subject {
  id: number;
  name: string;
  teacherId: string | null;
  type?: string | null;
}

interface Teacher {
  id: string;
  name: string;
  fullName: string;
}

interface TeacherSubject {
  id: number;
  teacherId: string;
  subjectId: number;
}

export function SubjectItem({ 
  subject, 
  teachers,
  teacherSubjects 
}: { 
  subject: Subject; 
  teachers: Teacher[];
  teacherSubjects: TeacherSubject[];
}) {
  // Получаем IDs учителей, закреплённых за этим предметом
  const assignedTeacherIds = new Set(teacherSubjects.map(ts => ts.teacherId));

  return (
    <div className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-800 font-medium text-lg">{subject.name}</span>
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full font-medium">
            {assignedTeacherIds.size} учител{assignedTeacherIds.size === 1 ? 'ь' : assignedTeacherIds.size < 5 ? 'я' : 'ей'}
          </span>
        </div>
        
        {/* Кнопки редактирования и удаления предмета */}
        <div className="flex gap-2">
          {/* Форма редактирования */}
          <form action={updateSubject} className="flex gap-2">
            <input type="hidden" name="id" value={subject.id} />
            <input
              name="name"
              defaultValue={subject.name}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-indigo-500"
              required
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 text-white rounded hover:bg-amber-600 transition-all text-sm font-medium"
            >
              Обновить
            </button>
          </form>
          {/* Форма удаления */}
          <form action={deleteSubject}>
            <input type="hidden" name="id" value={subject.id} />
            <button
              type="submit"
              className="px-3 py-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-all text-sm font-medium"
              onClick={(e) => {
                if (!confirm("Вы уверены, что хотите удалить этот предмет?")) {
                  e.preventDefault();
                }
              }}
            >
              Удалить
            </button>
          </form>
        </div>
      </div>

      {/* Справочник учителей для этого предмета */}
      {subject.type !== 'event' && subject.type !== 'class_hour' && subject.type !== 'olympiad' && (
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
          Учителя, ведущие этот предмет:
        </h4>
        
        <div className="space-y-2">
          {teachers.map((teacher) => {
            const isAssigned = assignedTeacherIds.has(teacher.id);
            
            return (
              <div 
                key={teacher.id}
                className={`flex justify-between items-center p-3 rounded-lg transition-all ${
                  isAssigned 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-700 font-semibold text-sm">
                      {teacher.fullName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span className={`font-medium ${isAssigned ? 'text-emerald-800' : 'text-gray-700'}`}>
                      {teacher.fullName}
                    </span>
                    {isAssigned && (
                      <p className="text-xs text-emerald-600">Закреплён за предметом</p>
                    )}
                  </div>
                </div>

                {/* Кнопка +/- */}
                {isAssigned ? (
                  <form action={removeTeacherFromSubject}>
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                      title="Открепить предмет"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </form>
                ) : (
                  <form action={assignTeacherToSubject}>
                    <input type="hidden" name="teacherId" value={teacher.id} />
                    <input type="hidden" name="subjectId" value={subject.id} />
                    <button
                      type="submit"
                      className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-md hover:shadow-lg"
                      title="Закрепить предмет"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>

        {teachers.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            В системе нет учителей
          </p>
        )}
      </div>
      )}
    </div>
  );
}
