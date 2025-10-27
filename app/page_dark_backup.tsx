'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-primary/30 rounded-full blur-3xl -top-48 -left-48 animate-float" />
        <div className="absolute w-96 h-96 bg-blue-500/20 rounded-full blur-3xl top-1/2 -right-48" style={{ animationDelay: '2s' }} />
        <div className="absolute w-96 h-96 bg-pink-500/20 rounded-full blur-3xl -bottom-48 left-1/2" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 backdrop-blur-sm bg-white/5 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.h1
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold gradient-text"
          >
            Family Docs Vault
          </motion.h1>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="secondary" size="sm">Login</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          {/* 3D Floating Icon */}
          <motion.div
            initial={{ scale: 0, rotateY: 180 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            whileHover={{ scale: 1.1, rotateY: 15 }}
            className="mx-auto h-40 w-40 bg-gradient-to-br from-primary to-pink-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl transform-3d relative"
            style={{
              boxShadow: '0 30px 60px rgba(139, 92, 246, 0.5), 0 0 100px rgba(236, 72, 153, 0.3)'
            }}
          >
            <motion.svg
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="h-20 w-20 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </motion.svg>
            {/* 3D Depth Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-400/50 to-pink-400/50 transform translate-z-[-10px] blur-sm" />
          </motion.div>

          {/* Headline with Gradient */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-7xl font-extrabold text-white mb-6 leading-tight"
          >
            <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
              Secure Family
            </span>
            <br />
            Document Storage
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Store, organize, and protect your family&apos;s important documents in password-protected folders.
            <span className="text-purple-400 font-semibold"> Premium security</span> with an intuitive interface.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex gap-6 justify-center flex-wrap"
          >
            <Link href="/register">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-700 text-lg px-8 py-4 glow">
                  Get Started Free
                </Button>
              </motion.div>
            </Link>
            <Link href="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button variant="secondary" size="lg" className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                  Sign In
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Features Grid with 3D Cards */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-32 grid md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ),
              title: "Password Protected",
              description: "Each folder is secured with its own password using industry-standard encryption.",
              gradient: "from-blue-500 to-cyan-500",
              delay: 0
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              ),
              title: "Easy Organization",
              description: "Create unlimited folders to organize your documents by category or family member.",
              gradient: "from-primary to-pink-500",
              delay: 0.2
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              ),
              title: "Multiple File Types",
              description: "Upload PDFs, images, documents, and more. Up to 10MB per file.",
              gradient: "from-orange-500 to-red-500",
              delay: 0.4
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay + 0.8 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <div className="relative backdrop-blur-sm bg-white/5 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300">
                <motion.div
                  whileHover={{ rotate: 360, scale: 1.1 }}
                  transition={{ duration: 0.6 }}
                  className={`h-16 w-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center mb-6 shadow-lg`}
                >
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {feature.icon}
                  </svg>
                </motion.div>
                <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.2 }}
        className="relative z-10 backdrop-blur-sm bg-white/5 border-t border-white/10 mt-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
          <p>&copy; 2025 Family Docs Vault. Built with Next.js & MongoDB.</p>
          <p className="text-sm mt-2 text-gray-500">Premium security for your family documents</p>
        </div>
      </motion.footer>
    </div>
  );
}
