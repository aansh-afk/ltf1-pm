import React, { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday
} from 'date-fns'
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineCalendar
} from 'react-icons/hi'
import clsx from 'clsx'

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type?: string
  color?: string
}

interface BrutalCalendarProps {
  events?: CalendarEvent[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  view?: 'month' | 'week'
  currentDate?: Date
  className?: string
}

const EMPTY_EVENTS: CalendarEvent[] = []

export default function BrutalCalendar({
  events = EMPTY_EVENTS,
  selectedDate,
  onDateSelect,
  onEventClick,
  view = 'month',
  currentDate: providedCurrentDate,
  className
}: BrutalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(providedCurrentDate || new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)
  
  // Update currentDate when providedCurrentDate changes
  React.useEffect(() => {
    if (providedCurrentDate) {
      setCurrentDate(providedCurrentDate)
    }
  }, [providedCurrentDate])

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach(event => {
      const key = format(event.date, 'yyyy-MM-dd')
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  const days = []
  let day = startDate

  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
    if (onDateSelect) {
      onDateSelect(new Date())
    }
  }

  return (
    <div className={clsx("bg-[var(--theme-background)] border-2 border-[var(--theme-border)]", className)}>
      {/* Calendar Header */}
      <div className="p-[10px] border-b-2 border-[var(--theme-border)]">
        <div className="flex items-center justify-between mb-[8px]">
          <div className="flex items-center gap-[10px]">
            <button
              onClick={handlePreviousMonth}
              aria-label="Previous month"
              className="p-[8px] border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] transition-colors text-[var(--theme-foreground)]"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            
            <h2 aria-live="polite" className="font-mono text-[14px] font-semibold uppercase min-w-200px text-center text-[var(--theme-foreground)]">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-[8px] border-2 border-[var(--theme-border)] bg-[var(--theme-background-secondary)] hover:bg-[var(--theme-primary)] hover:text-[var(--theme-background)] transition-colors text-[var(--theme-foreground)]"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleToday}
            className="brutal-btn flex items-center gap-[8px]"
          >
            <HiOutlineCalendar className="w-4 h-4" />
            TODAY
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b-2 border-[var(--theme-border)]">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-[8px] text-center font-mono text-brutal-xs uppercase bg-[var(--theme-background-secondary)] border-r-2 border-[var(--theme-border)] last:border-r-0 text-[var(--theme-foreground)]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isHovered = hoveredDate && isSameDay(day, hoveredDate)
          const isTodayDate = isToday(day)

          return (
            <button
              type="button"
              key={dateKey}
              aria-label={format(day, 'MMMM d, yyyy')}
              aria-current={isTodayDate ? 'date' : undefined}
              aria-selected={isSelected || undefined}
              onClick={() => onDateSelect && onDateSelect(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              className={clsx(
                "min-h-100px p-[8px] border-r-2 border-b-2 border-[var(--theme-border)] last:border-r-0 bg-[var(--theme-background)]",
                "cursor-pointer transition-all duration-200 text-left",
                !isCurrentMonth && "opacity-40",
                isSelected && "bg-[var(--theme-primary)]",
                isHovered && !isSelected && "bg-[var(--theme-background-secondary)]/50",
                isTodayDate && "ring-2 ring-[var(--theme-info)] ring-inset"
              )}
            >
              <div className={clsx(
                "font-mono text-brutal-sm mb-4px",
                isSelected && "text-[var(--theme-background)]",
                isTodayDate && !isSelected && "text-[var(--theme-info)]",
                !isSelected && !isTodayDate && "text-[var(--theme-foreground)]"
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Events */}
              <div className="space-y-2px">
                {dayEvents.slice(0, 3).map((event, eventIdx) => (
                  <button
                    type="button"
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick && onEventClick(event)
                    }}
                    className={clsx(
                      "px-4px py-2px text-brutal-xs truncate cursor-pointer w-full text-left",
                      "border border-[var(--theme-border)] hover:scale-105 transition-transform",
                      event.color || "bg-[var(--theme-primary)] text-[var(--theme-background)]"
                    )}
                  >
                    {event.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-brutal-xs text-[var(--theme-foreground)]/60">
                    +{dayEvents.length - 3} MORE
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}