"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

type Props = {
  title: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
};

export default function ExpandableSection({
  title,
  icon,
  defaultOpen = true,
  defaultExpanded,
  children
}: Props) {
  const [open, setOpen] = useState(defaultExpanded ?? defaultOpen);
  return (
    <div className="bg-white rounded-[25px] shadow-[0_35px_35px_rgba(0,0,0,0.01)]">
      <div className="flex items-center justify-between p-8">
        <div className="flex items-center gap-3">
          {icon && <span className="text-gray-500">{icon}</span>}
          <h2 className="text-[18px] font-semibold text-gray-800">{title}</h2>
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          className="inline-flex items-center text-gray-600 hover:text-gray-800"
        >
          <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
        </button>
      </div>
      {open && <div className="p-8 pt-6">{children}</div>}
    </div>
  );
}
