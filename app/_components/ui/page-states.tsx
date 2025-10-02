/**
 * LoadingState Component
 * Reusable loading state display for pages
 */
export function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="text-center py-16 px-8">
        <h2 className="text-2xl text-slate-800 mb-4">Loading...</h2>
        <p className="text-slate-600 text-lg">{message}</p>
      </div>
    </div>
  )
}

/**
 * AuthRequiredState Component
 * Reusable authentication required state for protected pages
 */
export function AuthRequiredState({ 
  title = "Authentication Required",
  message = "Please sign in to access this content."
}: { 
  title?: string
  message?: string 
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-4">
      <div className="text-center py-16 px-8">
        <h2 className="text-2xl text-slate-800 mb-4">{title}</h2>
        <p className="text-slate-600 text-lg">{message}</p>
      </div>
    </div>
  )
}

/**
 * AccessNotice Component
 * Reusable notice component for displaying access level information
 */
export function AccessNotice({ 
  accessLevel, 
  title = "🔐 Protected Content" 
}: { 
  accessLevel: string
  title?: string 
}) {
  return (
    <div className="bg-orange-50 border border-orange-300 p-8 rounded-lg text-center">
      <h3 className="text-slate-800 mb-2">{title}</h3>
      <p className="text-orange-900">
        This page is only accessible to authenticated users. Your account 
        has <strong>{accessLevel}</strong> access level.
      </p>
    </div>
  )
}
