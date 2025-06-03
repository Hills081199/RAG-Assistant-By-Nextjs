import React from "react";

export const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`rounded-xl shadow-lg bg-white p-6 ${className}`}>
      {children}
    </div>
  );
};