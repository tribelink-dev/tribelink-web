'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const { scrollYProgress } = useScroll();
    const { user } = useAuth();

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setScrollProgress(latest);
    });

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'About Us', href: '/#philosophy' },
        { name: 'Journeys', href: '/#experience' },
        { name: 'Culture', href: '/#cultural' },
        { name: 'Stories', href: '/#community' },
    ];

    return (
        <>
            <nav
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
                    isScrolled ? 'bg-deep-jungle/95 backdrop-blur-xl shadow-lg py-4' : 'bg-transparent py-6'
                )}
            >
                {/* Scroll Progress Bar */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-terracotta origin-left"
                    style={{ scaleX: scrollProgress }}
                />

                <div className="container mx-auto px-6 flex items-center justify-between">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link 
                            href="/" 
                            className="flex items-center gap-2 group"
                        >
                            <div className="text-white font-serif text-2xl font-bold tracking-wider relative">
                                Tribelink
                                <motion.div
                                    className="absolute bottom-0 left-0 h-0.5 bg-terracotta"
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '100%' }}
                                    transition={{ duration: 0.3 }}
                                />
                            </div>
                        </Link>
                    </motion.div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-8">
                        {navLinks.map((link, index) => (
                            <motion.a
                                key={link.name}
                                href={link.href}
                                className="relative text-white/80 hover:text-white transition-colors font-medium text-sm tracking-wide group"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -2 }}
                            >
                                {link.name}
                                <motion.div
                                    className="absolute -bottom-1 left-0 h-0.5 bg-terracotta"
                                    initial={{ width: 0 }}
                                    whileHover={{ width: '100%' }}
                                    transition={{ duration: 0.3 }}
                                />
                            </motion.a>
                        ))}
                        {user ? (
                            <Link href="/dashboard">
                                <motion.div
                                    className="bg-terracotta text-white px-6 py-2 rounded-full font-medium hover:bg-terracotta/90 transition-all relative overflow-hidden group shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="relative z-10">Dashboard</span>
                                    <motion.div
                                        className="absolute inset-0 bg-white/20"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </motion.div>
                            </Link>
                        ) : (
                            <Link href="/explore">
                                <motion.div
                                    className="bg-terracotta text-white px-6 py-2 rounded-full font-medium hover:bg-terracotta/90 transition-all relative overflow-hidden group shadow-lg"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <span className="relative z-10">Explore Experiences</span>
                                    <motion.div
                                        className="absolute inset-0 bg-white/20"
                                        initial={{ x: '-100%' }}
                                        whileHover={{ x: 0 }}
                                        transition={{ duration: 0.3 }}
                                    />
                                </motion.div>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <motion.button
                        className="md:hidden text-white relative z-50"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        whileTap={{ scale: 0.9 }}
                    >
                        <AnimatePresence mode="wait">
                            {isMobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X size={24} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Menu size={24} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
                                onClick={() => setIsMobileMenuOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, x: '100%' }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: '100%' }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="absolute top-full left-0 right-0 bg-deep-jungle/98 backdrop-blur-xl p-6 md:hidden border-t border-white/10 z-40 shadow-2xl"
                            >
                                <div className="flex flex-col gap-2">
                                    {navLinks.map((link, index) => (
                                        <motion.a
                                            key={link.name}
                                            href={link.href}
                                            className="text-white/90 text-lg py-3 px-4 rounded-lg hover:bg-white/10 transition-colors border-b border-white/5"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            {link.name}
                                        </motion.a>
                                    ))}
                                    {user ? (
                                        <Link href="/dashboard">
                                            <motion.div
                                                className="bg-terracotta text-white text-center py-3 rounded-lg font-medium mt-4 shadow-lg"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: navLinks.length * 0.1 }}
                                            >
                                                Dashboard
                                            </motion.div>
                                        </Link>
                                    ) : (
                                        <Link href="/explore">
                                            <motion.div
                                                className="bg-terracotta text-white text-center py-3 rounded-lg font-medium mt-4 shadow-lg"
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: navLinks.length * 0.1 }}
                                            >
                                                Explore Experiences
                                            </motion.div>
                                        </Link>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};

export default Navbar;

