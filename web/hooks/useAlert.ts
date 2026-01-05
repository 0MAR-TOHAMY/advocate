"use client";
import { useState, useCallback } from "react";
import { AlertItem } from "@/components/ui/AlertContainer";

export function useAlert() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const showAlert = useCallback((
    type: "success" | "error" | "warning" | "info",
    message: string,
    duration: number = 5000
  ) => {
    const id = `alert-${Date.now()}-${Math.random()}`;
    const newAlert: AlertItem = { id, type, message, duration };

    setAlerts((prev) => [...prev, newAlert]);

    // Auto-remove after duration + animation time
    if (duration > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      }, duration + 500);
    }
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    showAlert("success", message, duration);
  }, [showAlert]);

  const error = useCallback((message: string, duration?: number) => {
    showAlert("error", message, duration);
  }, [showAlert]);

  const warning = useCallback((message: string, duration?: number) => {
    showAlert("warning", message, duration);
  }, [showAlert]);

  const info = useCallback((message: string, duration?: number) => {
    showAlert("info", message, duration);
  }, [showAlert]);

  const closeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, []);

  return {
    alerts,
    showAlert,
    success,
    error,
    warning,
    info,
    closeAlert,
    clearAll,
  };
}
