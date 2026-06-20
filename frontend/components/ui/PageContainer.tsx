import { type HTMLAttributes } from 'react';

import { cn } from '@/lib/utils';



export type PageContainerWidth = 'fluid' | 'constrained' | 'narrow';



export interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {

  /** Apply fixed-navbar top offset (default true) */

  belowNav?: boolean;

  /** @deprecated Use `width="narrow"` instead */

  narrow?: boolean;

  /** Layout width mode (default fluid) */

  width?: PageContainerWidth;

}



const widthClasses: Record<PageContainerWidth, string> = {

  fluid: 'w-full px-page lg:px-page-lg',

  constrained: 'w-full max-w-7xl mx-auto px-page lg:px-page-lg',

  narrow: 'w-full max-w-3xl mx-auto px-page lg:px-page-lg',

};



export function PageContainer({

  className,

  belowNav = true,

  narrow = false,

  width,

  ...props

}: PageContainerProps) {

  const resolvedWidth: PageContainerWidth = width ?? (narrow ? 'narrow' : 'fluid');



  return (

    <div

      className={cn(

        widthClasses[resolvedWidth],

        belowNav && 'pt-below-nav',

        className

      )}

      {...props}

    />

  );

}

