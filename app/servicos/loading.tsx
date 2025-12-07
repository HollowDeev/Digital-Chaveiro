import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function ServicosLoading() {
    return (
        <div className="flex h-full flex-col">
            <div className="border-b p-4 md:p-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="mt-2 h-4 w-96" />
            </div>

            <div className="flex-1 space-y-4 overflow-auto p-4 md:p-6">
                <Skeleton className="h-10 w-full max-w-md" />

                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />

                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-4">
                            <Skeleton className="h-6 w-48" />
                            <div className="mt-4 space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-2/3" />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
