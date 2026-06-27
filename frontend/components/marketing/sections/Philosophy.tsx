'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Sparkles, Heart, Users, MapPin } from 'lucide-react';
import {
    BRAND_BADGE,
    BRAND_HEADLINE,
    BRAND_PHILOSOPHY_INTRO,
    BRAND_PHILOSOPHY_INTRO_EMPHASIS,
    BRAND_PILLARS,
    BRAND_QUOTE,
} from '@/lib/brand';

const PILLAR_ICONS = [<Sparkles size={24} key="sparkles" />, <MapPin size={24} key="mappin" />, <Users size={24} key="users" />];

const PhilosophyFeature = ({ number, title, text, image, reverse = false, icon }: { number: string; title: string; text: string; image: string; reverse?: boolean; icon: React.ReactNode }) => {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const imageY = useTransform(scrollYProgress, [0, 1], [50, -50]);
    const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

    return (
        <motion.div 
            ref={ref}
            style={{ opacity }}
            className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 sm:gap-12 md:gap-24 my-16 sm:my-24 md:my-32`}
        >
            <motion.div
                initial={{ opacity: 0, x: reverse ? 50 : -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 w-full"
                style={{ y: imageY }}
            >
                <div className="relative aspect-[4/5] md:aspect-square w-full max-w-md mx-auto overflow-hidden rounded-2xl sm:rounded-3xl group cursor-pointer">
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-jungle/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img 
                        src={image} 
                        alt={title} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                        loading="lazy" 
                    />
                    <div className="absolute inset-0 border-2 border-terracotta/20 rounded-2xl sm:rounded-3xl group-hover:border-terracotta/40 transition-colors duration-300" />
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        whileInView={{ scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3, type: "spring" }}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-12 sm:h-12 bg-terracotta/90 backdrop-blur-sm rounded-full flex items-center justify-center text-white z-20"
                    >
                        <div className="scale-75 sm:scale-100">{icon}</div>
                    </motion.div>
                </div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, x: reverse ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="flex-1 text-center md:text-left px-4 sm:px-0"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="font-serif text-5xl sm:text-6xl md:text-8xl text-terracotta/10 block mb-2 sm:mb-4 leading-none">{number}</span>
                    <h3 className="text-2xl sm:text-3xl md:text-5xl font-serif text-deep-jungle mb-4 sm:mb-6 relative">
                        {title}
                        <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: '60px' }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.5, duration: 0.6 }}
                            className="absolute bottom-0 left-0 h-1 bg-terracotta"
                        />
                    </h3>
                    <p className="text-deep-jungle/70 text-base sm:text-lg md:text-xl leading-relaxed max-w-md mx-auto md:mx-0 font-light">
                        {text}
                    </p>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

const Philosophy = () => {
    const sectionRef = useRef<HTMLElement>(null);
    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start end", "end start"]
    });

    const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 100]);

    return (
        <section ref={sectionRef} id="philosophy" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-off-white via-white to-off-white overflow-hidden relative">
            {/* Decorative Background Elements */}
            <motion.div
                style={{ y: backgroundY }}
                className="absolute top-0 left-0 w-full h-full pointer-events-none"
            >
                <div className="absolute top-20 left-10 w-48 h-48 sm:w-72 sm:h-72 bg-terracotta/5 rounded-full blur-3xl" />
                <div className="absolute bottom-20 right-10 w-64 h-64 sm:w-96 sm:h-96 bg-clay/5 rounded-full blur-3xl" />
            </motion.div>

            <div className="container mx-auto max-w-6xl relative z-10">
                <div className="text-center max-w-4xl mx-auto mb-16 sm:mb-24 md:mb-32">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="text-terracotta tracking-wide sm:tracking-widest text-xs sm:text-sm font-medium uppercase mb-4 sm:mb-6 inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-terracotta/10 rounded-full"
                        >
                            {BRAND_BADGE}
                        </motion.p>
                        <h2 className="text-3xl sm:text-5xl md:text-7xl font-serif text-deep-jungle mb-4 sm:mb-8 leading-tight px-2">
                            {BRAND_HEADLINE.line1}
                            <br />
                            <span className="text-terracotta italic">{BRAND_HEADLINE.line2}</span>
                        </h2>
                        <p className="text-base sm:text-xl md:text-2xl text-deep-jungle/80 leading-relaxed font-light px-2">
                            {BRAND_PHILOSOPHY_INTRO.split(BRAND_PHILOSOPHY_INTRO_EMPHASIS)[0]}
                            <span className="text-terracotta italic font-medium">{BRAND_PHILOSOPHY_INTRO_EMPHASIS}</span>
                        </p>
                    </motion.div>
                </div>

                {BRAND_PILLARS.map((pillar, index) => (
                    <PhilosophyFeature
                        key={pillar.number}
                        number={pillar.number}
                        title={pillar.title}
                        text={pillar.text}
                        image={pillar.image}
                        reverse={index === 1}
                        icon={PILLAR_ICONS[index]}
                    />
                ))}

                {/* Philosophy Quote Section */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-16 sm:mt-24 md:mt-32 text-center max-w-4xl mx-auto px-4 sm:px-0"
                >
                    <div className="relative bg-gradient-to-br from-deep-jungle to-deep-jungle/90 p-8 sm:p-12 md:p-16 rounded-2xl sm:rounded-3xl overflow-hidden">
                        <div className="absolute inset-0 bg-[url('/assets/kolam.jpg')] opacity-10 bg-cover bg-center" />
                        <div className="relative z-10">
                            <Heart className="w-8 h-8 sm:w-12 sm:h-12 text-terracotta mx-auto mb-4 sm:mb-6" />
                            <blockquote className="font-serif text-lg sm:text-2xl md:text-3xl text-white leading-relaxed italic mb-4 sm:mb-6">
                                {BRAND_QUOTE}
                            </blockquote>
                            <p className="text-white/80 text-sm sm:text-lg">— The Triberoutes Philosophy</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Philosophy;

