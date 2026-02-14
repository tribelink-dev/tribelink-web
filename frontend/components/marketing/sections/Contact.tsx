'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';
import { Send, CheckCircle, Mail, Calendar, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const Contact = () => {
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        dates: '',
        group: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsSubmitting(false);
        setIsSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
            setIsSubmitted(false);
            setFormData({
                name: '',
                email: '',
                dates: '',
                group: '',
                message: ''
            });
        }, 3000);
    };

    const InputField = ({ 
        label, 
        type = "text", 
        placeholder, 
        id,
        icon: Icon 
    }: { 
        label: string; 
        type?: string; 
        placeholder: string; 
        id: string;
        icon?: React.ReactNode;
    }) => {
        const hasValue = formData[id as keyof typeof formData] !== '';
        const isFocused = focusedField === id;

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative mb-8 group"
            >
                {Icon && (
                    <div className="absolute left-0 top-3 text-deep-jungle/40 group-hover:text-terracotta transition-colors">
                        {Icon}
                    </div>
                )}
                <label
                    htmlFor={id}
                    className={`absolute left-8 transition-all duration-300 pointer-events-none ${
                        isFocused || hasValue 
                            ? '-top-6 text-xs text-terracotta font-medium' 
                            : 'top-3 text-deep-jungle/40'
                    }`}
                >
                    {label}
                </label>
                {type === 'textarea' ? (
                    <textarea
                        id={id}
                        rows={5}
                        value={formData[id as keyof typeof formData]}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        placeholder={isFocused ? placeholder : ''}
                        className="w-full bg-transparent border-b-2 border-deep-jungle/20 py-3 pl-8 pr-2 text-deep-jungle focus:outline-none focus:border-terracotta transition-all resize-none"
                        onFocus={() => setFocusedField(id)}
                        onBlur={() => setFocusedField(null)}
                    />
                ) : (
                    <input
                        type={type}
                        id={id}
                        value={formData[id as keyof typeof formData]}
                        onChange={(e) => handleInputChange(id, e.target.value)}
                        placeholder={isFocused ? placeholder : ''}
                        className="w-full bg-transparent border-b-2 border-deep-jungle/20 py-3 pl-8 pr-2 text-deep-jungle focus:outline-none focus:border-terracotta transition-all"
                        onFocus={() => setFocusedField(id)}
                        onBlur={() => setFocusedField(null)}
                    />
                )}
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isFocused ? '100%' : 0 }}
                    className="absolute bottom-0 left-0 h-0.5 bg-terracotta"
                />
            </motion.div>
        );
    };

    return (
        <section id="contact" className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 bg-gradient-to-b from-off-white via-white to-deep-jungle relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-terracotta/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-clay/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="container mx-auto max-w-5xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-12 sm:mb-16"
                >
                    <motion.p
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="text-terracotta tracking-wide sm:tracking-widest text-xs sm:text-sm font-medium uppercase mb-4 sm:mb-6 inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-terracotta/10 rounded-full"
                    >
                        Find Your Tribe
                    </motion.p>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-serif text-deep-jungle mb-4 sm:mb-6 leading-tight px-2">
                        Tell Us What
                        <br />
                        <span className="text-terracotta italic">Moves You</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-deep-jungle/70 max-w-3xl mx-auto leading-relaxed font-light px-2">
                        Not where you want to go, but why. What are you seeking? What do you hope to understand?
                        <br className="hidden sm:block" />
                        <span className="block sm:inline">We'll listen, then we'll connect you with people and places that answer.</span>
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white p-6 sm:p-8 md:p-16 rounded-2xl sm:rounded-3xl shadow-2xl border border-deep-jungle/5 relative overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('/assets/kolam.jpg')] bg-cover bg-center" />
                    </div>

                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="text-center py-12 relative z-10"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                    <CheckCircle className="w-20 h-20 text-terracotta mx-auto mb-6" />
                                </motion.div>
                                <h3 className="text-3xl font-serif text-deep-jungle mb-4">Thank You!</h3>
                                <p className="text-deep-jungle/70 text-lg">
                                    We've received your message and will connect with you soon.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onSubmit={handleSubmit}
                                className="relative z-10"
                            >
                                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                                    <InputField 
                                        id="name" 
                                        label="Your name" 
                                        placeholder="How should we address you?"
                                        icon={<Mail size={18} />}
                                    />
                                    <InputField 
                                        id="email" 
                                        label="Email" 
                                        type="email" 
                                        placeholder="Where can we reach you?"
                                        icon={<Mail size={18} />}
                                    />
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
                                    <InputField 
                                        id="dates" 
                                        label="When do you want to travel?" 
                                        placeholder="Flexible dates or specific timeframe"
                                        icon={<Calendar size={18} />}
                                    />
                                    <InputField 
                                        id="group" 
                                        label="Who's traveling?" 
                                        placeholder="Just you, a couple, family, friends?"
                                        icon={<Users size={18} />}
                                    />
                                </div>

                                <InputField 
                                    id="message" 
                                    label="What are you seeking? What moves you?" 
                                    placeholder="Tell us about your interests, what you hope to experience, and what cultural connections you're looking for..."
                                    type="textarea"
                                    icon={<MessageSquare size={18} />}
                                />

                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="text-center mt-8 space-y-4"
                                >
                                    <Button 
                                        type="submit" 
                                        size="lg" 
                                        className="w-full md:w-auto min-w-[250px] relative overflow-hidden group"
                                        disabled={isSubmitting}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            {isSubmitting ? (
                                                <>
                                                    <motion.div
                                                        animate={{ rotate: 360 }}
                                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                                                    />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                                                    Start Your Journey
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                    <div className="text-center">
                                        <p className="text-deep-jungle/60 text-sm mb-3">or</p>
                                        <motion.div
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <Link
                                                href="/login"
                                                className="inline-flex items-center gap-2 text-terracotta hover:text-terracotta/80 font-medium text-lg group cursor-pointer"
                                            >
                                                <span>Browse Experiences Now</span>
                                                <motion.span
                                                    animate={{ x: [0, 5, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                    className="text-2xl"
                                                >
                                                    →
                                                </motion.span>
                                            </Link>
                                        </motion.div>
                                    </div>
                                </motion.div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
};

export default Contact;

