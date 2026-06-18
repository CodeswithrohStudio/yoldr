"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[#e8702a] text-white hover:bg-[#d2611f] hover:scale-[1.02] shadow-[0_10px_30px_-10px_rgba(232,112,42,0.6)]",
        secondary:
          "bg-white text-gray-900 hover:bg-gray-100",
        outline:
          "border border-white/15 bg-white/[0.03] text-white/80 hover:bg-white/[0.07] hover:text-white hover:border-white/25",
        ghost:
          "text-white/70 hover:bg-white/[0.06] hover:text-white",
        subtle:
          "bg-white/[0.05] text-white/80 hover:bg-white/[0.09] hover:text-white border border-white/10",
      },
      size: {
        sm: "h-8 px-3.5 text-xs",
        default: "h-10 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
