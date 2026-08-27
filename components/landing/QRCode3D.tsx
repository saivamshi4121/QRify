"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const QR_MATRIX = [
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,1,0,0,0,0,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1],
  [1,0,0,0,0,0,1,0,0,0,1,0,1,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,0,1,1,1,1,1,1,1],
  [0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0],
  [1,0,1,0,1,1,1,1,0,0,1,1,0,1,0,1,1,0,1],
  [0,1,0,1,0,0,0,1,1,0,1,0,1,0,1,0,0,1,0],
  [1,1,0,0,1,1,1,0,1,1,0,1,0,1,1,0,1,0,1],
  [0,0,0,0,0,0,0,0,1,0,1,1,0,0,1,1,0,1,0],
  [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,1,1,1],
  [1,0,0,0,0,0,1,0,1,1,1,0,0,1,0,1,0,0,1],
  [1,0,1,1,1,0,1,0,0,0,1,1,1,0,1,1,1,0,1],
  [1,0,1,1,1,0,1,0,1,0,0,0,1,1,0,0,1,1,0],
  [1,0,1,1,1,0,1,0,1,1,0,1,0,1,0,1,0,1,1],
  [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,1,0,0,1],
  [1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,1,1],
];

const COLORS = {
  cyan: new THREE.Color(0x22d3ee),
  indigo: new THREE.Color(0x6366f1),
  purple: new THREE.Color(0x8b5cf6),
  white: new THREE.Color(0xffffff),
};

export default function QRCode3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.018);

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x22d3ee, 0.3);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0x6366f1, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);
    const pointLight1 = new THREE.PointLight(0x22d3ee, 3, 30);
    pointLight1.position.set(-5, 5, 5);
    scene.add(pointLight1);
    const pointLight2 = new THREE.PointLight(0x8b5cf6, 2.5, 25);
    pointLight2.position.set(5, -3, 3);
    scene.add(pointLight2);

    const qrGroup = new THREE.Group();
    scene.add(qrGroup);

    const cubeGeo = new THREE.BoxGeometry(0.82, 0.82, 0.82);
    const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
    const cubes: { mesh: THREE.Mesh; edge: THREE.LineSegments; x: number; y: number; z: number; phase: number; baseZ: number }[] = [];

    const SIZE = QR_MATRIX.length;
    const SPACING = 1.15;
    const OFFSET = ((SIZE - 1) * SPACING) / 2;

    for (let row = 0; row < SIZE; row++) {
      for (let col = 0; col < SIZE; col++) {
        if (!QR_MATRIX[row][col]) continue;

        const x = col * SPACING - OFFSET;
        const y = (SIZE - 1 - row) * SPACING - OFFSET;
        const distFromCenter = Math.sqrt(x * x + y * y);
        const normalizedDist = distFromCenter / (OFFSET * 1.2);

        const color = new THREE.Color();
        color.lerpColors(COLORS.cyan, COLORS.indigo, normalizedDist);
        if (normalizedDist > 0.6) color.lerp(COLORS.purple, (normalizedDist - 0.6) * 2.5);

        const mat = new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.25,
          roughness: 0.2,
          metalness: 0.8,
          transparent: true,
          opacity: 0.92,
        });

        const mesh = new THREE.Mesh(cubeGeo, mat);
        const baseZ = normalizedDist * -1.5;
        mesh.position.set(x, y, baseZ);

        const edgeMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.35 });
        const edge = new THREE.LineSegments(edgeGeo, edgeMat);
        mesh.add(edge);

        qrGroup.add(mesh);
        cubes.push({
          mesh,
          edge,
          x,
          y,
          z: baseZ,
          phase: Math.random() * Math.PI * 2,
          baseZ,
        });
      }
    }

    const particleCount = 600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30 - 5;

      const c = new THREE.Color();
      c.setHSL(0.5 + Math.random() * 0.15, 0.8, 0.5 + Math.random() * 0.3);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      particleSpeeds[i] = 0.2 + Math.random() * 0.8;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const ringCount = 5;
    const rings: THREE.Mesh[] = [];
    for (let i = 0; i < ringCount; i++) {
      const ringGeo = new THREE.RingGeometry(6 + i * 2.5, 6.15 + i * 2.5, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.08 - i * 0.012,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      scene.add(ring);
      rings.push(ring);
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });

    let animFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const scrollFactor = Math.min(scrollRef.current / 600, 1);

      qrGroup.rotation.y = THREE.MathUtils.lerp(qrGroup.rotation.y, mouseRef.current.x * 0.35, 0.04);
      qrGroup.rotation.x = THREE.MathUtils.lerp(qrGroup.rotation.x, -mouseRef.current.y * 0.2, 0.04);

      camera.position.z = THREE.MathUtils.lerp(camera.position.z, 18 - scrollFactor * 6, 0.05);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, scrollFactor * 2, 0.05);

      for (let i = 0; i < cubes.length; i++) {
        const c = cubes[i];
        const wave = Math.sin(t * 0.8 + c.phase) * 0.12;
        const breathe = Math.sin(t * 0.4 + c.phase * 0.5) * 0.08;
        c.mesh.position.z = c.baseZ + wave + breathe;
        c.mesh.rotation.x = Math.sin(t * 0.3 + c.phase) * 0.08;
        c.mesh.rotation.y = Math.cos(t * 0.25 + c.phase) * 0.08;

        const emissivePulse = 0.15 + Math.sin(t * 1.2 + c.phase) * 0.12;
        (c.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = emissivePulse;
        (c.edge.material as THREE.LineBasicMaterial).opacity = 0.2 + Math.sin(t * 0.9 + c.phase) * 0.15;
      }

      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += particleSpeeds[i] * 0.003;
        if (positions[i * 3 + 1] > 20) positions[i * 3 + 1] = -20;
      }
      particleGeo.attributes.position.needsUpdate = true;
      particles.rotation.y = t * 0.02;

      for (let i = 0; i < rings.length; i++) {
        rings[i].rotation.z = t * (0.03 + i * 0.008) * (i % 2 === 0 ? 1 : -1);
        (rings[i].material as THREE.MeshBasicMaterial).opacity = (0.06 - i * 0.01) + Math.sin(t * 0.5 + i) * 0.02;
      }

      pointLight1.position.x = Math.sin(t * 0.3) * 8;
      pointLight1.position.y = Math.cos(t * 0.4) * 4;
      pointLight2.position.x = Math.cos(t * 0.25) * 6;
      pointLight2.position.z = Math.sin(t * 0.35) * 3 + 5;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animFrameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 z-0"
      style={{ pointerEvents: "none" }}
    />
  );
}
