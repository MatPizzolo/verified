import Link from "next/link"

interface AuthLayoutProps {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex flex-col">


      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>


    </div>
  )
}
