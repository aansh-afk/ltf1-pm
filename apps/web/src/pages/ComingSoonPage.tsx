import { useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { toast } from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { motion } from 'framer-motion'

export default function ComingSoonPage() {
    const stats = useQuery(api.waitlist.getWaitlistStats)
    const subscribe = useMutation(api.waitlist.subscribeToNewsletter)
    const addToWishlist = useMutation(api.waitlist.addToWishlist)
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const [fingerprint, setFingerprint] = useState<string>("")

    useEffect(() => {
        // Generate or retrieve persistent fingerprint
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
                    <div className="md:col-span-2 bg-void-black border-2 border-theme-border p-24px h-[300px] flex flex-col relative">
                        <h3 className="text-hologram-text/60 font-mono text-sm mb-16px z-10">GROWTH TRAJECTORY</h3>
                        <div className="flex-1 w-full min-h-0">
                            {stats && stats.graphData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.graphData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--primary-brutalist)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--primary-brutalist)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" opacity={0.2} vertical={false} />
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fill: 'var(--hologram-text)', opacity: 0.5, fontSize: 10, fontFamily: 'monospace' }}
                                            tickLine={{ stroke: 'var(--theme-border)' }}
                                            axisLine={{ stroke: 'var(--theme-border)' }}
                                            tickFormatter={(str) => {
                                                const d = new Date(str);
                                                return `${d.getDate()}/${d.getMonth() + 1}`;
                                            }}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            tick={{ fill: 'var(--hologram-text)', opacity: 0.5, fontSize: 10, fontFamily: 'monospace' }}
                                            tickLine={{ stroke: 'var(--theme-border)' }}
                                            axisLine={{ stroke: 'var(--theme-border)' }}
                                            domain={[0, (dataMax: number) => Math.max(100, Math.ceil(dataMax / 100) * 100)]}
                                            allowDataOverflow={true}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#000',
                                                border: '1px solid var(--primary-brutalist)',
                                                fontFamily: 'monospace',
                                                fontSize: '12px',
                                                textTransform: 'uppercase'
                                            }}
                                            itemStyle={{ color: 'var(--primary-brutalist)' }}
                                            cursor={{ stroke: 'var(--primary-brutalist)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="stepAfter"
                                            dataKey="count"
                                            stroke="var(--primary-brutalist)"
                                            fillOpacity={1}
                                            fill="url(#colorCount)"
                                            strokeWidth={2}
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-hologram-text/40 font-mono text-sm">
                                    INITIALIZING DATA STREAM...
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Action Sector: Newsletter + Wishlist */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mt-48px w-full max-w-2xl mx-auto flex flex-col md:flex-row gap-8px"
                >
                    {/* Newsletter - Main Block */}
                    <div className="flex-1 bg-void-black border-2 border-theme-border p-24px hover:border-brutal-success transition-colors duration-300 group">
                        <h3 className="text-hologram-text/80 font-mono text-xs mb-16px uppercase tracking-wider flex items-center gap-2">
                            <span className="w-2 h-2 bg-brutal-success rounded-none animate-pulse"></span>
                            Join the Resistance
                        </h3>
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const email = (form.elements.namedItem('email') as HTMLInputElement).value;
                                if (!email) return;

                                try {
                                    await subscribe({ email, source: 'coming_soon' });
                                    toast.success("TRANSMISSION RECEIVED. WELCOME ABOARD.");
                                    form.reset();
                                } catch (err) {
                                    toast.error("SIGNAL INTERFERENCE. PLEASE RETRY.");
                                    console.error(err);
                                }
                            }} // Close onSubmit
                            className="flex flex-col gap-12px"
                        >
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-hologram-text/40 font-mono text-sm">{'>'}</span>
                                </div>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="ENTER_EMAIL_ADDRESS"
                                    required
                                    className="w-full bg-black/50 border border-theme-border pl-10 pr-4 py-3 text-hologram-text font-mono placeholder-hologram-text/20 focus:border-brutal-success focus:outline-none focus:ring-1 focus:ring-brutal-success/50 uppercase text-sm transition-all"
                                />
                            </div>
                            <button
                                type="submit"
                                className="relative overflow-hidden bg-hologram-text/10 border border-hologram-text/20 text-hologram-text font-bold font-mono px-6 py-3 uppercase hover:bg-brutal-success hover:text-black hover:border-brutal-success transition-all duration-200 tracking-widest text-sm flex items-center justify-center gap-2 group-hover:shadow-[0_0_15px_rgba(0,255,100,0.3)]"
                            >
                                <span>Initialize</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                            </button>
                        </form>
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
                                        toast.custom((t) => (
                                            <div className="bg-void-black border-2 border-brutal-success p-4 font-mono text-brutal-success uppercase text-sm shadow-[0_0_20px_rgba(0,255,100,0.5)]">
                                                HYPE SIGNAL ACCEPTED
                                            </div>
                                        ), { duration: 3000 });
                                    } else {
                                        toast.custom((t) => (
                                            <div className="bg-void-black border-2 border-brutal-warning p-4 font-mono text-brutal-warning uppercase text-sm shadow-[0_0_20px_rgba(255,165,0,0.5)]">
                                                ENTHUSIASM APPRECIATED, BUT SIGNAL ALREADY RECORDED.
                                            </div>
                                        ), { duration: 3000 });
                                    }
                                } catch (err) {
                                    // Ignore errors for spam clicking
                                }
                            }}
                            className="w-full h-full min-h-[140px] bg-void-black border-2 border-theme-border hover:border-brutal-warning p-6 flex flex-col items-center justify-center gap-4 group transition-colors duration-300"
                        >
                            <div className="relative">
                                <span className="text-4xl filter grayscale group-hover:grayscale-0 transition-all duration-300">🔥</span>
                                <div className="absolute -inset-4 bg-brutal-warning/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full"></div>
                            </div>
                            <div className="text-center">
                                <div className="text-brutal-warning font-mono font-bold text-lg uppercase tracking-widest">Boost</div>
                                <div className="text-hologram-text/40 text-xs font-mono mt-1">SIGNAL INTEREST</div>
                            </div>
                        </motion.button>
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
