"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  RefreshCw, 
  User, 
  Cpu, 
  Hash, 
  RotateCcw, 
  History, 
  Palette,
  Settings2,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Player = "X" | "O" | null;
type GameMode = "PvP" | "PvE";
type Difficulty = "Easy" | "Hard";
type Theme = "Neon" | "Cyberpunk" | "Aurora" | "Midnight";

const WIN_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

const THEMES: Record<Theme, { 
  bg: string, 
  accent1: string, 
  accent2: string, 
  card: string,
  text: string,
  xColor: string,
  oColor: string 
}> = {
  Neon: {
    bg: "from-blue-950 via-slate-950 to-purple-950",
    accent1: "cyan-400",
    accent2: "purple-500",
    card: "bg-white/5 border-white/10",
    text: "text-white",
    xColor: "text-cyan-400",
    oColor: "text-purple-500"
  },
  Cyberpunk: {
    bg: "from-yellow-950 via-slate-950 to-pink-950",
    accent1: "yellow-400",
    accent2: "pink-500",
    card: "bg-black/40 border-yellow-500/20",
    text: "text-yellow-50",
    xColor: "text-yellow-400",
    oColor: "text-pink-500"
  },
  Aurora: {
    bg: "from-emerald-950 via-slate-950 to-teal-950",
    accent1: "emerald-400",
    accent2: "teal-400",
    card: "bg-emerald-900/10 border-emerald-500/20",
    text: "text-emerald-50",
    xColor: "text-emerald-400",
    oColor: "text-teal-400"
  },
  Midnight: {
    bg: "from-slate-950 via-black to-slate-900",
    accent1: "slate-200",
    accent2: "rose-500",
    card: "bg-white/5 border-white/10",
    text: "text-slate-100",
    xColor: "text-slate-100",
    oColor: "text-rose-500"
  }
};

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [history, setHistory] = useState<Player[][]>([]);
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>("PvE");
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  const [theme, setTheme] = useState<Theme>("Neon");
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winner, setWinner] = useState<Player | "Draw">(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [gameLog, setGameLog] = useState<string[]>(["Game started"]);

  const currentTheme = THEMES[theme];

  const checkWinner = useCallback((currentBoard: Player[]) => {
    for (const combo of WIN_COMBINATIONS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: "Draw" as const, line: null };
    }
    return null;
  }, []);

  const minimax = useCallback((currentBoard: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(currentBoard);
    if (result?.winner === "O") return 10 - depth;
    if (result?.winner === "X") return depth - 10;
    if (result?.winner === "Draw") return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = "O";
          const score = minimax(currentBoard, depth + 1, false);
          currentBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!currentBoard[i]) {
          currentBoard[i] = "X";
          const score = minimax(currentBoard, depth + 1, true);
          currentBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  }, [checkWinner]);

  const getBestMove = useCallback((currentBoard: Player[]) => {
    if (difficulty === "Easy") {
      const availableMoves = currentBoard.map((val, idx) => val === null ? idx : null).filter((val) => val !== null) as number[];
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!currentBoard[i]) {
        currentBoard[i] = "O";
        const score = minimax(currentBoard, 0, false);
        currentBoard[i] = null;
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }, [difficulty, minimax]);

  const handleMove = useCallback((index: number) => {
    if (board[index] || winner) return;

    setHistory((prev) => [...prev, board]);
    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === "X") {
        setScores((s) => ({ ...s, X: s.X + 1 }));
        setGameLog((l) => [`Player X wins!`, ...l.slice(0, 4)]);
      } else if (result.winner === "O") {
        setScores((s) => ({ ...s, O: s.O + 1 }));
        setGameLog((l) => [`${gameMode === "PvE" ? "Computer" : "Player O"} wins!`, ...l.slice(0, 4)]);
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        setGameLog((l) => [`It's a draw!`, ...l.slice(0, 4)]);
      }
    } else {
      setIsXNext(!isXNext);
      setGameLog((l) => [`${isXNext ? "X" : "O"} moved to ${index + 1}`, ...l.slice(0, 4)]);
    }
  }, [board, isXNext, winner, checkWinner, gameMode]);

  useEffect(() => {
    if (gameMode === "PvE" && !isXNext && !winner) {
      const timer = setTimeout(() => {
        const move = getBestMove(board);
        if (move !== -1) handleMove(move);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, winner, board, getBestMove, handleMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setHistory([]);
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setGameLog(["Game reset"]);
  };

  const undoMove = () => {
    if (history.length === 0 || winner) return;
    
    const lastState = history[history.length - 1];
    setBoard(lastState);
    setHistory((prev) => prev.slice(0, -1));
    setIsXNext(!isXNext);
    setGameLog((l) => ["Undo performed", ...l.slice(0, 4)]);
  };

  return (
    <div className={cn(
      "relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden transition-colors duration-1000 bg-gradient-to-br",
      currentTheme.bg
    )}>
      {/* Dynamic Aurora Background */}
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Sidebar Left: Stats & Modes */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-4 h-4 opacity-50" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Settings</span>
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Game Mode</label>
                  <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                    <ModeButton active={gameMode === "PvP"} onClick={() => { setGameMode("PvP"); resetGame(); }} icon={<User className="w-3 h-3" />} label="PvP" />
                    <ModeButton active={gameMode === "PvE"} onClick={() => { setGameMode("PvE"); resetGame(); }} icon={<Cpu className="w-3 h-3" />} label="AI" />
                  </div>
                </div>

                {gameMode === "PvE" && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest opacity-40">Difficulty</label>
                    <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                      <ModeButton active={difficulty === "Easy"} onClick={() => setDifficulty("Easy")} label="Easy" />
                      <ModeButton active={difficulty === "Hard"} onClick={() => setDifficulty("Hard")} label="Hard" />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Theme</label>
                  <div className="grid grid-cols-2 gap-1">
                    {(Object.keys(THEMES) as Theme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "px-2 py-1.5 rounded-md text-[10px] font-bold transition-all",
                          theme === t ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-widest opacity-50">Log</span>
                </div>
                <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="opacity-40 hover:opacity-100 transition-opacity">
                  {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>
              <div className="space-y-2 h-32 overflow-hidden flex flex-col justify-end">
                {gameLog.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1 - i * 0.2, x: 0 }}
                    className="text-xs opacity-80 border-l-2 border-white/10 pl-2 py-1"
                  >
                    {log}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <div className="text-center space-y-2">
            <motion.h1 
              layout
              className={cn("text-6xl font-black tracking-tighter transition-all duration-700", currentTheme.text)}
            >
              TIC<span className={cn("mx-2", currentTheme.xColor)}>TAC</span>TOE
            </motion.h1>
            <p className="text-xs uppercase tracking-[0.5em] opacity-40 font-bold">Interactive Experience</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ScoreCard 
              label="Player X" 
              value={scores.X} 
              active={isXNext && !winner} 
              color={currentTheme.xColor}
              themeCard={currentTheme.card}
            />
            <ScoreCard 
              label="Draws" 
              value={scores.draws} 
              color="text-white/60"
              themeCard={currentTheme.card}
            />
            <ScoreCard 
              label={gameMode === "PvE" ? "AI Bot" : "Player O"} 
              value={scores.O} 
              active={!isXNext && !winner} 
              color={currentTheme.oColor}
              themeCard={currentTheme.card}
            />
          </div>

          <div className="relative aspect-square w-full max-w-[450px] mx-auto">
            <div className="absolute inset-0 grid grid-cols-3 gap-3">
              {board.map((cell, idx) => (
                <GridCell
                  key={idx}
                  index={idx}
                  cell={cell}
                  onClick={() => handleMove(idx)}
                  isWinning={winningLine?.includes(idx)}
                  disabled={!!winner}
                  xColor={currentTheme.xColor}
                  oColor={currentTheme.oColor}
                  cardStyle={currentTheme.card}
                />
              ))}
            </div>
            {winner && <Confetti winColor={winner === "X" ? currentTheme.xColor : currentTheme.oColor} />}
          </div>

          <div className="flex gap-3 max-w-[450px] mx-auto">
            <Button
              variant="outline"
              onClick={undoMove}
              disabled={history.length === 0 || !!winner}
              className={cn("flex-1 h-14 transition-all duration-500 font-black tracking-widest", currentTheme.card, "hover:bg-white/10")}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              UNDO
            </Button>
            <Button
              variant="outline"
              onClick={resetGame}
              className={cn("flex-2 h-14 transition-all duration-500 font-black tracking-widest", currentTheme.card, "hover:bg-white hover:text-black")}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              RESET GAME
            </Button>
          </div>
        </div>

        {/* Sidebar Right: Trophies / Info */}
        <div className="lg:col-span-3 space-y-4 order-3">
          <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">Achievements</span>
              </div>
              <div className="space-y-3">
                <AchievementItem label="Win streak" value="3 Games" completed={scores.X > 2} />
                <AchievementItem label="Perfect game" value="Locked" completed={false} />
                <AchievementItem label="Beat AI Hard" value="Completed" completed={scores.X > 0 && difficulty === "Hard"} />
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4 text-center opacity-20">
            <p className="text-[10px] font-bold uppercase tracking-widest">Version 2.0.4</p>
            <p className="text-[8px] mt-1">Refined Gaming Interface</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function GridCell({ index, cell, onClick, isWinning, disabled, xColor, oColor, cardStyle }: any) {
  return (
    <motion.button
      whileHover={!cell && !disabled ? { scale: 0.98, y: -2 } : {}}
      whileTap={!cell && !disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-2xl border transition-all duration-500",
        cardStyle,
        isWinning && "ring-2 ring-offset-2 ring-offset-transparent scale-105 z-20",
        isWinning && cell === "X" && "border-cyan-400 bg-cyan-400/20 ring-cyan-400/50",
        isWinning && cell === "O" && "border-purple-400 bg-purple-400/20 ring-purple-400/50",
        !cell && !disabled && "hover:border-white/40"
      )}
    >
      <AnimatePresence mode="wait">
        {cell === "X" && (
          <motion.div
            key="X"
            initial={{ scale: 0.5, opacity: 0, rotate: -45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className={cn("font-black drop-shadow-2xl", xColor)}
          >
            <Hash className="w-12 h-12 lg:w-16 lg:h-16 stroke-[3]" />
          </motion.div>
        )}
        {cell === "O" && (
          <motion.div
            key="O"
            initial={{ scale: 0.5, opacity: 0, rotate: 45 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className={cn("font-black drop-shadow-2xl", oColor)}
          >
            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full border-[6px] lg:border-[8px] border-current" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

function ScoreCard({ label, value, color, active, themeCard }: any) {
  return (
    <div className={cn(
      "flex flex-col items-center p-3 rounded-2xl border transition-all duration-500 backdrop-blur-md",
      themeCard,
      active && "bg-white/10 border-white/40 scale-105 shadow-xl"
    )}>
      <span className="text-[10px] uppercase tracking-widest opacity-40 font-bold">{label}</span>
      <span className={cn("text-3xl font-black mt-1", color)}>{value}</span>
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="w-1.5 h-1.5 rounded-full bg-white mt-2 shadow-[0_0_10px_white]"
        />
      )}
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5",
        active ? "bg-white text-black shadow-lg" : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {icon} {label}
    </button>
  );
}

function AchievementItem({ label, value, completed }: any) {
  return (
    <div className="flex items-center justify-between group">
      <span className={cn("text-[10px] font-medium transition-opacity", completed ? "opacity-100" : "opacity-40")}>{label}</span>
      <span className={cn(
        "text-[10px] px-2 py-0.5 rounded-full font-bold",
        completed ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/20"
      )}>
        {value}
      </span>
    </div>
  );
}

function AuroraBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_60s_linear_infinite] opacity-30">
        <div className="absolute top-1/2 left-1/2 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_50%)] from-cyan-500/20 mix-blend-screen blur-[100px]" />
        <div className="absolute top-1/4 left-1/4 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_50%)] from-purple-500/20 mix-blend-screen blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_50%)] from-rose-500/20 mix-blend-screen blur-[100px]" />
      </div>
      
      {/* Moving gradient lines (no shapes) */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[2px] w-full bg-gradient-to-r from-transparent via-white to-transparent"
            animate={{
              top: ["0%", "100%", "0%"],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 5 + i * 2,
              repeat: Infinity,
              ease: "linear",
              delay: i * 1.5
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-150" />
    </div>
  );
}

function Confetti({ winColor }: { winColor: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: "50%", 
            left: "50%", 
            scale: 0,
            opacity: 1
          }}
          animate={{ 
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            scale: [0, 1, 0.5],
            opacity: [1, 1, 0],
            rotate: Math.random() * 360
          }}
          transition={{
            duration: 1.5,
            ease: "easeOut",
            delay: Math.random() * 0.2
          }}
          className={cn("absolute w-2 h-2 rounded-sm", winColor.replace('text-', 'bg-'))}
          style={{ backgroundColor: 'currentColor' }}
        />
      ))}
    </div>
  );
}
