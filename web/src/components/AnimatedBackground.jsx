import { motion } from 'framer-motion';

export default function AnimatedBackground() {
  return (
    <div className="ambient-bg" aria-hidden>
      <motion.div
        className="orb orb-a"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.08, 0.95, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="orb orb-b"
        animate={{
          x: [0, -35, 25, 0],
          y: [0, 25, -15, 0],
          scale: [1, 1.12, 0.92, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="orb orb-c"
        animate={{
          x: [0, 20, -35, 0],
          y: [0, 40, -25, 0],
          opacity: [0.35, 0.55, 0.4],
        }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="grid-overlay" />
    </div>
  );
}
