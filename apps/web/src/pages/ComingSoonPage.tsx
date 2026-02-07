import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import WaitlistForm from '../components/landing/WaitlistForm'

export default function ComingSoonPage() {
  const stats = useQuery(api.waitlist.getWaitlistStats)
  const addToWishlist = useMutation(api.waitlist.addToWishlist)
  const [fingerprint, setFingerprint] = useState<string>('')

  useEffect(() => {
    let fp = localStorage.getItem('iceberg_fingerprint')
    if (!fp) {
      fp = crypto.randomUUID()
      localStorage.setItem('iceberg_fingerprint', fp)
    }
    setFingerprint(fp)
  }, [])

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col">
      <PublicNavigation />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-24 md:py-32">
        <div className="w-full max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="font-['Inter',sans-serif] font-extrabold text-4xl md:text-6xl tracking-tight text-[#F9FAFB] mb-4">
              We're building something special
            </h1>
            <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto">
              We are currently in private beta. Join the waitlist to get early access.
            </p>
          </div>

          {/* Stats & Graph */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Counter Card */}
            <div className="bg-[#111111] border-2 border-[#2E2E35] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6 flex flex-col justify-center items-center">
              <p className="text-sm text-[#9CA3AF] mb-2">Total Interest</p>
              <div className="text-5xl font-bold text-[#6366F1]">
                {stats ? stats.totalCount.toLocaleString() : '...'}
              </div>
              <p className="text-xs text-[#6B7280] mt-2">people waiting</p>
            </div>

            {/* Graph Card */}
            <div className="md:col-span-2 bg-[#111111] border-2 border-[#2E2E35] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6 h-[300px] flex flex-col">
              <h3 className="text-sm text-[#9CA3AF] mb-4">Waitlist Growth</h3>
              <div className="flex-1 w-full min-h-0">
                {stats && stats.graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.graphData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F23" opacity={0.5} vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickLine={{ stroke: '#1F1F23' }}
                        axisLine={{ stroke: '#1F1F23' }}
                        tickFormatter={(str) => {
                          const d = new Date(str)
                          return `${d.getDate()}/${d.getMonth() + 1}`
                        }}
                        minTickGap={30}
                      />
                      <YAxis
                        tick={{ fill: '#6B7280', fontSize: 10 }}
                        tickLine={{ stroke: '#1F1F23' }}
                        axisLine={{ stroke: '#1F1F23' }}
                        domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 100) * 100)]}
                        allowDataOverflow={true}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111111',
                          border: '1px solid #6366F1',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                        itemStyle={{ color: '#6366F1' }}
                        cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#6366F1"
                        fillOpacity={1}
                        fill="url(#colorCount)"
                        strokeWidth={2}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#6B7280] text-sm">
                    Loading data...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Waitlist + Hype */}
          <div className="flex flex-col md:flex-row gap-6 max-w-2xl mx-auto">
            {/* Waitlist Form */}
            <div className="flex-1 bg-[#111111] border-2 border-[#2E2E35] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6 hover:border-[#6366F1] transition-colors duration-300">
              <h3 className="text-sm font-semibold text-[#9CA3AF] mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                Join the waitlist
              </h3>
              <WaitlistForm source="coming_soon" />
            </div>

            {/* Hype Button */}
            <div className="md:w-1/3">
              <button
                onClick={async () => {
                  try {
                    const success = await addToWishlist({ fingerprint })
                    if (success) {
                      toast.custom(() => (
                        <div className="bg-[#111111] border border-[#10B981] rounded-lg p-4 text-[#10B981] text-sm">
                          Hype signal accepted
                        </div>
                      ), { duration: 3000 })
                    } else {
                      toast.custom(() => (
                        <div className="bg-[#111111] border border-[#6366F1] rounded-lg p-4 text-[#6366F1] text-sm">
                          Signal already recorded
                        </div>
                      ), { duration: 3000 })
                    }
                  } catch {
                    // Ignore errors for spam clicking
                  }
                }}
                className="w-full h-full min-h-[140px] bg-[#111111] border-2 border-[#2E2E35] rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.5)] p-6 flex flex-col items-center justify-center gap-4 hover:border-[#6366F1] hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-300">
                  🔥
                </span>
                <div className="text-center">
                  <div className="text-[#6366F1] font-bold text-lg">Boost</div>
                  <div className="text-[#6B7280] text-xs mt-1">Signal interest</div>
                </div>
              </button>
            </div>
          </div>

          {/* Status indicators */}
          <div className="mt-16 flex items-center justify-center gap-6 text-xs text-[#6B7280]">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              System online
            </span>
            <span className="text-[#2E2E35]">|</span>
            <span className="bg-[#6366F1]/10 text-[#6366F1] text-xs font-mono font-semibold uppercase tracking-wider px-3 py-1 rounded-md border border-[#6366F1]/20">
              Beta
            </span>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
