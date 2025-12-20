"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
  VolumeX,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  LineChart,
  BarChart3,
  Users,
  Award,
  Zap,
  Star,
  Shield,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Player = "X" | "O" | null;
type GameMode = "PvP" | "PvE";
type Difficulty = "Easy" | "Hard";
type Theme = "Neon" | "Cyberpunk" | "Aurora" | "Midnight";
type LogType = "info" | "success" | "warning";

interface LogEntry {
  message: string;
  type: LogType;
  time: string;
}

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
  muted: string,
  xColor: string,
  oColor: string 
}> = {
  Neon: {
    bg: "from-blue-950 via-slate-950 to-purple-950",
    accent1: "cyan-400",
    accent2: "purple-500",
    card: "bg-white/5 border-white/10",
    text: "text-white",
    muted: "text-white/40",
    xColor: "text-cyan-400",
    oColor: "text-purple-500"
  },
  Cyberpunk: {
    bg: "from-yellow-950 via-slate-950 to-pink-950",
    accent1: "yellow-400",
    accent2: "pink-500",
    card: "bg-black/40 border-yellow-500/20",
    text: "text-yellow-50",
    muted: "text-yellow-50/40",
    xColor: "text-yellow-400",
    oColor: "text-pink-500"
  },
  Aurora: {
    bg: "from-emerald-950 via-slate-950 to-teal-950",
    accent1: "emerald-400",
    accent2: "teal-400",
    card: "bg-emerald-900/10 border-emerald-500/20",
    text: "text-emerald-50",
    muted: "text-emerald-50/40",
    xColor: "text-emerald-400",
    oColor: "text-teal-400"
  },
  Midnight: {
    bg: "from-slate-950 via-black to-slate-900",
    accent1: "slate-200",
    accent2: "rose-500",
    card: "bg-white/5 border-white/10",
    text: "text-slate-100",
    muted: "text-slate-100/40",
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
  const [gameLog, setGameLog] = useState<LogEntry[]>([{ 
    message: "Game started", 
    type: "info", 
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
  }]);
  
  const [sessionStats, setSessionStats] = useState({
    totalMoves: 0,
    startTime: Date.now(),
    optimalMoves: 0,
    matchesPlayed: 0
  });

  const logContainerRef = useRef<HTMLDivElement>(null);

  const currentTheme = THEMES[theme];

  const addLog = useCallback((message: string, type: LogType = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setGameLog(prev => [{ message, type, time }, ...prev.slice(0, 19)]);
  }, []);

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
    const currentPlayer = isXNext ? "X" : "O";
    newBoard[index] = currentPlayer;
    setBoard(newBoard);
    setSessionStats(prev => ({
      ...prev,
      totalMoves: prev.totalMoves + 1
    }));

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === "X") {
        setScores((s) => ({ ...s, X: s.X + 1 }));
        addLog("Player X wins!", "success");
      } else if (result.winner === "O") {
        setScores((s) => ({ ...s, O: s.O + 1 }));
        addLog(`${gameMode === "PvE" ? "Computer" : "Player O"} wins!`, "success");
      } else {
        setScores((s) => ({ ...s, draws: s.draws + 1 }));
        addLog("It's a draw!", "warning");
      }
    } else {
      setIsXNext(!isXNext);
      addLog(`${currentPlayer} moved to position ${index + 1}`);
    }
  }, [board, isXNext, winner, checkWinner, gameMode, addLog]);

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
    setSessionStats(prev => ({ ...prev, matchesPlayed: prev.matchesPlayed + 1 }));
    addLog("Game reset", "info");
  };

  const undoMove = () => {
    if (history.length === 0 || winner) return;
    
    const lastState = history[history.length - 1];
    setBoard(lastState);
    setHistory((prev) => prev.slice(0, -1));
    setIsXNext(!isXNext);
    addLog("Undo performed", "warning");
  };

  return (
    <div className={cn(
      "relative min-h-screen w-full flex flex-col items-center justify-start p-4 lg:p-12 overflow-x-hidden transition-colors duration-1000 bg-gradient-to-br",
      currentTheme.bg
    )}>
      {/* Dynamic Aurora Background */}
      <AuroraBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Sidebar Left: Settings */}
        <div className="lg:col-span-3 space-y-4 order-2 lg:order-1">
          <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Settings2 className={cn("w-4 h-4", currentTheme.muted)} />
                <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Settings</span>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-widest block font-bold", currentTheme.muted)}>Game Mode</label>
                  <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                    <ModeButton active={gameMode === "PvP"} onClick={() => { setGameMode("PvP"); resetGame(); }} icon={<User className="w-3 h-3" />} label="PvP" />
                    <ModeButton active={gameMode === "PvE"} onClick={() => { setGameMode("PvE"); resetGame(); }} icon={<Cpu className="w-3 h-3" />} label="AI" />
                  </div>
                </div>

                {gameMode === "PvE" && (
                  <div className="space-y-2">
                    <label className={cn("text-[10px] uppercase tracking-widest block font-bold", currentTheme.muted)}>Difficulty</label>
                    <div className="flex bg-white/5 p-1 rounded-lg gap-1">
                      <ModeButton active={difficulty === "Easy"} onClick={() => setDifficulty("Easy")} label="Easy" />
                      <ModeButton active={difficulty === "Hard"} onClick={() => setDifficulty("Hard")} label="Hard" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className={cn("text-[10px] uppercase tracking-widest block font-bold", currentTheme.muted)}>Theme</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(THEMES) as Theme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "px-2 py-2 rounded-lg text-[10px] font-bold transition-all border",
                          theme === t 
                            ? "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                            : "bg-white/5 text-white/60 border-white/5 hover:border-white/20 hover:bg-white/10"
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

          {/* Activity Log */}
          <Card className={cn("backdrop-blur-xl transition-all duration-500 overflow-hidden", currentTheme.card)}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className={cn("w-4 h-4", currentTheme.muted)} />
                <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Activity Log</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={cn("hover:opacity-100 transition-opacity", currentTheme.muted)}>
                  {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            <CardContent className="p-0">
              <div 
                ref={logContainerRef}
                className="h-48 overflow-y-auto custom-scrollbar p-3 space-y-2 flex flex-col-reverse"
              >
                <AnimatePresence initial={false}>
                  {gameLog.map((log, i) => (
                    <motion.div
                      key={`${log.time}-${i}`}
                      initial={{ opacity: 0, x: -10, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: "auto" }}
                      exit={{ opacity: 0, x: 10 }}
                      className={cn(
                        "text-[10px] p-2 rounded-md border flex items-start gap-2",
                        log.type === "success" && "bg-green-500/10 border-green-500/20 text-green-400",
                        log.type === "warning" && "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                        log.type === "info" && "bg-white/5 border-white/5 text-white/70"
                      )}
                    >
                      {log.type === "success" && <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" />}
                      {log.type === "warning" && <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />}
                      {log.type === "info" && <Clock className="w-3 h-3 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <div className="font-medium">{log.message}</div>
                        <div className="opacity-40 mt-0.5 text-[8px] font-mono">{log.time}</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Game Area */}
        <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
          <div className="text-center space-y-2">
            <motion.h1 
              layout
              className={cn("text-6xl font-black tracking-tighter transition-all duration-700 drop-shadow-2xl", currentTheme.text)}
            >
              TIC<span className={cn("mx-2 transition-colors duration-500", currentTheme.xColor)}>TAC</span>TOE
            </motion.h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-8 bg-current opacity-20" />
              <p className={cn("text-[10px] uppercase tracking-[0.5em] font-black", currentTheme.muted)}>Nexus Evolution</p>
              <div className="h-px w-8 bg-current opacity-20" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <ScoreCard 
              label="Player X" 
              value={scores.X} 
              active={isXNext && !winner} 
              color={currentTheme.xColor}
              themeCard={currentTheme.card}
              textColor={currentTheme.text}
              mutedColor={currentTheme.muted}
            />
            <ScoreCard 
              label="Draws" 
              value={scores.draws} 
              color={currentTheme.text}
              themeCard={currentTheme.card}
              textColor={currentTheme.text}
              mutedColor={currentTheme.muted}
            />
            <ScoreCard 
              label={gameMode === "PvE" ? "AI Bot" : "Player O"} 
              value={scores.O} 
              active={!isXNext && !winner} 
              color={currentTheme.oColor}
              themeCard={currentTheme.card}
              textColor={currentTheme.text}
              mutedColor={currentTheme.muted}
            />
          </div>

          <div className="relative aspect-square w-full max-w-[450px] mx-auto p-4 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="absolute inset-0 grid grid-cols-3 gap-3 p-4">
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
                  theme={theme}
                />
              ))}
            </div>
            {winner && (
              <Confetti 
                winColor={winner === "X" ? currentTheme.xColor : (winner === "O" ? currentTheme.oColor : currentTheme.text)} 
              />
            )}
          </div>

          <div className="flex gap-4 max-w-[450px] mx-auto">
            <Button
              variant="outline"
              onClick={undoMove}
              disabled={history.length === 0 || !!winner}
              className={cn(
                "flex-1 h-14 transition-all duration-500 font-black tracking-widest border-2",
                currentTheme.card, 
                "hover:bg-white/10 active:scale-95 disabled:opacity-30",
                currentTheme.text
              )}
            >
              <RotateCcw className="w-5 h-5 mr-2" />
              UNDO
            </Button>
            <Button
              variant="outline"
              onClick={resetGame}
              className={cn(
                "flex-[1.5] h-14 transition-all duration-500 font-black tracking-widest border-2",
                currentTheme.card, 
                "hover:bg-white hover:text-black hover:border-white active:scale-95",
                currentTheme.text
              )}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              RESET GAME
            </Button>
          </div>
        </div>

          {/* Sidebar Right: Achievements & Intelligence */}
          <div className="lg:col-span-3 space-y-4 order-3">
            <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
              <CardContent className="p-4 space-y-5">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Mastery Achievements</span>
                </div>
                
                <div className="space-y-4">
                  <AchievementItem 
                    label="Grandmaster" 
                    desc="Win 5 games as X"
                    icon={<Zap className="w-4 h-4" />}
                    current={scores.X}
                    target={5}
                    completed={scores.X >= 5}
                    themeColor={currentTheme.accent1}
                  />
                  <AchievementItem 
                    label="Untouchable" 
                    desc="Defeat Hard AI"
                    icon={<Shield className="w-4 h-4" />}
                    current={scores.X > 0 && difficulty === "Hard" ? 1 : 0}
                    target={1}
                    completed={scores.X > 0 && difficulty === "Hard"}
                    themeColor={currentTheme.accent2}
                  />
                  <AchievementItem 
                    label="Peacekeeper" 
                    desc="Achieve 3 Draws"
                    icon={<Star className="w-4 h-4" />}
                    current={scores.draws}
                    target={3}
                    completed={scores.draws >= 3}
                    themeColor="white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={cn("backdrop-blur-xl transition-all duration-500", currentTheme.card)}>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Activity className={cn("w-4 h-4", currentTheme.muted)} />
                  <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Nexus Intelligence</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className={cn("text-[8px] font-bold uppercase tracking-tighter opacity-40", currentTheme.text)}>Win Rate</div>
                    <div className={cn("text-lg font-black", currentTheme.text)}>
                      {sessionStats.matchesPlayed > 0 ? `${Math.round((scores.X / sessionStats.matchesPlayed) * 100)}%` : "0%"}
                    </div>
                  </div>
                  <div className="space-y-1 text-right">
                    <div className={cn("text-[8px] font-bold uppercase tracking-tighter opacity-40", currentTheme.text)}>Accuracy</div>
                    <div className={cn("text-lg font-black text-cyan-400")}>94.2%</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn("text-[8px] font-bold uppercase tracking-widest opacity-40", currentTheme.text)}>Tactical Load</span>
                    <span className="text-[8px] text-green-400 font-mono">OPTIMAL</span>
                  </div>
                  <div className="flex gap-0.5 h-6">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [`${30 + Math.random() * 70}%`, `${30 + Math.random() * 70}%`] }}
                        transition={{ repeat: Infinity, duration: 1 + Math.random() }}
                        className={cn("flex-1 rounded-full", i < 14 ? "bg-cyan-500/40" : "bg-white/10")}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                  <span className={cn("text-[9px] font-bold uppercase tracking-widest", currentTheme.muted)}>Live Analysis Feed</span>
                </div>
              </CardContent>
            </Card>
            
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-center group hover:bg-white/10 transition-colors">
              <div className={cn("text-[10px] font-black uppercase tracking-[0.3em] mb-1", currentTheme.muted)}>System Status</div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className={cn("text-[8px] font-bold uppercase", currentTheme.text)}>Core Online</span>
              </div>
            </div>
          </div>

      </motion.div>

      {/* NEW Dashboard Footer: Analytics & Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 w-full max-w-6xl mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        <div className="lg:col-span-8">
          <Card className={cn("backdrop-blur-xl transition-all duration-500 overflow-hidden", currentTheme.card)}>
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className={cn("w-4 h-4", currentTheme.muted)} />
                <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Nexus Performance Analytics</span>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className={cn("text-[8px] uppercase font-bold opacity-40", currentTheme.text)}>Uptime</div>
                  <div className={cn("text-[10px] font-mono font-bold", currentTheme.text)}>
                    {Math.floor((Date.now() - sessionStats.startTime) / 60000)}m {Math.floor(((Date.now() - sessionStats.startTime) / 1000) % 60)}s
                  </div>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <AnalyticStat 
                  icon={<Hash className="w-4 h-4" />} 
                  label="Total Moves" 
                  value={sessionStats.totalMoves} 
                  subtext="Across all rounds"
                  theme={currentTheme}
                />
                <AnalyticStat 
                  icon={<Zap className="w-4 h-4" />} 
                  label="Matches" 
                  value={sessionStats.matchesPlayed} 
                  subtext="Session cycles"
                  theme={currentTheme}
                />
                <AnalyticStat 
                  icon={<BarChart3 className="w-4 h-4" />} 
                  label="Win Rate" 
                  value={sessionStats.matchesPlayed > 0 ? `${Math.round((scores.X / sessionStats.matchesPlayed) * 100)}%` : "0%"} 
                  subtext="X-Dominance"
                  theme={currentTheme}
                />
                <AnalyticStat 
                  icon={<LineChart className="w-4 h-4" />} 
                  label="Avg Move" 
                  value={sessionStats.totalMoves > 0 ? `${(Math.floor((Date.now() - sessionStats.startTime) / 1000) / sessionStats.totalMoves).toFixed(1)}s` : "0s"} 
                  subtext="Decision speed"
                  theme={currentTheme}
                />
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">Session Load</span>
                    <span className="text-[10px] text-green-400 font-mono">STABLE</span>
                  </div>
                  <div className="flex items-end gap-1 h-12">
                    {[...Array(12)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ height: 0 }}
                        animate={{ height: `${20 + Math.random() * 80}%` }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 + Math.random() }}
                        className={cn("flex-1 rounded-t-sm", i % 2 === 0 ? "bg-cyan-500/40" : "bg-purple-500/40")}
                      />
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                      <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                        strokeDasharray={175.9}
                        strokeDashoffset={175.9 - (175.9 * (scores.X / (scores.X + scores.O + scores.draws || 1)))}
                        className="text-cyan-400 transition-all duration-1000" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">X</div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-40">Tactical Efficiency</div>
                    <div className="text-xs font-black">NEURAL OPTIMIZED</div>
                    <div className="text-[9px] opacity-40 italic">Heuristic analysis active...</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className={cn("backdrop-blur-xl transition-all duration-500 h-full", currentTheme.card)}>
            <div className="p-4 border-b border-white/5 flex items-center gap-2">
              <Users className={cn("w-4 h-4", currentTheme.muted)} />
              <span className={cn("text-xs font-bold uppercase tracking-widest", currentTheme.muted)}>Global Leaderboard</span>
            </div>
            <CardContent className="p-4 space-y-3">
              <LeaderboardItem name="CyberGhost" rank={1} score={2450} avatar="CG" theme={currentTheme} />
              <LeaderboardItem name="NeonWraith" rank={2} score={2120} avatar="NW" theme={currentTheme} />
              <LeaderboardItem name="AuroraSage" rank={3} score={1890} avatar="AS" theme={currentTheme} isUser />
              <LeaderboardItem name="BitRunner" rank={4} score={1560} avatar="BR" theme={currentTheme} />
              <LeaderboardItem name="VoidWalker" rank={5} score={1240} avatar="VW" theme={currentTheme} />
              
              <div className="mt-4 pt-4 border-t border-white/5">
                <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 hover:bg-white/5">
                  View Full Rankings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

function GridCell({ index, cell, onClick, isWinning, disabled, xColor, oColor, cardStyle, theme }: any) {
  return (
    <motion.button
      whileHover={!cell && !disabled ? { scale: 0.98, y: -2 } : {}}
      whileTap={!cell && !disabled ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={cn(
        "relative flex items-center justify-center rounded-2xl border-2 transition-all duration-500 group overflow-hidden",
        cardStyle,
        isWinning && "ring-4 ring-offset-4 ring-offset-transparent scale-105 z-20",
        isWinning && cell === "X" && "border-cyan-400 bg-cyan-400/20 ring-cyan-400/50 shadow-[0_0_30px_rgba(34,211,238,0.3)]",
        isWinning && cell === "O" && "border-purple-400 bg-purple-400/20 ring-purple-400/50 shadow-[0_0_30px_rgba(192,132,252,0.3)]",
        !cell && !disabled && "hover:border-white/40 hover:bg-white/5"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <AnimatePresence mode="wait">
        {cell === "X" && (
          <motion.div
            key="X"
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className={cn("drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]", xColor)}
          >
            <Hash className="w-12 h-12 lg:w-16 lg:h-16 stroke-[3]" />
          </motion.div>
        )}
        {cell === "O" && (
          <motion.div
            key="O"
            initial={{ scale: 0, opacity: 0, rotate: 90 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className={cn("drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]", oColor)}
          >
            <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-full border-[6px] lg:border-[10px] border-current" />
          </motion.div>
        )}
      </AnimatePresence>
      
      {!cell && !disabled && (
        <div className="w-1 h-1 rounded-full bg-white/10 transition-transform group-hover:scale-150" />
      )}
    </motion.button>
  );
}

function ScoreCard({ label, value, color, active, themeCard, textColor, mutedColor }: any) {
  return (
    <div className={cn(
      "flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-500 backdrop-blur-md relative overflow-hidden",
      themeCard,
      active ? "bg-white/15 border-white/60 scale-105 shadow-[0_0_30px_rgba(255,255,255,0.1)]" : "opacity-60 grayscale-[0.5]"
    )}>
      {active && (
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-50" />
      )}
      <span className={cn("text-[10px] uppercase tracking-widest font-black mb-1", mutedColor)}>{label}</span>
      <span className={cn("text-4xl font-black tabular-nums transition-colors duration-500", color)}>{value}</span>
      
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="flex items-center gap-1 mt-2"
          >
            <div className="w-1 h-1 rounded-full bg-current animate-ping" style={{ color: 'white' }} />
            <span className="text-[8px] font-bold uppercase tracking-wider text-white">Turn</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 px-3 py-2 rounded-md text-[10px] font-black transition-all duration-300 flex items-center justify-center gap-2",
        active 
          ? "bg-white text-black shadow-lg scale-[1.02]" 
          : "text-white/40 hover:bg-white/5 hover:text-white/80"
      )}
    >
      {icon} <span>{label}</span>
    </button>
  );
}

function AchievementItem({ label, desc, icon, current, target, completed, themeColor }: any) {
  const progress = Math.min(100, (current / target) * 100);
  
  return (
    <div className="space-y-2 group">
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            completed ? "bg-white/10 text-white" : "bg-white/5 text-white/20"
          )}>
            {icon}
          </div>
          <div>
            <div className={cn("text-[11px] font-black leading-tight mb-0.5", completed ? "text-white" : "text-white/60")}>{label}</div>
            <div className="text-[9px] opacity-40 font-medium">{desc}</div>
          </div>
        </div>
        {completed && <CheckCircle2 className="w-4 h-4 text-green-500" />}
      </div>
      
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          className={cn("h-full transition-colors", completed ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-white/20")}
        />
      </div>
      <div className="flex justify-between text-[8px] font-bold uppercase tracking-widest opacity-30">
        <span>Progress</span>
        <span>{current} / {target}</span>
      </div>
    </div>
  );
}

function AnalyticStat({ icon, label, value, subtext, theme }: any) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn("p-1.5 rounded-md bg-white/5", theme.muted)}>{icon}</div>
        <span className={cn("text-[10px] font-bold uppercase tracking-wider opacity-40", theme.text)}>{label}</span>
      </div>
      <div className={cn("text-xl font-black tabular-nums", theme.text)}>{value}</div>
      <div className={cn("text-[9px] font-bold opacity-30 uppercase tracking-widest")}>{subtext}</div>
    </div>
  );
}

function LeaderboardItem({ name, rank, score, avatar, theme, isUser }: any) {
  return (
    <div className={cn(
      "flex items-center justify-between p-2 rounded-xl transition-all border",
      isUser ? "bg-white/10 border-white/20 shadow-lg" : "bg-white/5 border-transparent hover:border-white/10"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("text-[10px] font-black w-4 opacity-40")}>{rank}</div>
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center text-[10px] font-black">
          {avatar}
        </div>
        <div>
          <div className="text-[11px] font-black flex items-center gap-1.5">
            {name}
            {isUser && <span className="text-[8px] bg-cyan-500 text-black px-1 rounded-sm">YOU</span>}
          </div>
          <div className="text-[9px] opacity-30 uppercase tracking-widest font-bold">Rank {rank <= 3 ? "Elite" : "Pro"}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={cn("text-[11px] font-black tabular-nums", theme.text)}>{score}</div>
        <div className="text-[8px] opacity-30 uppercase tracking-tighter font-bold">Points</div>
      </div>
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
      
      <div className="absolute inset-0 opacity-10">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1px] w-full bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{
              top: ["-10%", "110%"],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 8 + i * 3,
              repeat: Infinity,
              ease: "linear",
              delay: i * 2.5
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15] brightness-150 mix-blend-overlay" />
    </div>
  );
}

function Confetti({ winColor }: { winColor: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none z-50">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            top: "50%", 
            left: "50%", 
            scale: 0,
            opacity: 1,
            rotate: 0
          }}
          animate={{ 
            top: `${Math.random() * 120 - 10}%`,
            left: `${Math.random() * 120 - 10}%`,
            scale: [0, 1, 0.5, 0],
            opacity: [1, 1, 1, 0],
            rotate: Math.random() * 720
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: "easeOut",
            delay: Math.random() * 0.3
          }}
          className={cn("absolute w-2 h-2 rounded-[1px]")}
          style={{ backgroundColor: 'currentColor', boxShadow: '0 0 10px currentColor' }}
        />
      ))}
    </div>
  );
}
