import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import { 
  HiOutlineX, 
  HiOutlineSearch, 
  HiOutlineUser,
  HiOutlineCode,
  HiOutlineLocationMarker,
  HiOutlineGlobeAlt,
  HiOutlineChat,
  HiOutlineClipboardCopy,
  HiOutlineBadgeCheck
} from 'react-icons/hi'
import clsx from 'clsx'
import DeveloperStatusIndicator from '../developer/DeveloperStatusIndicator'

interface ExpertiseSearchModalProps {
  onClose: () => void
  workspaceId?: Id<"workspaces">
}

export function ExpertiseSearchModal({ onClose, workspaceId }: ExpertiseSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Search results with debouncing
  const searchResults = useQuery(
    api.developers.queries.searchDevelopers,
    searchQuery.trim().length >= 2 ? { 
      query: searchQuery.trim(),
      limit: 20 
    } : 'skip'
  )

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Set searching state based on query
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      setIsSearching(true)
      const timer = setTimeout(() => setIsSearching(false), 300)
      return () => clearTimeout(timer)
    } else {
      setIsSearching(false)
    }
  }, [searchQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const copyContactInfo = (user: any) => {
    const contactInfo = [
      user.name,
      user.email,
      user.profile?.phone,
      user.profile?.location
    ].filter(Boolean).join(' | ')
    
    navigator.clipboard.writeText(contactInfo)
  }

  const getExpertiseLevel = (level: number) => {
    if (level >= 8) return { label: 'EXPERT', color: 'text-brutal-success' }
    if (level >= 6) return { label: 'ADVANCED', color: 'text-brutal-info' }
    if (level >= 4) return { label: 'INTERMEDIATE', color: 'text-brutal-warning' }
    return { label: 'BEGINNER', color: 'text-primary-brutalist' }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-brutal-warning/30 px-2px font-bold">
          {part}
        </span>
      ) : part
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--theme-background-secondary)]/80">
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] shadow-brutal w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-24px border-b-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="flex items-center gap-12px">
            <HiOutlineSearch className="w-24px h-24px text-primary-brutalist" />
            <h2 className="text-brutal-lg font-bold">FIND WHO KNOWS</h2>
          </div>
          <button
            onClick={onClose}
            className="brutal-btn-secondary p-8px"
          >
            <HiOutlineX className="w-20px h-20px" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-24px border-b-2 border-[var(--theme-border)]">
          <div className="relative">
            <HiOutlineSearch className="absolute left-16px top-50% transform -translate-y-50% w-20px h-20px text-primary-brutalist/60" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="brutal-input w-full pl-48px pr-16px py-12px text-brutal-md"
              placeholder="Search for technologies, skills, or expertise (e.g., React, Python, DevOps)..."
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-16px top-50% transform -translate-y-50% p-4px text-primary-brutalist/60 hover:text-primary-brutalist"
              >
                <HiOutlineX className="w-16px h-16px" />
              </button>
            )}
          </div>
          <div className="mt-12px font-mono text-brutal-xs text-primary-brutalist/60">
            Search by technology, programming language, framework, or skill
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1 overflow-y-auto max-h-[60vh]">
          {!searchQuery.trim() && (
            <div className="p-48px text-center">
              <HiOutlineSearch className="w-64px h-64px text-primary-brutalist/30 mx-auto mb-24px" />
              <h3 className="text-brutal-md font-bold mb-12px">SEARCH TEAM EXPERTISE</h3>
              <p className="text-brutal-sm text-primary-brutalist/60 max-w-400px mx-auto">
                Type a technology, skill, or area of expertise to find team members who have experience with it.
              </p>
              <div className="mt-24px">
                <div className="text-brutal-xs font-mono text-primary-brutalist/40 mb-8px">EXAMPLE SEARCHES:</div>
                <div className="flex flex-wrap gap-8px justify-center">
                  {['React', 'Python', 'DevOps', 'Machine Learning', 'Database Design'].map((example) => (
                    <button
                      key={example}
                      onClick={() => setSearchQuery(example)}
                      className="px-12px py-6px font-mono text-brutal-xs bg-[var(--theme-background-secondary)] border border-[var(--theme-border)] text-primary-brutalist/80 hover:bg-primary-brutalist/10 hover:text-primary-brutalist transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <div className="p-48px text-center">
              <div className="text-brutal-sm text-primary-brutalist/60">
                Type at least 2 characters to search...
              </div>
            </div>
          )}

          {isSearching && searchQuery.trim().length >= 2 && (
            <div className="p-48px text-center">
              <div className="animate-pulse text-brutal-sm text-primary-brutalist/60">
                Searching team expertise...
              </div>
            </div>
          )}

          {!isSearching && searchResults && searchQuery.trim().length >= 2 && (
            <>
              {searchResults.length === 0 ? (
                <div className="p-48px text-center">
                  <HiOutlineUser className="w-48px h-48px text-primary-brutalist/30 mx-auto mb-16px" />
                  <h3 className="text-brutal-md font-bold mb-8px">NO MATCHES FOUND</h3>
                  <p className="text-brutal-sm text-primary-brutalist/60">
                    No team members found with expertise in "{searchQuery}". Try a different search term.
                  </p>
                </div>
              ) : (
                <div className="p-24px">
                  <div className="flex items-center justify-between mb-16px">
                    <div className="font-mono text-brutal-sm text-primary-brutalist/80">
                      FOUND {searchResults.length} EXPERT{searchResults.length !== 1 ? 'S' : ''}
                    </div>
                    <div className="font-mono text-brutal-xs text-primary-brutalist/60">
                      Sorted by expertise level
                    </div>
                  </div>

                  <div className="space-y-16px">
                    {searchResults.map((result) => (
                      <div
                        key={result._id}
                        className="brutal-card p-20px hover:shadow-brutal-sm transition-all"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-16px flex-1">
                            {/* Avatar */}
                            <div className="w-48px h-48px bg-basalt-border border-2 border-[var(--theme-border)] flex items-center justify-center flex-shrink-0">
                              {result.avatarUrl ? (
                                <img 
                                  src={result.avatarUrl} 
                                  alt={result.name || 'Developer'} 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <HiOutlineUser className="w-24px h-24px text-primary-brutalist" />
                              )}
                            </div>

                            {/* Developer Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-12px mb-8px">
                                <h4 className="text-brutal-md font-bold truncate">
                                  {highlightMatch(result.name || 'UNNAMED DEVELOPER', searchQuery)}
                                </h4>
                                <DeveloperStatusIndicator 
                                  userId={result._id}
                                  size="sm"
                                  showLabel={false}
                                />
                              </div>

                              <div className="flex items-center gap-16px mb-12px text-brutal-sm text-primary-brutalist/80">
                                <span>{result.profile?.role || 'DEVELOPER'}</span>
                                {result.profile?.location && (
                                  <div className="flex items-center gap-4px">
                                    <HiOutlineLocationMarker className="w-14px h-14px" />
                                    <span>{result.profile.location}</span>
                                  </div>
                                )}
                                {result.profile?.timezone && (
                                  <div className="flex items-center gap-4px">
                                    <HiOutlineGlobeAlt className="w-14px h-14px" />
                                    <span>{result.profile.timezone}</span>
                                  </div>
                                )}
                              </div>

                              {/* Matching Technologies */}
                              {result.profile?.techStack && result.profile.techStack.length > 0 && (
                                <div className="mb-12px">
                                  <div className="font-mono text-brutal-xs font-bold mb-6px text-primary-brutalist/60">
                                    EXPERTISE MATCHES:
                                  </div>
                                  <div className="flex flex-wrap gap-6px">
                                    {result.profile.techStack
                                      .filter(tech => 
                                        tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        searchQuery.toLowerCase().includes(tech.name.toLowerCase())
                                      )
                                      .slice(0, 6)
                                      .map((tech, index) => {
                                        const expertise = getExpertiseLevel(tech.level)
                                        return (
                                          <span
                                            key={index}
                                            className={clsx(
                                              "inline-flex items-center gap-4px px-8px py-4px font-mono text-brutal-xs border-2 font-bold",
                                              expertise.color,
                                              expertise.color === 'text-brutal-success' ? 'bg-brutal-success/20 border-brutal-success' :
                                              expertise.color === 'text-brutal-info' ? 'bg-brutal-info/20 border-brutal-info' :
                                              expertise.color === 'text-brutal-warning' ? 'bg-brutal-warning/20 border-brutal-warning' :
                                              'bg-primary-brutalist/20 border-primary-brutalist'
                                            )}
                                          >
                                            {highlightMatch(tech.name, searchQuery)}
                                            <span className="text-xs">({expertise.label})</span>
                                          </span>
                                        )
                                      })}
                                  </div>
                                </div>
                              )}

                              {/* Skills */}
                              {result.profile?.skills && result.profile.skills.length > 0 && (
                                <div className="mb-12px">
                                  <div className="font-mono text-brutal-xs font-bold mb-6px text-primary-brutalist/60">
                                    SKILLS:
                                  </div>
                                  <div className="flex flex-wrap gap-6px">
                                    {result.profile.skills
                                      .filter(skill => 
                                        skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                        searchQuery.toLowerCase().includes(skill.toLowerCase())
                                      )
                                      .slice(0, 4)
                                      .map((skill, index) => (
                                        <span
                                          key={index}
                                          className="px-8px py-4px font-mono text-brutal-xs bg-primary-brutalist/10 border border-primary-brutalist/30 text-primary-brutalist"
                                        >
                                          {highlightMatch(skill, searchQuery)}
                                        </span>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {/* Current Focus */}
                              {result.profile?.currentFocus && (
                                <div className="text-brutal-xs text-primary-brutalist/60">
                                  Currently focusing on: {result.profile.currentFocus}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-8px ml-16px">
                            <button
                              onClick={() => copyContactInfo(result)}
                              className="brutal-btn-secondary p-8px"
                              title="Copy contact info"
                            >
                              <HiOutlineClipboardCopy className="w-16px h-16px" />
                            </button>
                            {result.email && (
                              <a
                                href={`mailto:${result.email}?subject=Collaboration Opportunity`}
                                className="brutal-btn p-8px"
                                title="Send email"
                              >
                                <HiOutlineChat className="w-16px h-16px" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-16px border-t-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)]">
          <div className="font-mono text-brutal-xs text-primary-brutalist/60">
            Use ESC to close • Results show team members with matching expertise
          </div>
          <button
            onClick={onClose}
            className="brutal-btn-secondary px-16px py-8px"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  )
}