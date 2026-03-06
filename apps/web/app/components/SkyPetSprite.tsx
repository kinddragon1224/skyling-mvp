type SkyPetSpriteProps = {
  stage: number;
  hp: number;
  mood: number;
  bond: number;
};

function getFace(hp: number, mood: number, bond: number) {
  if (mood < 35 || hp < 30) {
    return { eyes: "sleepy", mouth: "down", blush: false } as const;
  }
  if (bond >= 75) {
    return { eyes: "happy", mouth: "smile", blush: true } as const;
  }
  if (mood >= 70) {
    return { eyes: "bright", mouth: "smile", blush: true } as const;
  }
  return { eyes: "normal", mouth: "soft", blush: false } as const;
}

export default function SkyPetSprite({ stage, hp, mood, bond }: SkyPetSpriteProps) {
  const face = getFace(hp, mood, bond);
  const isStage2 = stage >= 2;

  return (
    <div className="sky-pet-float relative z-20 mx-auto h-44 w-44">
      <svg viewBox="0 0 200 200" className="h-full w-full drop-shadow-[0_8px_10px_rgba(0,0,0,0.35)]">
        <defs>
          <radialGradient id="bodyGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor={isStage2 ? "#e0f2fe" : "#bae6fd"} />
            <stop offset="70%" stopColor={isStage2 ? "#7dd3fc" : "#93c5fd"} />
            <stop offset="100%" stopColor={isStage2 ? "#38bdf8" : "#60a5fa"} />
          </radialGradient>
          <radialGradient id="shine" cx="35%" cy="25%" r="35%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="100" cy="166" rx="50" ry="12" fill="rgba(15,23,42,0.35)" />

        <path d={isStage2 ? "M48 108 C24 90, 24 58, 56 62 C68 64, 72 80, 66 96 Z" : "M54 112 C34 98, 36 72, 62 76 C72 78, 74 92, 68 104 Z"} fill="#c4b5fd" fillOpacity="0.6" />
        <path d={isStage2 ? "M152 108 C176 90, 176 58, 144 62 C132 64, 128 80, 134 96 Z" : "M146 112 C166 98, 164 72, 138 76 C128 78, 126 92, 132 104 Z"} fill="#c4b5fd" fillOpacity="0.6" />

        <ellipse cx="100" cy="98" rx={isStage2 ? 66 : 62} ry={isStage2 ? 62 : 58} fill="url(#bodyGrad)" />
        <ellipse cx="84" cy="72" rx="30" ry="22" fill="url(#shine)" />

        {face.eyes === "sleepy" ? (
          <>
            <path d="M78 95 Q84 99 90 95" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
            <path d="M110 95 Q116 99 122 95" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="84" cy="94" r={face.eyes === "bright" ? 6 : 5} fill="#0f172a" />
            <circle cx="116" cy="94" r={face.eyes === "bright" ? 6 : 5} fill="#0f172a" />
            <circle cx="82" cy="92" r="1.4" fill="#fff" />
            <circle cx="114" cy="92" r="1.4" fill="#fff" />
          </>
        )}

        {face.blush ? (
          <>
            <ellipse cx="70" cy="108" rx="8" ry="5" fill="#fda4af" fillOpacity="0.5" />
            <ellipse cx="130" cy="108" rx="8" ry="5" fill="#fda4af" fillOpacity="0.5" />
          </>
        ) : null}

        {face.mouth === "down" ? (
          <path d="M88 122 Q100 114 112 122" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : face.mouth === "smile" ? (
          <path d="M86 118 Q100 130 114 118" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : (
          <path d="M90 120 Q100 124 110 120" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" fill="none" />
        )}

        {isStage2 ? <circle cx="100" cy="48" r="6" fill="#fef08a" /> : null}
      </svg>
    </div>
  );
}
