"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createProject, deleteProject } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2 } from "lucide-react"
import { EditProjectForm } from "@/components/forms/edit-project-form"

type Project = {
  id: string
  name: string
  createdAt: Date
}

interface ProjectManagementSectionProps {
  projects: Project[]
}

export function ProjectManagementSection({ projects }: ProjectManagementSectionProps) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    const result = await createProject({ name })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setName("")
    setSuccess("Project created successfully")
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(project: Project) {
    if (!window.confirm(`Delete project \"${project.name}\"?`)) {
      return
    }

    setDeletingId(project.id)
    setError("")
    setSuccess("")

    const result = await deleteProject({ projectId: project.id })

    if (result?.error) {
      setError(result.error)
      setDeletingId(null)
      return
    }

    setDeletingId(null)
    router.refresh()
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5">
      {editingProject && (
        <EditProjectForm
          project={editingProject}
          onCancel={() => setEditingProject(null)}
          onSuccess={() => setEditingProject(null)}
        />
      )}

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create Project</h2>
          <p className="mt-1 text-sm text-gray-600">Create projects here before assigning them to inputters.</p>
        </div>
        <div className="text-sm text-gray-500">Total projects: {projects.length}</div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Project name"
          className="sm:flex-1"
          required
        />
        <Button type="submit" disabled={loading} className="sm:w-40">
          {loading ? "Creating..." : "Create Project"}
        </Button>
      </form>

      {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
      {success && <div className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div>}

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-gray-900">Existing Projects</h3>
        {projects.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No projects created yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <li key={project.id} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-sm text-gray-700">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-gray-900">{project.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingProject(project)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(project)}
                      disabled={deletingId === project.id}
                      className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
