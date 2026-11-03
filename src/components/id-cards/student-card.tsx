'use client'

import { forwardRef, memo } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface StudentCardProps {
  id: string
  name: string
  className: string
  section: string
  fatherName: string
  rollNo: string
  bloodGroup: string
  photoUrl?: string
  schoolName?: string
}

const StudentIDCard = forwardRef<HTMLDivElement, StudentCardProps>(
  ({ id, name, className, section, fatherName, rollNo, bloodGroup, photoUrl, schoolName = 'School Name' }, ref) => {
    return (
      <div ref={ref} className="relative w-[380px] overflow-hidden bg-white">
        <div className="relative border-[3px] border-[#4338ca] rounded-2xl overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(79,70,229,0.08),transparent_70%)] pointer-events-none" />

          <div className="bg-gradient-to-r from-[#4f46e5] via-[#4338ca] to-[#3730a3] p-5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(129,140,248,0.1)_50%,transparent_75%)] bg-[length:20px_20px]" />
            <div className="absolute -top-6 -right-6 w-20 h-20 bg-[#818cf8]/10 rounded-full blur-xl" />
            <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-[#6366f1]/10 rounded-full blur-xl" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#818cf8] to-[#4f46e5] shadow-lg shadow-[#4338ca]/30">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-wide">{schoolName}</h3>
                <p className="text-[10px] text-[#c7d2fe]/90 uppercase tracking-widest font-medium">Student Identity Card</p>
              </div>
            </div>
          </div>

          <div className="relative flex items-start gap-5 px-5 pt-5 pb-3">
            <div className="flex-shrink-0">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#4338ca] p-[3px]" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] p-[3px] shadow-lg">
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white overflow-hidden">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={name}
                        loading="lazy"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe]">
                        <svg className="h-10 w-10 text-[#4f46e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h4 className="text-lg font-bold text-gray-900 truncate">{name}</h4>
              <p className="text-xs text-gray-500 mt-0.5">Class {className} - Section {section}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">Roll No: <strong className="text-gray-800">{rollNo}</strong></p>
              <div className="mt-1.5 inline-block rounded-md bg-gradient-to-r from-[#4f46e5] to-[#4338ca] px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                {bloodGroup || 'N/A'}
              </div>
            </div>
          </div>

          <div className="relative mx-5 my-2">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#4f46e5]/30 to-transparent" />
              <div className="text-[#4f46e5]/40">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#4f46e5]/30 to-transparent" />
            </div>
          </div>

          <div className="px-5 pb-3 text-xs">
            <div className="flex items-center gap-2.5 text-gray-600">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#e0e7ff]">
                <svg className="h-3.5 w-3.5 text-[#4f46e5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
              </div>
              <span><span className="text-gray-400">Father:</span> <strong className="text-gray-800">{fatherName || 'N/A'}</strong></span>
            </div>
          </div>

          <div className="px-5 pb-4 flex items-center justify-between">
            <div className="text-center">
              <div className="bg-white rounded-lg p-1.5 shadow-inner border border-[#e0e7ff]">
                <QRCodeSVG
                  value={JSON.stringify({ id, name, class: className, section, rollNo })}
                  size={44}
                />
              </div>
              <p className="mt-1 text-[9px] text-gray-400 uppercase tracking-wider">Scan QR</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400">Valid Till: Dec 2026</p>
              <div className="mt-1.5 flex flex-col items-end">
                <div className="w-24 h-0.5 bg-gradient-to-r from-[#4f46e5] to-[#4338ca] rounded-full mb-0.5" />
                <p className="text-[9px] italic text-gray-500">Authorized Signatory</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-[#4f46e5]/5 via-[#4338ca]/10 to-[#4f46e5]/5 py-2 text-center relative">
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(79,70,229,0.05)_50%,transparent_75%)] bg-[length:16px_16px]" />
            <p className="text-[9px] text-[#4f46e5]/60 uppercase tracking-[0.2em] font-medium relative z-10">
              Student Identity Card
            </p>
          </div>
        </div>
      </div>
    )
  }
)
StudentIDCard.displayName = 'StudentIDCard'

export default memo(StudentIDCard)
