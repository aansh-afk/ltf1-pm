import { useState, useRef, useEffect } from "react"

const EMOJI_GROUPS = [
  {
    label: "Common",
    emojis: ["📄", "📝", "📋", "📌", "📎", "📁", "📂", "🗂️", "📊", "📈", "📉", "🔗", "💡", "🎯", "🚀", "⭐", "🔥", "💎", "🏗️", "🧩"],
  },
  {
    label: "Status",
    emojis: ["✅", "❌", "⚠️", "🔄", "⏳", "🚧", "🎉", "💪", "👀", "🤔", "📢", "🔔", "🏆", "🎖️", "🏅", "🥇", "🎗️", "🏁", "🚩", "🔖"],
  },
  {
    label: "Tech",
    emojis: ["💻", "🖥️", "⌨️", "🖱️", "🔧", "⚙️", "🛠️", "🔨", "🧪", "🔬", "📡", "🌐", "🔐", "🔑", "🛡️", "🧮", "📱", "🤖", "🧠", "⚡"],
  },
  {
    label: "People",
    emojis: ["👤", "👥", "🧑‍💻", "👩‍💻", "👨‍💻", "🧑‍🔬", "🧑‍🎨", "🧑‍🏫", "👋", "🙌", "👏", "🤝", "💬", "🗣️", "👁️", "🧑‍🤝‍🧑", "👫", "👬", "👭", "🫂"],
  },
]

interface PageIconPickerProps {
  currentIcon?: string
  onSelect: (emoji: string) => void
  onRemove: () => void
}

export default function PageIconPicker({ currentIcon, onSelect, onRemove }: PageIconPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="text-3xl hover:bg-[var(--theme-hover)] p-1 transition-colors"
        title="Change icon"
      >
        {currentIcon || "📄"}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-[#0A0A0A] border-2 border-[#2E2E35] shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-3 w-[280px]">
          {currentIcon && (
            <button
              onClick={() => { onRemove(); setOpen(false) }}
              className="w-full text-left text-[11px] font-mono text-[var(--theme-foreground)]/60 hover:text-[var(--theme-error)] mb-2 px-1 py-1 hover:bg-[var(--theme-hover)]"
            >
              REMOVE ICON
            </button>
          )}

          {EMOJI_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="text-[10px] font-mono text-[var(--theme-foreground)]/40 tracking-wider mb-1 px-1">
                {group.label.toUpperCase()}
              </p>
              <div className="grid grid-cols-10 gap-0">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); setOpen(false) }}
                    className="text-lg p-1 hover:bg-[var(--theme-hover)] transition-colors text-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
