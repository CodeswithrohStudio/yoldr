"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ── Yoldr shield orbital configs ─────────────────────────────
const SHIELDS = [
  { asset: "GOLD", color: 0xf59e0b, r: 3.8, speed: 0.38, tilt: 0.22, phase: 0 },
  { asset: "BTC",  color: 0xf97316, r: 5.0, speed: 0.26, tilt: -0.42, phase: Math.PI * 0.55 },
  { asset: "ETH",  color: 0x8b5cf6, r: 3.2, speed: 0.48, tilt: 0.58,  phase: Math.PI },
  { asset: "FLOW", color: 0x10b981, r: 4.6, speed: 0.31, tilt: -0.28, phase: Math.PI * 1.6 },
];

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let W = mount.clientWidth;
    let H = mount.clientHeight;

    // ── Renderer ──────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(54, W / H, 0.1, 120);
    camera.position.set(0, 1.2, 10.5);
    camera.lookAt(0, 0, 0);

    // ── DOT GRID (world-map style flat background) ────────────
    const COLS = 58, ROWS = 32;
    const gridPos = new Float32Array(COLS * ROWS * 3);
    const gridCol = new Float32Array(COLS * ROWS * 3);
    let gi = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = (c / (COLS - 1) - 0.5) * 30;
        const y = (r / (ROWS - 1) - 0.5) * 16;
        gridPos[gi * 3]     = x;
        gridPos[gi * 3 + 1] = y;
        gridPos[gi * 3 + 2] = -8;
        // Radial brightness — brighter toward center
        const d = Math.sqrt(x * x + y * y) / 16;
        const b = Math.max(0.04, 0.18 - d * 0.14);
        gridCol[gi * 3]     = b * 0.85;
        gridCol[gi * 3 + 1] = b * 0.95;
        gridCol[gi * 3 + 2] = b * 1.5;
        gi++;
      }
    }
    const gridGeo = new THREE.BufferGeometry();
    gridGeo.setAttribute("position", new THREE.BufferAttribute(gridPos, 3));
    gridGeo.setAttribute("color",    new THREE.BufferAttribute(gridCol, 3));
    scene.add(new THREE.Points(gridGeo, new THREE.PointsMaterial({
      size: 0.055, vertexColors: true, transparent: true, opacity: 0.75,
    })));

    // ── CENTRAL VAULT ─────────────────────────────────────────
    const vaultGeo = new THREE.IcosahedronGeometry(0.88, 4);
    const vaultMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, emissive: 0xf59e0b, emissiveIntensity: 0.55,
      metalness: 0.85, roughness: 0.12,
    });
    const vault = new THREE.Mesh(vaultGeo, vaultMat);
    scene.add(vault);

    // Animated halo rings around vault
    const makeHalo = (r: number, opacity: number, rotX = 0, rotZ = 0) => {
      const m = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.028, 8, 80),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity })
      );
      m.rotation.x = rotX;
      m.rotation.z = rotZ;
      scene.add(m);
      return m;
    };
    const halo1 = makeHalo(1.35, 0.32);
    const halo2 = makeHalo(1.75, 0.14, Math.PI / 3.5, Math.PI / 6);
    const halo3 = makeHalo(2.1,  0.06, Math.PI / 2.2, Math.PI / 4);

    // ── PER-SHIELD STRUCTURES ─────────────────────────────────
    type Particle = { mesh: THREE.Mesh; t: number; speed: number };
    type Slot = {
      orb:       THREE.Mesh;
      curve:     THREE.CatmullRomCurve3;
      lineGeo:   THREE.BufferGeometry;
      lineMat:   THREE.LineDashedMaterial;
      line:      THREE.Line;
      particles: Particle[];
    };

    const slots: Slot[] = SHIELDS.map((cfg) => {
      // Orbital guide ring
      const orbitRing = new THREE.Mesh(
        new THREE.TorusGeometry(cfg.r, 0.01, 4, 90),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.07 })
      );
      orbitRing.rotation.x = cfg.tilt;
      scene.add(orbitRing);

      // Shield orb
      const orb = new THREE.Mesh(
        new THREE.SphereGeometry(0.28, 22, 22),
        new THREE.MeshStandardMaterial({
          color: cfg.color, emissive: cfg.color, emissiveIntensity: 0.75,
          metalness: 0.5, roughness: 0.18,
        })
      );
      // Mini ring on orb face
      orb.add(new THREE.Mesh(
        new THREE.TorusGeometry(0.45, 0.022, 6, 36),
        new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true, opacity: 0.5 })
      ));
      const lt = new THREE.PointLight(cfg.color, 1.4, 6);
      orb.add(lt);
      scene.add(orb);

      // Animated dashed yield line: vault → shield orb
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0.5, 0),
        new THREE.Vector3(0, 0, 0),
      ]);
      const pts = curve.getPoints(64);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineDashedMaterial({
        color: cfg.color, dashSize: 0.22, gapSize: 0.14,
        transparent: true, opacity: 0.45,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances(); // must call on Line, not BufferGeometry
      scene.add(line);

      // Yield-stream particles along the curve
      const pGeo = new THREE.SphereGeometry(0.052, 6, 6);
      const particles: Particle[] = Array.from({ length: 7 }, (_, p) => {
        const mesh = new THREE.Mesh(
          pGeo,
          new THREE.MeshBasicMaterial({ color: cfg.color, transparent: true })
        );
        scene.add(mesh);
        return { mesh, t: p / 7, speed: 0.004 + Math.random() * 0.003 };
      });

      return { orb, curve, lineGeo, lineMat, line, particles };
    });

    // ── LIGHTING ──────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0x1a2545, 3.5));
    const goldCore = new THREE.PointLight(0xf59e0b, 5, 14);
    scene.add(goldCore);

    // ── MOUSE PARALLAX ────────────────────────────────────────
    const mouse = { x: 0, y: 0 };
    const camLerp = { x: 0, y: 1.2 };
    const onMouse = (e: MouseEvent) => {
      mouse.x = (e.clientX / innerWidth - 0.5) * 2;
      mouse.y = -(e.clientY / innerHeight - 0.5) * 2;
    };
    addEventListener("mousemove", onMouse);

    // ── ANIMATE ───────────────────────────────────────────────
    const clock = new THREE.Clock();
    let raf: number;

    const animate = () => {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Vault pulse + rotation
      vault.rotation.y = t * 0.22;
      vault.rotation.x = Math.sin(t * 0.15) * 0.1;
      vault.scale.setScalar(1 + Math.sin(t * 2.0) * 0.035);
      halo1.rotation.z =  t * 0.5;
      halo2.rotation.y =  t * 0.35;
      halo3.rotation.z = -t * 0.22;
      goldCore.intensity = 4 + Math.sin(t * 2.2) * 1.2;

      // Per-shield orbit + line + particles
      SHIELDS.forEach((cfg, i) => {
        const slot = slots[i];
        const angle = cfg.phase + t * cfg.speed;
        const ox = Math.cos(angle) * cfg.r;
        const oz = Math.sin(angle) * cfg.r * 0.52;
        const oy = Math.sin(angle * 0.65 + cfg.tilt) * 1.5;
        slot.orb.position.set(ox, oy, oz);
        slot.orb.rotation.y = t * 1.8;

        // Rebuild dashed line to current orb position
        const wp = slot.orb.position;
        slot.curve.points[0].set(0, 0, 0);
        slot.curve.points[1].set(
          wp.x * 0.38 + Math.sin(t * 0.6 + i * 1.3) * 0.35,
          wp.y * 0.42 + 0.9,
          wp.z * 0.32
        );
        slot.curve.points[2].set(wp.x, wp.y, wp.z);

        const newPts = slot.curve.getPoints(64);
        const posAttr = slot.lineGeo.attributes.position as THREE.BufferAttribute;
        newPts.forEach((p, j) => posAttr.setXYZ(j, p.x, p.y, p.z));
        posAttr.needsUpdate = true;
        slot.line.computeLineDistances(); // recompute on Line after geometry update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (slot.lineMat as any).dashOffset -= 0.028; // animates dashes flowing outward

        // Particles travel vault → shield
        slot.particles.forEach((prt) => {
          prt.t = (prt.t + prt.speed) % 1;
          const pos = slot.curve.getPoint(prt.t);
          prt.mesh.position.copy(pos);
          (prt.mesh.material as THREE.MeshBasicMaterial).opacity =
            Math.sin(prt.t * Math.PI) * 0.92;
        });
      });

      // Camera parallax
      camLerp.x += (mouse.x * 1.6 - camLerp.x) * 0.04;
      camLerp.y += (mouse.y * 0.5 + 1.2 - camLerp.y) * 0.04;
      camera.position.x = camLerp.x;
      camera.position.y = camLerp.y;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    animate();

    // Resize
    const onResize = () => {
      W = mount.clientWidth; H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("mousemove", onMouse);
      removeEventListener("resize", onResize);
      slots.forEach((s) => {
        s.particles.forEach((p) => {
          p.mesh.geometry.dispose();
          (p.mesh.material as THREE.Material).dispose();
        });
        s.lineGeo.dispose();
        s.lineMat.dispose();
        (s.orb.material as THREE.Material).dispose();
      });
      vaultMat.dispose();
      vaultGeo.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
    />
  );
}
