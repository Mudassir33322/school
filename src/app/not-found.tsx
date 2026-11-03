import Link from 'next/link'
import { GraduationCap, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-950">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <GraduationCap className="h-24 w-24 text-blue-500/30 dark:text-blue-400/20" />
          <span className="absolute inset-0 flex items-center justify-center text-6xl font-bold text-blue-600 dark:text-blue-400">
            404
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Page Not Found
        </h1>
        <p className="max-w-md text-gray-600 dark:text-gray-400">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Go to Dashboard 
        </Link>
      </div>
    </div>
  )
}
