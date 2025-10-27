'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Merged Header - Full Viewport */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-white">
        {/* 3D Parallax Background */}
        <motion.div
          className="absolute inset-0"
          style={{ perspective: "1000px" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          {/* Layer 1 - Deepest */}
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              rotateX: [0, 2, 0],
              rotateY: [0, 2, 0]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-primary to-primary/80 rounded-full opacity-30 blur-3xl"
              style={{ transform: "translateZ(-100px)" }}
              animate={{
                y: [0, 40, 0],
                x: [0, 30, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Layer 2 - Middle */}
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
            animate={{
              rotateX: [0, -1, 0],
              rotateY: [0, -1, 0]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div
              className="absolute bottom-0 right-1/4 w-[450px] h-[450px] bg-gradient-to-br from-primary/80 to-primary/60 rounded-full opacity-35 blur-3xl"
              style={{ transform: "translateZ(-50px)" }}
              animate={{
                y: [0, -35, 0],
                x: [0, -25, 0],
                scale: [1, 1.3, 1]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Layer 3 - Closest */}
          <motion.div
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d" }}
          >
            <motion.div
              className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-gradient-to-br from-primary/60 to-background rounded-full opacity-40 blur-3xl"
              style={{ transform: "translateZ(0px) translate(-50%, -50%)" }}
              animate={{
                scale: [1, 1.4, 1],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 18,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </motion.div>

          {/* Animated Grid Wave */}
          <motion.div
            className="absolute inset-0 overflow-hidden opacity-30"
            style={{ perspective: "1000px" }}
          >
            <svg
              className="absolute inset-0 w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern
                  id="grid-pattern"
                  width="50"
                  height="50"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 50 0 L 0 0 0 50"
                    fill="none"
                    stroke="rgba(147, 51, 234, 0.4)"
                    strokeWidth="0.5"
                  />
                </pattern>
              </defs>
              <motion.rect
                width="120%"
                height="120%"
                x="-10%"
                y="-10%"
                fill="url(#grid-pattern)"
                animate={{
                  y: ["-10%", "-15%", "-10%"],
                  rotateX: [0, 5, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                style={{ transformOrigin: "center center" }}
              />
            </svg>

            {/* Secondary wave layer */}
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"]
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                backgroundImage: "linear-gradient(45deg, transparent 30%, rgba(168, 85, 247, 0.08) 50%, transparent 70%)",
                backgroundSize: "200% 200%"
              }}
            />

            {/* Ripple effect */}
            <motion.div
              className="absolute top-1/2 left-1/2"
              style={{ transform: "translate(-50%, -50%)" }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-0 left-0 w-32 h-32 border border-border/20 rounded-full"
                  style={{ transform: "translate(-50%, -50%)" }}
                  animate={{
                    scale: [1, 3, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: i * 2.7
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Header Navigation - Fully Integrated */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 pt-6"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3"
            >
              <Image
                src="/logo.png"
                alt="VaultKeep Logo"
                width={40}
                height={40}
                className="rounded-lg shadow-lg"
              />
              <h1 className="text-xl font-semibold text-gray-900">VaultKeep</h1>
            </motion.div>
            <div className="flex gap-3">
              <Link href="/login">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-gray-700 bg-white/90 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl hover:bg-white transition-all duration-300"
                  >
                    Login
                  </Button>
                </motion.div>
              </Link>
              <Link href="/register">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
                  >
                    Sign Up
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.header>

        {/* Hero Content - Centered */}
        <div className="relative flex-1 flex items-center justify-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mx-auto mb-8 inline-block"
            >
              <motion.div
                whileHover={{ y: -8, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <Image
                  src="/logo.png"
                  alt="VaultKeep"
                  width={100}
                  height={100}
                  className="rounded-2xl shadow-2xl"
                  style={{ boxShadow: '0 20px 40px rgba(147, 51, 234, 0.3)' }}
                />
              </motion.div>
            </motion.div>

            {/* Clean Typography */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight"
            >
              Secure Family
              <span className="block text-primary">Document Storage</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto"
            >
              Store, organize, and protect your family&apos;s important documents in password-protected folders with enterprise-grade security.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex gap-4 justify-center flex-wrap"
            >
              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-primary to-primary hover:from-primary/90 hover:to-primary shadow-2xl shadow-primary/20 hover:shadow-primary/30 text-lg px-10 py-6 font-semibold transition-all duration-300"
                  >
                    Get Started Free
                  </Button>
                </motion.div>
              </Link>
              <Link href="/login">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white/90 backdrop-blur-md border-2 border-border/50 hover:border-border hover:bg-white text-gray-700 text-lg px-10 py-6 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                  >
                    Sign In
                  </Button>
                </motion.div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to secure your documents
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Professional-grade features designed for families who value security and simplicity.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                ),
                title: "Password Protected",
                description: "Each folder is secured with its own password using industry-standard bcrypt encryption.",
                bgColor: "bg-muted/30",
                hoverBgColor: "group-hover:bg-muted",
                iconColor: "text-primary"
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                ),
                title: "Easy Organization",
                description: "Create unlimited folders to organize your documents by category or family member.",
                bgColor: "bg-muted/30",
                hoverBgColor: "group-hover:bg-muted",
                iconColor: "text-primary"
              },
              {
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                ),
                title: "Multiple File Types",
                description: "Upload PDFs, images, documents, and more. Up to 10MB per file with instant access.",
                bgColor: "bg-muted/30",
                hoverBgColor: "group-hover:bg-muted",
                iconColor: "text-primary"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.15 }}
                whileHover={{ y: -4 }}
                className="group"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-border hover:shadow-xl transition-all duration-300 h-full">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                    className={`h-14 w-14 ${feature.bgColor} ${feature.hoverBgColor} rounded-xl flex items-center justify-center mb-6 transition-colors`}
                  >
                    <svg className={`h-7 w-7 ${feature.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {feature.icon}
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-16 bg-gray-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "256-bit", label: "Encryption" },
              { value: "10MB", label: "Max File Size" },
              { value: "Unlimited", label: "Folders" },
              { value: "100%", label: "Secure" }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="bg-white border-t border-gray-200 py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="VaultKeep"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold text-gray-900">VaultKeep</span>
            </div>
            <p className="text-gray-600 mb-2">&copy; 2025 VaultKeep. All rights reserved.</p>
            <p className="text-sm text-gray-500">Built with Next.js, MongoDB & Enterprise Security</p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
