import type { ImgHTMLAttributes } from "react";
import catlLogo from "@/assets/images/catl-logo.png";

type CatlLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src">;

export function CatlLogo({ alt = "Logo Dulux", ...props }: CatlLogoProps) {
  return <img src={catlLogo} alt={alt} {...props} />;
}
