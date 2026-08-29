'use client';

import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { fibonacciSphere } from '@/lib/visualization/sphereLayout';
import type { SphereSkill, SphereConnection } from '@/lib/visualization/sphereTypes';

// ─── Color map ────────────────────────────────────────────────────────────────

const MASTERY_COLOR: Record<SphereSkill['mastery'], number> = {
  mastered:   0x10b981,
  strong:     0x8b5cf6,
  developing: 0x06b6d4,
  weak:       0xf59e0b,
  locked:     0x44445a,
};

const MASTERY_EMISSIVE: Record<SphereSkill['mastery'], number> = {
  mastered:   0x10b981,
  strong:     0x7c3aed,
  developing: 0x0891b2,
  weak:       0xd97706,
  locked:     0x1a1a2e,
};

// ─── Orbital rings ────────────────────────────────────────────────────────────

function OrbitalRings() {
  const configs = useMemo(() => [
    { rx: 0,            ry: 0, rz: 0,                    r: 2.15, opacity: 0.07 },
    { rx: Math.PI / 3,  ry: 0, rz: 0,                    r: 2.05, opacity: 0.045 },
    { rx: 0,            ry: 0, rz: Math.PI / 5,           r: 2.25, opacity: 0.05 },
  ], []);

  return (
    <>
      {configs.map((c, i) => (
        <mesh key={i} rotation={[c.rx, c.ry, c.rz]}>
          <torusGeometry args={[c.r, 0.003, 6, 90]} />
          <meshBasicMaterial color={0xffffff} transparent opacity={c.opacity} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

// ─── Central core ─────────────────────────────────────────────────────────────

function CentralCore({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (reducedMotion) return;
    const t = clock.elapsedTime;
    const scale = 1 + Math.sin(t * 1.1) * 0.07;
    if (meshRef.current) meshRef.current.scale.setScalar(scale);
    if (glowRef.current) glowRef.current.scale.setScalar(scale * 1.6);
  });

  return (
    <group>
      {/* Outer glow halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshBasicMaterial color={0x7c3aed} transparent opacity={0.06} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      {/* Core sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color={0x7c3aed}
          emissive={0x7c3aed}
          emissiveIntensity={1.2}
          transparent
          opacity={0.88}
        />
      </mesh>
    </group>
  );
}

// ─── Ambient particles ────────────────────────────────────────────────────────

function AmbientParticles({ reducedMotion }: { reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const geometry = useMemo(() => {
    const count = 130;
    const pos = new Float32Array(count * 3);
    // Deterministic pseudo-random using index
    for (let i = 0; i < count; i++) {
      const seed1 = (i * 2.618) % 1;
      const seed2 = (i * 1.414) % 1;
      const seed3 = (i * 3.141) % 1;
      const theta = seed1 * Math.PI * 2;
      const phi = Math.acos(2 * seed2 - 1);
      const r = 2.7 + seed3 * 0.9;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (reducedMotion || !pointsRef.current) return;
    const t = clock.elapsedTime;
    pointsRef.current.rotation.y = t * 0.012;
    pointsRef.current.rotation.x = t * 0.006;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial size={0.018} color={0xffffff} transparent opacity={0.28} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ─── Connection lines ─────────────────────────────────────────────────────────

interface ConnectionLinesProps {
  skills: SphereSkill[];
  connections: SphereConnection[];
  positions: [number, number, number][];
  selectedSkillId: string | null;
  connectedSkillIds: Set<string> | null;
}

function ConnectionLines({ skills, connections, positions, selectedSkillId, connectedSkillIds }: ConnectionLinesProps) {
  const skillIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    skills.forEach((s, i) => map.set(s.id, i));
    return map;
  }, [skills]);

  const { prereqGeo, relatedGeo, highlightedGeo } = useMemo(() => {
    const prereqPts: number[] = [];
    const relatedPts: number[] = [];
    const highlightedPts: number[] = [];

    for (const conn of connections) {
      const fi = skillIndexMap.get(conn.fromId);
      const ti = skillIndexMap.get(conn.toId);
      if (fi === undefined || ti === undefined) continue;

      const fp = positions[fi];
      const tp = positions[ti];

      const isConnected = connectedSkillIds
        ? (connectedSkillIds.has(conn.fromId) && connectedSkillIds.has(conn.toId)) ||
          conn.fromId === selectedSkillId || conn.toId === selectedSkillId
        : false;

      if (isConnected) {
        highlightedPts.push(...fp, ...tp);
      } else if (conn.type === 'prerequisite') {
        prereqPts.push(...fp, ...tp);
      } else {
        relatedPts.push(...fp, ...tp);
      }
    }

    const make = (pts: number[]) => {
      if (pts.length === 0) return null;
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      return g;
    };

    return { prereqGeo: make(prereqPts), relatedGeo: make(relatedPts), highlightedGeo: make(highlightedPts) };
  }, [connections, positions, skillIndexMap, selectedSkillId, connectedSkillIds]);

  const dimFactor = selectedSkillId ? 0.35 : 1;

  return (
    <>
      {relatedGeo && (
        <lineSegments geometry={relatedGeo}>
          <lineBasicMaterial color={0xffffff} transparent opacity={0.08 * dimFactor} depthWrite={false} />
        </lineSegments>
      )}
      {prereqGeo && (
        <lineSegments geometry={prereqGeo}>
          <lineBasicMaterial color={0x8b5cf6} transparent opacity={0.18 * dimFactor} depthWrite={false} />
        </lineSegments>
      )}
      {highlightedGeo && (
        <lineSegments geometry={highlightedGeo}>
          <lineBasicMaterial color={0x8b5cf6} transparent opacity={0.6} depthWrite={false} />
        </lineSegments>
      )}
    </>
  );
}

// ─── Path particles (learning path animation) ─────────────────────────────────

interface PathParticleProps {
  from: THREE.Vector3;
  to: THREE.Vector3;
  phaseOffset: number;
}

function PathParticle({ from, to, phaseOffset }: PathParticleProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tmpPos = useRef(new THREE.Vector3());

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = ((clock.elapsedTime * 0.28 + phaseOffset) % 1 + 1) % 1;
    tmpPos.current.lerpVectors(from, to, t);
    meshRef.current.position.copy(tmpPos.current);
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.75;
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.022, 6, 6]} />
      <meshBasicMaterial color={0x22d3ee} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

interface PathAnimationProps {
  skills: SphereSkill[];
  connections: SphereConnection[];
  positions: [number, number, number][];
  recommendedSkillIds: string[];
}

function PathAnimation({ skills, connections, positions, recommendedSkillIds }: PathAnimationProps) {
  const skillIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    skills.forEach((s, i) => map.set(s.id, i));
    return map;
  }, [skills]);

  const pathSegments = useMemo(() => {
    if (recommendedSkillIds.length === 0) return [];
    const recommended = new Set(recommendedSkillIds);
    const segs: { from: THREE.Vector3; to: THREE.Vector3; phase: number }[] = [];

    connections
      .filter(c => c.type === 'prerequisite' && recommended.has(c.toId))
      .slice(0, 4) // cap for performance
      .forEach((c, i) => {
        const fi = skillIndexMap.get(c.fromId);
        const ti = skillIndexMap.get(c.toId);
        if (fi === undefined || ti === undefined) return;
        segs.push({
          from: new THREE.Vector3(...positions[fi]),
          to: new THREE.Vector3(...positions[ti]),
          phase: i * 0.33,
        });
      });

    return segs;
  }, [connections, positions, skillIndexMap, recommendedSkillIds]);

  return (
    <>
      {pathSegments.map((seg, i) => (
        <PathParticle key={i} from={seg.from} to={seg.to} phaseOffset={seg.phase} />
      ))}
    </>
  );
}

// ─── Skill node ───────────────────────────────────────────────────────────────

interface SkillNodeMeshProps {
  skill: SphereSkill;
  position: [number, number, number];
  isSelected: boolean;
  isConnected: boolean | null; // null = no selection active
  onSelect: () => void;
  onPointerEnter: (skill: SphereSkill, e: ThreeEvent<PointerEvent>) => void;
  onPointerLeave: () => void;
  registerMesh: (id: string, mesh: THREE.Mesh | null) => void;
  reducedMotion: boolean;
}

function SkillNodeMesh({
  skill, position, isSelected, isConnected, onSelect,
  onPointerEnter, onPointerLeave, registerMesh, reducedMotion,
}: SkillNodeMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scaleTarget = useRef(1);

  const radius = 0.042 + skill.importance * 0.065;

  const geometry = useMemo(() => new THREE.SphereGeometry(radius, 12, 12), [radius]);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(MASTERY_COLOR[skill.mastery]),
    emissive: new THREE.Color(MASTERY_EMISSIVE[skill.mastery]),
    emissiveIntensity: skill.mastery === 'locked' ? 0 : 0.18,
    transparent: true,
    opacity: 0.85,
  }), [skill.mastery]);

  const setRef = useCallback((mesh: THREE.Mesh | null) => {
    (meshRef as React.MutableRefObject<THREE.Mesh | null>).current = mesh;
    registerMesh(skill.id, mesh);
  }, [skill.id, registerMesh]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // Target scale
    let targetScale = 1;
    if (isSelected) {
      targetScale = 1.45;
    } else if (!reducedMotion && skill.isRecommended) {
      // Pulsing is handled via emissive flicker, not scale (less jarring)
      targetScale = 1.08;
    } else if (isConnected === false) {
      // Dim unrelated when something is selected
      targetScale = 0.85;
    }
    scaleTarget.current = THREE.MathUtils.lerp(scaleTarget.current, targetScale, 0.1);
    mesh.scale.setScalar(scaleTarget.current);

    // Emissive pulse for recommended nodes
    if (!reducedMotion && skill.isRecommended && !isSelected) {
      // use mesh userData to accumulate time
      mesh.userData.t = (mesh.userData.t ?? 0) + 0.016;
      const pulse = 0.18 + Math.sin(mesh.userData.t * 2.2) * 0.14;
      material.emissiveIntensity = pulse;
    }
  });

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
    material.emissiveIntensity = 0.45;
    onPointerEnter(skill, e);
  }, [skill, onPointerEnter, material]);

  const handlePointerOut = useCallback(() => {
    document.body.style.cursor = 'auto';
    material.emissiveIntensity = skill.isRecommended ? 0.25 : 0.18;
    onPointerLeave();
  }, [skill.isRecommended, onPointerLeave, material]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  return (
    <mesh
      ref={setRef}
      geometry={geometry}
      material={material}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
  );
}

// ─── Goal marker ──────────────────────────────────────────────────────────────

function GoalMarker({ position }: { position: [number, number, number] }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    ringRef.current.rotation.z = clock.elapsedTime * 0.4;
    ringRef.current.rotation.x = clock.elapsedTime * 0.25;
  });

  const [x, y, z] = position;
  const offset = 0.2;

  return (
    <group position={[x, y, z + offset]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.14, 0.008, 8, 30]} />
        <meshBasicMaterial color={0x22d3ee} transparent opacity={0.55} depthWrite={false} />
      </mesh>
    </group>
  );
}

// ─── Main scene content ───────────────────────────────────────────────────────

export interface LabelInfo {
  id: string;
  name: string;
  mastery: SphereSkill['mastery'];
  x: number;
  y: number;
  opacity: number;
}

export interface SphereSceneProps {
  skills: SphereSkill[];
  connections: SphereConnection[];
  selectedSkillId: string | null;
  recommendedSkillIds: string[];
  goalSkillId: string | null;
  onSkillSelect: (id: string | null) => void;
  reducedMotion: boolean;
  onHoverChange: (skill: SphereSkill | null, screenX: number, screenY: number) => void;
  onLabelsUpdate: (labels: LabelInfo[]) => void;
}

function SceneContent({
  skills, connections, selectedSkillId, recommendedSkillIds, goalSkillId,
  onSkillSelect, reducedMotion, onHoverChange, onLabelsUpdate,
}: SphereSceneProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Fibonacci sphere layout — memoized since skills list is stable
  const positions = useMemo(() => fibonacciSphere(skills.length, 2.0), [skills.length]);

  // Map for quick skill lookup
  const skillMap = useMemo(() => {
    const m = new Map<string, SphereSkill>();
    skills.forEach(s => m.set(s.id, s));
    return m;
  }, [skills]);

  // Connected skills to the selection
  const connectedSkillIds = useMemo((): Set<string> | null => {
    if (!selectedSkillId) return null;
    const set = new Set<string>([selectedSkillId]);
    connections.forEach(c => {
      if (c.fromId === selectedSkillId) set.add(c.toId);
      if (c.toId === selectedSkillId) set.add(c.fromId);
    });
    return set;
  }, [selectedSkillId, connections]);

  // Mesh refs for depth-based opacity updates
  const nodeRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const tempVec = useRef(new THREE.Vector3());

  // Label projection refs (allocation-free)
  const frameCount = useRef(0);
  const projVec = useRef(new THREE.Vector3());
  const ndcVec = useRef(new THREE.Vector3());
  const camPosVec = useRef(new THREE.Vector3());
  const nodeDirVec = useRef(new THREE.Vector3());

  const registerMesh = useCallback((id: string, mesh: THREE.Mesh | null) => {
    if (mesh) nodeRefs.current.set(id, mesh);
    else nodeRefs.current.delete(id);
  }, []);

  // Depth-based opacity + dim-on-selection + auto-label projection
  useFrame(({ camera, size }) => {
    // ── Loop 1: depth-based opacity (every frame) ────────────────────────
    for (const [id, mesh] of nodeRefs.current.entries()) {
      if (!mesh) continue;
      mesh.getWorldPosition(tempVec.current);

      // depth 0 = back of sphere, 1 = front (camera at z≈5, sphere radius≈2)
      const depth = THREE.MathUtils.clamp((tempVec.current.z + 2.2) / 4.4, 0, 1);

      const skill = skillMap.get(id);
      const isLocked = skill?.mastery === 'locked';

      let baseOpacity = isLocked ? 0.22 : 0.9;

      // Dim non-connected nodes when something is selected
      if (selectedSkillId && id !== selectedSkillId && connectedSkillIds && !connectedSkillIds.has(id)) {
        baseOpacity *= 0.3;
      }

      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.opacity = baseOpacity * (0.28 + depth * 0.72);
    }

    // ── Loop 2: auto-label projection (~15 fps) ──────────────────────────
    frameCount.current++;
    if (frameCount.current % 4 !== 0) return;

    // Camera direction from origin (normalized) — updates as camera orbits
    camPosVec.current.copy(camera.position).normalize();

    const candidates: LabelInfo[] = [];

    for (const [id, mesh] of nodeRefs.current.entries()) {
      if (!mesh) continue;
      const skill = skillMap.get(id);
      if (!skill || skill.mastery === 'locked') continue;
      // Suppress labels for dimmed nodes when a selection is active
      if (selectedSkillId && connectedSkillIds && !connectedSkillIds.has(id)) continue;

      mesh.getWorldPosition(projVec.current);

      // Dot product: 1 = node faces camera, 0 = edge, -1 = back-facing
      nodeDirVec.current.copy(projVec.current).normalize();
      const dotWithCam = nodeDirVec.current.dot(camPosVec.current);
      if (dotWithCam < 0.15) continue;

      // Screen position via NDC projection
      ndcVec.current.copy(projVec.current).project(camera);
      const px = (ndcVec.current.x * 0.5 + 0.5) * size.width;
      const py = (-ndcVec.current.y * 0.5 + 0.5) * size.height;

      // Skip nodes near the canvas edges
      if (px < 44 || px > size.width - 44 || py < 44 || py > size.height - 44) continue;

      // Opacity ramps in as the node comes toward the camera
      const opacity = Math.max(0, Math.min(1, (dotWithCam - 0.15) / 0.35));
      candidates.push({ id, name: skill.name, mastery: skill.mastery, x: px, y: py, opacity });
    }

    // Most front-facing first
    candidates.sort((a, b) => b.opacity - a.opacity);

    // Deduplicate by minimum screen distance to avoid overlapping labels
    const shown: LabelInfo[] = [];
    const MIN_DIST_SQ = 72 * 72;
    for (const c of candidates) {
      let tooClose = false;
      for (const s of shown) {
        const dx = c.x - s.x, dy = c.y - s.y;
        if (dx * dx + dy * dy < MIN_DIST_SQ) { tooClose = true; break; }
      }
      if (!tooClose) shown.push(c);
      if (shown.length >= 5) break;
    }

    onLabelsUpdate(shown);
  });

  const handlePointerEnter = useCallback((skill: SphereSkill, e: ThreeEvent<PointerEvent>) => {
    onHoverChange(skill, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  }, [onHoverChange]);

  const handlePointerLeave = useCallback(() => {
    onHoverChange(null, 0, 0);
  }, [onHoverChange]);

  const goalIndex = goalSkillId ? skills.findIndex(s => s.id === goalSkillId) : -1;

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.12} />
      <pointLight position={[0, 0, 0]} intensity={1.2} color={0x7c3aed} decay={2} />
      <directionalLight position={[4, 6, 5]} intensity={0.45} color={0xffffff} />
      <directionalLight position={[-3, -2, -4]} intensity={0.12} color={0x06b6d4} />

      <CentralCore reducedMotion={reducedMotion} />
      <OrbitalRings />
      <AmbientParticles reducedMotion={reducedMotion} />

      <ConnectionLines
        skills={skills}
        connections={connections}
        positions={positions}
        selectedSkillId={selectedSkillId}
        connectedSkillIds={connectedSkillIds}
      />

      {!reducedMotion && (
        <PathAnimation
          skills={skills}
          connections={connections}
          positions={positions}
          recommendedSkillIds={recommendedSkillIds}
        />
      )}

      {skills.map((skill, i) => (
        <SkillNodeMesh
          key={skill.id}
          skill={skill}
          position={positions[i]}
          isSelected={skill.id === selectedSkillId}
          isConnected={connectedSkillIds ? connectedSkillIds.has(skill.id) : null}
          onSelect={() => onSkillSelect(skill.id === selectedSkillId ? null : skill.id)}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          registerMesh={registerMesh}
          reducedMotion={reducedMotion}
        />
      ))}

      {goalIndex >= 0 && (
        <GoalMarker position={positions[goalIndex]} />
      )}
    </group>
  );
}

// ─── Canvas wrapper ───────────────────────────────────────────────────────────

export function SphereScene(props: SphereSceneProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 5.2], fov: 48 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      aria-label="Interactive skill knowledge map"
    >
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={!props.reducedMotion}
        autoRotateSpeed={0.55}
        rotateSpeed={0.55}
        dampingFactor={0.07}
        enableDamping
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.8}
      />
      <SceneContent {...props} />
    </Canvas>
  );
}
