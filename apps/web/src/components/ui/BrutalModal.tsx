import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { HiOutlineX } from 'react-icons/hi'

interface BrutalModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export default function BrutalModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: BrutalModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const sizes = {
    sm: 'max-w-[400px]',
    md: 'max-w-[600px]',
    lg: 'max-w-[800px]',
    xl: 'max-w-[1200px]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-event-horizon/90 z-50"
            onClick={onClose}
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={clsx(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'w-[calc(100vw-48px)]',
              sizes[size]
            )}
          >
            <div className="bg-carbon-plate border-4 border-basalt-border shadow-brutal-lg">
              {/* HEADER */}
              {(title || showCloseButton) && (
                <div className="px-24px py-16px border-b-2 border-basalt-border flex items-center justify-between">
                  {title && (
                    <h2 className="text-brutal-xl">{title.toUpperCase()}</h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="ml-auto p-8px hover:bg-event-horizon transition-colors"
                    >
                      <HiOutlineX className="w-24px h-24px" />
                    </button>
                  )}
                </div>
              )}

              {/* CONTENT */}
              <div className="p-24px">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}