import Image from 'next/image';
import { LOGO_PATH, LOGO_ALT_TEXT } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BrandLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({ size = 32, className, priority }: BrandLogoProps) {
  return (
    <Image
      src={LOGO_PATH}
      alt={LOGO_ALT_TEXT}
      width={size}
      height={size}
      priority={priority}
      className={cn('rounded-[22%] object-contain shrink-0', className)}
      style={{ width: size, height: size }}
    />
  );
}
