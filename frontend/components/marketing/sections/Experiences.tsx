'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Music, Users, Theater, ArrowRight, Sparkles, Heart, MapPin } from 'lucide-react';
import Link from 'next/link';

const ExperienceCard = ({ 
    icon, 
    title, 
    description, 
    gradient,
    image,
    features,
    delay = 0 
}: { 
    icon: React.ReactNode; 
    title: string; 
    description: string;
    gradient: string;
    image: string;
    features: string[];
    delay?: number;
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const { scrollYProgress } = useScroll({
        target: cardRef,
        offset: ["start end", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <Link href="/explore">
            <motion.div
                ref={cardRef}
                style={{ y, opacity }}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay }}
                whileHover={{ y: -20, scale: 1.03 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="group relative bg-white rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-700 border border-deep-jungle/5 overflow-hidden cursor-pointer"
            >
                {/* Image Header */}
                <div className="relative h-48 sm:h-64 overflow-hidden">
                    <motion.img
                        src={image}
                        alt={title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        animate={{ scale: isHovered ? 1.15 : 1 }}
                        transition={{ duration: 0.7 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-jungle/90 via-deep-jungle/40 to-transparent" />
                    
                    {/* Icon Badge */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: delay + 0.2, type: "spring", stiffness: 200 }}
                        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center text-white border border-white/30 group-hover:bg-terracotta group-hover:border-terracotta transition-all duration-300"
                    >
                        <div className="scale-75 sm:scale-100">{icon}</div>
                    </motion.div>

                    {/* Title Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                        <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white mb-1 sm:mb-2 drop-shadow-lg">
                            {title}
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 md:p-10 relative">
                    {/* Gradient Background on Hover */}
                    <motion.div
                        className={`absolute inset-0 ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                    />
                    
                    <div className="relative z-10">
                        <p className="text-deep-jungle/80 leading-relaxed text-sm sm:text-lg mb-4 sm:mb-6 group-hover:text-white/95 transition-colors duration-300 font-light">
                            {description}
                        </p>

                        {/* Features List */}
                        <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                            {features.map((feature, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: delay + index * 0.1 }}
                                    className="flex items-center gap-2 sm:gap-3 text-deep-jungle/70 group-hover:text-white/90 transition-colors duration-300"
                                >
                                    <motion.div
                                        whileHover={{ rotate: 360 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-terracotta group-hover:bg-white flex-shrink-0"
                                    />
                                    <span className="text-xs sm:text-sm font-medium">{feature}</span>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: delay + 0.3 }}
                            whileHover={{ x: 5 }}
                            className="flex items-center gap-2 text-terracotta group-hover:text-white font-semibold text-xs sm:text-sm uppercase tracking-wider"
                        >
                            <span>Learn More</span>
                            <ArrowRight size={16} className="sm:w-4 sm:h-4 group-hover:translate-x-2 transition-transform duration-300" />
                        </motion.div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 sm:w-40 sm:h-40 bg-terracotta/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <motion.div
                        animate={{ 
                            rotate: isHovered ? 360 : 0,
                            scale: isHovered ? 1.2 : 1
                        }}
                        transition={{ duration: 0.6 }}
                        className="absolute bottom-4 left-4 w-10 h-10 sm:w-12 sm:h-12 bg-terracotta/10 rounded-full opacity-0 group-hover:opacity-100"
                    />
                </div>
            </motion.div>
        </Link>
    );
};

const Experiences = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], [0, -100]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [1, 1, 1, 0.3]);

    const experiences = [
        {
            icon: <Music size={28} />,
            title: "The Earth Has Music",
            description: "Our hosts are the conductors. Whether it's harvesting rice in the mist of a valley or learning a forgotten dialect by a fire, come back to the experiences that ground you.",
            gradient: "bg-gradient-to-br from-terracotta to-terracotta/80",
            image: "/assets/nandhu-kumar-TwYX-EQRXQQ-unsplash.jpg",
            features: [
                "Authentic local interactions",
                "Hands-on cultural learning",
                "Nature-immersive experiences"
            ],
            delay: 0
        },
        {
            icon: <Users size={28} />,
            title: "Find Your Tribe",
            description: "Strangers are just family you haven't met yet. In a world of infinite profiles, we help you find the people who resonate with your spirit. This is your tribe.",
            gradient: "bg-gradient-to-br from-deep-jungle to-deep-jungle/80",
            image: "/assets/community1.jpg",
            features: [
                "Community-based travel",
                "Meaningful connections",
                "Shared experiences"
            ],
            delay: 0.2
        },
        {
            icon: <Theater size={28} />,
            title: "Living Traditions",
            description: "These aren't performances for tourists. They're living practices, passed down through generations, shared with those who come with respect and curiosity.",
            gradient: "bg-gradient-to-br from-clay to-clay/80",
            image: "/assets/theyyam_main.jpg",
            features: [
                "Traditional art forms",
                "Elder wisdom sharing",
                "Cultural preservation"
            ],
            delay: 0.4
        }
    ];

    const stats = [
        { number: "500+", label: "Authentic Experiences", icon: <MapPin size={24} /> },
        { number: "50+", label: "Local Communities", icon: <Users size={24} /> },
        { number: "10K+", label: "Travelers Connected", icon: <Heart size={24} /> },
        { number: "98%", label: "Satisfaction Rate", icon: <Sparkles size={24} /> }
    ];

    return (
        <section ref={sectionRef} id="experience" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-white via-off-white to-white relative overflow-hidden">
            {/* Enhanced Animated Background */}
            <motion.div
                style={{ y: backgroundY, opacity }}
                className="absolute inset-0 pointer-events-none"
            >
                <div className="absolute top-1/4 left-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-terracotta/8 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-clay/8 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-deep-jungle/3 rounded-full blur-3xl" />
            </motion.div>

            <div className="container mx-auto max-w-7xl relative z-10">
                {/* Header Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 sm:mb-20 md:mb-24"
                >
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-terracotta tracking-wide sm:tracking-widest text-xs sm:text-sm font-medium uppercase mb-4 sm:mb-6 inline-block px-3 sm:px-5 py-1.5 sm:py-2.5 bg-terracotta/10 rounded-full border border-terracotta/20"
                    >
                        The Triberoutes Experience
                    </motion.p>
                    <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-deep-jungle mb-4 sm:mb-8 leading-tight px-2">
                        More Than Travelers.
                        <br />
                        <span className="text-terracotta italic">We Are Guests.</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-deep-jungle/70 max-w-3xl mx-auto leading-relaxed font-light px-2">
                        Travel used to mean <span className="italic font-medium text-deep-jungle">"travailler"</span>—to work, to engage, to struggle, and to triumph together.
                        <br className="hidden md:block" />
                        <span className="text-terracotta">We are bringing that depth back.</span>
                    </p>
                </motion.div>

                {/* Stats Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-20 md:mb-24"
                >
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                            className="text-center p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-white/60 backdrop-blur-sm border border-deep-jungle/5 hover:border-terracotta/30 transition-all duration-300 hover:shadow-lg"
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.4 + index * 0.1 }}
                                className="flex justify-center mb-2 sm:mb-3 text-terracotta"
                            >
                                <div className="scale-75 sm:scale-100">{stat.icon}</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="text-2xl sm:text-4xl md:text-5xl font-serif font-bold text-terracotta mb-1 sm:mb-2"
                            >
                                {stat.number}
                            </motion.div>
                            <div className="text-xs sm:text-sm md:text-base text-deep-jungle/70 font-medium">
                                {stat.label}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Experience Cards */}
                <div className="grid md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 mb-12 sm:mb-16 md:mb-20">
                    {experiences.map((exp, index) => (
                        <ExperienceCard
                            key={index}
                            icon={exp.icon}
                            title={exp.title}
                            description={exp.description}
                            gradient={exp.gradient}
                            image={exp.image}
                            features={exp.features}
                            delay={exp.delay}
                        />
                    ))}
                </div>

                {/* Philosophy Quote Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="mb-12 sm:mb-16 md:mb-20 px-4 sm:px-0"
                >
                    <div className="relative bg-gradient-to-br from-deep-jungle via-deep-jungle/95 to-deep-jungle rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                            <div className="absolute inset-0 bg-[url('/assets/kolam.jpg')] bg-cover bg-center" />
                        </div>
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-terracotta/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 bg-clay/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center max-w-4xl mx-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="mb-4 sm:mb-6"
                            >
                                <Sparkles className="w-8 h-8 sm:w-12 sm:h-12 text-terracotta mx-auto mb-3 sm:mb-4" />
                            </motion.div>
                            <blockquote className="font-serif text-xl sm:text-3xl md:text-4xl text-white mb-4 sm:mb-6 leading-relaxed italic px-2">
                                "We don't just take you places. We take you home—to places that feel like home, even when you've never been there before."
                            </blockquote>
                            <p className="text-white/80 text-sm sm:text-lg font-light">
                                — The Triberoutes Promise
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Enhanced Call to Action */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="relative px-4 sm:px-0"
                >
                    <div className="bg-gradient-to-br from-white via-off-white to-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 overflow-hidden relative border-2 border-deep-jungle/10 shadow-2xl">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-3">
                            <div className="absolute inset-0 bg-[url('/assets/kolam.jpg')] bg-cover bg-center" />
                        </div>
                        
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 bg-terracotta/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-clay/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 text-center">
                            <motion.h3
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="text-2xl sm:text-3xl md:text-4xl font-serif text-deep-jungle mb-3 sm:mb-4"
                            >
                                Ready to Begin Your Journey?
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.1 }}
                                className="text-deep-jungle/70 text-base sm:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 font-light"
                            >
                                Discover authentic experiences, connect with local communities, and create memories that last a lifetime.
                            </motion.p>

                            <motion.div
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-10 py-3 sm:py-5 bg-deep-jungle text-white rounded-full font-semibold text-base sm:text-lg hover:bg-deep-jungle/90 transition-all group shadow-xl cursor-pointer"
                                >
                                    <span>Plan Your Trip</span>
                                    <ArrowRight size={18} className="sm:w-5 sm:h-5 group-hover:translate-x-2 transition-transform duration-300" />
                                </Link>
                            </motion.div>
                            <p className="mt-4 sm:mt-6 text-deep-jungle/60 text-xs sm:text-sm">
                                Browse authentic experiences and connect with local communities
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Experiences;

