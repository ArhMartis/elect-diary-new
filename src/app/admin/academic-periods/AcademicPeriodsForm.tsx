"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addPeriod, updatePeriod, deletePeriod } from "./actions";

interface Group {
  id: number;
  name: string;
}

interface AcademicPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  groupId: number | null;
}

interface AcademicPeriodsFormProps {
  periods: AcademicPeriod[];
  groupsList: Group[];
}

export default function AcademicPeriodsForm({ periods, groupsList }: AcademicPeriodsFormProps) {
  const router = useRouter();
  const [editingPeriod, setEditingPeriod] = useState<AcademicPeriod | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    endDate: "",
    groupId: "",
  });

  const handleEdit = (period: AcademicPeriod) => {
    setEditingPeriod(period);
    setFormData({
      name: period.name,
      startDate: period.startDate,
      endDate: period.endDate,
      groupId: period.groupId?.toString() || "",
    });
  };

  const handleCancel = () => {
    setEditingPeriod(null);
    setFormData({ name: "", startDate: "", endDate: "", groupId: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("startDate", formData.startDate);
    data.append("endDate", formData.endDate);
    data.append("groupId", formData.groupId);

    if (editingPeriod) {
      data.append("id", editingPeriod.id.toString());
      updatePeriod(data);
    } else {
      addPeriod(data);
    }

    handleCancel();
  };

  return (
    <div className="space-y-6">
      {/* Форма добавления/редактирования */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-blue-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          {editingPeriod ? "Редактировать четверть" : "Добавить четверть"}
        </h2>

        <form onSubmit={handleSubmit} className="grid md:grid-cols-5 gap-4">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              placeholder="1 четверть"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Начало *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Конец *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Класс
            </label>
            <select
              value={formData.groupId}
              onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">Для всех классов</option>
              {groupsList.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end gap-2">
            <button
              type="submit"
              className={`flex-1 px-4 py-2.5 rounded-lg transition-all font-medium ${
                editingPeriod
                  ? "bg-amber-600 text-white hover:bg-amber-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {editingPeriod ? "Сохранить" : "Добавить"}
            </button>
            {editingPeriod && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Отмена
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Список четвертей */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
              clipRule="evenodd"
            />
          </svg>
          Учебные четверти
        </h2>

        {periods.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Четверти еще не добавлены
          </div>
        ) : (
          <div className="space-y-3">
            {periods
              .sort((a, b) => {
                // Сначала общие (без класса), потом по классам
                if (!a.groupId && !b.groupId) return a.startDate.localeCompare(b.startDate);
                if (!a.groupId) return -1;
                if (!b.groupId) return 1;
                return a.startDate.localeCompare(b.startDate);
              })
              .map((period) => {
                const group = period.groupId ? groupsList.find(g => g.id === period.groupId) : null;
                return (
                  <div
                    key={period.id}
                    className="flex justify-between items-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{period.name}</span>
                        {group ? (
                          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {group.name}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full font-medium">
                            Для всех классов
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {new Date(period.startDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        —{" "}
                        {new Date(period.endDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(period)}
                        className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                      >
                        Редактировать
                      </button>
                      <form action={deletePeriod}>
                        <input type="hidden" name="id" value={period.id.toString()} />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all text-sm font-medium"
                          onClick={(e) => {
                            if (!confirm("Удалить эту четверть?")) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Удалить
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
