'use client'

import { forwardRef, memo } from 'react'
import { User, GraduationCap, Hash, Mail, Phone, Building2 } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { Badge } from '@/components/ui/badge'

interface TeacherCardProps {
  id: string
  name: string
  employeeId: string
  department: string
  designation: string
  email: string
  phone: string
  photoUrl?: string
}

const TeacherIDCard = forwardRef<HTMLDivElement, TeacherCardProps>(
  ({ id, name, employeeId, department, designation, email, phone, photoUrl }, ref) => {
    return (
      <div ref={ref} className="w-[350px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Springfield School</h3>
              <p className="text-xs text-purple-100">Staff Identity Card</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              {photoUrl ? (
                <img src={photoUrl} alt={name} loading="lazy" className="h-20 w-20 rounded-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{name}</h4>
              <p className="text-sm text-gray-500">{designation}</p>
              <Badge variant="info">{department}</Badge>
            </div>
          </div>
          <div className="space-y-2 border-t border-gray-100 pt-3 text-sm dark:border-gray-700">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Hash className="h-4 w-4" />
              <span>Employee ID: <strong className="text-gray-900 dark:text-gray-100">{employeeId}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Building2 className="h-4 w-4" />
              <span>Dept: <strong className="text-gray-900 dark:text-gray-100">{department}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4" />
              <span className="truncate">{email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto h-12 w-12">
                <QRCodeSVG value={JSON.stringify({ id, name, employeeId, department })} size={48} />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Scan QR</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>Valid Until: Dec 2026</p>
              <p className="mt-1 font-medium text-gray-600 dark:text-gray-300">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
TeacherIDCard.displayName = 'TeacherIDCard'

export default memo(TeacherIDCard)
