"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { fcl } from "@/lib/flow";
import { useYoldrStore } from "@/store/useYoldrStore";
import BottomNav from "@/components/BottomNav";
import ToastNotifications from "@/components/ToastNotifications";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser } = useYoldrStore();

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsub = fcl.currentUser.subscribe((user: any) => {
      if (user?.loggedIn && user?.addr) {
        setUser({ addr: user.addr as string, loggedIn: true });
      } else {
        setUser(null);
        router.replace("/");
      }
    });
    return () => unsub();
  }, [router, setUser]);

  return (
    <>
      <ToastNotifications />
      {/* Mobile: max-width 480px centered with bottom-nav padding. Desktop: full width. */}
      <div className="max-w-[480px] lg:max-w-none mx-auto pb-20 lg:pb-0 min-h-dvh">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
