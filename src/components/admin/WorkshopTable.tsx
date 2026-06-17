"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { fetchWorkshops } from "@/app/admin/talleres/actions";

interface Workshop {
  id: string;
  slug: string;
  title: string;
  status: string;
  date_live: string;
  instructor: string;
  cover_image?: string | null;
}

interface WorkshopTableProps {
  initialWorkshops: Workshop[];
}

type FilterStatus = "" | "disponible" | "en vivo" | "próximamente" | "completado";

/**
 * WorkshopTable — Client Component para lista filterable de talleres.
 *
 * Props:
 * - initialWorkshops: array de Workshop objects
 *
 * Features:
 * - Filter dropdown (todas, disponible, en vivo, próximamente, completado)
 * - Table con columns: ID, Title, Status, Date, Instructor, Actions
 * - Action buttons: Edit (→ /admin/talleres/[id]), View (→ /catalogo)
 * - "New Workshop" button (deferred link)
 * - Responsive table (horizontal scroll mobile)
 */
export function WorkshopTable({ initialWorkshops }: WorkshopTableProps) {
  const [workshops, setWorkshops] = useState(initialWorkshops);
  const [filter, setFilter] = useState<FilterStatus>("");
  const [loading, setLoading] = useState(false);

  const handleFilterChange = useCallback(async (newFilter: FilterStatus) => {
    setFilter(newFilter);
    setLoading(true);
    try {
      const filtered = await fetchWorkshops(newFilter || undefined);
      setWorkshops(filtered);
    } catch (err) {
      console.error("Failed to filter workshops:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("es-AR");
    } catch {
      return "—";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "disponible":
        return "bg-green-100 text-green-800";
      case "en vivo":
        return "bg-blue-100 text-blue-800";
      case "próximamente":
        return "bg-yellow-100 text-yellow-800";
      case "completado":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar: Filter + New button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="filter" className="text-sm font-medium text-gray-700">
            Filtrar por estado:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value as FilterStatus)}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:bg-gray-50"
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="en vivo">En vivo</option>
            <option value="próximamente">Próximamente</option>
            <option value="completado">Completado</option>
          </select>
        </div>

        <Link
          href="/admin/talleres/new"
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition-colors"
        >
          Nuevo Taller
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm" data-testid="workshop-table">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">ID</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Título</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Estado</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Fecha</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Instructor</th>
              <th className="px-6 py-3 text-left font-semibold text-gray-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            ) : workshops.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No hay talleres
                </td>
              </tr>
            ) : (
              workshops.map((workshop) => (
                <tr key={workshop.id} className="hover:bg-gray-50" data-workshop-id={workshop.id}>
                  <td className="px-6 py-4 text-gray-900 font-mono text-xs">
                    {workshop.id.slice(0, 8)}...
                  </td>
                  <td className="px-6 py-4 text-gray-900 font-medium">{workshop.title}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(workshop.status)}`}>
                      {workshop.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(workshop.date_live)}</td>
                  <td className="px-6 py-4 text-gray-600">{workshop.instructor}</td>
                  <td className="px-6 py-4 flex items-center gap-2">
                    <Link
                      href={`/admin/talleres/${workshop.id}`}
                      className="px-3 py-1 bg-gray-200 text-gray-900 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                      data-testid="workshop-edit-btn"
                    >
                      Editar
                    </Link>
                    <Link
                      href={`/taller/${workshop.slug}`}
                      target="_blank"
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                      data-testid="workshop-view-btn"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
