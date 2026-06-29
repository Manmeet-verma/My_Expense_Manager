import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getMembers, getProjects, getSupervisors, getInputterDeselections } from "@/actions/auth"
import { ProjectAssignmentSection } from "@/components/forms/project-assignment-section"
import { ProjectManagementSection } from "@/components/forms/project-management-section"
import { DeselectionHistory } from "@/components/deselection-history"

export default async function AssignmentsPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const [members, verifiers, projects, deselections] = await Promise.all([
    getMembers(),
    getSupervisors(),
    getProjects(),
    getInputterDeselections(),
  ])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Project Management</h1>
        <p className="mt-1 text-gray-600">Create projects first, then assign one or more projects to each inputter from the multi-select dropdown.</p>
      </div>

      <div className="space-y-6">
        <ProjectManagementSection projects={projects} />
        {deselections.length > 0 && (
          <DeselectionHistory deselections={deselections} members={members} verifiers={verifiers} />
        )}
        <ProjectAssignmentSection members={members} verifiers={verifiers} projects={projects} />
      </div>
    </div>
  )
}
