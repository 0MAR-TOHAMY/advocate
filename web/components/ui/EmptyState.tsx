"use client";

import React from "react";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`text-center py-12 bg-white shadow-[0_35px_35px_rgba(0,0,0,0.01)] rounded-[15px] ${className || ""}`}>
      {icon ? <div className="mb-2 opacity-50 flex items-center justify-center">{icon}</div> : null}
      <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
      {description ? <p className="text-gray-600 mb-4 text-[14px]">{description}</p> : null}
      {action ? <div className="flex items-center justify-center">{action}</div> : null}
    </div>
  );
}

