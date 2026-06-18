import { StudentList } from "@/components/admin/StudentList";
import { fetchStudents } from "./actions";
import { getExerciseAwareProgress } from "@/lib/actions/workshop-sections";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página para ver lista de alumnos de un taller (Admin).
 * Muestra estudiantes + progreso de cada uno.
 * Server Component que fetch estudiantes + progreso y renderiza StudentList.
 */
export default async function StudentsPage({ params }: PageProps) {
  const { id: workshopId } = await params;

  // Fetch students para este taller
  const students = await fetchStudents(workshopId);

  // Fetch progress para cada alumno
  const progressMap: Record<string, number> = {};
  for (const student of students) {
    try {
      const progress = await getExerciseAwareProgress(student.userId, workshopId);
      progressMap[student.userId] = progress.progressPercent;
    } catch (err) {
      console.error(`Failed to get progress for student ${student.userId}:`, err);
      progressMap[student.userId] = 0;
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Alumnos del Taller</h1>
        <p className="text-gray-600 mb-6">Gestiona estudiantes y claves de acceso</p>

        <div className="bg-white rounded-lg shadow">
          <StudentList
            students={students}
            progressData={progressMap}
            workshopId={workshopId}
          />
        </div>
      </div>
    </div>
  );
}
