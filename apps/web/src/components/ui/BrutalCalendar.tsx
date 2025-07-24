import { useState, useMemo } from 'react'
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
  className?: string
}

export default function BrutalCalendar({
  events = [],
  selectedDate,
  onDateSelect,
  onEventClick,
  view = 'month',
  className
}: BrutalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

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
    <div className={clsx("bg-carbon-plate border-2 border-basalt-border", className)}>
      {/* Calendar Header */}
      <div className="p-16px border-b-2 border-basalt-border">
        <div className="flex items-center justify-between mb-16px">
          <div className="flex items-center gap-16px">
            <button
              onClick={handlePreviousMonth}
              className="p-8px border-2 border-basalt-border bg-event-horizon hover:bg-primary-brutalist hover:text-event-horizon transition-colors"
            >
              <HiOutlineChevronLeft className="w-16px h-16px" />
            </button>
            
            <h2 className="font-mono text-brutal-lg uppercase min-w-200px text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            
            <button
              onClick={handleNextMonth}
              className="p-8px border-2 border-basalt-border bg-event-horizon hover:bg-primary-brutalist hover:text-event-horizon transition-colors"
            >
              <HiOutlineChevronRight className="w-16px h-16px" />
            </button>
          </div>
          
          <button
            onClick={handleToday}
            className="brutal-btn flex items-center gap-8px"
          >
            <HiOutlineCalendar className="w-16px h-16px" />
            TODAY
          </button>
        </div>
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b-2 border-basalt-border">
        {weekDays.map(day => (
          <div
            key={day}
            className="p-8px text-center font-mono text-brutal-xs uppercase bg-event-horizon border-r-2 border-basalt-border last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayEvents = eventsByDate.get(dateKey) || []
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isHovered = hoveredDate && isSameDay(day, hoveredDate)
          const isTodayDate = isToday(day)
          
          return (
            <div
              key={idx}
              onClick={() => onDateSelect && onDateSelect(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              className={clsx(
                "min-h-100px p-8px border-r-2 border-b-2 border-basalt-border last:border-r-0",
                "cursor-pointer transition-all duration-200",
                !isCurrentMonth && "opacity-40",
                isSelected && "bg-primary-brutalist",
                isHovered && !isSelected && "bg-event-horizon/20",
                isTodayDate && "ring-2 ring-[#00FFFF] ring-inset"
              )}
            >
              <div className={clsx(
                "font-mono text-brutal-sm mb-4px",
                isSelected && "text-event-horizon",
                isTodayDate && !isSelected && "text-[#00FFFF]"
              )}>
                {format(day, 'd')}
              </div>
              
              {/* Events */}
              <div className="space-y-2px">
                {dayEvents.slice(0, 3).map((event, eventIdx) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick && onEventClick(event)
                    }}
                    className={clsx(
                      "px-4px py-2px text-brutal-xs truncate cursor-pointer",
                      "border border-basalt-border hover:scale-105 transition-transform",
                      event.color || "bg-primary-brutalist text-event-horizon"
                    )}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-brutal-xs text-neutral-500">
                    +{dayEvents.length - 3} MORE
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}