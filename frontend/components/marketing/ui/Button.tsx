'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
    href?: string;
}

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, href, disabled, ...props }, ref) => {

        const variants = {
            primary: 'bg-terracotta text-white hover:bg-terracotta/90 shadow-lg hover:shadow-xl',
            secondary: 'bg-deep-jungle text-white hover:bg-deep-jungle/90 shadow-lg hover:shadow-xl',
            ghost: 'bg-transparent text-white hover:bg-white/10',
            outline: 'border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50',
        };

        const sizes = {
            sm: 'px-4 py-2 text-sm',
            md: 'px-6 py-3 text-base',
            lg: 'px-8 py-4 text-lg',
        };

        const commonClasses = cn(
            'relative overflow-hidden rounded-full font-medium transition-all duration-300 inline-flex items-center justify-center cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed',
            variants[variant],
            sizes[size],
            className
        );

        const buttonContent = (
            <>
                <span className="relative z-10">{children}</span>
                <motion.div
                    className="absolute inset-0 bg-white/20"
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            </>
        );

        if (href) {
            return (
                <motion.a
                    href={href}
                    ref={ref as React.Ref<HTMLAnchorElement>}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={commonClasses}
                    {...(props as any)}
                >
                    {buttonContent}
                </motion.a>
            );
        }

        return (
            <motion.button
                ref={ref as React.Ref<HTMLButtonElement>}
                whileHover={!disabled ? { scale: 1.05 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                disabled={disabled}
                className={commonClasses}
                {...props}
            >
                {buttonContent}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;

