import {
  createElement,
  type ButtonHTMLAttributes,
  type ComponentType,
  type ReactNode,
} from "react";
import { Button as BootstrapButton } from "react-bootstrap";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  as?: "button";
  text?: ReactNode;
  variant?: string;
  size?: "sm" | "lg";
  active?: boolean;
};

const BootstrapButtonComponent =
  BootstrapButton as ComponentType<Omit<ButtonProps, "text">>;

export function Button({ as: _as, text, children, ...props }: ButtonProps) {
  return createElement(BootstrapButtonComponent, props, text ?? children);
}
