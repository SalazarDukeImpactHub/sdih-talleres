"use client";

import { useState } from "react";
import { CreateStudentModal } from "./CreateStudentModal";

interface Student {
  userId: string;
  email: string;
  name: string | null;
  progressPercent?: number;
  accessKeyStatus: "Pendiente" | "Canjeada" | "Expirada";
  createdAt: string;
}

interface StudentListProps {
  students: Student[];
  progressData: Record<string, number>;
  workshopId: string;
}

/**
 * Componente Client para mostrar lista de alumnos de un taller.
 * Tabla con email, nombre, progreso %, y acciones (generar clave, editar, eliminar).
 * Botón "Nuevo Alumno" abre modal para crear alumno + generar clave.
 * (Editar alumno y eliminar: deferred v1.1)
 */
export function StudentList({
  students,
  progressData,
  workshopId,
}: StudentListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentList, setStudentList] = useState(students);

  const handleStudentAdded = (newStudent: Student) => {
    setStudentList((prev) => [newStudent, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {studentList.length} alumno{studentList.length !== 1 ? "s" : ""}
        </h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          data-testid="btn-new-student"
        >
          Nuevo Alumno
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Progreso %
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Estado Clave
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {studentList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No hay alumnos aún. Crea el primero con el botón arriba.
                </td>
              </tr>
            ) : (
              studentList.map((student) => {
                const progress = progressData[student.userId] ?? 0;
                return (
                  <tr key={student.userId} data-testid={`student-row-${student.userId}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {student.name || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="ml-2 text-gray-700 font-medium">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          student.accessKeyStatus === "Canjeada"
                            ? "bg-green-100 text-green-800"
                            : student.accessKeyStatus === "Expirada"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                        }`}
                        data-testid={`key-status-${student.userId}`}
                      >
                        {student.accessKeyStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        {/* Editar deferred v1.1 */}
                        {/* Eliminar deferred v1.1 */}
                        <span className="text-gray-400 text-xs">v1.1</span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <CreateStudentModal
        workshopId={workshopId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleStudentAdded}
      />
    </div>
  );
}
