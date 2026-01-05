"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
    steps: { title: string }[];
    currentStep: number;
    className?: string;
}

export default function Stepper({ steps, currentStep, className }: StepperProps) {
    return (
        <div className={cn("flex items-center justify-between w-full px-12 py-6 mb-4 bg-white rounded-[25px] border border-gray-100", className)}>
            {steps.map((step, index) => {
                const isCompleted = index < currentStep;
                const isActive = index === currentStep;

                return (
                    <div key={index} className="flex items-center justify-center flex-1 last:flex-none">
                        {/* Step Circle */}
                        <div className="relative flex flex-col items-center group">
                            <div
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                                    isCompleted
                                        ? "bg-brand-primary border-brand-primary text-white shadow-md"
                                        : isActive
                                            ? "bg-white border-brand-primary text-brand-primary shadow-sm"
                                            : "bg-white border-gray-200 text-gray-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="w-5 h-5" />
                                ) : (
                                    <span className="text-sm font-bold">{index + 1}</span>
                                )}
                            </div>

                            {/* Step Title */}
                            <span
                                className={cn(
                                    "whitespace-nowrap text-[12px] font-bold transition-colors",
                                    isActive ? "text-gray-900" : "text-gray-400"
                                )}
                            >
                                {step.title}
                            </span>
                        </div>

                        {/* Connecting Line */}
                        {index < steps.length - 1 && (
                            <div className="flex-1 mx-4 h-[2px] bg-gray-100">
                                <div
                                    className={cn(
                                        "h-full bg-brand-primary transition-all duration-500",
                                        isCompleted ? "w-full" : "w-0"
                                    )}
                                />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
