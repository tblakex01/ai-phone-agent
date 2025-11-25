
import React from 'react';

interface IconProps {
  className?: string;
}

export const PhoneIcon: React.FC<IconProps> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.362-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
  </svg>
);

export const PhoneHangupIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 3.75 18 6m0 0 2.25 2.25M18 6l-2.25 2.25m1.5-1.5-2.25-2.25M12 18.75a4.5 4.5 0 0 1-4.5-4.5v-6a4.5 4.5 0 0 1 4.5-4.5m0 15.002a4.502 4.502 0 0 1-4.477-4.223M12 18.75a4.502 4.502 0 0 0 4.477-4.223" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 9.75 1.5-1.5-1.5-1.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 3.75a15.752 15.752 0 0 1 3.285 3.285" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 16.5a15.752 15.752 0 0 0 3.285 3.285" />
    </svg>
);

export const MicIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m12 5.25v-1.5a6 6 0 0 0-12 0v1.5m12 0a9 9 0 1 1-18 0a9 9 0 0 1 18 0Z" />
    </svg>
);
