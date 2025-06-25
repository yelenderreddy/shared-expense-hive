import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-base md:text-lg font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 md:[&_svg]:size-6 [&_svg]:shrink-0 min-h-[44px] min-w-[44px] transform hover:scale-105 active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-red-700 shadow-lg hover:shadow-xl",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg hover:shadow-xl",
        outline:
          "border-2 border-white bg-transparent text-white hover:bg-white hover:text-black shadow-md hover:shadow-lg",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl",
        warning: "bg-yellow-500 text-white hover:bg-yellow-600 shadow-lg hover:shadow-xl",
        netflix: "bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl",
        "netflix-outline": "border-2 border-red-600 bg-transparent text-red-600 hover:bg-red-600 hover:text-white shadow-md hover:shadow-lg",
        "netflix-secondary": "border-2 border-white bg-transparent text-white hover:bg-white hover:text-black shadow-md hover:shadow-lg",
      },
      size: {
        default: "h-11 md:h-12 px-4 md:px-6 py-3 text-base md:text-lg rounded-md min-h-[44px] min-w-[44px]",
        sm: "h-10 md:h-11 px-3 md:px-4 py-2 text-sm md:text-base rounded-md min-h-[44px] min-w-[44px]",
        lg: "h-12 md:h-14 px-6 md:px-8 py-4 text-lg md:text-xl rounded-xl min-h-[44px] min-w-[44px]",
        xl: "h-14 md:h-16 px-8 md:px-10 py-5 text-xl md:text-2xl rounded-xl min-h-[44px] min-w-[44px]",
        icon: "h-11 md:h-12 w-11 md:w-12 min-h-[44px] min-w-[44px]",
        "icon-sm": "h-10 md:h-11 w-10 md:w-11 min-h-[44px] min-w-[44px]",
        "icon-lg": "h-12 md:h-14 w-12 md:w-14 min-h-[44px] min-w-[44px]",
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
