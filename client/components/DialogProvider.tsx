"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { ConfirmDialog, AlertDialog } from "./ui/Dialog";

interface DialogContextType {
  confirm: (options: { title: string; description: string; confirmText?: string; cancelText?: string; type?: "danger" | "warning" | "info" }) => Promise<boolean>;
  alert: (options: { title: string; description: string; buttonText?: string; type?: "success" | "error" | "info" }) => Promise<void>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: any;
    resolve: (value: boolean) => void;
  }>({
    isOpen: false,
    options: {},
    resolve: () => {},
  });

  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: any;
    resolve: () => void;
  }>({
    isOpen: false,
    options: {},
    resolve: () => {},
  });

  const confirm = (options: any) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const alert = (options: any) => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  };

  const handleConfirmClose = (result: boolean) => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    confirmState.resolve(result);
  };

  const handleAlertClose = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
    alertState.resolve();
  };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        title={confirmState.options.title || ""}
        description={confirmState.options.description || ""}
        confirmText={confirmState.options.confirmText}
        cancelText={confirmState.options.cancelText}
        type={confirmState.options.type}
        onConfirm={() => handleConfirmClose(true)}
        onCancel={() => handleConfirmClose(false)}
      />
      <AlertDialog
        isOpen={alertState.isOpen}
        title={alertState.options.title || ""}
        description={alertState.options.description || ""}
        buttonText={alertState.options.buttonText}
        type={alertState.options.type}
        onClose={handleAlertClose}
      />
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}
