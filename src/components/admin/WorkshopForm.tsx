"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { createWorkshop, deleteWorkshop, updateWorkshop } from "@/app/admin/talleres/actions";
import { CoverUpload } from "./CoverUpload";

interface Workshop {
  id: string;
  title: string;
  description: string;
  instructor: string;
  date_live: string;
  duration: number;
  prerequisites?: string;
  status: string;
  category?: string | null;
  cover_image?: string;
}

interface WorkshopFormProps {
  mode: "create" | "edit";
  initialData?: Workshop;
  onSuccess?: (workshopId: string) => void;
}

/**
 * WorkshopForm — Componente para crear/editar talleres.
 * Mode 'create': formulario vacío, llama createWorkshop.
 * Mode 'edit': pre-populated, llama updateWorkshop.
 * Valida campos en cliente con Zod.
 */
export function WorkshopForm({ mode, initialData, onSuccess }: WorkshopFormProps) {
  const router = useRouter();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Prepare action based on mode
  const actionFunction = mode === "create" ? createWorkshop : (fd: FormData) =>
    updateWorkshop(initialData?.id || "", fd);

  const [, formAction, isPending] = useActionState(
    async (prevState: Record<string, unknown>, formData: FormData) => {
      // Add cover file if selected
      if (coverFile) {
        formData.set("cover", coverFile);
      }

      const result = await actionFunction(formData);

      if (!result.success) {
        // Parse error message for field-specific errors
        const errorMsg = result.error || "Error desconocido";
        if (errorMsg.includes(":")) {
          // Try to extract field errors
          const parts = errorMsg.split("; ");
          const errors: Record<string, string> = {};
          parts.forEach((part) => {
            const [field, msg] = part.split(": ");
            if (field && msg) {
              errors[field.trim()] = msg.trim();
            }
          });
          setFieldErrors(errors);
        }
        setFormError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Success
      setFormError("");
      setFieldErrors({});

      // Call onSuccess callback if provided, otherwise redirect
      if (onSuccess) {
        onSuccess((result as Record<string, unknown>).workshopId as string);
      } else {
        // Auto-redirect to list after success
        router.push("/admin/talleres");
      }

      return result;
    },
    { success: false }
  );

  const handleCoverError = (error: string) => {
    setFieldErrors((prev) => ({ ...prev, cover: error }));
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (mode !== "edit" || !initialData?.id) return;
    setIsDeleting(true);
    const result = await deleteWorkshop(initialData.id);
    if (!result.success) {
      setFormError(result.error || "No se pudo eliminar el taller");
      setIsDeleting(false);
      setShowDeleteModal(false);
      return;
    }
    router.push("/admin/talleres");
  };

  const statusOptions = ["disponible", "en vivo", "próximamente", "completado"];

  return (
    <>
    <form action={formAction} className="space-y-6 max-w-2xl">
      {/* Form-level error */}
      {formError && (
        <div
          className="p-4 bg-red-50 border border-red-200 rounded-md"
          data-testid="form-error"
        >
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Título*
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          defaultValue={initialData?.title || ""}
          maxLength={200}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.title ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-title"
          data-state={fieldErrors.title ? "error" : ""}
        />
        {fieldErrors.title && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Descripción*
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={initialData?.description || ""}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.description ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-description"
          data-state={fieldErrors.description ? "error" : ""}
        />
        {fieldErrors.description && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.description}</p>
        )}
      </div>

      {/* Instructor */}
      <div>
        <label htmlFor="instructor" className="block text-sm font-medium text-gray-700">
          Instructor*
        </label>
        <input
          type="text"
          id="instructor"
          name="instructor"
          required
          defaultValue={initialData?.instructor || ""}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.instructor ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-instructor"
          data-state={fieldErrors.instructor ? "error" : ""}
        />
        {fieldErrors.instructor && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.instructor}</p>
        )}
      </div>

      {/* Date */}
      <div>
        <label htmlFor="date_live" className="block text-sm font-medium text-gray-700">
          Fecha*
        </label>
        <input
          type="datetime-local"
          id="date_live"
          name="date_live"
          required
          defaultValue={
            initialData?.date_live
              ? new Date(initialData.date_live).toISOString().slice(0, 16)
              : ""
          }
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.date_live ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-date"
          data-state={fieldErrors.date_live ? "error" : ""}
        />
        {fieldErrors.date_live && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.date_live}</p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
          Duración (minutos)*
        </label>
        <input
          type="number"
          id="duration"
          name="duration"
          required
          min="1"
          defaultValue={initialData?.duration || ""}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.duration ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-duration"
          data-state={fieldErrors.duration ? "error" : ""}
        />
        {fieldErrors.duration && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.duration}</p>
        )}
      </div>

      {/* Prerequisites */}
      <div>
        <label htmlFor="prerequisites" className="block text-sm font-medium text-gray-700">
          Requisitos previos
        </label>
        <textarea
          id="prerequisites"
          name="prerequisites"
          rows={3}
          defaultValue={initialData?.prerequisites || ""}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          data-testid="input-prerequisites"
        />
      </div>

      {/* Categoría */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Categoría
        </label>
        <input
          type="text"
          id="category"
          name="category"
          list="category-suggestions"
          defaultValue={initialData?.category || ""}
          maxLength={60}
          placeholder="ej: IA y Tecnología"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          data-testid="input-category"
        />
        <datalist id="category-suggestions">
          <option value="IA y Tecnología" />
          <option value="Emprendimiento y Negocio" />
          <option value="Bienestar y Salud Mental" />
          <option value="Creatividad y Aprendizaje" />
        </datalist>
        <p className="mt-1 text-xs text-gray-500">
          Agrupa el taller en el catálogo. Dejala vacía para quitarla.
        </p>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Estado*
        </label>
        <select
          id="status"
          name="status"
          required
          defaultValue={initialData?.status || "disponible"}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
            fieldErrors.status ? "border-red-500" : "border-gray-300"
          }`}
          data-testid="input-status"
          data-state={fieldErrors.status ? "error" : ""}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {fieldErrors.status && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.status}</p>
        )}
      </div>

      {/* Cover Upload */}
      <div>
        <CoverUpload
          onFileSelect={setCoverFile}
          onError={handleCoverError}
          defaultPreview={initialData?.cover_image}
        />
        {fieldErrors.cover && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.cover}</p>
        )}
      </div>

      {/* Submit + Delete buttons */}
      <div className="flex gap-2 justify-between">
        <button
          type="submit"
          disabled={isPending || isDeleting}
          className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="submit-button"
          data-state={isPending ? "loading" : ""}
        >
          {isPending
            ? "Guardando..."
            : mode === "create"
              ? "Crear Taller"
              : "Guardar Cambios"}
        </button>

        {mode === "edit" && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isPending || isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="delete-button"
            data-state={isDeleting ? "loading" : ""}
          >
            {isDeleting ? "Eliminando..." : "Eliminar Taller"}
          </button>
        )}
      </div>
    </form>

    {showDeleteModal && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        data-testid="delete-modal"
      >
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <h2 className="text-lg font-semibold text-gray-900">¿Eliminar el taller?</h2>
          <p className="mt-2 text-sm text-gray-600">
            {initialData?.title}. Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              disabled={isDeleting}
              className="px-4 py-2 bg-gray-200 text-gray-900 rounded-md font-medium hover:bg-gray-300 disabled:opacity-50"
              data-testid="delete-cancel"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 disabled:opacity-50"
              data-testid="delete-confirm"
            >
              {isDeleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
