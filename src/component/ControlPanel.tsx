interface ControlPanelProps {
  lightsBrightness: number;
  setLightsBrightness: (value: number) => void;
  privacyMode: boolean;
  setPrivacyMode: (value: boolean) => void;
  meetingOn: boolean;
  setMeetingOn: (value: boolean) => void;
  curtainPosition: number; // 0-100%
  onCurtainUp: () => void;
  onCurtainDown: () => void;
  onCurtainStop: () => void;
  curtainMoving: "up" | "down" | "stopped";
}

function ControlPanel({
  lightsBrightness,
  setLightsBrightness,
  privacyMode,
  setPrivacyMode,
  meetingOn,
  setMeetingOn,
  curtainPosition,
  onCurtainUp,
  onCurtainDown,
  onCurtainStop,
  curtainMoving,
}: ControlPanelProps) {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.85)",
        padding: "20px",
        borderRadius: "12px",
        color: "white",
        fontFamily: "Arial, sans-serif",
        minWidth: "250px",
        zIndex: 1000,
        border: "2px solid #00ff88",
        boxShadow: "0 4px 20px rgba(0, 255, 136, 0.3)",
      }}
    >
      <h2
        style={{
          margin: "0 0 20px 0",
          fontSize: "18px",
          color: "#00ff88",
          borderBottom: "2px solid #00ff88",
          paddingBottom: "10px",
        }}
      >
        🎛️ Office Controls
      </h2>

      {/* Lights Brightness Slider */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <label style={{ fontSize: "14px", fontWeight: "bold" }}>
            💡 Lights
          </label>
          <span
            style={{
              fontSize: "14px",
              color: "#00ff88",
              fontWeight: "bold",
            }}
          >
            {lightsBrightness}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={lightsBrightness}
          onChange={(e) => setLightsBrightness(Number(e.target.value))}
          style={{
            width: "100%",
            cursor: "pointer",
            accentColor: "#00ff88",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "10px",
            color: "#666",
            marginTop: "5px",
          }}
        >
          <span>Off</span>
          <span>Bright</span>
        </div>
      </div>

      {/* Privacy Mode Control */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <label style={{ fontSize: "14px", fontWeight: "bold" }}>
            🔒 Privacy
          </label>
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            style={{
              padding: "8px 16px",
              background: privacyMode ? "#ff9500" : "#00ff88",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "all 0.3s",
            }}
          >
            {privacyMode ? "ON" : "OFF"}
          </button>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#aaa",
            marginTop: "5px",
          }}
        >
          Glass: {privacyMode ? "🔒 Frosted" : "👁️ Transparent"}
        </div>
      </div>

      {/* Meeting Screen Control */}
      <div style={{ marginBottom: "25px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <label style={{ fontSize: "14px", fontWeight: "bold" }}>
            📺 Meeting
          </label>
          <button
            onClick={() => setMeetingOn(!meetingOn)}
            style={{
              padding: "8px 16px",
              background: meetingOn ? "#00ff88" : "#666",
              color: meetingOn ? "#000" : "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "all 0.3s",
            }}
          >
            {meetingOn ? "ON" : "OFF"}
          </button>
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "#aaa",
            marginTop: "5px",
          }}
        >
          Status: {meetingOn ? "👥 Meeting Active" : "⚫ No Meeting"}
        </div>
      </div>

      {/* Curtain Control - NEW! */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <label style={{ fontSize: "14px", fontWeight: "bold" }}>
            🪟 Curtain
          </label>
          <span
            style={{
              fontSize: "14px",
              color: "#00ff88",
              fontWeight: "bold",
            }}
          >
            {Math.round(curtainPosition)}%
          </span>
        </div>

        {/* 3 Buttons: UP, STOP, DOWN */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            marginBottom: "10px",
          }}
        >
          <button
            onClick={onCurtainUp}
            disabled={curtainMoving === "up"}
            style={{
              flex: 1,
              padding: "10px",
              background: curtainMoving === "up" ? "#00ff88" : "#444",
              color: curtainMoving === "up" ? "#000" : "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: curtainMoving === "up" ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "all 0.3s",
              opacity: curtainMoving === "up" ? 1 : 0.8,
            }}
          >
            🔼 UP
          </button>

          <button
            onClick={onCurtainStop}
            disabled={curtainMoving === "stopped"}
            style={{
              flex: 1,
              padding: "10px",
              background: "#ff9500",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              cursor: curtainMoving === "stopped" ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "all 0.3s",
              opacity: curtainMoving === "stopped" ? 0.5 : 1,
            }}
          >
            ⏸️ STOP
          </button>

          <button
            onClick={onCurtainDown}
            disabled={curtainMoving === "down"}
            style={{
              flex: 1,
              padding: "10px",
              background: curtainMoving === "down" ? "#00ff88" : "#444",
              color: curtainMoving === "down" ? "#000" : "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: curtainMoving === "down" ? "default" : "pointer",
              fontWeight: "bold",
              fontSize: "12px",
              transition: "all 0.3s",
              opacity: curtainMoving === "down" ? 1 : 0.8,
            }}
          >
            🔽 DOWN
          </button>
        </div>

        {/* Status Display */}
        <div
          style={{
            fontSize: "11px",
            color: "#aaa",
            marginTop: "5px",
          }}
        >
          Status:{" "}
          {curtainMoving === "up"
            ? "⬆️ Moving Up"
            : curtainMoving === "down"
              ? "⬇️ Moving Down"
              : "⏸️ Stopped"}
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
