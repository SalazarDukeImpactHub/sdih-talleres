/**
 * Storage utility functions para Supabase Storage.
 * Construye URLs públicas para assets CDN.
 */

/**
 * getPublicUrl() — Construye URL pública de Supabase Storage para acceso CDN.
 *
 * @param bucket - Nombre del bucket (e.g., 'workshops')
 * @param path - Ruta dentro del bucket (e.g., '{workshopId}/cover.jpg')
 * @returns URL pública accesible sin autenticación
 */
export async function getPublicUrl(bucket: string, path: string): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  }

  // Format: https://{project-ref}.supabase.co/storage/v1/object/public/{bucket}/{path}
  return `${url}/storage/v1/object/public/${bucket}/${path}`;
}
