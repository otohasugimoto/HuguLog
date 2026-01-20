
export const DiaperIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
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
    >
        <path d="M5 8L7 4H17L19 8" />
        <path d="M5 8V18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V8" />
        <path d="M9 8C9 10.7614 10.3431 13 12 13C13.6569 13 15 10.7614 15 8" />
    </svg>
);
