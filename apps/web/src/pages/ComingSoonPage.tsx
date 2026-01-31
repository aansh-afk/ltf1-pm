import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'
import PublicNavigation from '../components/common/PublicNavigation'
import Footer from '../components/common/Footer'
import WaitlistForm from '../components/landing/WaitlistForm'

export default function ComingSoonPage() {
    const stats = useQuery(api.waitlist.getWaitlistStats)
    const addToWishlist = useMutation(api.waitlist.addToWishlist)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [fingerprint, setFingerprint] = useState<string>("")

    useEffect(() => {
        let fp = localStorage.getItem('iceberg_fingerprint')
        if (!fp) {
            fp = crypto.randomUUID()
            localStorage.setItem('iceberg_fingerprint', fp)
        }
        setFingerprint(fp)
    }, [])

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
        <div className="min-h-screen bg-event-horizon flex flex-col">
            <PublicNavigation />

            <div className="flex-1 flex flex-col items-center justify-center p-24px relative overflow-hidden">
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
                        className="text-center mb-64px"
                    >
                        <div className="inline-block border-2 border-brutal-info bg-brutal-info/10 px-16px py-4px mb-24px">
                            <span className="text-brutal-info font-mono font-bold tracking-widest text-sm">SYSTEM LOCKED</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black mb-16px tracking-tighter text-cathode-white">
                            COMING SOON
                        </h1>
                        <p className="text-xl md:text-2xl text-cathode-white/60 font-mono max-w-2xl mx-auto">
                            We are currently in private beta. Join the waitlist to get early access.
                        </p>
                    </motion.div>

                    {/* Stats & Graph Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-24px"
                    >
                        {/* Counter Card */}
                        <div className="bg-carbon-plate border-2 border-basalt-border p-24px flex flex-col justify-center items-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-brutal-info/5 opacity-0 group-hover:opacity-100" />
                            <h3 className="text-cathode-white/60 font-mono text-sm mb-8px z-10">TOTAL INTEREST</h3>
                            <div className="text-5xl font-bold text-brutal-info font-mono z-10">
                                {stats ? stats.totalCount.toLocaleString() : '...'}
                            </div>
                            <div className="text-xs text-cathode-white/40 mt-8px font-mono z-10">PEOPLE WAITING</div>
                        </div>

                        {/* Graph Card */}
                        <div className="md:col-span-2 bg-carbon-plate border-2 border-basalt-border p-24px h-[300px] flex flex-col relative">
                            <h3 className="text-cathode-white/60 font-mono text-sm mb-16px z-10">GROWTH TRAJECTORY</h3>
                            <div className="flex-1 w-full min-h-0">
                                {stats && stats.graphData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.graphData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                            <defs>
                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--brutal-info)" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="var(--brutal-info)" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.2} vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                tick={{ fill: 'var(--cathode-white)', opacity: 0.5, fontSize: 10, fontFamily: 'monospace' }}
                                                tickLine={{ stroke: 'var(--theme-border)' }}
                                                axisLine={{ stroke: 'var(--theme-border)' }}
                                                tickFormatter={(str) => {
                                                    const d = new Date(str);
                                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                                }}
                                                minTickGap={30}
                                            />
                                            <YAxis
                                                tick={{ fill: 'var(--cathode-white)', opacity: 0.5, fontSize: 10, fontFamily: 'monospace' }}
                                                tickLine={{ stroke: 'var(--theme-border)' }}
                                                axisLine={{ stroke: 'var(--theme-border)' }}
                                                domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 100) * 100)]}
                                                allowDataOverflow={true}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'var(--event-horizon)',
                                                    border: '1px solid var(--brutal-info)',
                                                    fontFamily: 'monospace',
                                                    fontSize: '12px',
                                                    textTransform: 'uppercase'
                                                }}
                                                itemStyle={{ color: 'var(--brutal-info)' }}
                                                cursor={{ stroke: 'var(--brutal-info)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area
                                                type="stepAfter"
                                                dataKey="count"
                                                stroke="var(--brutal-info)"
                                                fillOpacity={1}
                                                fill="url(#colorCount)"
                                                strokeWidth={2}
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-cathode-white/40 font-mono text-sm">
                                        INITIALIZING DATA STREAM...
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Section: Waitlist + Hype */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-48px w-full max-w-2xl mx-auto flex flex-col md:flex-row gap-8px"
                    >
                        {/* Waitlist Form */}
                        <div className="flex-1 bg-carbon-plate border-2 border-basalt-border p-24px hover:border-brutal-info">
                            <h3 className="text-cathode-white/80 font-mono text-xs mb-16px uppercase tracking-wider flex items-center gap-2">
                                <span className="w-2 h-2 bg-brutal-info animate-pulse" />
                                JOIN THE WAITLIST
                            </h3>
                            <WaitlistForm source="coming_soon" />
                        </div>

                        {/* Wishlist / Hype Button */}
                        <div className="md:w-1/3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={async () => {
                                    try {
                                        const success = await addToWishlist({ fingerprint });
                                        if (success) {
                                            toast.custom(() => (
                                                <div className="bg-event-horizon border-2 border-brutal-success p-4 font-mono text-brutal-success uppercase text-sm">
                                                    HYPE SIGNAL ACCEPTED
                                                </div>
                                            ), { duration: 3000 });
                                        } else {
                                            toast.custom(() => (
                                                <div className="bg-event-horizon border-2 border-brutal-warning p-4 font-mono text-brutal-warning uppercase text-sm">
                                                    ENTHUSIASM APPRECIATED, BUT SIGNAL ALREADY RECORDED.
                                                </div>
                                            ), { duration: 3000 });
                                        }
                                    } catch {
                                        // Ignore errors for spam clicking
                                    }
                                }}
                                className="w-full h-full min-h-[140px] bg-carbon-plate border-2 border-basalt-border hover:border-brutal-warning p-24px flex flex-col items-center justify-center gap-16px group"
                            >
                                <div className="relative">
                                    <span className="text-4xl filter grayscale group-hover:grayscale-0">🔥</span>
                                </div>
                                <div className="text-center">
                                    <div className="text-brutal-warning font-mono font-bold text-lg uppercase tracking-widest">BOOST</div>
                                    <div className="text-cathode-white/40 text-xs font-mono mt-4px">SIGNAL INTEREST</div>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Subtle status indicator */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="mt-64px flex items-center justify-center gap-24px text-xs text-cathode-white/30 uppercase tracking-wider font-mono"
                    >
                        <span className="flex items-center gap-6px">
                            <span className="w-6px h-6px bg-brutal-success animate-pulse" />
                            SYSTEM: ONLINE
                        </span>
                        <span className="text-basalt-border">|</span>
                        <span>BUILD: PASSING</span>
                        <span className="text-basalt-border">|</span>
                        <span>BETA: ACTIVE</span>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
