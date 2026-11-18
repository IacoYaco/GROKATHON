export const CEID_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 32,
};

export const CEID_EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: CEID_EASE },
  },
};

export const staggerChildren = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};
