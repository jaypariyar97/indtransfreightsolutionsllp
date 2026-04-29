import React from 'react';

interface LogoProps {
  showText?: boolean;
  subtitle?: string;
  className?: string;
}

export default function Logo({ showText = true, subtitle, className = '' }: LogoProps) {
  if (!showText) {
    return (
      <img 
        src="/logo.jpeg" 
        alt="INDTRANS" 
        className={`w-10 h-10 object-contain ${className}`}
      />
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="/logo.jpeg" 
        alt="INDTRANS" 
        className="w-12 h-12 object-contain"
      />
      <div className="flex flex-col justify-center leading-tight">
        <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-wider uppercase">
          INDTRANS FREIGHT SOLUTIONS LLP
           {/* <span className="text-orange-600">LLP</span> */}
        </h1>
        {subtitle && <p className="text-xs md:text-sm text-gray-600 font-medium mt-1 tracking-wide">{subtitle}</p>}
      </div>
    </div>
  );
}