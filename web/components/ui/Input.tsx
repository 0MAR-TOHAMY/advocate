"use client";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    const base = "w-full rounded-[15px] bg-gray-100 min-h-[55px] px-[30px] text-[14px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#2E71E5] transition-all";
    const errorClass = error ? "border-2 border-red-500" : "";
    
    return (
      <div className="w-full">
        <input 
          ref={ref}
          className={`${base} ${errorClass} ${className}`} 
          {...props} 
        />
        {error && (
          <p className="text-red-500 text-xs mt-1 px-2">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
