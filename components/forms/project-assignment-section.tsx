"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { assignMemberToVerifier, clearMemberAssignment } from "@/actions/auth"
import { Pencil, Trash2, Search } from "lucide-react"
import { formatAssignedProjects } from "@/lib/utils"

type Verifier = {
  id: string
  name: string | null
  email: string
}

type Project = {
  id: string
  name: string
}

type Member = {
  id: string
  name: string | null
  email: string
  assignedProject?: string[] | null
  assignedVerifierIds?: string[] | null
  assignedVerifierId?: string | null
  assignedVerifier?: {
    id: string
    name: string | null
    email: string
  } | null
}

interface ProjectAssignmentSectionProps {
  members: Member[]
  verifiers: Verifier[]
  projects: Project[]
}

export function ProjectAssignmentSection({ members, verifiers, projects }: ProjectAssignmentSectionProps) {
  const router = useRouter()
  const [memberId, setMemberId] = useState("")
  const [verifierIds, setVerifierIds] = useState<string[]>([])
  const [projectIds, setProjectIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [clearingId, setClearingId] = useState<string | null>(null)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProjectView, setSelectedProjectView] = useState("")

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members
    const q = searchQuery.toLowerCase()
    return members.filter((m) =>
      (m.name?.toLowerCase() || "").includes(q) ||
      m.email.toLowerCase().includes(q) ||
      (m.assignedProject?.some((p) => p.toLowerCase().includes(q)) || false)
    )
  }, [members, searchQuery])

  const verifierAssignmentCounts = useMemo(() => {
    return verifiers.reduce<Record<string, number>>((counts, verifier) => {
      counts[verifier.id] = members.filter((member) => {
        const ids = member.assignedVerifierIds?.length
          ? member.assignedVerifierIds
          : member.assignedVerifierId
            ? [member.assignedVerifierId]
            : member.assignedVerifier?.id
              ? [member.assignedVerifier.id]
              : []
        return ids.includes(verifier.id)
      }).length
      return counts
    }, {})
  }, [members, verifiers])

  const unassignedInputters = useMemo(
    () => members.filter((member) => !member.assignedProject?.length),
    [members]
  )

  const assignedToProjectOnly = useMemo(
    () => members.filter((member) => member.assignedProject?.length && !member.assignedVerifierIds?.length && !member.assignedVerifierId),
    [members]
  )

  const projectAssignments = useMemo(() => {
    return projects.map((project) => ({
      project,
      inputters: members.filter((member) => member.assignedProject?.includes(project.name)),
    }))
  }, [projects, members])

  function handleProjectSelection(event: React.ChangeEvent<HTMLSelectElement>) {
    const selectedProjects = Array.from(event.target.selectedOptions).map((option) => option.value)
    setProjectIds(selectedProjects)
  }

  async function handleAssign(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!memberId || projectIds.length === 0) {
      alert("Please select inputter and at least one project")
      return
    }

    setSubmitting(true)
    const result = await assignMemberToVerifier({
      memberId,
      verifierIds,
      projectIds,
    })

    if (result?.error) {
      alert(result.error)
      setSubmitting(false)
      return
    }

    setMemberId("")
    setVerifierIds([])
    setProjectIds([])
    setSubmitting(false)
    setEditingMemberId(null)
    router.refresh()
  }

  function startEdit(member: Member) {
    setMemberId(member.id)
    setProjectIds(
      projects.filter((project) => member.assignedProject?.includes(project.name)).map((project) => project.id)
    )
    setVerifierIds(
      member.assignedVerifierIds?.length
        ? member.assignedVerifierIds
        : member.assignedVerifierId
          ? [member.assignedVerifierId]
          : member.assignedVerifier?.id
            ? [member.assignedVerifier.id]
            : []
    )
    setEditingMemberId(member.id)
  }

  async function handleClear(memberIdToClear: string) {
    if (!window.confirm("Clear assignment for this inputter?")) {
      return
    }

    setClearingId(memberIdToClear)
    const result = await clearMemberAssignment({ memberId: memberIdToClear })

    if (result?.error) {
      alert(result.error)
      setClearingId(null)
      return
    }

    setClearingId(null)
    if (editingMemberId === memberIdToClear) {
      setMemberId("")
      setProjectIds([])
      setVerifierIds([])
      setEditingMemberId(null)
    }
    router.refresh()
  }

  return (
    <section id="project-assignments" className="mt-10 rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-gray-900">Project And Verifier Assignment</h2>
        <p className="mt-1 text-sm text-gray-600">Assign or edit each inputter&apos;s project and verifier from the admin dashboard.</p>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search inputter by name, email or project..."
          className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <form onSubmit={handleAssign} className="grid gap-3 rounded-lg border border-gray-100 bg-gray-50 p-4 md:grid-cols-4">
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
        >
          <option value="">Select inputter</option>
          {filteredMembers.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name ? `${member.name} (${member.email})` : member.email}
            </option>
          ))}
        </select>

        <select
          multiple
          value={projectIds}
          onChange={handleProjectSelection}
          className="min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 md:col-span-4">Hold Ctrl or Command to choose multiple projects.</p>

        <select
          multiple
          value={verifierIds}
          onChange={(event) => setVerifierIds(Array.from(event.target.selectedOptions).map((option) => option.value))}
          className="min-h-24 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          {verifiers.map((verifier) => {
            const assignedCount = verifierAssignmentCounts[verifier.id] ?? 0
            const label = `${verifier.name || verifier.email} (${assignedCount})`

            return (
              <option key={verifier.id} value={verifier.id}>
                {label}
              </option>
            )
          })}
        </select>
        <p className="text-xs text-gray-500 md:col-span-4">Hold Ctrl or Command to choose multiple verifiers.</p>

        <button
          type="submit"
          disabled={submitting}
          className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Saving..." : editingMemberId ? "Update Assignment" : "Assign"}
        </button>
      </form>

      {projects.length === 0 && (
        <div className="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          Create at least one project before assigning inputters.
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Inputters by Project</h3>
        <div className="mb-4">
          <select
            value={selectedProjectView}
            onChange={(e) => setSelectedProjectView(e.target.value)}
            className="h-10 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 text-sm"
          >
            <option value="">-- Select a project to view --</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {selectedProjectView ? (
          (() => {
            const project = projects.find((p) => p.id === selectedProjectView)
            if (!project) return null
            const inputters = members.filter((m) => m.assignedProject?.includes(project.name))
            return (
              <div className="rounded-lg border border-gray-200 p-4">
                <h4 className="text-sm font-semibold text-gray-900">{project.name}</h4>
                <p className="text-xs text-gray-500">{inputters.length} inputter{inputters.length !== 1 ? "s" : ""}</p>

                {inputters.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">No inputter assigned.</p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {inputters.map((member) => {
                      const verifierName = member.assignedVerifier?.name || member.assignedVerifier?.email
                      return (
                        <li key={member.id} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                          <p className="text-sm font-medium text-gray-900">{member.name || member.email}</p>
                          {verifierName ? (
                            <p className="text-xs text-gray-600">Verifier: {verifierName}</p>
                          ) : (
                            <p className="text-xs text-amber-600">No verifier assigned</p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-xs">
                            <button
                              type="button"
                              onClick={() => startEdit(member)}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleClear(member.id)}
                              disabled={clearingId === member.id}
                              className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 disabled:opacity-60"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {clearingId === member.id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })()
        ) : (
          <p className="text-sm text-gray-500">Select a project from the dropdown above to see its assigned inputters.</p>
        )}
      </div>

      {assignedToProjectOnly.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">Inputters with Projects (No Verifier)</h3>
          <p className="text-xs text-amber-700 mb-2">These inputters have projects assigned but no verifier.</p>
          <ul className="space-y-1 text-sm text-amber-900">
            {assignedToProjectOnly.map((member) => (
              <li key={member.id} className="flex items-center justify-between">
                <span>{member.name || member.email} — {formatAssignedProjects(member.assignedProject)}</span>
                <button
                  type="button"
                  onClick={() => startEdit(member)}
                  className="text-blue-600 hover:text-blue-700 text-xs"
                >
                  <Pencil className="h-3 w-3 inline mr-1" />
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-dashed border-gray-300 p-4">
        <h3 className="text-sm font-semibold text-gray-900">Unassigned Inputters (No Projects)</h3>
        {unassignedInputters.length === 0 ? (
          <p className="mt-2 text-sm text-gray-600">All inputters have at least one project.</p>
        ) : (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {unassignedInputters.map((member) => (
              <li key={member.id}>{member.name || member.email}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
