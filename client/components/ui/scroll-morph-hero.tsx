"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useRouter } from "next/navigation";

export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

interface FlipCardProps {
    src: string;
    href: string;
    index: number;
    total: number;
    phase: AnimationPhase;
    target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

const IMG_WIDTH = 100;
const IMG_HEIGHT = 140;

function FlipCard({
    src,
    href,
    index,
    total,
    phase,
    target,
}: FlipCardProps) {
    const router = useRouter();
    return (
        <motion.div
            onClick={() => router.push(href)}
            animate={{
                x: target.x,
                y: target.y,
                rotate: target.rotation,
                scale: target.scale,
                opacity: target.opacity,
            }}
            transition={{
                type: "spring",
                stiffness: 40,
                damping: 15,
            }}
            style={{
                position: "absolute",
                width: IMG_WIDTH,
                height: IMG_HEIGHT,
                transformStyle: "preserve-3d",
                perspective: "1000px",
            }}
            className="cursor-pointer group"
        >
            <motion.div
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                whileHover={{ rotateY: 180 }}
            >
                {/* Front Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.15)] bg-white border border-[#E7ECF2]"
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <img
                        src={src}
                        alt={`service-${index}`}
                        className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-[#102D52]/10 transition-colors group-hover:bg-transparent" />
                </div>

                {/* Back Face */}
                <div
                    className="absolute inset-0 h-full w-full overflow-hidden rounded-xl shadow-[0_4px_20px_rgba(15,23,42,0.15)] bg-[#102D52] flex flex-col items-center justify-center p-2 border border-[#1E73BE]/30"
                    style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                    <div className="text-center">
                        <p className="text-[7px] font-bold text-gold uppercase tracking-widest mb-1">View</p>
                        <p className="text-[10px] font-medium text-white">Service</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

const TOTAL_IMAGES = 9; // Reduced for a cleaner look in the UI
const MAX_SCROLL = 1200;

const SERVICE_LINKS = [
    "/services/general-dentistry",
    "/services/teeth-whitening",
    "/services/dental-crowns",
    "/childrens-dentistry"
];

const IMAGES = [
    { src: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=300&q=80", href: SERVICE_LINKS[0] },
    { src: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300&q=80", href: SERVICE_LINKS[1] },
    { src: "https://images.unsplash.com/photo-1629909615184-74f495363b67?w=300&q=80", href: SERVICE_LINKS[2] },
    { src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=300&q=80", href: SERVICE_LINKS[3] },
    { src: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=300&q=80", href: SERVICE_LINKS[0] },
    { src: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=300&q=80", href: SERVICE_LINKS[1] },
    { src: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=300&q=80", href: SERVICE_LINKS[2] },
    { src: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&q=80", href: SERVICE_LINKS[3] },
    { src: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300&q=80", href: SERVICE_LINKS[0] },
];

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export default function IntroAnimation() {
    const [introPhase, setIntroPhase] = useState<AnimationPhase>("circle");
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const handleResize = (entries: ResizeObserverEntry[]) => {
            for (const entry of entries) {
                setContainerSize({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height,
                });
            }
        };
        const observer = new ResizeObserver(handleResize);
        observer.observe(containerRef.current);
        setContainerSize({
            width: containerRef.current.offsetWidth,
            height: containerRef.current.offsetHeight,
        });
        return () => observer.disconnect();
    }, []);

    const virtualScroll = useMotionValue(0);
    const scrollRef = useRef(0);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const newScroll = Math.min(Math.max(scrollRef.current + e.deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };
        let touchStartY = 0;
        const handleTouchStart = (e: TouchEvent) => {
            touchStartY = e.touches[0].clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            e.preventDefault();
            const touchY = e.touches[0].clientY;
            const deltaY = touchStartY - touchY;
            touchStartY = touchY;
            const newScroll = Math.min(Math.max(scrollRef.current + deltaY, 0), MAX_SCROLL);
            scrollRef.current = newScroll;
            virtualScroll.set(newScroll);
        };
        container.addEventListener("wheel", handleWheel, { passive: false });
        container.addEventListener("touchstart", handleTouchStart, { passive: false });
        container.addEventListener("touchmove", handleTouchMove, { passive: false });
        return () => {
            container.removeEventListener("wheel", handleWheel);
            container.removeEventListener("touchstart", handleTouchStart);
            container.removeEventListener("touchmove", handleTouchMove);
        };
    }, [virtualScroll]);

    const morphProgress = useTransform(virtualScroll, [0, 300], [0, 1]);
    const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });
    const scrollRotate = useTransform(virtualScroll, [300, MAX_SCROLL], [0, 360]);
    const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });
    const mouseX = useMotionValue(0);
    const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const handleMouseMove = (e: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            const relativeX = e.clientX - rect.left;
            const normalizedX = (relativeX / rect.width) * 2 - 1;
            mouseX.set(normalizedX * 100);
        };
        container.addEventListener("mousemove", handleMouseMove);
        return () => container.removeEventListener("mousemove", handleMouseMove);
    }, [mouseX]);

    // Removed the timer-based auto-animation so it starts directly as a circle

    const scatterPositions = useMemo(() => {
        return IMAGES.map(() => ({
            x: (Math.random() - 0.5) * 1500,
            y: (Math.random() - 0.5) * 1000,
            rotation: (Math.random() - 0.5) * 180,
            scale: 0.6,
            opacity: 0,
        }));
    }, []);

    const [morphValue, setMorphValue] = useState(0);
    const [rotateValue, setRotateValue] = useState(0);
    const [parallaxValue, setParallaxValue] = useState(0);

    useEffect(() => {
        const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
        const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
        const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
        return () => {
            unsubscribeMorph();
            unsubscribeRotate();
            unsubscribeParallax();
        };
    }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

    const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
    const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

    return (
        <div ref={containerRef} className="relative w-full h-full bg-white overflow-hidden rounded-[28px]">
            <div className="flex h-full w-full flex-col items-center justify-center perspective-1000 relative">

                {/* Intro Text (Fades out) */}
                <div className="absolute z-0 flex flex-col items-center justify-center text-center pointer-events-none top-1/2 -translate-y-1/2">
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.8 - morphValue * 1.5 } : { opacity: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="text-xs font-bold tracking-[0.2em] text-[#1E73BE] uppercase"
                    >
                        Scroll to Explore Services
                    </motion.p>
                </div>

                <div className="relative flex items-center justify-center w-full h-full">
                    {IMAGES.slice(0, TOTAL_IMAGES).map((item, i) => {
                        let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

                        const isMobile = containerSize.width < 768;
                            const minDimension = Math.min(containerSize.width, containerSize.height);

                            // 1. Circle Position
                            const circleRadius = Math.min(minDimension * 0.35, 280);
                            const circleAngle = (i / TOTAL_IMAGES) * 360;
                            const circleRad = (circleAngle * Math.PI) / 180;
                            const circlePos = {
                                x: Math.cos(circleRad) * circleRadius,
                                y: Math.sin(circleRad) * circleRadius,
                                rotation: circleAngle + 90,
                            };

                            // 2. Straight Line Position
                            // Distribute all cards evenly across the container width
                            const maxAvailableWidth = containerSize.width - (isMobile ? 20 : 100); 
                            const spacing = Math.min(maxAvailableWidth / TOTAL_IMAGES, 130);
                            const totalWidth = spacing * (TOTAL_IMAGES - 1);
                            
                            const finalPos = {
                                x: (-totalWidth / 2) + (i * spacing) + parallaxValue,
                                y: 30, // Slightly below center
                                rotation: 0, // Perfectly straight
                                scale: isMobile ? 1.1 : 1.5,
                            };

                            target = {
                                x: lerp(circlePos.x, finalPos.x, morphValue),
                                y: lerp(circlePos.y, finalPos.y, morphValue),
                                rotation: lerp(circlePos.rotation, finalPos.rotation, morphValue),
                                scale: lerp(1, finalPos.scale, morphValue),
                                opacity: 1,
                            };

                        return (
                            <FlipCard
                                key={i}
                                src={item.src}
                                href={item.href}
                                index={i}
                                total={TOTAL_IMAGES}
                                phase={introPhase}
                                target={target}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
