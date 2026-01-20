
import React from 'react';

export const PoopIcon = ({ size = 24, className = "", ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M10 12h.01" />
        <path d="M14 12h.01" />
        <path d="M10 16c.5.5 2 1 2.5 0" />
        <path d="M21 16c0 2.5-2 4-5 4H8c-3 0-5-1.5-5-4 0-4 4-5 4-5s-.5-2 3-5c2 2 3 5 3 5s4 1 4 5" />
    </svg>
);
