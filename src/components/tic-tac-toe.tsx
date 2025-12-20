"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, RefreshCw, User, Cpu, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Player = "X" | "O" | null;
type GameMode = "PvP" | "PvE";
type Difficulty = "Easy" | "Hard";

const WIN_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6],             // Diagonals
];

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>("PvE");
  const [difficulty, setDifficulty] = useState<Difficulty>("Hard");
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [winner, setWinner] = useState<Player | "Draw">(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

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

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      setWinner(result.winner);
      setWinningLine(result.line);
      if (result.winner === "X") setScores((s) => ({ ...s, X: s.X + 1 }));
      else if (result.winner === "O") setScores((s) => ({ ...s, O: s.O + 1 }));
      else setScores((s) => ({ ...s, draws: s.draws + 1 }));
    } else {
      setIsXNext(!isXNext);
    }
  }, [board, isXNext, winner, checkWinner]);

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
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden bg-[#050505]">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <BackgroundAnimations />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-4xl font-black tracking-tighter bg-gradient-to-br from-white via-white/80 to-white/40 bg-clip-text text-transparent">
              TIC TAC TOE
            </CardTitle>
            <div className="flex justify-center gap-4 mt-2">
              <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Mode</span>
                <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => { setGameMode("PvP"); resetGame(); }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs transition-all duration-300 flex items-center gap-1.5",
                      gameMode === "PvP" ? "bg-white text-black font-bold" : "text-white/60 hover:text-white"
                    )}
                  >
                    <User className="w-3 h-3" /> PvP
                  </button>
                  <button
                    onClick={() => { setGameMode("PvE"); resetGame(); }}
                    className={cn(
                      "px-3 py-1 rounded-md text-xs transition-all duration-300 flex items-center gap-1.5",
                      gameMode === "PvE" ? "bg-white text-black font-bold" : "text-white/60 hover:text-white"
                    )}
                  >
                    <Cpu className="w-3 h-3" /> AI
                  </button>
                </div>
              </div>
              {gameMode === "PvE" && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Difficulty</span>
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button
                      onClick={() => setDifficulty("Easy")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs transition-all duration-300",
                        difficulty === "Easy" ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                      )}
                    >
                      Easy
                    </button>
                    <button
                      onClick={() => setDifficulty("Hard")}
                      className={cn(
                        "px-3 py-1 rounded-md text-xs transition-all duration-300",
                        difficulty === "Hard" ? "bg-white/20 text-white font-bold" : "text-white/60 hover:text-white"
                      )}
                    >
                      Hard
                    </button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Score Board */}
            <div className="grid grid-cols-3 gap-4">
              <ScoreCard label="Player X" value={scores.X} color="text-cyan-400" active={isXNext && !winner} />
              <ScoreCard label="Draws" value={scores.draws} color="text-white/60" />
              <ScoreCard label={gameMode === "PvE" ? "Computer" : "Player O"} value={scores.O} color="text-rose-500" active={!isXNext && !winner} />
            </div>

            {/* Game Board */}
            <div className="grid grid-cols-3 gap-3 aspect-square w-full">
              {board.map((cell, idx) => (
                <motion.button
                  key={idx}
                  whileHover={!cell && !winner ? { scale: 0.98, backgroundColor: "rgba(255,255,255,0.08)" } : {}}
                  whileTap={!cell && !winner ? { scale: 0.95 } : {}}
                  onClick={() => handleMove(idx)}
                  className={cn(
                    "relative flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 transition-colors duration-300 text-5xl",
                    winningLine?.includes(idx) && cell === "X" && "bg-cyan-500/20 border-cyan-500/50",
                    winningLine?.includes(idx) && cell === "O" && "bg-rose-500/20 border-rose-500/50"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {cell === "X" && (
                      <motion.div
                        key="X"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-cyan-400 font-black drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                      >
                        <Hash className="w-12 h-12 stroke-[3]" />
                      </motion.div>
                    )}
                    {cell === "O" && (
                      <motion.div
                        key="O"
                        initial={{ scale: 0, rotate: 45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="text-rose-500 font-black drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]"
                      >
                        <div className="w-10 h-10 rounded-full border-[6px] border-current" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-2"
                  >
                    <span className="text-xl font-bold flex items-center justify-center gap-2">
                      {winner === "Draw" ? (
                        "It's a Draw!"
                      ) : (
                        <>
                          <Trophy className={cn("w-6 h-6", winner === "X" ? "text-cyan-400" : "text-rose-500")} />
                          {winner === "X" ? "Player X" : (gameMode === "PvE" ? "Computer" : "Player O")} Wins!
                        </>
                      )}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="outline"
                onClick={resetGame}
                className="w-full h-12 bg-white/5 border-white/10 hover:bg-white hover:text-black transition-all duration-300 font-bold tracking-tight text-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                RESET GAME
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function ScoreCard({ label, value, color, active }: { label: string, value: number, color: string, active?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center p-3 rounded-2xl border border-white/5 bg-white/5 transition-all duration-300",
      active && "bg-white/10 border-white/20 scale-105"
    )}>
      <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</span>
      <span className={cn("text-2xl font-black mt-1", color)}>{value}</span>
      {active && (
        <motion.div
          layoutId="active-indicator"
          className="w-1 h-1 rounded-full bg-white mt-2"
        />
      )}
    </div>
  );
}

function BackgroundAnimations() {
  return (
    <>
      {/* Moving Shapes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-br from-white/10 to-transparent blur-3xl"
          animate={{
            x: [
              Math.random() * 100 - 50 + "vw",
              Math.random() * 100 - 50 + "vw",
              Math.random() * 100 - 50 + "vw",
            ],
            y: [
              Math.random() * 100 - 50 + "vh",
              Math.random() * 100 - 50 + "vh",
              Math.random() * 100 - 50 + "vh",
            ],
            scale: [1, 1.5, 1],
            opacity: [0.1, 0.3, 0.1],
          }}
          transition={{
            duration: 10 + Math.random() * 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            width: 300 + Math.random() * 300,
            height: 300 + Math.random() * 300,
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
          }}
        />
      ))}

      {/* Glitter / Star field */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#050505_100%)]" />
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 2 + 1 + "px",
              height: Math.random() * 2 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
            }}
            animate={{
              opacity: [0.1, 0.8, 0.1],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </>
  );
}
