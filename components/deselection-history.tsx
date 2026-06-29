import { formatDate } from "@/lib/utils"

type Deselection = {
  id: string
  verifierId: string
  memberId: string
  reason: string
  createdAt: Date
}

type UserSummary = {
  id: string
  name: string | null
  email: string
}

export function DeselectionHistory({
  deselections,
  members,
  verifiers,
}: {
  deselections: Deselection[]
  members: UserSummary[]
  verifiers: UserSummary[]
}) {
  const allUsers = [...members, ...verifiers]

  function getUserName(id: string) {
    const user = allUsers.find((u) => u.id === id)
    return user?.name || user?.email || id
  }

  return (
    <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-orange-900">Verifier Deselection History</h2>
        <p className="text-xs text-orange-700">Verifiers have removed inputters from their assigned list with the following reasons.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-orange-800">
            <tr>
              <th className="px-3 py-2 font-semibold">Verifier</th>
              <th className="px-3 py-2 font-semibold">Inputter</th>
              <th className="px-3 py-2 font-semibold">Reason</th>
              <th className="px-3 py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {deselections.map((d) => (
              <tr key={d.id} className="border-t border-orange-200 align-top">
                <td className="px-3 py-2 text-orange-900 font-medium">{getUserName(d.verifierId)}</td>
                <td className="px-3 py-2 text-orange-900">{getUserName(d.memberId)}</td>
                <td className="px-3 py-2 text-orange-800 max-w-xs">{d.reason}</td>
                <td className="px-3 py-2 text-orange-700 whitespace-nowrap">{formatDate(d.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}