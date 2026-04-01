import { motion } from 'framer-motion';

export default function Navbar({ brand, right }) {
  return (
    <motion.nav
      className="navbar"
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="navbar-inner flex-between">
        <div className="nav-brand">{brand}</div>
        {right}
      </div>
    </motion.nav>
  );
}
