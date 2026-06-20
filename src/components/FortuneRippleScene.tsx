import { motion } from "framer-motion";

interface Props {
  /** false = 水面呼吸；true = 落瓣入水 + 涟漪 */
  shaking?: boolean;
}

const RIPPLE_RINGS = [0, 1, 2];

function PetalShape({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 36" width="22" height="33" className={className} aria-hidden>
      <defs>
        <linearGradient id="petalFill" x1="12" y1="0" x2="12" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0E8E0" />
          <stop offset="55%" stopColor="#E2D5C8" />
          <stop offset="100%" stopColor="#C9B8A8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path
        d="M12 2 C18 6 20 14 12 34 C4 14 6 6 12 2 Z"
        fill="url(#petalFill)"
        stroke="#D4C4BC"
        strokeWidth="0.6"
        opacity="0.92"
      />
      <path d="M12 6 V28" stroke="#F5EDE6" strokeWidth="0.5" opacity="0.35" />
    </svg>
  );
}

/** 涟漪 + 落瓣 — 求签 idle / drawing 视觉 */
export default function FortuneRippleScene({ shaking = false }: Props) {
  return (
    <div className="relative mx-auto mb-8 flex h-[260px] w-[240px] items-center justify-center">
      {/* 水面环境光 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 55%, rgba(122, 155, 168, 0.16) 0%, rgba(168, 196, 188, 0.07) 38%, transparent 68%)",
        }}
      />

      <div className="relative flex h-[200px] w-[200px] items-center justify-center">
        {/* 静水面 */}
        <div
          className="absolute h-[132px] w-[132px] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 45% 38%, rgba(240, 237, 230, 0.1) 0%, rgba(122, 155, 168, 0.08) 45%, rgba(30, 35, 38, 0.35) 100%)",
            boxShadow: "inset 0 0 40px rgba(122, 155, 168, 0.12), 0 0 60px rgba(122, 155, 168, 0.08)",
          }}
        />
        <div className="absolute h-[132px] w-[132px] rounded-full border border-[#7A9BA8]/20" />

        {/* 待机：呼吸涟漪 */}
        {!shaking &&
          RIPPLE_RINGS.map((i) => (
            <motion.div
              key={`idle-${i}`}
              className="absolute rounded-full border border-[#A8C4BC]/35"
              style={{ width: 56, height: 56, marginLeft: -28, marginTop: -28, left: "50%", top: "50%" }}
              animate={{ scale: [0.55, 2.1], opacity: [0.45, 0] }}
              transition={{
                duration: 4.2,
                repeat: Infinity,
                delay: i * 1.35,
                ease: "easeOut",
              }}
            />
          ))}

        {/* 求签：落瓣激起更快涟漪 */}
        {shaking &&
          RIPPLE_RINGS.map((i) => (
            <motion.div
              key={`draw-${i}`}
              className="absolute rounded-full border border-[#A8C4BC]/50"
              style={{ width: 56, height: 56, marginLeft: -28, marginTop: -28, left: "50%", top: "50%" }}
              initial={{ scale: 0.4, opacity: 0.7 }}
              animate={{ scale: [0.4, 2.4], opacity: [0.65, 0] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                delay: i * 0.35,
                ease: "easeOut",
              }}
            />
          ))}

        {/* 水面中心光点 */}
        <motion.div
          className="absolute h-2.5 w-2.5 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, #F0EDE6 0%, #C9A874 55%, transparent 100%)",
          }}
          animate={
            shaking
              ? { scale: [1, 1.8, 1.2], opacity: [0.5, 1, 0.7] }
              : { scale: [1, 1.15, 1], opacity: [0.45, 0.75, 0.45] }
          }
          transition={
            shaking
              ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" }
              : { duration: 3.5, repeat: Infinity, ease: "easeInOut" }
          }
        />

        {/* 待机：瓣在水面上方轻飘 */}
        {!shaking && (
          <motion.div
            className="absolute left-1/2 top-[18%] -translate-x-1/2"
            animate={{ y: [0, -6, 0], x: [0, 5, -4, 0], rotate: [-8, 4, -6, -8] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <PetalShape className="opacity-80 drop-shadow-[0_4px_12px_rgba(0,0,0,0.25)]" />
          </motion.div>
        )}

        {/* 求签：瓣落入水中 */}
        {shaking && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2"
            initial={{ y: -72, x: 8, rotate: -18, opacity: 0.95 }}
            animate={{ y: -4, x: 0, rotate: 8, opacity: 0, scale: [1, 0.85, 0.5] }}
            transition={{ duration: 0.95, ease: [0.33, 0, 0.2, 1] }}
          >
            <PetalShape />
          </motion.div>
        )}

        {/* 落点柔光 — 求签时 */}
        {shaking && (
          <motion.div
            className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(201, 168, 124, 0.35) 0%, transparent 70%)",
            }}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 1.4, 1], opacity: [0, 0.8, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
        )}
      </div>

      <p className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.35em] text-muted-foreground/65 pl-[0.35em] font-light">
        {shaking ? "心定则签现" : "静水"}
      </p>
    </div>
  );
}
