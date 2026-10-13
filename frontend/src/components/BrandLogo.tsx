import React from "react";
import logoImg from "../assets/gym-genius-logo.jpg";

interface BrandLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 32, className = "", style = {} }) => {
  return (
    <img
      src={logoImg}
      alt="GymGenius Logo"
      width={size}
      height={size}
      className={`brand-logo-img ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        objectFit: "cover",
        borderRadius: "50%",
        display: "inline-block",
        verticalAlign: "middle",
        border: "1.5px solid rgba(245, 158, 11, 0.6)",
        boxShadow: "0 2px 10px rgba(245, 158, 11, 0.35)",
        ...style
      }}
    />
  );
};
