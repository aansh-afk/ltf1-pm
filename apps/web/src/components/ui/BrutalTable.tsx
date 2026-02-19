import React, { ReactNode } from 'react'
import clsx from 'clsx'

interface Column<T> {
  key: string
  header: string
  accessor: (item: T) => ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
}

interface BrutalTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  isLoading?: boolean
}

export default function BrutalTable<T extends { id?: string; _id?: string }>({
  columns,
  data,
  onRowClick,
  emptyMessage = 'NO DATA AVAILABLE',
  isLoading = false,
}: BrutalTableProps<T>) {
  const getRowKey = (item: T, index: number) => {
    return item.id || item._id || `row-${index}`
  }

  if (isLoading) {
    return (
      <div className="border-2 border-[var(--theme-border)]">
        <div className="p-[24px] text-center">
          <div className="animate-pulse text-[14px] font-semibold text-[var(--theme-foreground)]/50">
            LOADING DATA...
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="border-2 border-[var(--theme-border)]">
        <div className="p-[24px] text-center">
          <p className="text-brutal-sm text-[var(--theme-foreground)]/50">{emptyMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-[var(--theme-border)] overflow-hidden bg-[var(--theme-background)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--theme-background-secondary)] border-b-2 border-[var(--theme-border)]">
              {columns.map(column => (
                <th
                  key={column.key}
                  className={clsx(
                    'px-[10px] py-[8px] text-left text-brutal-sm font-bold text-[var(--theme-foreground)]',
                    column.width,
                    {
                      'text-left': column.align === 'left' || !column.align,
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    }
                  )}
                >
                  {column.header.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={getRowKey(item, index)}
                className={clsx(
                  'border-b border-[var(--theme-border)]/50 transition-all duration-200 text-[var(--theme-foreground)]',
                  'hover:bg-[var(--theme-background-secondary)]/50',
                  onRowClick && 'cursor-pointer hover:translate-x-2px'
                )}
                onClick={() => onRowClick?.(item)}
                {...(onRowClick ? {
                  role: 'button' as const,
                  tabIndex: 0,
                  onKeyDown: (e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onRowClick(item)
                    }
                  },
                } : {})}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={clsx(
                      'px-[10px] py-[8px] text-sm',
                      {
                        'text-left': column.align === 'left' || !column.align,
                        'text-center': column.align === 'center',
                        'text-right': column.align === 'right',
                      }
                    )}
                  >
                    {column.accessor(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}