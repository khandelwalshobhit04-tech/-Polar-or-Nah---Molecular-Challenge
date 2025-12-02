import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Cylinder, Text, Html, Cone, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { MoleculeData, DipoleDirection, UserDipoleMap, AtomData } from '../types';
import { ELEMENT_STYLES } from '../constants';

interface Molecule3DProps {
  molecule: MoleculeData;
  userDipoles: UserDipoleMap;
  onBondClick: (bondId: number) => void;
  showResult: boolean;
  powerUps: { enScanner: boolean; };
}

interface AtomMeshProps {
  position: THREE.Vector3;
  element: string;
  powerUpActive: boolean;
  electronegativity: number;
}

// Reusable Atom Component
const AtomMesh: React.FC<AtomMeshProps> = ({ 
  position, 
  element, 
  powerUpActive,
  electronegativity 
}) => {
  const style = ELEMENT_STYLES[element] || { color: '#hotpink', radius: 0.5 };
  const textColor = style.textColor || 'black';
  
  return (
    <group position={position}>
      <Sphere args={[style.radius, 32, 32]}>
        <meshStandardMaterial 
          color={style.color} 
          roughness={0.3} 
          metalness={0.2} 
        />
      </Sphere>
      
      {/* Electronegativity Label - Floating above atom */}
      <Html position={[0, 0, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
        <div 
          className={`
            text-white font-bold text-xs drop-shadow-md 
            transition-all duration-300 pointer-events-none
            ${powerUpActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}
          `}
          style={{ transform: 'translate3d(0, -250%, 0)' }}
        >
          <div className="bg-black/60 px-1.5 py-0.5 rounded text-[10px] border border-white/20 whitespace-nowrap">
            EN: {electronegativity}
          </div>
        </div>
      </Html>

      {/* Element Symbol - Always facing camera */}
      <Billboard follow={true} lockX={false} lockY={false} lockZ={false}>
        <Text
          position={[0, 0, style.radius + 0.1]} // Slightly in front of the sphere surface
          fontSize={style.radius * 0.8}
          color={textColor}
          anchorX="center"
          anchorY="middle"
          outlineWidth={element === 'H' ? 0 : 0.02}
          outlineColor="white"
        >
          {element}
        </Text>
      </Billboard>
    </group>
  );
};

interface BondMeshProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  id: number;
  userDipole: DipoleDirection;
  onClick: () => void;
  showResult: boolean;
  atomA: AtomData;
  atomB: AtomData;
}

// Interactive Bond Component with Dipole Arrow
const BondMesh: React.FC<BondMeshProps> = ({ 
  start, 
  end, 
  id, 
  userDipole, 
  onClick,
  showResult,
  atomA,
  atomB
}) => {
  const [hovered, setHovered] = useState(false);

  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  
  // Orientation
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(up, direction.normalize());

  // Determine actual Correct Dipole for this bond
  const diff = atomB.electronegativity - atomA.electronegativity;
  let correctDipole = DipoleDirection.NONE;
  // Using 0.4 threshold for polar bond visualization
  if (Math.abs(diff) >= 0.4) {
    correctDipole = diff > 0 ? DipoleDirection.A_TO_B : DipoleDirection.B_TO_A;
  }

  // Visual Logic
  let displayDirection = userDipole;
  let arrowColor = "#22d3ee"; // Default Cyan

  if (showResult) {
    // In result mode, ALWAYS show the correct dipole
    displayDirection = correctDipole;

    if (userDipole === correctDipole) {
      arrowColor = "#4ade80"; // Green-400 (Correct!)
    } else {
      arrowColor = "#f87171"; // Red-400 (Wrong/Missed)
    }
  }

  let showArrow = false;
  let arrowFlip = false;

  if (displayDirection === DipoleDirection.A_TO_B) {
    showArrow = true;
    arrowFlip = false;
  } else if (displayDirection === DipoleDirection.B_TO_A) {
    showArrow = true;
    arrowFlip = true;
  }

  // Arrow rotation relative to bond
  const arrowRotation = arrowFlip ? [Math.PI, 0, 0] : [0, 0, 0];
  
  // Arrow Geometry Constants
  const arrowOffset = 0.25; // Float to the side of the bond
  const arrowLength = Math.max(0.5, length - 0.7); // Fit between atoms
  const headLength = 0.25;
  const shaftLength = arrowLength - headLength;

  return (
    <group position={midPoint} quaternion={quaternion}>
      {/* Invisible wider hit area for easier clicking on mobile */}
      <mesh 
        onClick={(e) => { e.stopPropagation(); !showResult && onClick(); }}
        onPointerOver={() => !showResult && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <cylinderGeometry args={[0.3, 0.3, length, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* Visible Bond */}
      <Cylinder args={[0.08, 0.08, length, 12]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={(hovered && !showResult) ? '#facc15' : '#cbd5e1'} 
          roughness={0.4} 
          metalness={0.1}
        />
      </Cylinder>

      {/* Dipole Arrow Visual */}
      {showArrow && (
        <group rotation={arrowRotation as any} position={[arrowOffset, 0, 0]}>
           {/* Cross at tail (Positive End) */}
           <mesh position={[0, -arrowLength/2, 0]}>
             <boxGeometry args={[0.2, 0.05, 0.05]} />
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </mesh>
           
           {/* Arrow Shaft */}
           <Cylinder 
            args={[0.03, 0.03, shaftLength, 8]} 
            position={[0, -headLength/2, 0]}
           >
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </Cylinder>
           
           {/* Arrow Head (Negative End) */}
           <Cone 
            args={[0.12, headLength, 16]} 
            position={[0, arrowLength/2 - headLength/2, 0]}
           >
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </Cone>
        </group>
      )}
    </group>
  );
};

// Resultant Net Dipole Component
const ResultantDipole = ({ molecule }: { molecule: MoleculeData }) => {
  const netDipole = useMemo(() => {
    const net = new THREE.Vector3(0, 0, 0);
    // Calculate simple vector sum weighted by EN difference
    molecule.bonds.forEach(bond => {
      const atomA = molecule.atoms[bond.atomA];
      const atomB = molecule.atoms[bond.atomB];
      const posA = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
      const posB = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
      
      const diff = atomB.electronegativity - atomA.electronegativity;
      const bondDir = new THREE.Vector3().subVectors(posB, posA).normalize();
      
      // Vector adds towards higher EN
      if (diff !== 0) {
        net.add(bondDir.multiplyScalar(diff));
      }
    });
    return net;
  }, [molecule]);

  const length = netDipole.length();
  
  if (length < 0.1 || !molecule.isPolar) return null; // Too small or non-polar

  const origin = new THREE.Vector3(0, 0, 0); // Assuming center is roughly 0,0,0
  const dir = netDipole.clone().normalize();
  
  // Calculate quaternion for orientation
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(up, dir);

  return (
    <group position={origin} quaternion={quaternion}>
      {/* Glowing Shaft */}
      <Cylinder args={[0.1, 0.1, 3, 16]} position={[0, 1.5, 0]}>
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#f59e0b" 
          emissiveIntensity={2} 
          transparent 
          opacity={0.8} 
        />
      </Cylinder>
      {/* Glowing Head */}
      <Cone args={[0.4, 0.8, 16]} position={[0, 3, 0]}>
        <meshStandardMaterial 
          color="#fbbf24" 
          emissive="#f59e0b" 
          emissiveIntensity={2} 
        />
      </Cone>
      
      <Html position={[1, 1.5, 0]} center>
        <div className="bg-yellow-500/80 text-black px-2 py-1 rounded font-bold whitespace-nowrap backdrop-blur-md">
          NET DIPOLE
        </div>
      </Html>
    </group>
  );
};

// Animated Lone Pair Orbital
const LonePairMesh: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Orient the orbital lobe to point away from center (assuming center is 0,0,0)
  // We want the local Y axis (elongated axis) to point along the position vector
  const quaternion = useMemo(() => {
     const posVec = position.clone();
     // If position is at origin, default to up, else point along vector from origin
     if (posVec.lengthSq() < 0.001) return new THREE.Quaternion();
     
     const up = new THREE.Vector3(0, 1, 0);
     const dir = posVec.normalize();
     const q = new THREE.Quaternion();
     q.setFromUnitVectors(up, dir);
     return q;
  }, [position]);

  // Breathing animation
  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      
      // Pulse scale (breathing)
      const scaleBase = 1;
      const scalePulse = Math.sin(t * 2.5) * 0.15; 
      meshRef.current.scale.set(
        scaleBase + scalePulse, 
        (scaleBase + scalePulse) * 1.4, // Elongate along local Y axis to look like a lobe
        scaleBase + scalePulse
      );

      // Pulse opacity/emissive for "energy" feel
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (material) {
        material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
        material.opacity = 0.5 + Math.sin(t * 2) * 0.1;
      }
    }
  });

  return (
    <group position={position} quaternion={quaternion} ref={groupRef}>
      {/* Offset the sphere slightly along Y so the base is near the atom center */}
      <Sphere ref={meshRef} args={[0.35, 32, 32]} position={[0, 0.2, 0]}>
        <meshPhysicalMaterial
          color="#d8b4fe" // Light Purple
          emissive="#a855f7" // Purple-500
          emissiveIntensity={0.6}
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.1}
          transmission={0.1}
          thickness={0.5}
          depthWrite={false} // Prevents z-buffer writing for better transparency blending
        />
      </Sphere>
    </group>
  );
};

export default function Molecule3D({ 
  molecule, 
  userDipoles, 
  onBondClick, 
  showResult,
  powerUps 
}: Molecule3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [initialRotation] = useState(() => {
    // Random rotation on mount to prevent memorization
    const euler = new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    return euler;
  });

  // Animation Loop
  useFrame((state, delta) => {
    if (groupRef.current) {
       // Continuous rotation
       groupRef.current.rotation.y += delta * 0.1;

       // Smoothly shift vertical position: Move UP when result is shown
       const targetY = showResult ? 2.5 : 0; 
       groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 3);
    }
  });

  return (
    <group ref={groupRef} rotation={initialRotation}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      
      {molecule.atoms.map((atom) => (
        <AtomMesh 
          key={atom.id} 
          position={new THREE.Vector3(atom.position.x, atom.position.y, atom.position.z)}
          element={atom.element}
          electronegativity={atom.electronegativity}
          powerUpActive={powerUps.enScanner}
        />
      ))}

      {molecule.bonds.map((bond) => {
        const atomA = molecule.atoms[bond.atomA];
        const atomB = molecule.atoms[bond.atomB];
        const start = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
        const end = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);

        return (
          <BondMesh
            key={bond.id}
            id={bond.id}
            start={start}
            end={end}
            userDipole={userDipoles[bond.id] || DipoleDirection.NONE}
            onClick={() => onBondClick(bond.id)}
            showResult={showResult}
            atomA={atomA}
            atomB={atomB}
          />
        );
      })}

      {/* Lone Pairs */}
      {molecule.lonePairs && molecule.lonePairs.map((lp) => (
        <LonePairMesh 
          key={lp.id} 
          position={new THREE.Vector3(lp.position.x, lp.position.y, lp.position.z)} 
        />
      ))}

      {showResult && molecule.isPolar && (
        <ResultantDipole molecule={molecule} />
      )}
    </group>
  );
}