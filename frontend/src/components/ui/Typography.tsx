/**
 * Typography component — use these instead of raw h1/h2/p tags
 * to ensure every type size references the token scale.
 */
import { cn } from "@/src/lib/utils";
import type { ElementType } from "react";

interface TypoProps {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
}

export function Display({ children, className, as: Tag = "h1" }: TypoProps) {
  return <Tag className={cn("text-display font-serif text-charcoal", className)}>{children}</Tag>;
}

export function Heading1({ children, className, as: Tag = "h1" }: TypoProps) {
  return <Tag className={cn("text-h1 font-serif text-charcoal", className)}>{children}</Tag>;
}

export function Heading2({ children, className, as: Tag = "h2" }: TypoProps) {
  return <Tag className={cn("text-h2 font-serif text-charcoal", className)}>{children}</Tag>;
}

export function Heading3({ children, className, as: Tag = "h3" }: TypoProps) {
  return <Tag className={cn("text-h3 font-sans font-semibold text-charcoal", className)}>{children}</Tag>;
}

export function Body({ children, className, as: Tag = "p" }: TypoProps) {
  return <Tag className={cn("text-body text-charcoal", className)}>{children}</Tag>;
}

export function Small({ children, className, as: Tag = "p" }: TypoProps) {
  return <Tag className={cn("text-small text-muted", className)}>{children}</Tag>;
}

export function Caption({ children, className, as: Tag = "p" }: TypoProps) {
  return <Tag className={cn("text-caption text-muted", className)}>{children}</Tag>;
}
