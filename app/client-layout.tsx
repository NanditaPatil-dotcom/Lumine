"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isAuthPage, setIsAuthPage] = useState(false);
  
  useEffect(() => {
    const authPage = pathname?.startsWith("/auth");
    setIsAuthPage(authPage);
  }, [pathname]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source
          src={isAuthPage ? "/bgapp.mp4" : "/bgapp2.mp4"}
          type="video/mp4"
        />
      </video>

      {/* Optional overlay */}
      <div className="absolute inset-0 bg-black/40 -z-10"></div>

      {/* Page Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
