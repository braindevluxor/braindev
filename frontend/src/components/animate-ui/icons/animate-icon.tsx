import { motion, type HTMLMotionProps } from "motion/react"
import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface AnimateIconProps extends HTMLMotionProps<"span"> {
  children: ReactNode
  asChild?: boolean
  animate?: boolean | string
  animateOnHover?: boolean | string
  animateOnTap?: boolean | string
  animateOnView?: boolean | string
  animateOnViewMargin?: string
  animateOnViewOnce?: boolean
  persistOnAnimateEnd?: boolean
  delay?: number
  loop?: boolean
  loopDelay?: number
}

export const AnimateIcon = forwardRef<HTMLSpanElement, AnimateIconProps>(
  (
    {
      children,
      className,
      animate = false,
      animateOnHover = false,
      animateOnTap = false,
      animateOnView = false,
      animateOnViewMargin = "0px",
      animateOnViewOnce = true,
      persistOnAnimateEnd = false,
      delay = 0,
      loop = false,
      loopDelay = 0,
      ...props
    },
    ref
  ) => {
    const shouldAnimate = animate || animateOnView

    return (
      <motion.span
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
        whileHover={animateOnHover ? { scale: 1.1 } : undefined}
        whileTap={animateOnTap ? { scale: 0.95 } : undefined}
        initial={shouldAnimate ? { opacity: 0, scale: 0.8 } : undefined}
        animate={shouldAnimate ? { opacity: 1, scale: 1 } : undefined}
        transition={{
          duration: 0.3,
          delay,
          repeat: loop ? Infinity : 0,
          repeatDelay: loopDelay,
        }}
        viewport={animateOnView ? { once: animateOnViewOnce, margin: animateOnViewMargin } : undefined}
        {...props}
      >
        {children}
      </motion.span>
    )
  }
)

AnimateIcon.displayName = "AnimateIcon"
