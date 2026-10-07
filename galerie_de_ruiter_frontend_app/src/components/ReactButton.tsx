import type { ButtonHTMLAttributes, ComponentType } from "react";
import { Button as BootstrapButton } from "react-bootstrap";

type ReactButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button";
  variant?: string;
  active?: boolean;
};

export const Button = BootstrapButton as ComponentType<ReactButtonProps>;
