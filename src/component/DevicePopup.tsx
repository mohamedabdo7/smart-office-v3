import { useEffect, useRef } from "react";

export type DeviceType = "lights" | "curtain" | "meeting" | "privacy";

interface DevicePopupProps {
  device: DeviceType | null;
  position: { x: number; y: number };
  onClose: () => void;
  lightsBrightness: number;
  setLightsBrightness: (v: number) => void;
  onLightsOn: () => void;
  onLightsOff: () => void;
  privacyMode: boolean;
  setPrivacyMode: (v: boolean) => void;
  meetingOn: boolean;
  setMeetingOn: (v: boolean) => void;
  curtainPosition: number;
  onCurtainUp: () => void;
  onCurtainDown: () => void;
  onCurtainStop: () => void;
  curtainMoving: "up" | "down" | "stopped";
}

const POPUP_WIDTH = 280;
const OFFSET = 20;

function getAdjustedPosition(
  x: number,
  y: number,
): { top: number; left: number } {
  let left = x + OFFSET;
  let top = y - 60;
  if (left + POPUP_WIDTH > window.innerWidth - 16)
    left = x - POPUP_WIDTH - OFFSET;
  if (top < 16) top = 16;
  if (top + 320 > window.innerHeight) top = window.innerHeight - 330;
  return { top, left };
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: "46px",
        height: "26px",
        borderRadius: "13px",
        background: on ? "#00d68f" : "rgba(255,255,255,0.15)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s",
        flexShrink: 0,
        border: on ? "none" : "1px solid rgba(255,255,255,0.2)",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          background: "#fff",
          position: "absolute",
          top: "3px",
          left: on ? "23px" : "3px",
          transition: "left 0.25s",
        }}
      />
    </div>
  );
}

function DeviceIcon({
  device,
  active,
}: {
  device: DeviceType;
  active: boolean;
}) {
  const icons: Record<DeviceType, string> = {
    lights: "💡",
    curtain: "🪟",
    meeting: "📺",
    privacy: "🔒",
  };
  return (
    <div
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "12px",
        background: active ? "rgba(0,214,143,0.2)" : "rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "18px",
        flexShrink: 0,
        border: active
          ? "1px solid rgba(0,214,143,0.4)"
          : "1px solid rgba(255,255,255,0.1)",
        transition: "all 0.25s",
      }}
    >
      {icons[device]}
    </div>
  );
}

function BrightnessDots({ value }: { value: number }) {
  const total = 12;
  const filled = Math.round((value / 100) * total);
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i < filled ? "14px" : "6px",
            height: "6px",
            borderRadius: "3px",
            background: i < filled ? "#00d68f" : "rgba(255,255,255,0.15)",
            transition: "all 0.2s",
          }}
        />
      ))}
    </div>
  );
}

function DevicePopup({
  device,
  position,
  onClose,
  lightsBrightness,
  setLightsBrightness,
  onLightsOn,
  onLightsOff,
  privacyMode,
  setPrivacyMode,
  meetingOn,
  setMeetingOn,
  curtainPosition,
  onCurtainUp,
  onCurtainDown,
  onCurtainStop,
  curtainMoving,
}: DevicePopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!device) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(
      () => window.addEventListener("mousedown", handleOutsideClick),
      100,
    );
    return () => {
      clearTimeout(timer);
      window.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [device, onClose]);

  if (!device) return null;

  const { top, left } = getAdjustedPosition(position.x, position.y);

  const isActive =
    device === "lights"
      ? lightsBrightness > 0
      : device === "privacy"
        ? privacyMode
        : device === "meeting"
          ? meetingOn
          : curtainPosition > 0;

  const deviceLabels: Record<DeviceType, string> = {
    lights: "Lighting",
    curtain: "Curtain",
    meeting: "Display",
    privacy: "Privacy Glass",
  };

  const deviceSubs: Record<DeviceType, string> = {
    lights: "Ceiling Dimmers",
    curtain: "Window Blinds",
    meeting: "Conference Screen",
    privacy: "Door Glass",
  };

  const card: React.CSSProperties = {
    position: "fixed",
    top,
    left,
    zIndex: 2000,
    width: `${POPUP_WIDTH}px`,
    background: "rgba(18, 20, 28, 0.93)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.1)",
    padding: "20px",
    color: "#fff",
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    boxSizing: "border-box" as const,
    animation: "dv-popIn 0.18s cubic-bezier(0.34,1.56,0.64,1)",
  };

  const label12: React.CSSProperties = {
    fontSize: "12px",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "0.3px",
    marginTop: "2px",
  };

  const ctrlBtn = (active: boolean, warn = false): React.CSSProperties => ({
    flex: 1,
    padding: "10px 0",
    borderRadius: "10px",
    border: `1px solid ${
      active
        ? warn
          ? "rgba(255,140,0,0.3)"
          : "rgba(0,214,143,0.3)"
        : "rgba(255,255,255,0.08)"
    }`,
    background: active
      ? warn
        ? "rgba(255,140,0,0.18)"
        : "rgba(0,214,143,0.18)"
      : "rgba(255,255,255,0.05)",
    color: active ? (warn ? "#ffb347" : "#00d68f") : "rgba(255,255,255,0.45)",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "0.3px",
  });

  const statusCard = (active: boolean): React.CSSProperties => ({
    borderRadius: "12px",
    background: active ? "rgba(0,214,143,0.07)" : "rgba(255,255,255,0.04)",
    border: `1px solid ${
      active ? "rgba(0,214,143,0.22)" : "rgba(255,255,255,0.08)"
    }`,
    padding: "14px 16px",
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    transition: "all 0.3s",
  });

  const actionBtn = (color: string): React.CSSProperties => ({
    width: "100%",
    padding: "12px",
    borderRadius: "12px",
    border: "none",
    background: color,
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "opacity 0.2s",
  });

  return (
    <>
      <style>{`
        @keyframes dv-popIn {
          from { opacity: 0; transform: scale(0.88) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);   }
        }
        .dv-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 2px;
          outline: none;
          cursor: pointer;
        }
        .dv-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,214,143,0.35);
          cursor: pointer;
        }
        .dv-range::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: none;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(0,214,143,0.35);
          cursor: pointer;
        }
      `}</style>

      <div ref={popupRef} style={card}>
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <DeviceIcon device={device} active={isActive} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.2 }}>
              {deviceLabels[device]}
            </div>
            <div style={label12}>{deviceSubs[device]}</div>
          </div>

          {device !== "curtain" && (
            <Toggle
              on={isActive}
              onToggle={() => {
                if (device === "lights")
                  isActive ? onLightsOff() : onLightsOn();
                if (device === "privacy") setPrivacyMode(!privacyMode);
                if (device === "meeting") setMeetingOn(!meetingOn);
              }}
            />
          )}

          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "rgba(255,255,255,0.35)",
              width: "28px",
              height: "28px",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div
          style={{
            height: "1px",
            background: "rgba(255,255,255,0.07)",
            margin: "0 0 16px",
          }}
        />

        {/* ══ LIGHTS ══ */}
        {device === "lights" && (
          <>
            {/* Dots row + % label on same line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <BrightnessDots value={lightsBrightness} />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color:
                    lightsBrightness > 0 ? "#00d68f" : "rgba(255,255,255,0.25)",
                  whiteSpace: "nowrap",
                }}
              >
                {lightsBrightness}%
              </span>
            </div>

            {/* Slider sits directly below the dots */}
            <input
              type="range"
              min="0"
              max="100"
              value={lightsBrightness}
              onChange={(e) => setLightsBrightness(Number(e.target.value))}
              className="dv-range"
              style={{
                marginBottom: "16px",
                display: "block",
                background: `linear-gradient(to right, #00d68f ${lightsBrightness}%, rgba(255,255,255,0.12) ${lightsBrightness}%)`,
              }}
            />

            <div style={{ display: "flex", gap: "6px" }}>
              <button
                onClick={onLightsOff}
                style={ctrlBtn(lightsBrightness === 0, false)}
              >
                Off
              </button>
              <button
                onClick={() => setLightsBrightness(25)}
                style={ctrlBtn(lightsBrightness > 0 && lightsBrightness <= 35)}
              >
                Low
              </button>
              <button
                onClick={() => setLightsBrightness(60)}
                style={ctrlBtn(lightsBrightness > 35 && lightsBrightness <= 75)}
              >
                Med
              </button>
              <button
                onClick={() => {
                  setLightsBrightness(100);
                  onLightsOn();
                }}
                style={ctrlBtn(lightsBrightness > 75)}
              >
                Max
              </button>
            </div>
          </>
        )}

        {/* ══ PRIVACY ══ */}
        {device === "privacy" && (
          <>
            <div style={statusCard(privacyMode)}>
              <div style={{ fontSize: "26px" }}>
                {privacyMode ? "🔒" : "👁️"}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: privacyMode ? "#00d68f" : "rgba(255,255,255,0.65)",
                  }}
                >
                  {privacyMode ? "Frosted" : "Transparent"}
                </div>
                <div style={label12}>
                  {privacyMode ? "Glass is opaque" : "Glass is clear"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setPrivacyMode(!privacyMode)}
              style={actionBtn(
                privacyMode ? "rgba(255,140,0,0.85)" : "rgba(0,214,143,0.85)",
              )}
            >
              {privacyMode ? "Disable Privacy" : "Enable Privacy"}
            </button>
          </>
        )}

        {/* ══ MEETING ══ */}
        {device === "meeting" && (
          <>
            <div style={statusCard(meetingOn)}>
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: meetingOn ? "#00d68f" : "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                  boxShadow: meetingOn ? "0 0 8px rgba(0,214,143,0.6)" : "none",
                  transition: "all 0.3s",
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: meetingOn ? "#00d68f" : "rgba(255,255,255,0.45)",
                  }}
                >
                  {meetingOn ? "Meeting Active" : "No Meeting"}
                </div>
                <div style={label12}>
                  {meetingOn ? "Screen broadcasting" : "Screen is idle"}
                </div>
              </div>
            </div>
            <button
              onClick={() => setMeetingOn(!meetingOn)}
              style={actionBtn(
                meetingOn ? "rgba(210,55,55,0.85)" : "rgba(0,214,143,0.85)",
              )}
            >
              {meetingOn ? "End Meeting" : "Start Meeting"}
            </button>
          </>
        )}

        {/* ══ CURTAIN ══ */}
        {device === "curtain" && (
          <>
            <div style={{ textAlign: "center", marginBottom: "12px" }}>
              <div
                style={{
                  fontSize: "34px",
                  fontWeight: 700,
                  lineHeight: 1,
                  color: "#fff",
                }}
              >
                {Math.round(curtainPosition)}
                <span
                  style={{
                    fontSize: "16px",
                    color: "rgba(255,255,255,0.35)",
                    fontWeight: 400,
                  }}
                >
                  %
                </span>
              </div>
              <div style={{ ...label12, textAlign: "center" }}>open</div>
            </div>

            <div
              style={{
                height: "5px",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.1)",
                marginBottom: "16px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${curtainPosition}%`,
                  borderRadius: "3px",
                  background: "#00d68f",
                  transition: "width 0.1s",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
              <button
                onClick={onCurtainDown}
                disabled={curtainMoving === "down"}
                style={ctrlBtn(curtainMoving === "down")}
              >
                ▼ Down
              </button>
              <button
                onClick={onCurtainStop}
                disabled={curtainMoving === "stopped"}
                style={ctrlBtn(curtainMoving !== "stopped", true)}
              >
                ⏸ Stop
              </button>
              <button
                onClick={onCurtainUp}
                disabled={curtainMoving === "up"}
                style={ctrlBtn(curtainMoving === "up")}
              >
                ▲ Up
              </button>
            </div>

            <div style={{ textAlign: "center", ...label12 }}>
              {curtainMoving === "up"
                ? "Moving up..."
                : curtainMoving === "down"
                  ? "Moving down..."
                  : "Stopped"}
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default DevicePopup;

// import { useEffect, useRef } from "react";

// export type DeviceType = "lights" | "curtain" | "meeting" | "privacy";

// interface DevicePopupProps {
//   device: DeviceType | null;
//   position: { x: number; y: number };
//   onClose: () => void;
//   // Lights
//   lightsBrightness: number;
//   setLightsBrightness: (v: number) => void;
//   onLightsOn: () => void;
//   onLightsOff: () => void;
//   // Privacy
//   privacyMode: boolean;
//   setPrivacyMode: (v: boolean) => void;
//   // Meeting
//   meetingOn: boolean;
//   setMeetingOn: (v: boolean) => void;
//   // Curtain
//   curtainPosition: number;
//   onCurtainUp: () => void;
//   onCurtainDown: () => void;
//   onCurtainStop: () => void;
//   curtainMoving: "up" | "down" | "stopped";
// }

// const POPUP_WIDTH = 240;
// const POPUP_HEIGHT = 200;
// const OFFSET = 16;

// function getAdjustedPosition(
//   x: number,
//   y: number,
// ): { top: number; left: number } {
//   let left = x + OFFSET;
//   let top = y + OFFSET;

//   if (left + POPUP_WIDTH > window.innerWidth) {
//     left = x - POPUP_WIDTH - OFFSET;
//   }
//   if (top + POPUP_HEIGHT > window.innerHeight) {
//     top = y - POPUP_HEIGHT - OFFSET;
//   }

//   return { top, left };
// }

// function DevicePopup({
//   device,
//   position,
//   onClose,
//   lightsBrightness,
//   setLightsBrightness,
//   onLightsOn,
//   onLightsOff,
//   privacyMode,
//   setPrivacyMode,
//   meetingOn,
//   setMeetingOn,
//   curtainPosition,
//   onCurtainUp,
//   onCurtainDown,
//   onCurtainStop,
//   curtainMoving,
// }: DevicePopupProps) {
//   const popupRef = useRef<HTMLDivElement>(null);

//   // Close on outside click
//   useEffect(() => {
//     if (!device) return;

//     const handleOutsideClick = (e: MouseEvent) => {
//       if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
//         onClose();
//       }
//     };

//     // Delay to avoid the same click that opened it
//     const timer = setTimeout(() => {
//       window.addEventListener("mousedown", handleOutsideClick);
//     }, 100);

//     return () => {
//       clearTimeout(timer);
//       window.removeEventListener("mousedown", handleOutsideClick);
//     };
//   }, [device, onClose]);

//   if (!device) return null;

//   const { top, left } = getAdjustedPosition(position.x, position.y);

//   const baseStyle: React.CSSProperties = {
//     position: "fixed",
//     top,
//     left,
//     zIndex: 2000,
//     background: "rgba(10, 12, 18, 0.92)",
//     backdropFilter: "blur(12px)",
//     border: "1px solid rgba(0, 255, 136, 0.35)",
//     borderRadius: "14px",
//     padding: "18px",
//     color: "#fff",
//     fontFamily: "Arial, sans-serif",
//     width: `${POPUP_WIDTH}px`,
//     boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,136,0.1)",
//     animation: "fadeIn 0.15s ease",
//   };

//   const titleStyle: React.CSSProperties = {
//     fontSize: "13px",
//     fontWeight: "bold",
//     color: "#00ff88",
//     marginBottom: "14px",
//     display: "flex",
//     justifyContent: "space-between",
//     alignItems: "center",
//   };

//   const closeBtnStyle: React.CSSProperties = {
//     background: "none",
//     border: "none",
//     color: "#666",
//     cursor: "pointer",
//     fontSize: "16px",
//     lineHeight: 1,
//     padding: "0 2px",
//   };

//   const btnBase: React.CSSProperties = {
//     border: "none",
//     borderRadius: "7px",
//     cursor: "pointer",
//     fontWeight: "bold",
//     fontSize: "12px",
//     padding: "8px 12px",
//     transition: "all 0.2s",
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes fadeIn {
//           from { opacity: 0; transform: scale(0.95) translateY(-4px); }
//           to   { opacity: 1; transform: scale(1)    translateY(0);    }
//         }
//       `}</style>

//       <div ref={popupRef} style={baseStyle}>
//         {/* ── LIGHTS ─────────────────────────────────── */}
//         {device === "lights" && (
//           <>
//             <div style={titleStyle}>
//               <span>💡 Lights</span>
//               <button style={closeBtnStyle} onClick={onClose}>
//                 ✕
//               </button>
//             </div>

//             <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
//               <button
//                 onClick={onLightsOff}
//                 style={{
//                   ...btnBase,
//                   flex: 1,
//                   background: lightsBrightness === 0 ? "#ff4444" : "#2a2a2a",
//                   color: "#fff",
//                 }}
//               >
//                 OFF
//               </button>
//               <button
//                 onClick={onLightsOn}
//                 style={{
//                   ...btnBase,
//                   flex: 1,
//                   background: lightsBrightness > 0 ? "#00ff88" : "#2a2a2a",
//                   color: lightsBrightness > 0 ? "#000" : "#fff",
//                 }}
//               >
//                 ON
//               </button>
//             </div>

//             <input
//               type="range"
//               min="0"
//               max="100"
//               value={lightsBrightness}
//               onChange={(e) => setLightsBrightness(Number(e.target.value))}
//               style={{
//                 width: "100%",
//                 accentColor: "#00ff88",
//                 cursor: "pointer",
//               }}
//             />
//             <div
//               style={{
//                 display: "flex",
//                 justifyContent: "space-between",
//                 fontSize: "10px",
//                 color: "#555",
//                 marginTop: "5px",
//               }}
//             >
//               <span>0%</span>
//               <span style={{ color: "#00ff88", fontWeight: "bold" }}>
//                 {lightsBrightness}%
//               </span>
//               <span>100%</span>
//             </div>
//           </>
//         )}

//         {/* ── PRIVACY ────────────────────────────────── */}
//         {device === "privacy" && (
//           <>
//             <div style={titleStyle}>
//               <span>🔒 Privacy Glass</span>
//               <button style={closeBtnStyle} onClick={onClose}>
//                 ✕
//               </button>
//             </div>

//             <div
//               style={{
//                 fontSize: "12px",
//                 color: "#aaa",
//                 marginBottom: "16px",
//                 lineHeight: 1.5,
//               }}
//             >
//               {privacyMode
//                 ? "Glass is currently frosted."
//                 : "Glass is currently transparent."}
//             </div>

//             <button
//               onClick={() => setPrivacyMode(!privacyMode)}
//               style={{
//                 ...btnBase,
//                 width: "100%",
//                 padding: "10px",
//                 background: privacyMode ? "#ff9500" : "#00ff88",
//                 color: privacyMode ? "#fff" : "#000",
//                 fontSize: "13px",
//               }}
//             >
//               {privacyMode ? "🔓 Make Transparent" : "🔒 Enable Privacy"}
//             </button>
//           </>
//         )}

//         {/* ── MEETING ────────────────────────────────── */}
//         {device === "meeting" && (
//           <>
//             <div style={titleStyle}>
//               <span>📺 Screen</span>
//               <button style={closeBtnStyle} onClick={onClose}>
//                 ✕
//               </button>
//             </div>

//             <div
//               style={{
//                 fontSize: "12px",
//                 color: "#aaa",
//                 marginBottom: "16px",
//                 lineHeight: 1.5,
//               }}
//             >
//               Status:{" "}
//               <span style={{ color: meetingOn ? "#00ff88" : "#666" }}>
//                 {meetingOn ? "👥 Meeting Active" : "⚫ No Meeting"}
//               </span>
//             </div>

//             <button
//               onClick={() => setMeetingOn(!meetingOn)}
//               style={{
//                 ...btnBase,
//                 width: "100%",
//                 padding: "10px",
//                 background: meetingOn ? "#ff4444" : "#00ff88",
//                 color: meetingOn ? "#fff" : "#000",
//                 fontSize: "13px",
//               }}
//             >
//               {meetingOn ? "⏹ End Meeting" : "▶ Start Meeting"}
//             </button>
//           </>
//         )}

//         {/* ── CURTAIN ────────────────────────────────── */}
//         {device === "curtain" && (
//           <>
//             <div style={titleStyle}>
//               <span>🪟 Curtain — {Math.round(curtainPosition)}%</span>
//               <button style={closeBtnStyle} onClick={onClose}>
//                 ✕
//               </button>
//             </div>

//             {/* Progress bar */}
//             <div
//               style={{
//                 width: "100%",
//                 height: "6px",
//                 background: "#222",
//                 borderRadius: "3px",
//                 marginBottom: "14px",
//                 overflow: "hidden",
//               }}
//             >
//               <div
//                 style={{
//                   width: `${curtainPosition}%`,
//                   height: "100%",
//                   background: "#00ff88",
//                   borderRadius: "3px",
//                   transition: "width 0.1s",
//                 }}
//               />
//             </div>

//             <div style={{ display: "flex", gap: "8px" }}>
//               <button
//                 onClick={onCurtainUp}
//                 disabled={curtainMoving === "up"}
//                 style={{
//                   ...btnBase,
//                   flex: 1,
//                   background: curtainMoving === "up" ? "#00ff88" : "#2a2a2a",
//                   color: curtainMoving === "up" ? "#000" : "#fff",
//                   opacity: curtainPosition >= 100 ? 0.4 : 1,
//                 }}
//               >
//                 🔼 Up
//               </button>

//               <button
//                 onClick={onCurtainStop}
//                 disabled={curtainMoving === "stopped"}
//                 style={{
//                   ...btnBase,
//                   flex: 1,
//                   background: "#ff9500",
//                   color: "#000",
//                   opacity: curtainMoving === "stopped" ? 0.4 : 1,
//                 }}
//               >
//                 ⏸ Stop
//               </button>

//               <button
//                 onClick={onCurtainDown}
//                 disabled={curtainMoving === "down"}
//                 style={{
//                   ...btnBase,
//                   flex: 1,
//                   background: curtainMoving === "down" ? "#00ff88" : "#2a2a2a",
//                   color: curtainMoving === "down" ? "#000" : "#fff",
//                   opacity: curtainPosition <= 0 ? 0.4 : 1,
//                 }}
//               >
//                 🔽 Down
//               </button>
//             </div>

//             <div
//               style={{
//                 fontSize: "11px",
//                 color: "#555",
//                 marginTop: "10px",
//                 textAlign: "center",
//               }}
//             >
//               {curtainMoving === "up"
//                 ? "⬆️ Moving up…"
//                 : curtainMoving === "down"
//                   ? "⬇️ Moving down…"
//                   : "⏸ Stopped"}
//             </div>
//           </>
//         )}
//       </div>
//     </>
//   );
// }

// export default DevicePopup;
