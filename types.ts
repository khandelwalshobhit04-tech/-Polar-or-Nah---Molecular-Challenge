export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AtomData {
  id: number;
  element: string; // 'H', 'C', 'O', etc.
  position: Vector3;
  electronegativity: number;
}

export interface BondData {
  id: number;
  atomA: number; // index in atoms array
  atomB: number; // index in atoms array
}

export interface LonePairData {
  id: number;
  position: Vector3;
  rotation?: Vector3; // Optional rotation for shaping the orbital
}

export interface MoleculeData {
  id: string;
  name: string;
  formula: string;
  geometryName: string; // e.g., 'Bent', 'Tetrahedral'
  atoms: AtomData[];
  bonds: BondData[];
  lonePairs?: LonePairData[];
  isPolar: boolean;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description?: string;
  hint: string;
}

export enum GamePhase {
  MENU = 'MENU',
  BOND_SETUP = 'BOND_SETUP',     // Phase 1: Draw arrows
  POLARITY_DECISION = 'POLARITY_DECISION', // Phase 2: Symmetry check + Final Vote
  RESULT = 'RESULT',             // Phase 3: Feedback
  GAME_OVER = 'GAME_OVER'
}

export enum DipoleDirection {
  NONE = 0,
  A_TO_B = 1,
  B_TO_A = 2,
}

// Map bond ID to user selected direction
export type UserDipoleMap = Record<number, DipoleDirection>;

export interface ElementStyle {
  color: string;
  radius: number;
  textColor?: string;
}