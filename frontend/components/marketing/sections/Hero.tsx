'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import Button from '../ui/Button';
import { MapPin, Heart, Users } from 'lucide-react';

const Hero = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ['start start', 'end start']
    });
    
    const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
    const y = useTransform(scrollYProgress, [0, 1], [0, 100]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                setMousePosition({
                    x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
                    y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
                });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <section 
            ref={heroRef}
            id="home" 
            className="relative h-screen w-full overflow-hidden flex items-center justify-center"
        >
            {/* Animated Background Layers */}
            <div className="absolute inset-0 z-0">
                {/* Video Background with Parallax */}
                <motion.div
                    style={{ scale, opacity }}
                    className="absolute inset-0"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-deep-jungle/60 via-black/40 to-black/60 z-10" />
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                        poster="/assets/nandhu-kumar-TwYX-EQRXQQ-unsplash.jpg"
                    >
                        <source
                            src="https://cdn.coverr.co/videos/coverr-backwaters-sunrise-4514/1080p.mp4"
                            type="video/mp4"
                        />
                    </video>
                </motion.div>

                {/* Animated Gradient Orbs */}
                <motion.div
                    animate={{
                        x: mousePosition.x,
                        y: mousePosition.y,
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute top-1/4 left-1/4 w-96 h-96 bg-terracotta/20 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{
                        x: -mousePosition.x * 0.5,
                        y: -mousePosition.y * 0.5,
                    }}
                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-clay/20 rounded-full blur-3xl"
                />

                {/* Floating Cultural Elements */}
                <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-20 left-10 text-6xl opacity-20"
                >
                    🎭
                </motion.div>
                <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-20 right-10 text-6xl opacity-20"
                >
                    🌾
                </motion.div>
            </div>

            {/* Content with Parallax */}
            <motion.div 
                style={{ y, opacity }}
                className="relative z-20 text-center px-6 max-w-5xl mx-auto"
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="mb-6"
                >
                    <span className="inline-block px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm font-medium tracking-widest uppercase border border-white/20">
                        Deep Authentic Regional Cultural Travel
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.4 }}
                    className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-6 leading-tight"
                >
                    <motion.span 
                        className="block"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        The World is Waiting.
                    </motion.span>
                    <motion.span 
                        className="block text-terracotta italic"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.8 }}
                    >
                        In Person.
                    </motion.span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1 }}
                    className="text-white/95 text-lg md:text-2xl mb-12 max-w-3xl mx-auto font-light leading-relaxed"
                >
                    We use the intelligence of the future to help you find the wisdom of the past.
                    <br className="hidden md:block" />
                    <span className="text-terracotta/90 italic">Discover regional experiences that feel like coming home.</span>
                </motion.p>

                {/* Feature Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 1.2 }}
                    className="flex flex-wrap justify-center gap-4 mb-10"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm border border-white/20"
                    >
                        <MapPin size={16} />
                        <span>Authentic Locations</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm border border-white/20"
                    >
                        <Users size={16} />
                        <span>Local Communities</span>
                    </motion.div>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white/90 text-sm border border-white/20"
                    >
                        <Heart size={16} />
                        <span>Cultural Immersion</span>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 1.4 }}
                    className="flex flex-col md:flex-row gap-4 justify-center items-center"
                >
                    <Button 
                        href="/login" 
                        variant="primary" 
                        size="lg"
                    >
                        Explore Experiences
                    </Button>
                    <Button href="#philosophy" variant="outline" size="lg" onClick={() => {
                        const element = document.getElementById('philosophy');
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }}>
                        Our Journey
                    </Button>
                </motion.div>
            </motion.div>

            {/* Enhanced Scroll indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="flex flex-col items-center gap-2 text-white/70"
                >
                    <span className="text-xs uppercase tracking-widest">Scroll</span>
                    <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center p-1 backdrop-blur-sm bg-white/5">
                        <motion.div
                            animate={{ y: [0, 12, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="w-1 h-3 bg-white/80 rounded-full"
                        />
                    </div>
                </motion.div>
            </motion.div>
        </section>
    );
};

export default Hero;

