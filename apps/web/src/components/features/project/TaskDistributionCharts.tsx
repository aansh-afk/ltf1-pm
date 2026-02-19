import React, { useState, useEffect } from 'react'
import type { Id } from '../../../../../../convex/_generated/dataModel'

type RechartsModuleType = typeof import('recharts')

function useRecharts() {
  const [mod, setMod] = useState<RechartsModuleType | null>(null)
  useEffect(() => {
    import('recharts').then(setMod)
  }, [])
  return mod
}

interface TaskDistributionChartsProps {
  tasks: {
    _id: Id<'tasks'>
    status: string
    type: string
    priority: string
    assigneeId?: Id<'users'>
  }[]
  team?: {
    _id: Id<'users'>
    name: string
  }[]
}

function CustomTooltip({ active, payload, totalTasks }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[4px]">
        <p className="text-brutal-xs font-bold">{payload[0].name}</p>
        <p className="text-brutal-xs">Count: {payload[0].value}</p>
        <p className="text-brutal-xs">
          {((payload[0].value / totalTasks) * 100).toFixed(1)}% of total
        </p>
      </div>
    )
  }
  return null
}

export default function TaskDistributionCharts({ tasks, team }: TaskDistributionChartsProps) {
  const recharts = useRecharts()

  // Status distribution
  const statusData = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'todo').length, color: 'var(--theme-foreground-tertiary)' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, color: 'var(--theme-info)' },
    { name: 'In Review', value: tasks.filter(t => t.status === 'in_review').length, color: 'var(--theme-warning)' },
    { name: 'Done', value: tasks.filter(t => t.status === 'done').length, color: 'var(--theme-success)' },
  ].filter(d => d.value > 0)
  
  // Type distribution
  const typeData = [
    { name: 'Feature', value: tasks.filter(t => t.type === 'feature').length, color: 'var(--theme-primary)' },
    { name: 'Bug', value: tasks.filter(t => t.type === 'bug').length, color: 'var(--theme-error)' },
    { name: 'Task', value: tasks.filter(t => t.type === 'task').length, color: 'var(--theme-info)' },
    { name: 'Improvement', value: tasks.filter(t => t.type === 'improvement').length, color: 'var(--theme-success)' },
    { name: 'Epic', value: tasks.filter(t => t.type === 'epic').length, color: 'var(--theme-warning)' },
  ].filter(d => d.value > 0)
  
  // Priority distribution
  const priorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'urgent').length, color: 'var(--theme-error)' },
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: 'var(--theme-warning)' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: 'var(--theme-info)' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: 'var(--theme-foreground-tertiary)' },
  ].filter(d => d.value > 0)
  
  // Team workload
  const workloadData = team?.map(member => ({
    name: member.name.split(' ')[0], // First name only for space
    tasks: tasks.filter(t => t.assigneeId === member._id).length,
    completed: tasks.filter(t => t.assigneeId === member._id && t.status === 'done').length,
    inProgress: tasks.filter(t => t.assigneeId === member._id && t.status === 'in_progress').length,
  })).sort((a, b) => b.tasks - a.tasks) || []
  
  // Custom label for pie charts
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180)
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180)
    
    if (percent < 0.05) return null // Don't show label for small slices
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="var(--theme-background)" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    )
  }
  
  if (!recharts) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-brutal-xs font-mono text-[var(--theme-foreground-secondary)]">
        Loading charts...
      </div>
    )
  }

  return (
    <div className="space-y-[12px]">
      {/* Distribution Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px]">
        {/* Status Distribution */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">Task Status</h3>
          <recharts.ResponsiveContainer width="100%" height={200}>
            <recharts.PieChart>
              <recharts.Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry) => (
                  <recharts.Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </recharts.Pie>
              <recharts.Tooltip content={<CustomTooltip totalTasks={tasks.length} />} />
            </recharts.PieChart>
          </recharts.ResponsiveContainer>
          <div className="mt-[4px] space-y-4px">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-brutal-xs">
                <div className="flex items-center gap-4px">
                  <div className="w-8px h-8px" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">Priority</h3>
          <recharts.ResponsiveContainer width="100%" height={200}>
            <recharts.PieChart>
              <recharts.Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {priorityData.map((entry) => (
                  <recharts.Cell key={`cell-${entry.name}`} fill={entry.color} />
                ))}
              </recharts.Pie>
              <recharts.Tooltip content={<CustomTooltip totalTasks={tasks.length} />} />
            </recharts.PieChart>
          </recharts.ResponsiveContainer>
          <div className="mt-[4px] space-y-4px">
            {priorityData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-brutal-xs">
                <div className="flex items-center gap-4px">
                  <div className="w-8px h-8px" style={{ backgroundColor: item.color }} />
                  <span>{item.name}</span>
                </div>
                <span className="font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Workload Bar Chart */}
      {workloadData.length > 0 && (
        <div className="bg-[var(--theme-background)] border-2 border-[var(--theme-border)] p-[10px]">
          <h3 className="text-brutal-sm font-bold uppercase mb-[6px]">Team Workload</h3>
          <recharts.ResponsiveContainer width="100%" height={200}>
            <recharts.BarChart data={workloadData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <recharts.CartesianGrid strokeDasharray="0" stroke="var(--theme-border)" strokeOpacity={0.3} />
              <recharts.XAxis
                dataKey="name"
                stroke="var(--theme-foreground-secondary)"
                tick={{ fontSize: 10 }}
              />
              <recharts.YAxis
                stroke="var(--theme-foreground-secondary)"
                tick={{ fontSize: 10 }}
              />
              <recharts.Tooltip
                contentStyle={{
                  backgroundColor: 'var(--theme-background)',
                  border: '2px solid var(--theme-border)',
                  borderRadius: 0,
                }}
                labelStyle={{ fontSize: 12, fontWeight: 'bold' }}
              />
              <recharts.Bar dataKey="completed" stackId="a" fill="var(--theme-success)" name="Completed" />
              <recharts.Bar dataKey="inProgress" stackId="a" fill="var(--theme-info)" name="In Progress" />
              <recharts.Bar
                dataKey="tasks"
                fill="transparent"
                stroke="var(--theme-border)"
                strokeWidth={2}
                strokeDasharray="3 3"
                name="Total Assigned"
              />
            </recharts.BarChart>
          </recharts.ResponsiveContainer>
        </div>
      )}
    </div>
  )
}