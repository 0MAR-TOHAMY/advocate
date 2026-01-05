import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "brand" | "brand-outline";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
    const variants = {
        default: "border-transparent bg-brand-secondary text-white hover:opacity-90",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-100/80",
        destructive: "border-transparent bg-red-500 text-gray-50 hover:bg-red-500/80",
        outline: "text-gray-950",
        success: "border-transparent bg-emerald-500 text-white hover:bg-emerald-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
        brand: "border-transparent bg-brand-primary text-white hover:opacity-90",
        "brand-outline": "text-brand-primary border-0 bg-brand-primary/5",
    }

    const variantClass = variants[variant]

    return (
        <div
            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 ${variantClass} ${className}`}
            {...props}
        />
    )
}

export { Badge }
