
import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import Molecule3D from './components/Molecule3D';
import { MOLECULES } from './constants';
import { MoleculeData, GamePhase, UserDipoleMap, DipoleDirection } from './types';
import { getMoleculeExplanation, ExplanationResult } from './services/geminiService';
import { playSfx } from './services/soundService';

const App = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.MENU);
  const [moleculeIndex, setMoleculeIndex] = useState(0);
  const [userDipoles, setUserDipoles] = useState<UserDipoleMap>({});
  const [score, setScore] = useState(0);
  const [roundScore, setRoundScore] = useState({ polarity: 0, bonds: 0, time: 0 });
  const [explanation, setExplanation] = useState<ExplanationResult | null>(null);
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  
  // Power Ups State
  const [powerUps, setPowerUps] = useState({
    enScanner: false,
    showHint: false,
  });

  // Derived state
  const currentMolecule = MOLECULES[moleculeIndex];

  // Timer Effect
  useEffect(() => {
    let timer: any;
    if (phase === GamePhase.BOND_SETUP || phase === GamePhase.POLARITY_DECISION) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (phase !== GamePhase.RESULT) {
               checkPolarity(false, true);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [phase]);

  const handleBondClick = (bondId: number) => {
    if (phase !== GamePhase.BOND_SETUP) return;
    playSfx('pop');
    setUserDipoles(prev => {
      const current = prev[bondId] || DipoleDirection.NONE;
      let next = DipoleDirection.NONE;
      if (current === DipoleDirection.NONE) next = DipoleDirection.A_TO_B;
      else if (current === DipoleDirection.A_TO_B) next = DipoleDirection.B_TO_A;
      else next = DipoleDirection.NONE;
      return { ...prev, [bondId]: next };
    });
  };

  const handleStartGame = () => {
    playSfx('start');
    setScore(0);
    setMoleculeIndex(0);
    startLevel(0);
  };

  const startLevel = (index: number) => {
    if (index >= MOLECULES.length) {
      setPhase(GamePhase.GAME_OVER);
      playSfx('success');
      return;
    }
    setMoleculeIndex(index);
    setUserDipoles({});
    setExplanation(null);
    setLastGuessCorrect(false);
    setPowerUps({ enScanner: false, showHint: false });
    setTimeLeft(60);
    setPhase(GamePhase.BOND_SETUP);
  };

  const checkPolarity = async (userSaysPolar: boolean, isTimeout: boolean = false) => {
    const isCorrectPolarity = userSaysPolar === currentMolecule.isPolar;
    const finalResultCorrect = isTimeout ? false : isCorrectPolarity;
    setLastGuessCorrect(finalResultCorrect);

    if (finalResultCorrect) playSfx('success');
    else playSfx('wrong');

    let polarityPoints = 0;
    let bondPoints = 0;
    let timeBonus = 0;

    if (!isTimeout) {
      if (isCorrectPolarity) polarityPoints = 50;
      let correctBondsCount = 0;
      const totalBonds = currentMolecule.bonds.length;
      currentMolecule.bonds.forEach(bond => {
        const atomA = currentMolecule.atoms[bond.atomA];
        const atomB = currentMolecule.atoms[bond.atomB];
        const diff = atomB.electronegativity - atomA.electronegativity;
        let correctDir = DipoleDirection.NONE;
        if (Math.abs(diff) >= 0.4) { 
           correctDir = diff > 0 ? DipoleDirection.A_TO_B : DipoleDirection.B_TO_A;
        }
        if ((userDipoles[bond.id] || DipoleDirection.NONE) === correctDir) correctBondsCount++;
      });
      bondPoints = totalBonds > 0 ? Math.round((correctBondsCount / totalBonds) * 50) : 50;
      if (isCorrectPolarity) timeBonus = timeLeft;
    }

    setRoundScore({ polarity: polarityPoints, bonds: bondPoints, time: timeBonus });
    setScore(prev => prev + (polarityPoints + bondPoints + timeBonus));
    setPhase(GamePhase.RESULT);
    setIsLoadingExplanation(true);
    
    if (isTimeout) {
      setExplanation({ remark: "Time's Up!", explanation: "The clock ran out before you could decide." });
    } else {
      const result = await getMoleculeExplanation(currentMolecule, finalResultCorrect);
      setExplanation(result);
    }
    setIsLoadingExplanation(false);
  };

  const nextLevel = () => {
    playSfx('click');
    startLevel(moleculeIndex + 1);
  };

  const togglePowerUp = (type: 'enScanner' | 'showHint') => {
    playSfx('powerup');
    setPowerUps(p => ({...p, [type]: !p[type]}));
  };

  return (
    <div className="w-full h-screen bg-slate-900 text-white overflow-hidden flex flex-col font-sans relative">
      {/* HEADER HUD */}
      <div className="absolute top-0 w-full z-10 flex justify-between items-start p-4 bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <div className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-bold text-cyan-400 font-mono tracking-widest drop-shadow-md">LEVEL 5</h1>
          {phase !== GamePhase.MENU && (
             <div className="flex flex-col gap-2">
               <div className="text-sm text-slate-300 font-mono">
                 MOLECULE {moleculeIndex + 1}/{MOLECULES.length} • {currentMolecule?.difficulty}
               </div>
               <div className="flex items-center gap-2">
                 <div className="bg-cyan-500/20 backdrop-blur-md px-4 py-2 rounded-lg border border-cyan-400/30 flex flex-col">
                    <span className="text-white font-black text-xl leading-none uppercase tracking-tight">{currentMolecule.name}</span>
                    <span className="text-cyan-300 font-mono text-sm font-bold">{currentMolecule.formula}</span>
                 </div>
                 <div className="bg-slate-800/80 backdrop-blur px-3 py-1.5 rounded border border-slate-600 flex flex-col justify-center">
                    <span className="text-slate-400 text-[8px] uppercase font-bold">Geometry</span>
                    <span className="text-white font-bold text-xs">{currentMolecule.geometryName}</span>
                 </div>
               </div>
             </div>
          )}
        </div>

        <div className="flex flex-col items-end pointer-events-auto">
          <a href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true" target="_blank" rel="noopener noreferrer"
            className="mb-2 px-3 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-600 transition-colors backdrop-blur-sm flex items-center gap-1">
            <span>🏠</span> Home
          </a>
          {phase !== GamePhase.MENU && (
             <>
                <div className="text-2xl font-bold text-yellow-400 drop-shadow-lg font-mono">SCORE: {score}</div>
                <div className={`text-xl font-bold font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>TIME: {timeLeft}s</div>
             </>
          )}
        </div>
      </div>

      {/* 3D CANVAS */}
      <div className="flex-1 relative cursor-move">
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
          <Suspense fallback={null}>
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
            <Environment preset="city" />
            {currentMolecule && (
              <Molecule3D 
                molecule={currentMolecule}
                userDipoles={userDipoles}
                onBondClick={handleBondClick}
                showResult={phase === GamePhase.RESULT}
                powerUps={powerUps}
              />
            )}
            <OrbitControls enablePan={false} maxDistance={10} minDistance={2} />
          </Suspense>
        </Canvas>

        {phase === GamePhase.BOND_SETUP && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-2 rounded-full border border-cyan-500/50 backdrop-blur-sm animate-pulse pointer-events-none text-center min-w-[280px]">
            <span className="text-cyan-300 font-bold block text-sm">STEP 1</span> Tap bonds to draw dipoles
          </div>
        )}

        {powerUps.showHint && (
          <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-purple-900/80 p-4 rounded-xl border border-purple-500/50 backdrop-blur-md animate-fade-in-down pointer-events-none z-20">
            <div className="flex items-start gap-3">
               <span className="text-2xl">💡</span>
               <div>
                  <h4 className="font-bold text-purple-200 text-sm mb-1">HINT</h4>
                  <p className="text-white text-sm leading-relaxed">{currentMolecule.hint}</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM UI CONTROLS */}
      <div className="absolute bottom-0 w-full z-10 p-4 flex flex-col items-center gap-2 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none">
        <div className="pointer-events-auto w-full flex flex-col items-center">
          {phase === GamePhase.MENU && (
            <div className="w-full max-w-2xl flex flex-col items-center gap-6 mb-8 animate-fade-in-up px-4">
              <div className="text-center">
                <h2 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 animate-float mb-2">
                  LEVEL 5
                </h2>
                <p className="text-slate-400 text-lg font-light tracking-wide italic">POLAR OR NAH? — THE CHALLENGE</p>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-md p-6 rounded-2xl border border-slate-600/50 shadow-2xl w-full text-left">
                <h3 className="text-cyan-300 font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-xl">🔬</span> MISSION BRIEFING
                </h3>
                <div className="space-y-4 text-slate-200">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center font-bold text-cyan-400 text-xs">01</div>
                      <div className="w-0.5 h-full bg-slate-700"></div>
                    </div>
                    <div className="pb-2">
                      <h4 className="font-bold text-white text-sm">SET BOND DIPOLES</h4>
                      <p className="text-xs text-slate-400 leading-snug">Click bonds to draw arrows pointing toward the <span className="text-white font-semibold">more electronegative</span> atom.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center font-bold text-purple-400 text-xs">02</div>
                      <div className="w-0.5 h-full bg-slate-700"></div>
                    </div>
                    <div className="pb-2">
                      <h4 className="font-bold text-white text-sm">ANALYZE SYMMETRY</h4>
                      <p className="text-xs text-slate-400 leading-snug">Rotate the 3D structure. Determine if vectors <span className="text-white font-semibold">cancel</span> or form a <span className="text-white font-semibold">net dipole</span>.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="flex flex-col items-center gap-1">
                      <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-500 flex items-center justify-center font-bold text-yellow-400 text-xs">03</div>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">FINAL VERDICT</h4>
                      <p className="text-xs text-slate-400 leading-snug">Decide: <strong className="text-orange-400 uppercase">Polar</strong> or <strong className="text-cyan-400 uppercase">Non-Polar</strong>?</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={handleStartGame}
                className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xl rounded-xl shadow-[0_0_25px_rgba(8,145,178,0.6)] transition-all transform hover:scale-105 active:scale-95 border border-cyan-400/30">
                INITIATE CHALLENGE
              </button>
            </div>
          )}

          {phase === GamePhase.BOND_SETUP && (
            <div className="w-full max-w-2xl flex flex-col items-center gap-4 animate-fade-in-up">
              <div className="flex gap-4 mb-2">
                <button onClick={() => togglePowerUp('enScanner')}
                  className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${powerUps.enScanner ? 'bg-green-500/20 border-green-500 text-green-300 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-slate-800/80 border-slate-600 text-slate-400'}`}>
                  <span className="text-lg">📊</span> EN Scanner
                </button>
                <button onClick={() => togglePowerUp('showHint')}
                  className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${powerUps.showHint ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' : 'bg-slate-800/80 border-slate-600 text-slate-400'}`}>
                  <span className="text-lg">💡</span> Hint
                </button>
              </div>
              <button onClick={() => { playSfx('click'); setPhase(GamePhase.POLARITY_DECISION); }}
                className="w-full md:w-auto px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg">
                Phase 2: Final Verdict &rarr;
              </button>
            </div>
          )}

          {phase === GamePhase.POLARITY_DECISION && (
            <div className="w-full max-w-lg animate-fade-in-up flex flex-col gap-3">
              <div className="text-center text-slate-200 text-sm drop-shadow-md bg-black/40 backdrop-blur-sm rounded-full py-1 px-4 self-center border border-white/10">
                Analyze {currentMolecule.name}: Do vectors cancel?
              </div>
              <div className="grid grid-cols-2 gap-4 px-2">
                <button onClick={() => checkPolarity(true)}
                  className="p-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl font-black text-xl hover:scale-105 transition-transform shadow-lg border border-red-400/30 text-white flex flex-col items-center">
                  POLAR
                  <span className="text-[10px] font-normal opacity-90 mt-1">Net Dipole Found</span>
                </button>
                <button onClick={() => checkPolarity(false)}
                  className="p-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl font-black text-xl hover:scale-105 transition-transform shadow-lg border border-cyan-400/30 text-white flex flex-col items-center">
                  NON-POLAR
                  <span className="text-[10px] font-normal opacity-90 mt-1">Perfect Symmetry</span>
                </button>
              </div>
              <button onClick={() => { playSfx('click'); setPhase(GamePhase.BOND_SETUP); }}
                className="w-full text-center text-slate-400 text-sm mt-1 hover:text-white underline drop-shadow-md">
                &larr; Refine Dipole Vectors
              </button>
            </div>
          )}

          {phase === GamePhase.RESULT && (
            <div className="w-full max-w-xs text-center bg-slate-900/85 p-3 rounded-xl border border-slate-700 backdrop-blur-md animate-fade-in-up shadow-2xl mb-1">
              <div className="mb-2">
                  <span className={`text-xl font-black ${currentMolecule.isPolar ? 'text-orange-400' : 'text-cyan-400'}`}>
                    {currentMolecule.name} is {currentMolecule.isPolar ? 'POLAR' : 'NON-POLAR'}!
                  </span>
              </div>
              <div className={`p-2 rounded-lg mb-2 border min-h-[60px] flex flex-col items-center justify-center gap-1 ${lastGuessCorrect ? 'bg-green-900/20 border-green-500/50' : 'bg-red-900/20 border-red-500/50'}`}>
                {isLoadingExplanation ? (
                  <span className="animate-pulse text-slate-500 text-xs">Neural analysis complete...</span>
                ) : explanation ? (
                  <>
                    <div className={`text-lg font-bold ${lastGuessCorrect ? 'text-green-400' : 'text-red-400'}`}>{explanation.remark}</div>
                    <p className="text-slate-200 italic text-[10px] leading-relaxed px-1">"{explanation.explanation}"</p>
                  </>
                ) : null}
              </div>
               <div className="flex justify-between text-xs text-slate-400 px-4 mb-2 font-mono">
                  <div className="flex flex-col items-center">
                    <span className="uppercase text-[8px]">Polarity</span>
                    <span className={`${roundScore.polarity > 0 ? 'text-green-400' : 'text-slate-500'} font-bold`}>+{roundScore.polarity}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="uppercase text-[8px]">Bonds</span>
                    <span className={`${roundScore.bonds === 50 ? 'text-green-400' : roundScore.bonds > 0 ? 'text-yellow-400' : 'text-slate-500'} font-bold`}>+{roundScore.bonds}</span>
                  </div>
                   <div className="flex flex-col items-center">
                    <span className="uppercase text-[8px]">Time</span>
                    <span className="text-blue-400 font-bold">+{roundScore.time}</span>
                  </div>
               </div>
              <button onClick={nextLevel} className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg text-sm">
                NEXT MISSION &rarr;
              </button>
            </div>
          )}

          {phase === GamePhase.GAME_OVER && (
            <div className="text-center bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 animate-fade-in-up">
              <h2 className="text-3xl font-bold mb-2 text-white uppercase tracking-tighter">Mission Success</h2>
              <div className="text-5xl font-black text-yellow-400 mb-6 drop-shadow-md">{score} XP</div>
              <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm">You have mastered the polarities of the known universe.</p>
              <button onClick={handleStartGame}
                className="px-8 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-500 transition-colors shadow-lg uppercase tracking-wider">
                Re-Deploy
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
