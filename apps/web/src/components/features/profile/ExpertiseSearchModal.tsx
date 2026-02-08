import { useState, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../../../convex/_generated/api'
import type { Id } from '../../../../../../convex/_generated/dataModel'
import {
  HiOutlineX,
  HiOutlineSearch,
  HiOutlineUser,
  HiOutlineLocationMarker,
  HiOutlineGlobeAlt,
  HiOutlineChat,
  HiOutlineClipboardCopy,
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

  const searchResults = useQuery(
    api.developers.queries.searchDevelopers,
    searchQuery.trim().length >= 2 ? {
      query: searchQuery.trim(),
      limit: 20
    } : 'skip'
  )

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

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
    if (level >= 8) return { label: 'EXPERT', color: 'text-[#22C55E]', bg: 'bg-[#22C55E]/15 border-[#22C55E]/40' }
    if (level >= 6) return { label: 'ADVANCED', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/15 border-[#06B6D4]/40' }
    if (level >= 4) return { label: 'INTER', color: 'text-[#F59E0B]', bg: 'bg-[#F59E0B]/15 border-[#F59E0B]/40' }
    return { label: 'BASIC', color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/15 border-[#6366F1]/40' }
  }

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    const regex = new RegExp(`(${query.trim()})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="bg-[#6366F1]/30 font-bold">{part}</span>
      ) : part
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-[#050505]/80 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[8px_8px_0px_#000000] w-full max-w-2xl max-h-[75vh] flex flex-col overflow-hidden">
        {/* Search bar — the focal point */}
        <div className="flex items-center gap-2 px-3 py-2.5 border-b-2 border-[#2E2E35]">
          <HiOutlineSearch className="w-4 h-4 text-[#6366F1] shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none font-mono"
            placeholder="Search expertise... (React, Python, DevOps)"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-0.5 text-[#6B7280] hover:text-[#F9FAFB] transition-colors"
            >
              <HiOutlineX className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="ml-1 px-1.5 py-0.5 text-[10px] font-mono text-[#6B7280] border border-[#2E2E35] hover:text-[#F9FAFB] hover:border-[#6366F1] transition-colors"
          >
            ESC
          </button>
        </div>

        {/* Results area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Empty state */}
          {!searchQuery.trim() && (
            <div className="px-3 py-6 text-center">
              <p className="font-mono text-xs text-[#6B7280] mb-3">
                FIND TEAM MEMBERS BY SKILL OR TECHNOLOGY
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {['React', 'Python', 'DevOps', 'Machine Learning', 'Database Design'].map((example) => (
                  <button
                    key={example}
                    onClick={() => setSearchQuery(example)}
                    className="px-2 py-1 font-mono text-[10px] uppercase bg-[#111111] border border-[#2E2E35] text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#F9FAFB] transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Min chars hint */}
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <div className="px-3 py-4 text-center">
              <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider">
                Type at least 2 characters...
              </span>
            </div>
          )}

          {/* Searching indicator */}
          {isSearching && searchQuery.trim().length >= 2 && (
            <div className="px-3 py-4 text-center">
              <span className="font-mono text-[10px] text-[#6B7280] uppercase tracking-wider animate-pulse">
                Searching...
              </span>
            </div>
          )}

          {/* Results */}
          {!isSearching && searchResults && searchQuery.trim().length >= 2 && (
            <>
              {searchResults.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <HiOutlineUser className="w-5 h-5 text-[#2E2E35] mx-auto mb-2" />
                  <p className="font-mono text-xs text-[#6B7280]">
                    No matches for "{searchQuery}"
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#6B7280] border-b border-[#1F1F23] bg-[#111111]">
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                  </div>

                  {searchResults.map((result) => (
                    <div
                      key={result._id}
                      className="px-3 py-2.5 border-b border-[#1F1F23] hover:bg-[#111111] transition-colors group"
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Avatar */}
                        <div className="w-7 h-7 bg-[#111111] border border-[#2E2E35] flex items-center justify-center shrink-0 mt-0.5">
                          {result.avatarUrl ? (
                            <img
                              src={result.avatarUrl}
                              alt={result.name || ''}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <HiOutlineUser className="w-3.5 h-3.5 text-[#6B7280]" />
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          {/* Name + status + role */}
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[#F9FAFB] truncate">
                              {highlightMatch(result.name || 'Unknown', searchQuery)}
                            </span>
                            <DeveloperStatusIndicator
                              userId={result._id}
                              size="sm"
                              showLabel={false}
                            />
                            <span className="font-mono text-[10px] text-[#6B7280] uppercase shrink-0">
                              {result.profile?.role || 'DEV'}
                            </span>
                          </div>

                          {/* Location / timezone */}
                          {(result.profile?.location || result.profile?.timezone) && (
                            <div className="flex items-center gap-3 mb-1.5 text-[10px] font-mono text-[#6B7280]">
                              {result.profile?.location && (
                                <span className="flex items-center gap-0.5">
                                  <HiOutlineLocationMarker className="w-2.5 h-2.5" />
                                  {result.profile.location}
                                </span>
                              )}
                              {result.profile?.timezone && (
                                <span className="flex items-center gap-0.5">
                                  <HiOutlineGlobeAlt className="w-2.5 h-2.5" />
                                  {result.profile.timezone}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Matching tech stack */}
                          {result.profile?.techStack && result.profile.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-1">
                              {result.profile.techStack
                                .filter((tech: any) =>
                                  tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  searchQuery.toLowerCase().includes(tech.name.toLowerCase())
                                )
                                .slice(0, 5)
                                .map((tech: any, index: number) => {
                                  const expertise = getExpertiseLevel(tech.level)
                                  return (
                                    <span
                                      key={index}
                                      className={clsx(
                                        "inline-flex items-center gap-1 px-1.5 py-px font-mono text-[10px] font-bold border",
                                        expertise.color,
                                        expertise.bg
                                      )}
                                    >
                                      {highlightMatch(tech.name, searchQuery)}
                                      <span className="text-[9px] opacity-70">{expertise.label}</span>
                                    </span>
                                  )
                                })}
                            </div>
                          )}

                          {/* Skills */}
                          {result.profile?.skills && result.profile.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {result.profile.skills
                                .filter((skill: string) =>
                                  skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  searchQuery.toLowerCase().includes(skill.toLowerCase())
                                )
                                .slice(0, 4)
                                .map((skill: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-1 py-px font-mono text-[9px] uppercase text-[#9CA3AF] bg-[#111111] border border-[#2E2E35]"
                                  >
                                    {highlightMatch(skill, searchQuery)}
                                  </span>
                                ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); copyContactInfo(result) }}
                            className="p-1 text-[#6B7280] hover:text-[#F9FAFB] hover:bg-[#111111] border border-transparent hover:border-[#2E2E35] transition-colors"
                            title="Copy contact info"
                          >
                            <HiOutlineClipboardCopy className="w-3.5 h-3.5" />
                          </button>
                          {result.email && (
                            <a
                              href={`mailto:${result.email}?subject=Collaboration Opportunity`}
                              className="p-1 text-[#6B7280] hover:text-[#6366F1] hover:bg-[#111111] border border-transparent hover:border-[#6366F1]/40 transition-colors"
                              title="Send email"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <HiOutlineChat className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
