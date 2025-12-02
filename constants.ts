import { MoleculeData, ElementStyle } from './types';

// Standard CPK Colors
export const ELEMENT_STYLES: Record<string, ElementStyle> = {
  H: { color: '#FFFFFF', radius: 0.3, textColor: '#000000' },
  C: { color: '#909090', radius: 0.5, textColor: '#FFFFFF' },
  N: { color: '#3050F8', radius: 0.5, textColor: '#FFFFFF' },
  O: { color: '#FF0D0D', radius: 0.5, textColor: '#FFFFFF' },
  F: { color: '#90E050', radius: 0.45, textColor: '#000000' },
  Cl: { color: '#1FF01F', radius: 0.6, textColor: '#000000' },
  B: { color: '#FFB5B5', radius: 0.5, textColor: '#000000' },
  P: { color: '#FF8000', radius: 0.6, textColor: '#000000' },
  Xe: { color: '#429EB0', radius: 0.65, textColor: '#000000' },
};

// Helper to create vector
const v = (x: number, y: number, z: number) => ({ x, y, z });

export const MOLECULES: MoleculeData[] = [
  {
    id: 'h2o',
    name: 'Water',
    formula: 'H₂O',
    geometryName: 'Bent',
    isPolar: true,
    difficulty: 'Easy',
    atoms: [
      { id: 0, element: 'O', position: v(0, 0, 0), electronegativity: 3.44 },
      { id: 1, element: 'H', position: v(0.75, -0.6, 0), electronegativity: 2.2 },
      { id: 2, element: 'H', position: v(-0.75, -0.6, 0), electronegativity: 2.2 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
    ],
    lonePairs: [
      { id: 0, position: v(0, 0.5, 0.5) },
      { id: 1, position: v(0, 0.5, -0.5) }
    ],
    hint: "Oxygen's lone pairs force hydrogens down, breaking symmetry."
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    geometryName: 'Linear',
    isPolar: false,
    difficulty: 'Easy',
    atoms: [
      { id: 0, element: 'C', position: v(0, 0, 0), electronegativity: 2.55 },
      { id: 1, element: 'O', position: v(1.2, 0, 0), electronegativity: 3.44 },
      { id: 2, element: 'O', position: v(-1.2, 0, 0), electronegativity: 3.44 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
    ],
    hint: "Opposing linear pulls cancel each other out perfectly."
  },
  {
    id: 'bf3',
    name: 'Boron Trifluoride',
    formula: 'BF₃',
    geometryName: 'Trigonal Planar',
    isPolar: false,
    difficulty: 'Medium',
    atoms: [
      { id: 0, element: 'B', position: v(0, 0, 0), electronegativity: 2.04 },
      { id: 1, element: 'F', position: v(0, 1.3, 0), electronegativity: 3.98 },
      { id: 2, element: 'F', position: v(1.12, -0.65, 0), electronegativity: 3.98 },
      { id: 3, element: 'F', position: v(-1.12, -0.65, 0), electronegativity: 3.98 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
      { id: 2, atomA: 0, atomB: 3 },
    ],
    hint: "Three identical atoms pull equally at 120° angles."
  },
  {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    geometryName: 'Trigonal Pyramidal',
    isPolar: true,
    difficulty: 'Medium',
    atoms: [
      { id: 0, element: 'N', position: v(0, 0.2, 0), electronegativity: 3.04 },
      { id: 1, element: 'H', position: v(0, -0.4, 0.94), electronegativity: 2.2 },
      { id: 2, element: 'H', position: v(0.81, -0.4, -0.47), electronegativity: 2.2 },
      { id: 3, element: 'H', position: v(-0.81, -0.4, -0.47), electronegativity: 2.2 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
      { id: 2, atomA: 0, atomB: 3 },
    ],
    lonePairs: [
      { id: 0, position: v(0, 1.0, 0) }
    ],
    hint: "A lone pair atop the Nitrogen prevents vertical cancellation."
  },
  {
    id: 'xef2',
    name: 'Xenon Difluoride',
    formula: 'XeF₂',
    geometryName: 'Linear',
    isPolar: false,
    difficulty: 'Hard',
    atoms: [
      { id: 0, element: 'Xe', position: v(0, 0, 0), electronegativity: 2.6 },
      { id: 1, element: 'F', position: v(0, 2.0, 0), electronegativity: 3.98 },
      { id: 2, element: 'F', position: v(0, -2.0, 0), electronegativity: 3.98 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
    ],
    lonePairs: [
      { id: 0, position: v(0.8, 0, 0) },
      { id: 1, position: v(-0.4, 0, 0.7) },
      { id: 2, position: v(-0.4, 0, -0.7) }
    ],
    hint: "Equatorial lone pairs cancel, leaving a symmetric linear shape."
  },
  {
    id: 'clf3',
    name: 'Chlorine Trifluoride',
    formula: 'ClF₃',
    geometryName: 'T-Shaped',
    isPolar: true,
    difficulty: 'Hard',
    atoms: [
      { id: 0, element: 'Cl', position: v(0, 0, 0), electronegativity: 3.16 },
      { id: 1, element: 'F', position: v(0, 1.6, 0), electronegativity: 3.98 }, // Axial
      { id: 2, element: 'F', position: v(0, -1.6, 0), electronegativity: 3.98 }, // Axial
      { id: 3, element: 'F', position: v(1.4, 0, 0), electronegativity: 3.98 }, // Equatorial
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
      { id: 2, atomA: 0, atomB: 3 },
    ],
    lonePairs: [
      { id: 0, position: v(-1.0, 0, 0.8) }, // Eq LP 1
      { id: 1, position: v(-1.0, 0, -0.8) } // Eq LP 2
    ],
    hint: "The T-shaped geometry creates asymmetry, resulting in a net dipole."
  },
  {
    id: 'ccl4',
    name: 'Carbon Tetrachloride',
    formula: 'CCl₄',
    geometryName: 'Tetrahedral',
    isPolar: false,
    difficulty: 'Hard',
    atoms: [
      { id: 0, element: 'C', position: v(0, 0, 0), electronegativity: 2.55 },
      { id: 1, element: 'Cl', position: v(1, 1, 1), electronegativity: 3.16 },
      { id: 2, element: 'Cl', position: v(-1, -1, 1), electronegativity: 3.16 },
      { id: 3, element: 'Cl', position: v(-1, 1, -1), electronegativity: 3.16 },
      { id: 4, element: 'Cl', position: v(1, -1, -1), electronegativity: 3.16 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
      { id: 2, atomA: 0, atomB: 3 },
      { id: 3, atomA: 0, atomB: 4 },
    ],
    hint: "Four identical atoms pulling in 3D space cancel perfectly."
  },
  {
    id: 'chcl3',
    name: 'Chloroform',
    formula: 'CHCl₃',
    geometryName: 'Tetrahedral',
    isPolar: true,
    difficulty: 'Hard',
    atoms: [
      { id: 0, element: 'C', position: v(0, 0, 0), electronegativity: 2.55 },
      { id: 1, element: 'H', position: v(0, 1.1, 0), electronegativity: 2.2 }, // Top
      { id: 2, element: 'Cl', position: v(0.94, -0.33, 0), electronegativity: 3.16 },
      { id: 3, element: 'Cl', position: v(-0.47, -0.33, 0.81), electronegativity: 3.16 },
      { id: 4, element: 'Cl', position: v(-0.47, -0.33, -0.81), electronegativity: 3.16 },
    ],
    bonds: [
      { id: 0, atomA: 0, atomB: 1 },
      { id: 1, atomA: 0, atomB: 2 },
      { id: 2, atomA: 0, atomB: 3 },
      { id: 3, atomA: 0, atomB: 4 },
    ],
    hint: "Chlorine is much more electronegative than Hydrogen."
  }
];