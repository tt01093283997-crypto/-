import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Share2, RefreshCw, Eye, Trophy, Clock, Move, Upload, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';

const SlidingPuzzle = () => {
    const [gridSize, setGridSize] = useState(3);
    const [imageSrc, setImageSrc] = useState('./codari_robot.png');
    const [tiles, setTiles] = useState([]);
    const [moves, setMoves] = useState(0);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isWon, setIsWon] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [showNumbers, setShowNumbers] = useState(true);
    const timerRef = useRef(null);

    // Initialize and Shuffle
    const initGame = useCallback((size = gridSize, currentImage = imageSrc) => {
        const tileCount = size * size;
        const initialTiles = Array.from({ length: tileCount - 1 }, (_, i) => i);
        initialTiles.push(null); // The empty space

        // Shuffle and ensure it's solvable
        let shuffled;
        let solvable = false;

        while (!solvable) {
            shuffled = [...initialTiles].sort(() => Math.random() - 0.5);
            solvable = isSolvable(shuffled, size);
            // Also ensure it's not already solved
            if (shuffled.every((tile, i) => tile === (i === tileCount - 1 ? null : i))) {
                solvable = false;
            }
        }

        setTiles(shuffled);
        setMoves(0);
        setSeconds(0);
        setIsActive(true);
        setIsWon(false);
        setShowNumbers(prev => !prev);
    }, [gridSize, imageSrc]);

    // Solvability check for sliding puzzle
    const isSolvable = (tiles, size) => {
        let inversions = 0;
        const filteredTiles = tiles.filter(t => t !== null);
        for (let i = 0; i < filteredTiles.length - 1; i++) {
            for (let j = i + 1; j < filteredTiles.length; j++) {
                if (filteredTiles[i] > filteredTiles[j]) inversions++;
            }
        }

        if (size % 2 !== 0) {
            return inversions % 2 === 0;
        } else {
            const emptyRowFromBottom = size - Math.floor(tiles.indexOf(null) / size);
            return (inversions + emptyRowFromBottom) % 2 !== 0; // Check standard formula for even grid
        }
    };

    useEffect(() => {
        initGame();
    }, [initGame]);

    // Timer logic
    useEffect(() => {
        if (isActive && !isWon) {
            timerRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, isWon]);


    const handleTileClick = (index) => {
        if (isWon) return;

        const emptyIndex = tiles.indexOf(null);
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        const emptyRow = Math.floor(emptyIndex / gridSize);
        const emptyCol = emptyIndex % gridSize;

        const isAdjacent =
            (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
            (Math.abs(col - emptyCol) === 1 && row === emptyRow);

        if (isAdjacent) {
            const newTiles = [...tiles];
            newTiles[emptyIndex] = tiles[index];
            newTiles[index] = null;
            setTiles(newTiles);
            setMoves(prev => prev + 1);

            // Check win
            const won = newTiles.every((tile, i) =>
                tile === (i === gridSize * gridSize - 1 ? null : i)
            );

            if (won) {
                setIsWon(true);
                setIsActive(false);

                // 환호성 소리 재생
                const audio = new Audio(`${import.meta.env.BASE_URL}success.mp3`);
                audio.volume = 0.5;
                audio.play().catch(e => console.log('Audio play failed:', e));

                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#0ea5e9', '#38bdf8', '#7dd3fc']
                });
            }
        }
    };

    const formatTime = (totalSeconds) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const onDrop = useCallback(acceptedFiles => {
        const file = acceptedFiles[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false
    });

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
            <div className="max-w-4xl w-full">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-premium-400 to-premium-600 mb-2">
                            FISH ROBOT PUZZLE
                        </h1>
                        <p className="text-slate-400 flex items-center gap-2">
                            <Settings className="w-4 h-4" /> Sliding Mechanism • Interactive Robot AI
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
                            <Clock className="w-5 h-5 text-premium-400" />
                            <span className="text-2xl font-mono font-bold">{formatTime(seconds)}</span>
                        </div>
                        <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
                            <Move className="w-5 h-5 text-premium-400" />
                            <span className="text-2xl font-mono font-bold">{moves}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Puzzle Board */}
                    <div className="lg:col-span-2 flex flex-col items-center">
                        <div
                            className="relative p-2 glass rounded-3xl overflow-hidden shadow-2xl shadow-blue-500/10"
                            style={{
                                width: 'min(90vw, 500px)',
                                height: 'min(90vw, 500px)',
                            }}
                        >
                            <div
                                className="grid gap-1 h-full w-full"
                                style={{
                                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                                }}
                            >
                                {tiles.map((tile, index) => (
                                    <div
                                        key={index}
                                        onClick={() => handleTileClick(index)}
                                        className={`puzzle-tile relative rounded-lg overflow-hidden cursor-pointer ${tile === null ? 'bg-slate-900/50' : 'bg-slate-800'
                                            } ${isWon ? 'cursor-default' : ''}`}
                                    >
                                        {tile !== null && (
                                            <>
                                                <div
                                                    className="absolute inset-0 bg-no-repeat transition-transform"
                                                    style={{
                                                        backgroundImage: `url(${imageSrc})`,
                                                        backgroundSize: `${gridSize * 100}%`,
                                                        backgroundPosition: `${(tile % gridSize) * (100 / (gridSize - 1))}% ${Math.floor(tile / gridSize) * (100 / (gridSize - 1))}%`,
                                                    }}
                                                />
                                                {showNumbers && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
                                                        <span className="text-2xl font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] select-none">
                                                            {tile + 1}
                                                        </span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* Win Overlay */}
                            {isWon && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in zoom-in duration-300">
                                    <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce-slow" />
                                    <h2 className="text-4xl font-black text-white mb-2">PERFECT!</h2>
                                    <p className="text-slate-300 mb-6 font-medium">Completed in {moves} moves</p>
                                    <button
                                        onClick={() => initGame()}
                                        className="bg-premium-500 hover:bg-premium-400 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-premium-500/20 transition-all active:scale-95"
                                    >
                                        Play Again
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hint Button */}
                        <div className="mt-8 flex items-center justify-center gap-6">
                            <button
                                onClick={() => setShowNumbers(!showNumbers)}
                                className="group flex flex-col items-center gap-2"
                            >
                                <div className={`w-12 h-12 glass rounded-full flex items-center justify-center transition-all ${showNumbers ? 'bg-premium-500 text-white' : 'group-hover:bg-premium-500/20 group-hover:text-premium-400'}`}>
                                    <span className="font-bold text-lg">#</span>
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Numbers</span>
                            </button>

                            <button
                                onMouseEnter={() => setShowHint(true)}
                                onMouseLeave={() => setShowHint(false)}
                                className="group flex flex-col items-center gap-2"
                            >
                                <div className="w-12 h-12 glass rounded-full flex items-center justify-center group-hover:bg-premium-500/20 group-hover:text-premium-400 transition-all">
                                    <Eye className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hint</span>
                            </button>

                            <button
                                onClick={() => initGame()}
                                className="group flex flex-col items-center gap-2"
                            >
                                <div className="w-12 h-12 glass rounded-full flex items-center justify-center group-hover:bg-premium-500/20 group-hover:text-premium-400 transition-all">
                                    <RefreshCw className="w-6 h-6" />
                                </div>
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Controls & Options */}
                    <div className="space-y-6">
                        <div className="glass p-6 rounded-3xl">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Difficulty
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                                {[3, 4, 5].map(size => (
                                    <button
                                        key={size}
                                        onClick={() => { setGridSize(size); initGame(size); }}
                                        className={`py-3 rounded-xl font-bold transition-all ${gridSize === size
                                            ? 'bg-premium-500 text-white shadow-lg shadow-premium-500/30'
                                            : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                                            }`}
                                    >
                                        {size}x{size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="glass p-6 rounded-3xl">
                            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                                <Upload className="w-4 h-4" /> Custom Image
                            </h3>
                            <div
                                {...getRootProps()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${isDragActive ? 'border-premium-400 bg-premium-500/10' : 'border-slate-700 hover:border-slate-500'
                                    }`}
                            >
                                <input {...getInputProps()} />
                                <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Upload className="w-5 h-5 text-slate-400" />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">
                                    {isDragActive ? "Drop here" : "Drag & drop image or click"}
                                </p>
                            </div>
                        </div>

                        {/* Hint Modal/Overlay */}
                        {showHint && (
                            <div className="glass p-4 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
                                <h3 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-widest underline decoration-premium-500 underline-offset-4">Target Image</h3>
                                <img
                                    src={imageSrc}
                                    alt="Hint"
                                    className="w-full h-auto rounded-xl shadow-lg brightness-75 grayscale-[0.2]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SlidingPuzzle;
