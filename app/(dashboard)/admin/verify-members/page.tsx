'use server'

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMembers } from '@/actions/auth'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { MemberPasswordCard } from './member-password-card'

type MemberRow = {
  id: string
  name: string | null
  fatherName: string | null
  aadhaarNo: string | null
  email: string
  createdAt: Date
  _count: {
    expenses: number
  }
}

export default async function VerifyMembersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const members = await getMembers()

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inputter Password Verification</h1>
        <p className="mt-1 text-gray-600">
          Check which inputters have valid passwords set up for login
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 mt-0.5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-900">
            If an inputter shows &quot;No Password&quot;, use the Reset Inputter Password feature to set one.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {members.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No inputters found
            </CardContent>
          </Card>
        ) : (
          members.map((member: MemberRow) => (
            <MemberPasswordCard key={member.id} member={member} />
          ))
        )}
      </div>
    </div>
  )
}

