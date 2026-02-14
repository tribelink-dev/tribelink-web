'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Palette, Utensils, Music2, BookOpen, Camera, Heart } from 'lucide-react';
import Link from 'next/link';

const CulturalActivity = ({ 
    icon, 
    title, 
    description, 
    image,
    delay = 0 
}: { 
    icon: React.ReactNode; 
    title: string; 
    description: string;
    image: string;
    delay?: number;
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <motion.div
            ref={cardRef}
            style={{ y, opacity }}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay }}
            className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transition-all duration-500"
        >
            <div className="relative h-64 overflow-hidden">
                <motion.img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.7 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep-jungle/90 via-deep-jungle/50 to-transparent" />
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: delay + 0.2, type: "spring" }}
                    className="absolute top-6 right-6 w-16 h-16 bg-terracotta rounded-full flex items-center justify-center text-white shadow-lg"
                >
                    {icon}
                </motion.div>
                <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-serif text-white mb-2">{title}</h3>
                </div>
            </div>
            <div className="p-6">
                <p className="text-deep-jungle/70 leading-relaxed">{description}</p>
            </div>
        </motion.div>
    );
};

const CulturalImmersion = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 100]);

    const activities = [
        {
            icon: <Palette size={28} />,
            title: "Traditional Arts",
            description: "Learn from master artisans—pottery, weaving, painting. These aren't workshops; they're conversations with living traditions.",
            image: "/assets/pottery.jpg"
        },
        {
            icon: <Utensils size={28} />,
            title: "Culinary Journeys",
            description: "Cook with local families, understand the stories behind each spice, and taste the heritage in every dish.",
            image: "/assets/spices.jpg"
        },
        {
            icon: <Music2 size={28} />,
            title: "Folk Performances",
            description: "Experience authentic performances in their natural settings—not on stages, but in communities where they belong.",
            image: "/assets/kadhakali.jpg"
        },
        {
            icon: <BookOpen size={28} />,
            title: "Storytelling Sessions",
            description: "Listen to elders share myths, legends, and histories passed down through generations around evening fires.",
            image: "/assets/community1.jpg"
        },
        {
            icon: <Camera size={28} />,
            title: "Cultural Documentation",
            description: "Capture moments with respect and permission, learning the significance behind each ritual and celebration.",
            image: "/assets/theyyam.jpg"
        },
        {
            icon: <Heart size={28} />,
            title: "Community Connection",
            description: "Participate in daily life—help with harvests, join festivals, and become part of the community, even if just for a moment.",
            image: "/assets/community2.jpg"
        }
    ];

    return (
        <section ref={sectionRef} id="cultural" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-deep-jungle via-deep-jungle/95 to-deep-jungle relative overflow-hidden">
            {/* Animated Background */}
            <motion.div
                style={{ y: backgroundY }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/kolam.jpg')] opacity-5 bg-cover bg-center" />
                <div className="absolute top-1/4 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-terracotta/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-clay/10 rounded-full blur-3xl" />
            </motion.div>

            <div className="container mx-auto max-w-7xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 sm:mb-16 md:mb-20"
                >
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-terracotta tracking-wide sm:tracking-widest text-xs sm:text-sm font-medium uppercase mb-4 sm:mb-6 inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-terracotta/20 rounded-full text-white"
                    >
                        Deep Cultural Immersion
                    </motion.p>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-serif text-white mb-4 sm:mb-8 leading-tight px-2">
                        Experience Culture
                        <br />
                        <span className="text-terracotta italic">From the Inside</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed font-light px-2">
                        Go beyond observation. Participate, learn, and connect with traditions that have shaped communities for generations.
                        <br className="hidden sm:block" />
                        <span className="block sm:inline">This is cultural immersion at its deepest—authentic, respectful, and transformative.</span>
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {activities.map((activity, index) => (
                        <CulturalActivity
                            key={index}
                            icon={activity.icon}
                            title={activity.title}
                            description={activity.description}
                            image={activity.image}
                            delay={index * 0.1}
                        />
                    ))}
                </div>

                {/* Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mt-12 sm:mt-16 md:mt-20 text-center px-4 sm:px-0"
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-block"
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-terracotta text-white rounded-full font-medium hover:bg-terracotta/90 transition-all group shadow-lg hover:shadow-xl text-sm sm:text-base"
                        >
                            <span>Discover Cultural Experiences</span>
                            <motion.div
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                →
                            </motion.div>
                        </Link>
                    </motion.div>
                    <p className="mt-3 sm:mt-4 text-white/70 text-xs sm:text-sm">
                        Browse immersive cultural activities and connect with local artisans
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export default CulturalImmersion;

