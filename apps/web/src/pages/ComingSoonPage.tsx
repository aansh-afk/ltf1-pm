import { useEffect, useState } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion } from 'framer-motion'

export default function ComingSoonPage() {
    const stats = useQuery(api.waitlist.getWaitlistStats)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1,
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <div className="min-h-screen bg-event-horizon text-hologram-text overflow-hidden relative flex flex-col items-center justify-center p-24px">
            {/* Background Grid */}
            <div
                className="absolute inset-0 z-0 opacity-20 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(to right, var(--theme-border) 1px, transparent 1px),
            linear-gradient(to bottom, var(--theme-border) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                    transform: `translate(${mousePosition.x * 20}px, ${mousePosition.y * 20}px)`
                }}
            />

            {/* Content Container */}
            <div className="relative z-10 w-full max-w-4xl">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center mb-64px"
                >
                    <div className="inline-block border-2 border-primary-brutalist bg-primary-brutalist/10 px-16px py-4px mb-24px">
                        <span className="text-primary-brutalist font-mono font-bold tracking-widest text-sm">SYSTEM LOCKED</span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-black mb-16px tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
                        COMING SOON
                    </h1>
                    <p className="text-xl md:text-2xl text-hologram-text/60 font-mono max-w-2xl mx-auto">
                        We are currently in private beta. Join the waitlist to get early access.
                    </p>
                </motion.div>

                {/* Stats & Graph Section */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-24px"
                >
                    {/* Counter Card */}
                    <div className="bg-void-black border-2 border-theme-border p-24px flex flex-col justify-center items-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-primary-brutalist/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <h3 className="text-hologram-text/60 font-mono text-sm mb-8px z-10">TOTAL INTEREST</h3>
                        <div className="text-5xl font-bold text-primary-brutalist font-mono z-10">
                            {stats ? stats.totalCount.toLocaleString() : '...'}
                        </div>
                        <div className="text-xs text-hologram-text/40 mt-8px font-mono z-10">PEOPLE WAITING</div>
                    </div>

                    {/* Graph Card */}
                    <div className="md:col-span-2 bg-void-black border-2 border-theme-border p-24px h-[300px] relative">
                        <h3 className="text-hologram-text/60 font-mono text-sm mb-16px absolute top-24px left-24px z-10">GROWTH TRAJECTORY</h3>
                        {stats && stats.graphData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.graphData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--primary-brutalist)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--primary-brutalist)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        hide
                                    />
                                    <YAxis
                                        hide
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#000',
                                            border: '1px solid var(--theme-border)',
                                            fontFamily: 'monospace'
                                        }}
                                        itemStyle={{ color: 'var(--primary-brutalist)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="var(--primary-brutalist)"
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-hologram-text/40 font-mono text-sm">
                                INITIALIZING DATA STREAM...
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-64px text-center"
                >
                    <div className="inline-flex items-center gap-8px text-hologram-text/40 font-mono text-xs">
                        <div className="w-8px h-8px bg-brutal-success rounded-full animate-pulse" />
                        SYSTEM STATUS: ONLINE
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
