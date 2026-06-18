"use client";

/**
 * Componente KeyTable para mostrar claves de acceso de estudiantes.
 * Tabla con email, nombre, clave (enmascarada), estado, fecha creación, y acciones.
 * Botón "Regenerar Clave" solo para claves Pendiente y Expirada.
 * Deferred: esta tabla no se usa en 5c (provisional), se usa en 5d con hash.
 * Por ahora, integrada en StudentList como mostrador de estado.
 */

interface KeyTableProps {
  keys: Array<{
    userId: string;
    studentEmail: string;
    studentName: string;
    maskedKey: string; // últimos 4 chars
    status: "Pending" | "Redeemed" | "Expired";
    createdAt: string;
  }>;
  onRegenerateKey: (userId: string, workshopId: string) => Promise<void>;
}

export function KeyTable({ keys, onRegenerateKey }: KeyTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Email del Alumno
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Clave (últimos 4)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Creada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {keys.map((key) => (
            <tr key={`${key.userId}`} data-testid={`key-row-${key.userId}`}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {key.studentEmail}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {key.studentName}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-gray-900">
                ••••{key.maskedKey}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    key.status === "Redeemed"
                      ? "bg-green-100 text-green-800"
                      : key.status === "Expired"
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {key.status === "Redeemed"
                    ? "Canjeada"
                    : key.status === "Expired"
                      ? "Expirada"
                      : "Pendiente"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {new Date(key.createdAt).toLocaleDateString("es-AR")}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {key.status === "Redeemed" ? (
                  <span className="text-gray-400 text-xs">-</span>
                ) : (
                  <button
                    onClick={() => onRegenerateKey(key.userId, key.studentEmail)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                    data-testid={`btn-regenerate-${key.userId}`}
                  >
                    Regenerar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
