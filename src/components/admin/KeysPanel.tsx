"use client";

import { useMemo, useState } from "react";
import {
  assignKeyToStudent,
  type AccessKeyRow,
  type AssignOption,
  type KeyStatus,
} from "@/app/admin/claves/actions";

interface KeysPanelProps {
  keys: AccessKeyRow[];
  students: AssignOption[];
  workshops: AssignOption[];
}

const STATUS_STYLES: Record<KeyStatus, string> = {
  Canjeada: "bg-green-100 text-green-800",
  Expirada: "bg-red-100 text-red-800",
  Pendiente: "bg-yellow-100 text-yellow-800",
};

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * KeysPanel — vista global de claves de acceso de todos los talleres.
 * Filtros por taller y estado + modal para asignar/regenerar clave
 * a un alumno existente. La clave generada se muestra UNA vez con botón copiar.
 */
export function KeysPanel({ keys, students, workshops }: KeysPanelProps) {
  const [filterWorkshop, setFilterWorkshop] = useState<string>("todos");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado del formulario de asignación
  const [selStudent, setSelStudent] = useState("");
  const [selWorkshop, setSelWorkshop] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [generatedKey, setGeneratedKey] = useState("");
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(
    () =>
      keys.filter(
        (k) =>
          (filterWorkshop === "todos" || k.workshopId === filterWorkshop) &&
          (filterStatus === "todos" || k.status === filterStatus)
      ),
    [keys, filterWorkshop, filterStatus]
  );

  const counts = useMemo(() => {
    const c = { Pendiente: 0, Canjeada: 0, Expirada: 0 };
    for (const k of keys) c[k.status]++;
    return c;
  }, [keys]);

  const handleAssign = async () => {
    setAssignError("");
    setIsAssigning(true);
    const result = await assignKeyToStudent(selStudent, selWorkshop);
    setIsAssigning(false);

    if (!result.success || !result.key) {
      setAssignError(result.error || "Error generando la clave");
      return;
    }
    setGeneratedKey(result.key);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard puede fallar en contextos no-https; el admin puede seleccionar el texto
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelStudent("");
    setSelWorkshop("");
    setAssignError("");
    setGeneratedKey("");
    setCopied(false);
  };

  return (
    <div>
      {/* Header + acción principal */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claves de acceso</h1>
          <p className="text-sm text-gray-500 mt-1">
            {keys.length} claves · {counts.Pendiente} pendientes ·{" "}
            {counts.Canjeada} canjeadas · {counts.Expirada} expiradas
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          data-testid="btn-assign-key"
        >
          Asignar clave
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterWorkshop}
          onChange={(e) => setFilterWorkshop(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
          data-testid="filter-workshop"
        >
          <option value="todos">Todos los talleres</option>
          {workshops.map((w) => (
            <option key={w.id} value={w.id}>
              {w.label}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900"
          data-testid="filter-status"
        >
          <option value="todos">Todos los estados</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Canjeada">Canjeada</option>
          <option value="Expirada">Expirada</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Alumno", "Taller", "Estado", "Canjeada", "Expira", "Creada"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  {keys.length === 0
                    ? "No hay claves emitidas todavía. Asigná la primera con el botón de arriba."
                    : "Ninguna clave coincide con los filtros."}
                </td>
              </tr>
            ) : (
              filtered.map((k) => (
                <tr key={k.accessId} data-testid={`key-row-${k.accessId}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{k.email}</div>
                    {k.name && (
                      <div className="text-xs text-gray-500">{k.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                    {k.workshopTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[k.status]}`}
                    >
                      {k.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(k.redeemedAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(k.expiresAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(k.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de asignación */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          data-testid="assign-key-modal"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
            {generatedKey ? (
              /* Paso 2: clave generada — se muestra UNA vez */
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Clave generada
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Copiala ahora — no se vuelve a mostrar. Compartila con la
                  alumna por WhatsApp o el canal que uses.
                </p>
                <div className="flex items-center gap-2 mb-6">
                  <code
                    className="flex-1 px-4 py-3 bg-gray-100 rounded-lg text-lg font-mono text-gray-900 text-center tracking-wider"
                    data-testid="generated-key"
                  >
                    {generatedKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-3 rounded-lg text-sm font-semibold transition ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                    }`}
                    data-testid="btn-copy-key"
                  >
                    {copied ? "✓ Copiada" : "Copiar"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            ) : (
              /* Paso 1: elegir alumno + taller */
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Asignar clave de acceso
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Generá una clave para un alumno existente. Si ya tenía clave
                  para ese taller, se reemplaza por una nueva (90 días de
                  vigencia).
                </p>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alumno
                </label>
                <select
                  value={selStudent}
                  onChange={(e) => setSelStudent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 bg-white text-gray-900"
                  data-testid="select-student"
                >
                  <option value="">Elegí un alumno…</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taller
                </label>
                <select
                  value={selWorkshop}
                  onChange={(e) => setSelWorkshop(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-4 bg-white text-gray-900"
                  data-testid="select-workshop"
                >
                  <option value="">Elegí un taller…</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.label}
                    </option>
                  ))}
                </select>

                {assignError && (
                  <p className="text-sm text-red-600 mb-4" data-testid="assign-error">
                    {assignError}
                  </p>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={closeModal}
                    disabled={isAssigning}
                    className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAssign}
                    disabled={isAssigning || !selStudent || !selWorkshop}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    data-testid="btn-confirm-assign"
                  >
                    {isAssigning ? "Generando…" : "Generar clave"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
