'use client';

import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import Link from 'next/link';

const StoryCard = ({ 
    image, 
    quote, 
    author, 
    role, 
    location,
    index 
}: { 
    image: string; 
    quote: string; 
    author: string; 
    role: string; 
    location: string;
    index: number;
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className="flex-none w-[85vw] md:w-[600px] bg-white rounded-3xl overflow-hidden snap-center group shadow-lg hover:shadow-2xl transition-all duration-500 border border-deep-jungle/5"
        >
            <div className="relative h-64 md:h-80 overflow-hidden">
                <motion.div
                    animate={{ scale: isHovered ? 1.1 : 1 }}
                    transition={{ duration: 0.7 }}
                    className="absolute inset-0 bg-gradient-to-t from-deep-jungle/90 via-deep-jungle/40 to-transparent z-10"
                />
                <img 
                    src={image} 
                    alt={location} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                />
                <div className="absolute bottom-4 left-6 z-20">
                    <motion.span
                        whileHover={{ scale: 1.05 }}
                        className="text-white/90 text-sm font-medium uppercase tracking-widest bg-white/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/30"
                    >
                        {location}
                    </motion.span>
                </div>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 1 : 0 }}
                    className="absolute inset-0 bg-terracotta/20 z-10"
                />
            </div>
            <div className="p-8 md:p-10 bg-white">
                <div className="mb-6">
                    <motion.div
                        animate={{ rotate: isHovered ? [0, -10, 10, -10, 0] : 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Quote className="w-10 h-10 text-terracotta mb-4 opacity-60" />
                    </motion.div>
                    <p className="font-serif text-xl md:text-2xl text-deep-jungle leading-relaxed italic">
                        "{quote}"
                    </p>
                </div>
                <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-4 pt-6 border-t border-deep-jungle/10"
                >
                    <motion.div
                        whileHover={{ scale: 1.1, rotate: 360 }}
                        transition={{ duration: 0.5 }}
                        className="w-12 h-12 bg-gradient-to-br from-terracotta to-terracotta/80 rounded-full flex items-center justify-center text-white font-serif font-bold text-lg shadow-lg"
                    >
                        {author[0]}
                    </motion.div>
                    <div>
                        <p className="font-bold text-deep-jungle text-lg">{author}</p>
                        <p className="text-sm text-deep-jungle/60">{role}</p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

const Stories = () => {
    const scrollContainer = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainer.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainer.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainer.current) {
            const scrollAmount = direction === 'left' ? -600 : 600;
            scrollContainer.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            setTimeout(checkScroll, 300);
        }
    };

    return (
        <section id="community" className="py-16 sm:py-24 md:py-32 bg-gradient-to-b from-off-white via-white to-off-white border-t border-deep-jungle/5 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-terracotta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-96 sm:h-96 bg-clay/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto px-4 sm:px-6 mb-8 sm:mb-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 sm:mb-16 gap-6"
                >
                    <div className="max-w-2xl">
                        <motion.p
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="text-terracotta tracking-wide sm:tracking-widest text-xs sm:text-sm font-medium uppercase mb-4 sm:mb-6 inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-terracotta/10 rounded-full"
                        >
                            Community Stories
                        </motion.p>
                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-deep-jungle mb-4 sm:mb-6 leading-tight">
                            Moments That Feel Like
                            <br />
                            <span className="text-terracotta italic">Coming Home</span>
                        </h2>
                        <p className="text-base sm:text-lg text-deep-jungle/70 leading-relaxed">
                            Real experiences from real travelers who found their tribe and discovered authentic cultural connections.
                        </p>
                    </div>
                    <div className="hidden md:flex gap-4 flex-shrink-0">
                        <motion.button
                            onClick={() => scroll('left')}
                            disabled={!canScrollLeft}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-14 h-14 rounded-full border-2 ${
                                canScrollLeft 
                                    ? 'border-deep-jungle/20 hover:border-deep-jungle hover:bg-deep-jungle hover:text-white text-deep-jungle' 
                                    : 'border-deep-jungle/10 text-deep-jungle/30 cursor-not-allowed'
                            } flex items-center justify-center transition-all duration-300`}
                        >
                            <ChevronLeft size={24} />
                        </motion.button>
                        <motion.button
                            onClick={() => scroll('right')}
                            disabled={!canScrollRight}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-14 h-14 rounded-full border-2 ${
                                canScrollRight 
                                    ? 'border-deep-jungle/20 hover:border-deep-jungle hover:bg-deep-jungle hover:text-white text-deep-jungle' 
                                    : 'border-deep-jungle/10 text-deep-jungle/30 cursor-not-allowed'
                            } flex items-center justify-center transition-all duration-300`}
                        >
                            <ChevronRight size={24} />
                        </motion.button>
                    </div>
                </motion.div>

                <div
                    ref={scrollContainer}
                    onScroll={checkScroll}
                    className="flex overflow-x-auto gap-8 px-6 pb-12 snap-x snap-mandatory hide-scrollbar scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <StoryCard
                        image="/assets/spices.jpg"
                        location="Kochi • Monsoon season"
                        quote="Ammini didn't just teach us to grind spices. She invited us into her home, shared stories of her grandmother, showed us how to listen to what the ingredients tell you."
                        author="Sarah & Tom"
                        role="Travelers from UK"
                        index={0}
                    />
                    <StoryCard
                        image="/assets/tourism-6852475.jpg"
                        location="Munnar • Dawn"
                        quote="We woke before sunrise to walk the tea ridges. No phones. Just mist, conversation, and the sound of leaves being plucked. The planter told us about his grandfather."
                        author="Elena"
                        role="Solo Traveler"
                        index={1}
                    />
                    <StoryCard
                        image="/assets/kadhakali.jpg"
                        location="Backwaters • Evening"
                        quote="The boatman knew every curve of the canal. He pointed out birds we'd never seen, told stories of floods and festivals. Technology connected us; his knowledge made it real."
                        author="David"
                        role="Photographer"
                        index={2}
                    />
                    <StoryCard
                        image="/assets/theyyam_main.jpg"
                        location="Wayanad • Sunset"
                        quote="We walked through a plantation with a guide who'd grown up there. He showed us how to read the soil, when to harvest, why certain trees grow together."
                        author="The Chen Family"
                        role="Family Trip"
                        index={3}
                    />
                    <StoryCard
                        image="/assets/community2.jpg"
                        location="Kerala • Festival"
                        quote="We were invited to a local festival. Not as spectators, but as participants. We learned the dances, tasted the food, and felt the rhythm of a community celebrating together."
                        author="Maria & James"
                        role="Couple from Canada"
                        index={4}
                    />
                </div>

                {/* Platform CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-12 sm:mt-16 text-center px-4 sm:px-6"
                >
                    <p className="text-deep-jungle/70 mb-3 sm:mb-4 text-base sm:text-lg">Inspired by these stories?</p>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-terracotta text-white rounded-full font-medium hover:bg-terracotta/90 transition-all group shadow-lg cursor-pointer text-sm sm:text-base"
                        >
                            <span>Create Your Own Story</span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                →
                            </motion.span>
                        </Link>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default Stories;

