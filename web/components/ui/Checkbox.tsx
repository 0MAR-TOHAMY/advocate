"use client";
import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement>;

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center justify-center w-6 h-6">
        <input
          type="checkbox"
          className={cn(
            "peer h-6 w-6 shrink-0 appearance-none rounded-lg border-2 border-gray-300 bg-white transition-all checked:bg-brand-primary checked:border-brand-primary hover:border-brand-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer",
            className
          )}
          ref={ref}
          {...props}
        />
        <Check className="absolute h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200 stroke-[3.5]" />
      </div>
    );
  }
);
Checkbox.displayName = "Checkbox";

export default Checkbox;
