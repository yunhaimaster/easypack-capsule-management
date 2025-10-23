import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700",
        destructive:
          "bg-danger-600 text-white hover:bg-danger-700",
        outline:
          "border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-neutral-50 dark:hover:bg-gray-700 hover:text-neutral-900 dark:hover:text-gray-100 dark:text-gray-100",
        secondary:
          "bg-neutral-100 dark:bg-gray-800 text-neutral-900 dark:text-gray-100 hover:bg-neutral-200 dark:hover:bg-gray-700",
        ghost: "hover:bg-neutral-100 dark:hover:bg-gray-800 hover:text-neutral-900 dark:hover:text-gray-100 dark:text-gray-300",
        link: "text-primary-600 dark:text-primary-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
