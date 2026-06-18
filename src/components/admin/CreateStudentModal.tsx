"use client";

import { useState } from "react";
import { createStudent } from "@/app/admin/talleres/[id]/alumnos/actions";
import { createStudentSchema } from "@/lib/schemas/user";

interface StudentData {
  userId: string;
  email: string;
  name: string;
  progressPercent: number;
  accessKeyStatus: "Pendiente" | "Canjeada" | "Expirada";
  createdAt: string;
}

interface CreateStudentModalProps {
  workshopId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (student: StudentData) => void;
}

/**
 * Modal para crear nuevo alumno.
 * Forma con email + password temporal.
 * Al crear exitosamente, muestra clave de acceso UNA VEZ.
 * La clave no se recupera después de cerrar el modal (security).
 */
export function CreateStudentModal({
  workshopId,
  isOpen,
  onClose,
  onSuccess,
}: CreateStudentModalProps) {
  const [email, setEmail] = useState("");
  const [passwordTemp, setPasswordTemp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validar contra schema
      createStudentSchema.parse({ email, passwordTemp });

      // Llamar Server Action
      const result = await createStudent(workshopId, email, passwordTemp);

      if (!result.success) {
        setError(result.error || "Error creando alumno");
        setLoading(false);
        return;
      }

      // Mostrar clave generada
      setGeneratedKey(result.accessKey || "");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setError(message);
      setLoading(false);
    }
  };

  const handleConfirmKey = () => {
    // Alumno creado exitosamente
    onSuccess({
      userId: "temp-id", // ID real viene del server
      email,
      name: email.split("@")[0],
      progressPercent: 0,
      accessKeyStatus: "Pendiente",
      createdAt: new Date().toISOString(),
    });
    // Reset form
    setEmail("");
    setPasswordTemp("");
    setGeneratedKey(null);
    setError("");
  };

  const copyToClipboard = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      data-testid="create-student-modal"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {generatedKey ? (
            // Mostrar clave generada
            <div data-state="key-revealed">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Alumno Creado
              </h2>
              <p className="text-gray-600 mb-4">
                La clave de acceso ha sido generada. Cópiala ahora; no podrá recuperarse después.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-600 mb-2 font-semibold">Clave de Acceso:</p>
                <code className="text-xl font-mono font-bold text-blue-900 break-all">
                  {generatedKey}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Últimos 4 caracteres: {generatedKey.slice(-4)}
                </p>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition mb-3"
                data-testid="btn-copy-key"
              >
                Copiar Clave
              </button>

              <button
                onClick={handleConfirmKey}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                data-testid="btn-confirm-key"
              >
                Confirmar
              </button>
            </div>
          ) : (
            // Mostrar form de creación
            <form onSubmit={handleSubmit} data-state="form-input">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Crear Nuevo Alumno
              </h2>

              {error && (
                <div
                  className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm"
                  data-testid="error-message"
                >
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alumno@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="input-email"
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña Temporal
                </label>
                <input
                  type="password"
                  value={passwordTemp}
                  onChange={(e) => setPasswordTemp(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="input-password"
                  disabled={loading}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
                  data-testid="btn-cancel"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  data-testid="btn-create"
                  disabled={loading}
                  data-state={loading ? "loading" : "ready"}
                >
                  {loading ? "Creando..." : "Crear Alumno"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
