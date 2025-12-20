"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, RefreshCcw, User, Bot, Sparkles, X, Circle } from "lucide-react";

type Player = "X" | "O" | null;
type GameMode = "local" | "ai";
type Difficulty = "easy" | "hard";

const WIN_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6],             // Diagonals
];

export function TicTacToe() {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winner, setWinner] = useState<Player | "draw">(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });
  const [gameMode, setGameMode] = useState<GameMode>("local");
  const [difficulty, setDifficulty] = useState<Difficulty>("hard");
  const [isAiThinking, setIsAiThinking] = useState(false);

  const checkWinner = useCallback((currentBoard: Player[]) => {
    for (const combo of WIN_COMBINATIONS) {
      const [a, b, c] = combo;
      if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
        return { winner: currentBoard[a], line: combo };
      }
    }
    if (currentBoard.every((cell) => cell !== null)) {
      return { winner: "draw" as const, line: null };
    }
    return null;
  }, []);

  const handleMove = useCallback((index: number) => {
    if (board[index] || winner || isAiThinking) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) {
      if (result.winner === "draw") {
        setWinner("draw");
        setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
      } else {
        setWinner(result.winner);
        setWinningLine(result.line);
        setScores((prev) => ({ ...prev, [result.winner as string]: prev[result.winner as string] + 1 }));
      }
    } else {
      setIsXNext(!isXNext);
    }
  }, [board, winner, isAiThinking, isXNext, checkWinner]);

  // AI Logic
  const minimax = (tempBoard: Player[], depth: number, isMaximizing: boolean): number => {
    const result = checkWinner(tempBoard);
    if (result?.winner === "O") return 10 - depth;
    if (result?.winner === "X") return depth - 10;
    if (result?.winner === "draw") return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (!tempBoard[i]) {
          tempBoard[i] = "O";
          const score = minimax(tempBoard, depth + 1, false);
          tempBoard[i] = null;
          bestScore = Math.max(score, bestScore);
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (!tempBoard[i]) {
          tempBoard[i] = "X";
          const score = minimax(tempBoard, depth + 1, true);
          tempBoard[i] = null;
          bestScore = Math.min(score, bestScore);
        }
      }
      return bestScore;
    }
  };

  const getAiMove = useCallback(() => {
    if (difficulty === "easy") {
      const availableMoves = board.map((val, idx) => (val === null ? idx : null)).filter((val) => val !== null) as number[];
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }

    let bestScore = -Infinity;
    let move = -1;
    for (let i = 0; i < 9; i++) {
      if (!board[i]) {
        const tempBoard = [...board];
        tempBoard[i] = "O";
        const score = minimax(tempBoard, 0, false);
        if (score > bestScore) {
          bestScore = score;
          move = i;
        }
      }
    }
    return move;
  }, [board, difficulty]);

  useEffect(() => {
    if (gameMode === "ai" && !isXNext && !winner) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const move = getAiMove();
        if (move !== -1) handleMove(move);
        setIsAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [gameMode, isXNext, winner, getAiMove, handleMove]);

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
    setIsAiThinking(false);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 bg-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1),rgba(0,0,0,1))]" />
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 bg-blue-500/20 rounded-full"
            initial={{
              x: Math.random() * 100 + "%",
              y: Math.random() * 100 + "%",
              scale: Math.random() * 2,
            }}
            animate={{
              y: [null, "-10%"],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 tracking-tighter">
              TIC-TAC-TOE
            </h1>
            <Badge variant="outline" className="w-fit border-blue-500/30 text-blue-400">
              {gameMode === "ai" ? "vs Advanced AI" : "Local Multiplayer"}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-slate-900/50 border-slate-800"
              onClick={() => setGameMode(gameMode === "local" ? "ai" : "local")}
            >
              {gameMode === "local" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-slate-900/50 border-slate-800"
              onClick={resetGame}
            >
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-xs text-slate-400 uppercase font-bold mb-1">Player X</span>
              <span className="text-2xl font-black text-blue-400">{scores.X}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-xs text-slate-400 uppercase font-bold mb-1">Draws</span>
              <span className="text-2xl font-black text-slate-400">{scores.draws}</span>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/40 border-slate-800/50 backdrop-blur-md">
            <CardContent className="p-4 flex flex-col items-center">
              <span className="text-xs text-slate-400 uppercase font-bold mb-1">Player O</span>
              <span className="text-2xl font-black text-emerald-400">{scores.O}</span>
            </CardContent>
          </Card>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center mb-6">
          <AnimatePresence mode="wait">
            {winner ? (
              <motion.div
                key="winner"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="flex items-center gap-2 text-xl font-bold"
              >
                {winner === "draw" ? (
                  <span className="text-slate-300">It's a Draw!</span>
                ) : (
                  <>
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <span className={winner === "X" ? "text-blue-400" : "text-emerald-400"}>
                      Winner: {winner}
                    </span>
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="turn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-slate-400 font-medium"
              >
                {isAiThinking ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse text-emerald-400" />
                    <span>AI is thinking...</span>
                  </>
                ) : (
                  <>
                    <span className={isXNext ? "text-blue-400 font-bold" : "text-emerald-400 font-bold"}>
                      {isXNext ? "X" : "O"}'s Turn
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Game Board */}
        <div className="relative">
          <div className="grid grid-cols-3 gap-3">
            {board.map((cell, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: cell || winner ? 1 : 1.05 }}
                whileTap={{ scale: cell || winner ? 1 : 0.95 }}
                onClick={() => handleMove(idx)}
                className={`
                  aspect-square rounded-2xl flex items-center justify-center text-4xl
                  ${winningLine?.includes(idx) 
                    ? (cell === "X" ? "bg-blue-500/20 ring-2 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]" : "bg-emerald-500/20 ring-2 ring-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]")
                    : "bg-slate-900/60 border border-slate-800/50 hover:bg-slate-800/80 hover:border-slate-700"}
                  transition-colors duration-200
                `}
              >
                <AnimatePresence>
                  {cell === "X" && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-blue-400"
                    >
                      <X size={48} strokeWidth={3} />
                    </motion.div>
                  )}
                  {cell === "O" && (
                    <motion.div
                      initial={{ scale: 0, rotate: 45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="text-emerald-400"
                    >
                      <Circle size={40} strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
          
          {/* Difficulty selector for AI mode */}
          {gameMode === "ai" && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDifficulty("easy")}
                className={`rounded-full ${difficulty === "easy" ? "bg-blue-500/20 text-blue-400" : "text-slate-500"}`}
              >
                Easy
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDifficulty("hard")}
                className={`rounded-full ${difficulty === "hard" ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500"}`}
              >
                Advanced
              </Button>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm font-medium">
            Challenge your friends or test your skills against our neural-network AI.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
