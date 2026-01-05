"use client";
import React from "react";
import Alert, { AlertProps } from "./Alert";

export interface AlertItem extends Omit<AlertProps, "onClose"> {
  id: string;
}

interface AlertContainerProps {
  alerts: AlertItem[];
  onClose: (id: string) => void;
  position?: AlertProps["position"];
}

export default function AlertContainer({ alerts, onClose, position = "top-center" }: AlertContainerProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <div className="relative h-full">
        {alerts.map((alert, index) => (
          <div
            key={alert.id}
            className="pointer-events-auto"
            style={{
              position: "absolute",
              ...(position.includes("top") ? { top: `${4 + index * 80}px` } : { bottom: `${4 + index * 80}px` }),
              ...(position.includes("right") && { right: "16px" }),
              ...(position.includes("left") && !position.includes("center") && { left: "16px" }),
              ...(position.includes("center") && { left: "50%", transform: "translateX(-50%)" }),
            }}
          >
            <Alert
              type={alert.type}
              message={alert.message}
              duration={alert.duration}
              position={position}
              onClose={() => onClose(alert.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
