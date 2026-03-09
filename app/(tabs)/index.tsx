/* eslint-disable react-hooks/exhaustive-deps */
import { CSSProperties, useCallback, useEffect, useState } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type Player = "X" | "O";
type Cell = Player | null;
type Board = Cell[];
type GameMode = "pvp" | "pvc";

interface WinResult {
  winner: Player;
  line: [number, number, number];
}

interface Scores {
  X: number;
  O: number;
  D: number;
}

// ── Theme — warm, mobile-friendly palette ─────────────────────────────────────
const T = {
  bg: "#F0EDE8",          // warm cream background
  surface: "#FDFCFA",          // card white
  surfaceAlt: "#E8E4DE",          // slightly darker cream
  border: "#D6CFC5",          // warm border
  borderLight: "#EAE6E0",

  x: "#4F46E5",          // rich indigo — X player
  xLight: "#EEF2FF",          // indigo tint
  xBorder: "#A5B4FC",
  xShadow: "rgba(79,70,229,0.25)",

  o: "#EA580C",          // warm coral-orange — O player
  oLight: "#FFF7ED",          // orange tint
  oBorder: "#FDBA74",
  oShadow: "rgba(234,88,12,0.25)",

  draw: "#0EA5E9",          // sky blue for draw
  drawLight: "#F0F9FF",

  textPrimary: "#1C1917",        // near-black warm
  textSecondary: "#78716C",        // warm gray
  textMuted: "#A8A29E",

  win: "#16A34A",          // green for win banner
  winLight: "#F0FDF4",

  btnPrimary: "#4F46E5",
  btnDanger: "#DC2626",

  shadow: "0 4px 24px rgba(0,0,0,0.08)",
  shadowLg: "0 8px 40px rgba(0,0,0,0.12)",
};

// ── Winning lines ─────────────────────────────────────────────────────────────
const LINES: [number, number, number][] = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinner(squares: Board): WinResult | null {
  for (const [a, b, c] of LINES) {
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c])
      return { winner: squares[a] as Player, line: [a, b, c] };
  }
  return null;
}

// ── Minimax AI ────────────────────────────────────────────────────────────────
function minimax(squares: Board, isMaximizing: boolean, depth = 0): number {
  const result = getWinner(squares);
  if (result) return result.winner === "O" ? 10 - depth : depth - 10;
  if (!squares.includes(null)) return 0;
  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const next = [...squares] as Board;
      next[i] = isMaximizing ? "O" : "X";
      scores.push(minimax(next, !isMaximizing, depth + 1));
    }
  }
  return isMaximizing ? Math.max(...scores) : Math.min(...scores);
}

function getBestMove(squares: Board): number {
  let best = -Infinity, move = -1;
  for (let i = 0; i < 9; i++) {
    if (!squares[i]) {
      const next = [...squares] as Board;
      next[i] = "O";
      const score = minimax(next, false);
      if (score > best) { best = score; move = i; }
    }
  }
  return move;
}

// ── Particle Burst ────────────────────────────────────────────────────────────
interface ParticlesProps { active: boolean; color: string; }
function Particles({ active, color }: ParticlesProps) {
  if (!active) return null;
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
      {Array.from({ length: 10 }, (_, i) => {
        const angle = (i / 10) * 360;
        const dist = 36 + Math.random() * 20;
        return (
          <div key={i} style={{
            position: "absolute", top: "50%", left: "50%",
            width: 7, height: 7, borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${color}`,
            animation: "burst 0.55s ease-out forwards",
            animationDelay: `${i * 0.025}s`,
            "--angle": `${angle}deg`,
            "--dist": `${dist}px`,
          } as CSSProperties} />
        );
      })}
    </div>
  );
}

// ── Score Badge ───────────────────────────────────────────────────────────────
interface ScoreBadgeProps { label: string; score: number; player: Player; }
function ScoreBadge({ label, score, player }: ScoreBadgeProps) {
  const color = player === "X" ? T.x : T.o;
  const light = player === "X" ? T.xLight : T.oLight;
  const border = player === "X" ? T.xBorder : T.oBorder;
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "14px 20px", borderRadius: 20,
      background: light,
      border: `2px solid ${border}`,
      minWidth: 80,
      boxShadow: `0 2px 12px ${color}22`,
    }}>
      <span style={{
        fontSize: 10, fontWeight: 800, letterSpacing: 3,
        color, textTransform: "uppercase",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
      }}>{label}</span>
      <span style={{
        fontSize: 38, fontWeight: 900, color,
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        lineHeight: 1.15,
      }}>{score}</span>
    </div>
  );
}

// ── Main Game ─────────────────────────────────────────────────────────────────
export default function TicTacToe() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState<boolean>(true);
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0, D: 0 });
  const [mode, setMode] = useState<GameMode>("pvp");
  const [animCells, setAnimCells] = useState<number[]>([]);
  const [burstCell, setBurstCell] = useState<number | null>(null);
  const [thinking, setThinking] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const result = getWinner(board);
  const winner = result?.winner ?? null;
  const winLine: number[] = result?.line ?? [];
  const isDraw = !winner && !board.includes(null);

  // Score tracking
  useEffect(() => {
    if (winner) {
      setScores(s => ({ ...s, [winner]: s[winner] + 1 }));
      setGameOver(true);
    } else if (isDraw) {
      setScores(s => ({ ...s, D: s.D + 1 }));
      setGameOver(true);
    }
  }, [winner, isDraw]);

  // AI move trigger
  useEffect(() => {
    if (mode !== "pvc" || isXNext || winner || isDraw || gameOver) return;
    setThinking(true);
    const id = setTimeout(() => {
      const move = getBestMove(board);
      if (move !== -1) makeMove(move, board, false);
      setThinking(false);
    }, 480);
    return () => clearTimeout(id);
  }, [isXNext, mode, board, winner, isDraw, gameOver]);

  const makeMove = useCallback((index: number, cur: Board, human = true) => {
    if (cur[index] || getWinner(cur)) return;
    const symbol: Player = human ? (isXNext ? "X" : "O") : "O";
    const next = [...cur] as Board;
    next[index] = symbol;
    setAnimCells(prev => [...prev, index]);
    setBurstCell(index);
    setTimeout(() => setBurstCell(null), 650);
    setBoard(next);
    setIsXNext(human ? !isXNext : true);
  }, [isXNext]);

  const handlePress = (index: number) => {
    if (thinking || gameOver) return;
    if (mode === "pvc" && !isXNext) return;
    makeMove(index, board, true);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setAnimCells([]);
    setBurstCell(null);
    setThinking(false);
    setGameOver(false);
  };

  const resetAll = () => {
    resetGame();
    setScores({ X: 0, O: 0, D: 0 });
  };

  // Status
  const statusText =
    winner
      ? mode === "pvc"
        ? winner === "X" ? "🏆 You Win!" : "🤖 AI Wins!"
        : `🏆 Player ${winner} Wins!`
      : isDraw ? "🤝 It's a Draw!"
        : thinking ? "🤖 AI is thinking…"
          : mode === "pvc"
            ? isXNext ? "Your turn" : "AI's turn"
            : `Player ${isXNext ? "X" : "O"}'s turn`;

  const statusBg = winner === "X" ? T.xLight : winner === "O" ? T.oLight : isDraw ? T.drawLight : T.surfaceAlt;
  const statusColor = winner === "X" ? T.x : winner === "O" ? T.o : isDraw ? T.draw : T.textSecondary;
  const statusBorder = winner === "X" ? T.xBorder : winner === "O" ? T.oBorder : isDraw ? "#7DD3FC" : T.border;

  // Turn indicator dot
  const activeColor = isXNext ? T.x : T.o;

  // ── Cell ─────────────────────────────────────────────────────────────────
  const renderCell = (index: number) => {
    const val = board[index];
    const isWinCell = winLine.includes(index);
    const isNew = animCells.includes(index);
    const burst = burstCell === index;
    const cellColor = val === "X" ? T.x : T.o;
    const cellLight = val === "X" ? T.xLight : T.oLight;
    const cellBorder = val === "X" ? T.xBorder : T.oBorder;
    const cellShadow = val === "X" ? T.xShadow : T.oShadow;
    const hintColor = isXNext ? T.x : T.o;

    return (
      <div
        key={index}
        onClick={() => handlePress(index)}
        style={{
          position: "relative",
          width: "calc(33.333% - 10px)",
          aspectRatio: "1",
          margin: 5,
          borderRadius: 18,
          background: isWinCell ? cellLight : T.surface,
          border: isWinCell
            ? `2.5px solid ${cellBorder}`
            : `2px solid ${T.border}`,
          boxShadow: isWinCell
            ? `0 4px 20px ${cellShadow}, inset 0 1px 0 rgba(255,255,255,0.8)`
            : `0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: val || winner || isDraw || thinking ? "default" : "pointer",
          transition: "all 0.18s ease",
          overflow: "hidden",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <Particles active={burst} color={cellColor} />

        {val ? (
          <span style={{
            fontSize: 54, fontWeight: 900, lineHeight: 1,
            color: cellColor,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            animation: isNew ? "popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) forwards" : "none",
            display: "inline-block",
            userSelect: "none",
          }}>{val}</span>
        ) : !winner && !isDraw && !thinking ? (
          <span style={{
            fontSize: 30, color: hintColor, opacity: 0.1,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            fontWeight: 900, pointerEvents: "none", userSelect: "none",
          }}>{isXNext ? "X" : "O"}</span>
        ) : null}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: "100vh", width: "100%",
      background: T.bg,
      backgroundImage: `
        radial-gradient(ellipse 70% 40% at 20% 0%, rgba(79,70,229,0.08) 0%, transparent 60%),
        radial-gradient(ellipse 60% 40% at 80% 100%, rgba(234,88,12,0.07) 0%, transparent 60%)
      `,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "28px 20px",
      boxSizing: "border-box",
    }}>

      <style>{`
        @keyframes popIn {
          0%   { transform: scale(0) rotate(-12deg); opacity: 0; }
          100% { transform: scale(1) rotate(0deg);  opacity: 1; }
        }
        @keyframes burst {
          0%   { transform: translate(-50%,-50%) rotate(var(--angle)) translateX(0) scale(1); opacity: 1; }
          100% { transform: translate(-50%,-50%) rotate(var(--angle)) translateX(var(--dist)) scale(0); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        @keyframes fadeUp {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @keyframes dotBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: 24, animation: "fadeUp 0.5s ease" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          fontSize: 11, letterSpacing: 4, color: T.textMuted,
          textTransform: "uppercase", marginBottom: 6,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.x, display: "inline-block" }} />
          STRATEGY GAME
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.o, display: "inline-block" }} />
        </div>
        <h1 style={{
          margin: 0, fontSize: 38, fontWeight: 900, letterSpacing: -1,
          color: T.textPrimary,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
        }}>
          TIC<span style={{ color: T.x }}>·</span>TAC<span style={{ color: T.o }}>·</span>TOE
        </h1>
      </div>

      {/* ── Mode switcher ── */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 24,
        background: T.surfaceAlt,
        borderRadius: 14, padding: 5,
        border: `1.5px solid ${T.border}`,
        boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
        animation: "fadeUp 0.5s ease 0.05s both",
      }}>
        {([["pvp", "👥 2 Players"], ["pvc", "🤖 vs AI"]] as [GameMode, string][]).map(([m, label]) => (
          <button key={m} onClick={() => { setMode(m); resetAll(); }} style={{
            padding: "9px 18px", borderRadius: 10,
            border: mode === m ? `1.5px solid ${T.xBorder}` : "1.5px solid transparent",
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
            background: mode === m ? T.surface : "transparent",
            color: mode === m ? T.x : T.textMuted,
            boxShadow: mode === m ? `0 2px 8px ${T.xShadow}` : "none",
            transition: "all 0.2s",
            WebkitTapHighlightColor: "transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* ── Scoreboard ── */}
      <div style={{
        display: "flex", gap: 14, marginBottom: 24, alignItems: "center",
        animation: "fadeUp 0.5s ease 0.1s both",
      }}>
        <ScoreBadge label={mode === "pvc" ? "YOU" : "X"} score={scores.X} player="X" />

        <div style={{ textAlign: "center", padding: "0 4px" }}>
          <div style={{
            fontSize: 10, color: T.textMuted, letterSpacing: 2,
            marginBottom: 4, fontFamily: "'SF Mono', 'Fira Code', monospace",
            textTransform: "uppercase",
          }}>TIE</div>
          <div style={{
            fontSize: 34, fontWeight: 900, color: T.draw,
            fontFamily: "'SF Mono', 'Fira Code', monospace",
          }}>{scores.D}</div>
        </div>

        <ScoreBadge label={mode === "pvc" ? "AI" : "O"} score={scores.O} player="O" />
      </div>

      {/* ── Status pill ── */}
      <div style={{
        marginBottom: 20,
        padding: "11px 24px",
        background: statusBg,
        border: `1.5px solid ${statusBorder}`,
        borderRadius: 40,
        boxShadow: `0 2px 12px ${statusColor}18`,
        display: "flex", alignItems: "center", gap: 8,
        animation: thinking ? "pulse 1.2s ease infinite" : "fadeUp 0.3s ease",
        transition: "background 0.3s, border-color 0.3s",
      }}>
        {/* Turn dot — only when game is live */}
        {!winner && !isDraw && (
          <span style={{
            width: 9, height: 9, borderRadius: "50%",
            background: thinking ? T.o : activeColor,
            display: "inline-block", flexShrink: 0,
            animation: thinking ? "dotBlink 1.2s ease infinite" : "none",
            boxShadow: `0 0 8px ${thinking ? T.o : activeColor}`,
          }} />
        )}
        <span style={{
          fontSize: 15, fontWeight: 700, color: statusColor,
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          letterSpacing: 0.5,
        }}>{statusText}</span>
      </div>

      {/* ── Board ── */}
      <div style={{
        display: "flex", flexWrap: "wrap",
        width: 320, padding: 5,
        background: T.surfaceAlt,
        borderRadius: 24,
        border: `2px solid ${T.border}`,
        boxShadow: T.shadowLg,
        animation: "fadeUp 0.5s ease 0.15s both",
      }}>
        {board.map((_, i) => renderCell(i))}
      </div>

      {/* ── Buttons ── */}
      <div style={{
        display: "flex", gap: 10, marginTop: 24,
        animation: "fadeUp 0.5s ease 0.2s both",
      }}>
        <button onClick={resetGame} style={{
          padding: "13px 28px", borderRadius: 40,
          background: T.x, border: "none",
          color: "#fff", fontSize: 13, fontWeight: 800,
          cursor: "pointer", letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          boxShadow: `0 4px 16px ${T.xShadow}`,
          transition: "all 0.18s",
          WebkitTapHighlightColor: "transparent",
          minWidth: 130,
        }}>↺ New Game</button>

        <button onClick={resetAll} style={{
          padding: "13px 20px", borderRadius: 40,
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          color: T.textMuted, fontSize: 13, fontWeight: 700,
          cursor: "pointer", letterSpacing: 1.5,
          textTransform: "uppercase",
          fontFamily: "'SF Mono', 'Fira Code', monospace",
          transition: "all 0.18s",
          WebkitTapHighlightColor: "transparent",
        }}>✕ Reset</button>
      </div>

      {/* ── Footer ── */}
      <div style={{
        marginTop: 28, fontSize: 10, color: T.textMuted,
        letterSpacing: 3, textTransform: "uppercase",
        fontFamily: "'SF Mono', 'Fira Code', monospace",
        opacity: 0.5,
      }}>
        NEON GRID · v1.0
      </div>
    </div>
  );
}