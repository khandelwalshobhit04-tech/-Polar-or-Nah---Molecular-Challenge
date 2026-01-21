
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

      <Billboard follow={true}>
        <Text
          position={[0, 0, style.radius + 0.1]}
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
  
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(up, direction.clone().normalize());

  const diff = atomB.electronegativity - atomA.electronegativity;
  let correctDipole = DipoleDirection.NONE;
  if (Math.abs(diff) >= 0.4) {
    correctDipole = diff > 0 ? DipoleDirection.A_TO_B : DipoleDirection.B_TO_A;
  }

  let displayDirection = userDipole;
  let arrowColor = "#22d3ee";

  if (showResult) {
    displayDirection = correctDipole;
    arrowColor = (userDipole === correctDipole) ? "#4ade80" : "#f87171";
  }

  let showArrow = displayDirection !== DipoleDirection.NONE;
  let arrowFlip = displayDirection === DipoleDirection.B_TO_A;
  const arrowRotation = arrowFlip ? [Math.PI, 0, 0] : [0, 0, 0];
  const arrowOffset = 0.25;
  const arrowLength = Math.max(0.5, length - 0.7);
  const headLength = 0.25;
  const shaftLength = arrowLength - headLength;

  return (
    <group position={midPoint} quaternion={quaternion}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); !showResult && onClick(); }}
        onPointerOver={() => !showResult && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        visible={false}
      >
        <cylinderGeometry args={[0.3, 0.3, length, 8]} />
        <meshBasicMaterial />
      </mesh>

      <Cylinder args={[0.08, 0.08, length, 12]} castShadow receiveShadow>
        <meshStandardMaterial 
          color={(hovered && !showResult) ? '#facc15' : '#cbd5e1'} 
          roughness={0.4} 
          metalness={0.1}
        />
      </Cylinder>

      {showArrow && (
        <group rotation={arrowRotation as any} position={[arrowOffset, 0, 0]}>
           <mesh position={[0, -arrowLength/2, 0]}>
             <boxGeometry args={[0.2, 0.05, 0.05]} />
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </mesh>
           <Cylinder args={[0.03, 0.03, shaftLength, 8]} position={[0, -headLength/2, 0]}>
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </Cylinder>
           <Cone args={[0.12, headLength, 16]} position={[0, arrowLength/2 - headLength/2, 0]}>
             <meshStandardMaterial color={arrowColor} emissive={arrowColor} emissiveIntensity={0.6} />
           </Cone>
        </group>
      )}
    </group>
  );
};

const ResultantDipole = ({ molecule }: { molecule: MoleculeData }) => {
  const netDipole = useMemo(() => {
    const net = new THREE.Vector3(0, 0, 0);
    molecule.bonds.forEach(bond => {
      const atomA = molecule.atoms[bond.atomA];
      const atomB = molecule.atoms[bond.atomB];
      const posA = new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z);
      const posB = new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z);
      const diff = atomB.electronegativity - atomA.electronegativity;
      const bondDir = new THREE.Vector3().subVectors(posB, posA).normalize();
      if (diff !== 0) net.add(bondDir.multiplyScalar(diff));
    });
    return net;
  }, [molecule]);

  const length = netDipole.length();
  if (length < 0.1 || !molecule.isPolar) return null;

  const origin = new THREE.Vector3(0, 0, 0);
  const dir = netDipole.clone().normalize();
  const quaternion = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  quaternion.setFromUnitVectors(up, dir);

  return (
    <group position={origin} quaternion={quaternion}>
      <Cylinder args={[0.1, 0.1, 3, 16]} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} transparent opacity={0.8} />
      </Cylinder>
      <Cone args={[0.4, 0.8, 16]} position={[0, 3, 0]}>
        <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} />
      </Cone>
      <Html position={[1, 1.5, 0]} center>
        <div className="bg-yellow-500/80 text-black px-2 py-1 rounded font-bold whitespace-nowrap backdrop-blur-md">
          NET DIPOLE
        </div>
      </Html>
    </group>
  );
};

const LonePairMesh: React.FC<{ position: THREE.Vector3 }> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const quaternion = useMemo(() => {
     const posVec = position.clone();
     if (posVec.lengthSq() < 0.001) return new THREE.Quaternion();
     const up = new THREE.Vector3(0, 1, 0);
     const dir = posVec.normalize();
     const q = new THREE.Quaternion();
     q.setFromUnitVectors(up, dir);
     return q;
  }, [position]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.elapsedTime;
      const scaleBase = 1;
      const scalePulse = Math.sin(t * 2.5) * 0.15; 
      meshRef.current.scale.set(scaleBase + scalePulse, (scaleBase + scalePulse) * 1.4, scaleBase + scalePulse);
      const material = meshRef.current.material as THREE.MeshPhysicalMaterial;
      if (material) {
        material.emissiveIntensity = 0.6 + Math.sin(t * 3) * 0.3;
        material.opacity = 0.5 + Math.sin(t * 2) * 0.1;
      }
    }
  });

  return (
    <group position={position} quaternion={quaternion}>
      <Sphere ref={meshRef} args={[0.35, 32, 32]} position={[0, 0.2, 0]}>
        <meshPhysicalMaterial color="#d8b4fe" emissive="#a855f7" emissiveIntensity={0.6} transparent opacity={0.6} roughness={0.1} metalness={0.1} transmission={0.1} thickness={0.5} depthWrite={false} />
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
  const [initialRotation] = useState(() => new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));

  useFrame((state, delta) => {
    if (groupRef.current) {
       groupRef.current.rotation.y += delta * 0.1;
       const targetY = showResult ? 2.5 : 0; 
       groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, delta * 3);
    }
  });

  return (
    <group ref={groupRef} rotation={initialRotation}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      {/* 3D LABEL FOR THE MOLECULE */}
      <Html position={[0, 3, 0]} center>
         <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full text-white font-bold text-xs pointer-events-none select-none uppercase tracking-widest whitespace-nowrap">
           {molecule.name} • {molecule.formula}
         </div>
      </Html>

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
        return (
          <BondMesh
            key={bond.id}
            id={bond.id}
            start={new THREE.Vector3(atomA.position.x, atomA.position.y, atomA.position.z)}
            end={new THREE.Vector3(atomB.position.x, atomB.position.y, atomB.position.z)}
            userDipole={userDipoles[bond.id] || DipoleDirection.NONE}
            onClick={() => onBondClick(bond.id)}
            showResult={showResult}
            atomA={atomA}
            atomB={atomB}
          />
        );
      })}

      {molecule.lonePairs && molecule.lonePairs.map((lp) => (
        <LonePairMesh key={lp.id} position={new THREE.Vector3(lp.position.x, lp.position.y, lp.position.z)} />
      ))}

      {showResult && molecule.isPolar && (
        <ResultantDipole molecule={molecule} />
      )}
    </group>
  );
}
