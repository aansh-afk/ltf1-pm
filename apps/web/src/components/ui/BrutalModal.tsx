import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* BACKDROP */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[var(--theme-background)]/90 z-50"
            onClick={onClose}
          />

          {/* MODAL CONTAINER - handles positioning */}
          <div
            className="fixed z-50"
            style={{ 
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px',
              pointerEvents: 'none'
            }}
          >
            {/* MODAL CONTENT - handles animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={clsx(
                'relative',
                'w-full',
                sizes[size]
              )}
              style={{ 
                pointerEvents: 'auto',
                maxHeight: 'calc(100vh - 48px)',
                overflow: 'auto'
              }}
            >
              <div className="bg-[var(--theme-background-secondary)] border-4 border-[var(--theme-border)] shadow-[var(--theme-box-shadow-hover)]">
              {/* HEADER */}
              {(title || showCloseButton) && (
                <div className="px-24px py-16px border-b-2 border-[var(--theme-border)] flex items-center justify-between">
                  {title && (
                    <h2 className="text-brutal-xl">{title.toUpperCase()}</h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onClose()
                      }}
                      className="ml-auto p-8px hover:bg-[var(--theme-hover)] transition-colors"
                      type="button"
                      aria-label="Close modal"
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
          </div>
        </>
      )}
    </AnimatePresence>
  )

  // Render the modal at the document root using portal
  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}