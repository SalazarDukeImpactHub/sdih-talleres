"use client";

import { ChangeEvent, useState } from "react";

interface CoverUploadProps {
  onFileSelect: (file: File | null) => void;
  onError: (error: string) => void;
  defaultPreview?: string;
}

/**
 * CoverUpload — Sub-componente para seleccionar y previsualizar imagen de portada.
 * Valida tipo de archivo (JPEG, PNG, WebP) y tamaño (<5MB) en cliente.
 * Emite file selection al padre via callback.
 */
export function CoverUpload({ onFileSelect, onError, defaultPreview }: CoverUploadProps) {
  const [preview, setPreview] = useState<string | null>(defaultPreview || null);
  const [fileName, setFileName] = useState<string>("");
  const [validationError, setValidationError] = useState<string>("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError("");

    if (!file) {
      setPreview(null);
      setFileName("");
      onFileSelect(null);
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      const error = "Tipo de archivo no válido. Solo JPG, PNG y WebP.";
      setValidationError(error);
      onError(error);
      onFileSelect(null);
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = "Archivo muy grande. Máximo 5 MB.";
      setValidationError(error);
      onError(error);
      onFileSelect(null);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setPreview(result);
      setFileName(file.name);
      onFileSelect(file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Portada (opcional)</label>

      {/* File input */}
      <div className="relative">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
          data-testid="cover-file-input"
        />
      </div>

      {/* Validation error */}
      {validationError && (
        <p className="text-sm text-red-600" data-testid="cover-error">
          {validationError}
        </p>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Previsualización:</p>
          <div className="relative h-40 w-full bg-gray-100 rounded-md overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
              data-testid="cover-preview"
            />
          </div>
          {fileName && (
            <p className="text-xs text-gray-500 mt-1">Archivo: {fileName}</p>
          )}
        </div>
      )}
    </div>
  );
}
