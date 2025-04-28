// Navbar.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/portfolioMain.jpeg';
import ResumeModal from './ResumeModal';

const Navbar = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <motion.nav
        className="bg-white shadow p-4 flex justify-between items-center fixed top-0 w-full z-50"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Logo animation */}
        <motion.img
          src={logo}
          alt="Logo"
          className="w-12 h-12 cursor-pointer logoimg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.1 }}
        />

        {/* Nav links animation */}
        <motion.ul
          className="flex gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.li whileHover={{ scale: 1.1 }}>
            <a href="#about" className="hover:text-gray-600 text-blue-600">About</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            <a href="#projects" className="hover:text-gray-600 text-blue-600">Projects</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            <a href="#contact" className="hover:text-gray-600 text-blue-600">Contact</a>
          </motion.li>
          <motion.li whileHover={{ scale: 1.1 }}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Resume
            </button>
          </motion.li>
        </motion.ul>
      </motion.nav>

      {/* Resume Modal */}
      <ResumeModal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default Navbar;
