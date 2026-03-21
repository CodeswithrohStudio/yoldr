"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useYoldrStore } from "@/store/useYoldrStore";

export default function ToastNotifications() {
  const { toasts, removeToast } = useYoldrStore();

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="pointer-events-auto"
            onClick={() => removeToast(toast.id)}
          >
            <div
              className={`glass rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer ${
                toast.type === "xp"
                  ? "border-yellow-500/40 bg-yellow-500/10"
                  : toast.type === "success"
                  ? "border-green-500/40 bg-green-500/10"
                  : toast.type === "warning"
                  ? "border-orange-500/40 bg-orange-500/10"
                  : "border-blue-500/40 bg-blue-500/10"
              }`}
            >
              <span className="text-lg">
                {toast.type === "xp" ? "⚡" : toast.type === "success" ? "✅" : toast.type === "warning" ? "⚠️" : "ℹ️"}
              </span>
              <p className="text-sm font-medium text-white">{toast.message}</p>
              {toast.xpAmount && (
                <span className="ml-auto text-yellow-400 font-bold text-sm font-orbitron">
                  +{toast.xpAmount}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
