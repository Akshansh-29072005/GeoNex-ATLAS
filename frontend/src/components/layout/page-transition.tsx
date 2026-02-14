import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import gsap from "gsap";

export function PageTransition({ children }: { children: React.ReactNode }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    useEffect(() => {
        if (!containerRef.current) return;

        // Simple fade-in and slide-up animation on route change
        gsap.fromTo(
            containerRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }
        );
    }, [location.pathname]);

    return <div ref={containerRef} className="w-full h-full">{children}</div>;
}
