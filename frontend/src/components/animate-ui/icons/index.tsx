import { motion, type SVGMotionProps } from "motion/react"
import { forwardRef } from "react"
import { AnimateIcon, type AnimateIconProps } from "./animate-icon"

interface IconProps extends SVGMotionProps<SVGSVGElement> {
  size?: number
  animate?: boolean | string
  animateOnHover?: boolean | string
  animateOnTap?: boolean | string
  animateOnView?: boolean | string
}

function wrapWithAnimateIcon(
  icon: React.ReactElement,
  animateOnHover?: boolean | string,
  animateOnTap?: boolean | string,
  animateOnView?: boolean | string
) {
  if (animateOnHover || animateOnTap || animateOnView) {
    return (
      <AnimateIcon animateOnHover={animateOnHover} animateOnTap={animateOnTap} animateOnView={animateOnView}>
        {icon}
      </AnimateIcon>
    )
  }
  return icon
}

export const ArrowRight = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M5 12h14" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.4 }} />
        <motion.path d="m12 5 7 7-7 7" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
ArrowRight.displayName = "ArrowRight"

export const ArrowDown = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M12 5v14" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.4 }} />
        <motion.path d="m19 12-7 7-7-7" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
ArrowDown.displayName = "ArrowDown"

export const ArrowUp = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M12 19V5" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.4 }} />
        <motion.path d="m5 12 7-7 7 7" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
ArrowUp.displayName = "ArrowUp"

export const Edit = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M12 20h9" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.3 }} />
        <motion.path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.5, delay: 0.1 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
Edit.displayName = "Edit"

export const Target = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.circle cx="12" cy="12" r="10" initial={isActive ? { pathLength: 0, scale: 0.8 } : {}} animate={isActive ? { pathLength: 1, scale: 1 } : {}} transition={{ duration: 0.4 }} />
        <motion.circle cx="12" cy="12" r="6" initial={isActive ? { pathLength: 0, scale: 0.8 } : {}} animate={isActive ? { pathLength: 1, scale: 1 } : {}} transition={{ duration: 0.3, delay: 0.1 }} />
        <motion.circle cx="12" cy="12" r="2" initial={isActive ? { scale: 0 } : {}} animate={isActive ? { scale: 1 } : {}} transition={{ duration: 0.2, delay: 0.3 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
Target.displayName = "Target"

export const ChartBar = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M3 3v18h18" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.3 }} />
        <motion.rect x="7" y="12" width="3" height="6" initial={isActive ? { scaleY: 0 } : {}} animate={isActive ? { scaleY: 1 } : {}} transition={{ duration: 0.3, delay: 0.1 }} style={{ transformOrigin: '7px 18px' }} />
        <motion.rect x="12" y="8" width="3" height="10" initial={isActive ? { scaleY: 0 } : {}} animate={isActive ? { scaleY: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} style={{ transformOrigin: '12px 18px' }} />
        <motion.rect x="17" y="5" width="3" height="13" initial={isActive ? { scaleY: 0 } : {}} animate={isActive ? { scaleY: 1 } : {}} transition={{ duration: 0.3, delay: 0.3 }} style={{ transformOrigin: '17px 18px' }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
ChartBar.displayName = "ChartBar"

export const MoreVertical = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.circle cx="12" cy="12" r="1" initial={isActive ? { scale: 0 } : {}} animate={isActive ? { scale: 1 } : {}} transition={{ duration: 0.2 }} />
        <motion.circle cx="12" cy="5" r="1" initial={isActive ? { scale: 0 } : {}} animate={isActive ? { scale: 1 } : {}} transition={{ duration: 0.2, delay: 0.1 }} />
        <motion.circle cx="12" cy="19" r="1" initial={isActive ? { scale: 0 } : {}} animate={isActive ? { scale: 1 } : {}} transition={{ duration: 0.2, delay: 0.2 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
MoreVertical.displayName = "MoreVertical"

export const LogOut = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.4 }} />
        <motion.polyline points="16 17 21 12 16 7" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} />
        <motion.line x1="21" y1="12" x2="9" y2="12" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.3, delay: 0.3 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
LogOut.displayName = "LogOut"

export const Scale = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3 }} />
        <motion.path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" initial={isActive ? { pathLength: 0, opacity: 0 } : {}} animate={isActive ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.3, delay: 0.1 }} />
        <motion.path d="M7 21h10" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.3, delay: 0.2 }} />
        <motion.path d="M12 3v18" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.3, delay: 0.3 }} />
        <motion.path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.4, delay: 0.4 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
Scale.displayName = "Scale"

export const Receipt = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 28, animate, animateOnHover, animateOnTap, animateOnView, ...props }, ref) => {
    const isActive = Boolean(animate || animateOnHover)
    return wrapWithAnimateIcon(
      <svg ref={ref} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <motion.path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2 1Z" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.5 }} />
        <motion.path d="M8 7h8" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.2, delay: 0.3 }} />
        <motion.path d="M8 11h8" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.2, delay: 0.4 }} />
        <motion.path d="M8 15h5" initial={isActive ? { pathLength: 0 } : {}} animate={isActive ? { pathLength: 1 } : {}} transition={{ duration: 0.2, delay: 0.5 }} />
      </svg>,
      animateOnHover, animateOnTap, animateOnView
    )
  }
)
Receipt.displayName = "Receipt"
