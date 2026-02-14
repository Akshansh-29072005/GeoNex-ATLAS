import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageComparisonProps {
    beforeImage: string;
    afterImage: string;
    beforeLabel?: string;
    afterLabel?: string;
}

export function ImageComparisonSlider({
    beforeImage,
    afterImage,
    beforeLabel = "Before",
    afterLabel = "After",
}: ImageComparisonProps) {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback(
        (clientX: number) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
            const percentage = (x / rect.width) * 100;
            setSliderPosition(percentage);
        },
        []
    );

    const onMouseMove = useCallback(
        (e: React.MouseEvent | MouseEvent) => {
            if (!isDragging) return;
            handleMove(e.clientX);
        },
        [isDragging, handleMove]
    );

    const onTouchMove = useCallback(
        (e: React.TouchEvent | TouchEvent) => {
            if (!isDragging) return;
            handleMove(e.touches[0].clientX);
        },
        [isDragging, handleMove]
    );

    const stopDragging = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", onMouseMove as any);
            window.addEventListener("mouseup", stopDragging);
            window.addEventListener("touchmove", onTouchMove as any);
            window.addEventListener("touchend", stopDragging);
        } else {
            window.removeEventListener("mousemove", onMouseMove as any);
            window.removeEventListener("mouseup", stopDragging);
            window.removeEventListener("touchmove", onTouchMove as any);
            window.removeEventListener("touchend", stopDragging);
        }

        return () => {
            window.removeEventListener("mousemove", onMouseMove as any);
            window.removeEventListener("mouseup", stopDragging);
            window.removeEventListener("touchmove", onTouchMove as any);
            window.removeEventListener("touchend", stopDragging);
        };
    }, [isDragging, onMouseMove, onTouchMove, stopDragging]);

    return (
        <div
            className="relative w-full h-[300px] md:h-[400px] overflow-hidden rounded-xl border select-none cursor-ew-resize group"
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onTouchStart={() => setIsDragging(true)}
        >
            {/* After Image (Background) */}
            <img
                src={afterImage}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
            />

            {/* Label for After Image */}
            <div className="absolute top-4 right-4 bg-black/50 text-white px-2 py-1 text-xs rounded backdrop-blur-sm">
                {afterLabel}
            </div>

            {/* Before Image (Clipped) */}
            <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
            >
                <img
                    src={beforeImage}
                    alt="Before"
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                />
                {/* Label for Before Image */}
                <div className="absolute top-4 left-4 bg-black/50 text-white px-2 py-1 text-xs rounded backdrop-blur-sm">
                    {beforeLabel}
                </div>
            </div>

            {/* Slider Handle */}
            <div
                className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-10 shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center transition-transform"
                style={{ left: `${sliderPosition}%` }}
            >
                <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg -ml-3.5 text-gray-600">
                    <div className="flex gap-0.5">
                        <ChevronLeft className="h-3 w-3" />
                        <ChevronRight className="h-3 w-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}
