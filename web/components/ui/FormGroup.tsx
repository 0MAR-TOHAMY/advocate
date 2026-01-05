"use client";
import { ReactNode } from "react";

interface FormGroupProps {
  children: ReactNode;
  label?: string;
  required?: boolean;
  className?: string;
}

export default function FormGroup({ children, label, required, className = "" }: FormGroupProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      {children}
    </div>
  );
}
