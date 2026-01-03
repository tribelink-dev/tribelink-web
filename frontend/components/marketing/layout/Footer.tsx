'use client';

import { motion } from 'framer-motion';
import { Mail, Instagram, Facebook, Twitter, Heart, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        journey: [
            { name: 'Home', href: '/' },
            { name: 'About Us', href: '/#philosophy' },
            { name: 'Journeys', href: '/#experience' },
            { name: 'Cultural Immersion', href: '/#cultural' },
        ],
        connect: [
            { name: 'Stories', href: '/#community' },
            { name: 'Contact', href: '/#contact' },
            { name: 'Find Your Tribe', href: '/#contact' },
        ]
    };

    const socialLinks = [
        { icon: <Instagram size={20} />, href: '#', label: 'Instagram' },
        { icon: <Facebook size={20} />, href: '#', label: 'Facebook' },
        { icon: <Twitter size={20} />, href: '#', label: 'Twitter' },
        { icon: <Mail size={20} />, href: '#', label: 'Email' },
    ];

    return (
        <footer className="bg-gradient-to-b from-deep-jungle to-deep-jungle/95 text-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[url('/assets/kolam.jpg')] bg-cover bg-center" />
            </div>

            <div className="container mx-auto px-6 py-20 relative z-10">
                <div className="grid md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="md:col-span-2 max-w-md"
                    >
                        <div className="font-serif text-4xl font-bold mb-6 bg-gradient-to-r from-white to-terracotta bg-clip-text text-transparent">
                            Tribelink
                        </div>
                        <p className="text-xl mb-6 text-white/90 font-light">Connect Deeply. Travel Authentically.</p>
                        <p className="text-white/70 leading-relaxed mb-6">
                            Come Back to What Matters. Tribelink is an invitation to step through the screen and into the scenery.
                            To hold the clay, to taste the spice, to shake the hand.
                        </p>
                        
                        {/* Contact Info */}
                        <div className="space-y-3 mt-8">
                            <div className="flex items-center gap-3 text-white/80">
                                <Mail size={18} className="text-terracotta" />
                                <span>info@tribelink.com</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <Phone size={18} className="text-terracotta" />
                                <span>+91 123 456 7890</span>
                            </div>
                            <div className="flex items-center gap-3 text-white/80">
                                <MapPin size={18} className="text-terracotta" />
                                <span>Kerala, India</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Journey Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        <h5 className="font-serif text-xl mb-6 text-terracotta">Journey</h5>
                        <ul className="space-y-3">
                            {footerLinks.journey.map((link, index) => (
                                <motion.li
                                    key={link.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <a 
                                        href={link.href} 
                                        className="text-white/70 hover:text-terracotta transition-colors inline-flex items-center gap-2 group"
                                    >
                                        <span>{link.name}</span>
                                        <motion.span
                                            initial={{ x: -5, opacity: 0 }}
                                            whileHover={{ x: 0, opacity: 1 }}
                                            className="text-terracotta"
                                        >
                                            →
                                        </motion.span>
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </motion.div>

                    {/* Connect Links */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h5 className="font-serif text-xl mb-6 text-terracotta">Connect</h5>
                        <ul className="space-y-3">
                            {footerLinks.connect.map((link, index) => (
                                <motion.li
                                    key={link.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <a 
                                        href={link.href} 
                                        className="text-white/70 hover:text-terracotta transition-colors inline-flex items-center gap-2 group"
                                    >
                                        <span>{link.name}</span>
                                        <motion.span
                                            initial={{ x: -5, opacity: 0 }}
                                            whileHover={{ x: 0, opacity: 1 }}
                                            className="text-terracotta"
                                        >
                                            →
                                        </motion.span>
                                    </a>
                                </motion.li>
                            ))}
                        </ul>

                        {/* Social Links */}
                        <div className="mt-8">
                            <h5 className="font-serif text-lg mb-4 text-terracotta">Follow Us</h5>
                            <div className="flex gap-4">
                                {socialLinks.map((social, index) => (
                                    <motion.a
                                        key={social.label}
                                        href={social.href}
                                        aria-label={social.label}
                                        initial={{ opacity: 0, scale: 0 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: index * 0.1, type: "spring" }}
                                        whileHover={{ scale: 1.2, rotate: 5 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-terracotta flex items-center justify-center text-white/80 hover:text-white transition-all backdrop-blur-sm"
                                    >
                                        {social.icon}
                                    </motion.a>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Newsletter Signup */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="border-t border-white/10 pt-12 mb-12"
                >
                    <div className="max-w-md">
                        <h5 className="font-serif text-xl mb-4 text-terracotta">Stay Connected</h5>
                        <p className="text-white/70 mb-4">Get stories, updates, and invitations to authentic cultural experiences.</p>
                        <form onSubmit={(e) => e.preventDefault()} className="flex gap-3">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex-1 px-4 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-terracotta transition-colors"
                            />
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-terracotta rounded-full font-medium hover:bg-terracotta/90 transition-colors"
                            >
                                Subscribe
                            </motion.button>
                        </form>
                    </div>
                </motion.div>

                {/* Platform CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="border-t border-white/10 pt-12 mb-8 text-center"
                >
                    <p className="text-white/80 mb-4 text-lg">Ready to start your journey?</p>
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-terracotta text-white rounded-full font-medium hover:bg-terracotta/90 transition-all group shadow-lg cursor-pointer"
                        >
                            <span>Plan Your Trip</span>
                            <motion.span
                                animate={{ x: [0, 5, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                →
                            </motion.span>
                        </Link>
                    </motion.div>
                </motion.div>

                {/* Bottom Bar */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
                >
                    <p className="text-white/50 text-sm">
                        © {currentYear} Tribelink. Built with intention, designed for connection.
                    </p>
                    <div className="flex items-center gap-2 text-white/50 text-sm">
                        <span>Made with</span>
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            <Heart size={14} className="text-terracotta fill-terracotta" />
                        </motion.div>
                        <span>for authentic travelers</span>
                    </div>
                </motion.div>
            </div>
        </footer>
    );
};

export default Footer;

