import { motion } from "framer-motion";

interface Props {
  /** false = 水面呼吸；true = 落瓣入水 + 涟漪 */
  shaking?: boolean;
}

/* ============================================================
 * 折扇求签视觉
 * 待机：半开折扇轻轻呼吸，扇面散落几朵梅花
 * 抽签：花瓣脱离扇面、各自飘落旋转，下方浮现"心定则签现"
 * ========================================================== */

const FAN_BLADES = [-70, -56, -42, -28, -14, 0, 14, 28, 42, 56, 70];

// 扇面上预置的梅花位置（相对扇面 SVG viewBox 240×160）
const STATIC_BLOSSOMS: Array<{ x: number; y: number; r: number; tilt: number }> = [
  { x: 70, y: 78, r: 7, tilt: -14 },
  { x: 120, y: 60, r: 8, tilt: 6 },
  { x: 168, y: 82, r: 7, tilt: 18 },
  { x: 96, y: 96, r: 5, tilt: 28 },
  { x: 146, y: 100, r: 5, tilt: -22 },
];

// 抽签时飘落的花瓣（随机分布、各自参数）
const FALLING_PETALS: Array<{
  startX: number;
  driftX: number;
  rot: number;
  delay: number;
  duration: number;
  hue: string;
}> = [
  { startX: -70, driftX: -38, rot: 280, delay: 0.0, duration: 2.8, hue: "#f4c4c4" },
  { startX: -45, driftX: 20, rot: -200, delay: 0.15, duration: 3.2, hue: "#e8a4a4" },
  { startX: -20, driftX: -25, rot: 360, delay: 0.3, duration: 2.6, hue: "#f0b8b8" },
  { startX: 5, driftX: 45, rot: -320, delay: 0.45, duration: 3.0, hue: "#e8a4a4" },
  { startX: 30, driftX: -15, rot: 240, delay: 0.6, duration: 2.9, hue: "#f4c4c4" },
  { startX: 55, driftX: 35, rot: -280, delay: 0.75, duration: 3.3, hue: "#eba8a8" },
  { startX: -55, driftX: 30, rot: 200, delay: 0.9, duration: 2.7, hue: "#f0b8b8" },
  { startX: 0, driftX: -40, rot: -360, delay: 1.05, duration: 3.1, hue: "#e8a4a4" },
  { startX: 40, driftX: 22, rot: 320, delay: 1.2, duration: 2.8, hue: "#f4c4c4" },
  { startX: -30, driftX: 50, rot: -240, delay: 1.35, duration: 3.0, hue: "#eba8a8" },
  { startX: 65, driftX: -28, rot: 300, delay: 1.5, duration: 2.9, hue: "#f0b8b8" },
  { startX: -10, driftX: 18, rot: -260, delay: 1.65, duration: 3.2, hue: "#e8a4a4" },
];

/** 单朵梅花（5 瓣 + 蕊心） */
function Blossom({ r, color = "#e8a4a4" }: { r: number; color?: string }) {
  const petals = [0, 72, 144, 216, 288];
  return (
    <g>
      {petals.map((deg) => (
        <ellipse
          key={deg}
          cx={0}
          cy={-r * 0.55}
          rx={r * 0.55}
          ry={r * 0.8}
          fill={color}
          stroke="#b04040"
          strokeWidth={0.25}
          opacity={0.92}
          transform={`rotate(${deg})`}
        />
      ))}
      <circle cx={0} cy={0} r={r * 0.22} fill="#d4af37" />
    </g>
  );
}

/** 飘落的单瓣花瓣 */
function FallingPetal({ color }: { color: string }) {
  return (
    <svg width="14" height="20" viewBox="-7 -10 14 20" aria-hidden>
      <ellipse cx={0} cy={0} rx={5} ry={9} fill={color} stroke="#a83838" strokeWidth={0.3} opacity={0.92} />
    </svg>
  );
}

/** 折扇 SVG */
function FoldingFan() {
  return (
    <svg
      viewBox="-130 -20 260 200"
      width="240"
      height="180"
      aria-hidden
      style={{ overflow: "visible" }}
    >
      <defs>
        <linearGradient id="fanPaper" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8efd8" />
          <stop offset="55%" stopColor="#ecdcb8" />
          <stop offset="100%" stopColor="#d8c498" />
        </linearGradient>
        <linearGradient id="fanBlade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4af37" />
          <stop offset="60%" stopColor="#6b4423" />
          <stop offset="100%" stopColor="#3a2418" />
        </linearGradient>
        <radialGradient id="fanGlow" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="rgba(212, 175, 55, 0.35)" />
          <stop offset="60%" stopColor="rgba(212, 175, 55, 0.05)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      {/* 扇面 — 用扇形 path（弧形开角约 160°） */}
      <path
        d="M -118 140
           A 140 140 0 0 1 118 140
           L 38 152
           A 42 42 0 0 0 -38 152
           Z"
        fill="url(#fanPaper)"
        stroke="#a8895a"
        strokeWidth={0.8}
        opacity={0.96}
      />

      {/* 扇面外缘描金 */}
      <path
        d="M -118 140 A 140 140 0 0 1 118 140"
        fill="none"
        stroke="#d4af37"
        strokeWidth={1.2}
        opacity={0.7}
      />

      {/* 扇骨 */}
      {FAN_BLADES.map((deg) => (
        <line
          key={deg}
          x1={0}
          y1={155}
          x2={Math.sin((deg * Math.PI) / 180) * 138}
          y2={155 - Math.cos((deg * Math.PI) / 180) * 138}
          stroke="url(#fanBlade)"
          strokeWidth={1.4}
          opacity={0.55}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** 求签 — 折扇 + 花瓣飘落视觉 */
export default function FortuneRippleScene({ shaking = false }: Props) {
  return (
    <div className="relative mx-auto mb-8 flex h-[260px] w-[260px] items-center justify-center">
      {/* 环境光 */}
      <div
        className="pointer-events-none absolute inset-0 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle at 50% 60%, rgba(212, 175, 55, 0.14) 0%, rgba(176, 64, 64, 0.06) 38%, transparent 68%)",
        }}
      />

      {/* 折扇主体（待机微摆 / 抽签淡出微合） */}
      <motion.div
        className="absolute left-1/2 bottom-[26px] -translate-x-1/2"
        style={{ transformOrigin: "50% 100%" }}
        animate={
          shaking
            ? { rotate: 0, scale: 0.96, opacity: 0.35 }
            : { rotate: [-1.6, 1.6, -1.6], scale: 1, opacity: 1 }
        }
        transition={
          shaking
            ? { duration: 0.9, ease: "easeOut" }
            : { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <div className="relative">
          <FoldingFan />

          {/* 扇面上的梅花（与扇面同坐标系叠加） */}
          <svg
            viewBox="-130 -20 260 200"
            width="240"
            height="180"
            className="pointer-events-none absolute inset-0"
            style={{ overflow: "visible" }}
            aria-hidden
          >
            {STATIC_BLOSSOMS.map((b, i) => {
              // 把矩形坐标映射到扇面弧内：cx 沿水平、cy 由上至下
              const cx = (b.x - 120) * 0.9;
              const cy = b.y - 20 + 30;
              return (
                <motion.g
                  key={i}
                  transform={`translate(${cx} ${cy}) rotate(${b.tilt})`}
                  animate={shaking ? { opacity: 0 } : { opacity: 1 }}
                  transition={{ duration: 0.6, delay: shaking ? i * 0.05 : 0 }}
                >
                  <Blossom r={b.r} color={i % 2 === 0 ? "#e8a4a4" : "#f4c4c4"} />
                </motion.g>
              );
            })}
          </svg>
        </div>
      </motion.div>

      {/* 抽签：花瓣飘落 */}
      {shaking && (
        <div className="pointer-events-none absolute inset-0">
          {FALLING_PETALS.map((p, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-[35%]"
              initial={{ x: p.startX, y: -10, rotate: 0, opacity: 0 }}
              animate={{
                x: p.startX + p.driftX,
                y: 160,
                rotate: p.rot,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.4, 0, 0.6, 1],
                times: [0, 0.15, 0.75, 1],
              }}
            >
              <FallingPetal color={p.hue} />
            </motion.div>
          ))}
        </div>
      )}

      {/* 抽签：签文浮现 */}
      {shaking && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.9, ease: "easeOut" }}
        >
          <div
            className="relative flex h-20 w-14 items-center justify-center rounded-sm"
            style={{
              background: "linear-gradient(180deg, #f5ecd9 0%, #e0c896 100%)",
              boxShadow: "0 6px 24px rgba(212, 175, 55, 0.35), inset 0 0 12px rgba(176, 64, 64, 0.18)",
              border: "1px solid #c2410c",
            }}
          >
            <span
              className="text-[#7a2418]"
              style={{
                fontFamily: '"Noto Serif SC", "Ma Shan Zheng", serif',
                fontSize: 22,
                writingMode: "vertical-rl",
                letterSpacing: "0.3em",
              }}
            >
              签
            </span>
          </div>
        </motion.div>
      )}

      <p
        className="absolute bottom-0 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] tracking-[0.35em] text-muted-foreground/65 pl-[0.35em] font-light"
        style={{ fontFamily: '"Noto Serif SC", serif' }}
      >
        {shaking ? "心定则签现" : "执扇问心"}
      </p>
    </div>
  );
}
