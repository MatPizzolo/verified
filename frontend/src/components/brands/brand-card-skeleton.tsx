import { Skeleton } from "@/components/ui/skeleton"

export function BrandCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="w-20 h-20 rounded-lg mb-4" />
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}
