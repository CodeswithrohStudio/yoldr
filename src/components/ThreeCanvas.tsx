"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function ThreeCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // --- Scene setup ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.set(0, 0, 28);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // --- Particles ---
    const particleCount = 800;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    const goldColor = new THREE.Color("#F59E0B");
    const purpleColor = new THREE.Color("#8B5CF6");
    const blueColor = new THREE.Color("#3B82F6");

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 10;

      const r = Math.random();
      const c = r < 0.5 ? goldColor : r < 0.8 ? purpleColor : blueColor;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = Math.random() * 2 + 0.5;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    particleGeo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const particleMat = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Floating orbs ---
    const orbData: { mesh: THREE.Mesh; speed: number; phase: number; radius: number; yOffset: number }[] = [];

    const orbConfigs = [
      { color: "#F59E0B", emissive: "#F59E0B", x: -12, y: 4, z: -5, scale: 1.8 },
      { color: "#8B5CF6", emissive: "#8B5CF6", x: 10, y: -3, z: -8, scale: 2.2 },
      { color: "#3B82F6", emissive: "#3B82F6", x: 6, y: 7, z: -12, scale: 1.4 },
      { color: "#10B981", emissive: "#10B981", x: -8, y: -6, z: -6, scale: 1.0 },
      { color: "#F59E0B", emissive: "#F59E0B", x: 14, y: 2, z: -15, scale: 3.0 },
    ];

    orbConfigs.forEach((cfg, i) => {
      const geo = new THREE.SphereGeometry(cfg.scale, 32, 32);
      const mat = new THREE.MeshStandardMaterial({
        color: cfg.color,
        emissive: cfg.emissive,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.15,
        roughness: 0.1,
        metalness: 0.8,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      scene.add(mesh);
      orbData.push({ mesh, speed: 0.3 + i * 0.15, phase: i * 1.2, radius: 1.5 + i * 0.3, yOffset: cfg.y });
    });

    // --- Geometric ring ---
    const ringGeo = new THREE.TorusGeometry(14, 0.06, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
      color: "#F59E0B",
      transparent: true,
      opacity: 0.12,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.position.z = -20;
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(20, 0.04, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({
      color: "#8B5CF6",
      transparent: true,
      opacity: 0.08,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 5;
    ring2.rotation.z = Math.PI / 6;
    ring2.position.z = -25;
    scene.add(ring2);

    // --- Lights ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    const goldLight = new THREE.PointLight("#F59E0B", 2, 50);
    goldLight.position.set(-10, 5, 10);
    scene.add(goldLight);

    const purpleLight = new THREE.PointLight("#8B5CF6", 1.5, 40);
    purpleLight.position.set(10, -5, 8);
    scene.add(purpleLight);

    // --- Mouse parallax ---
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // --- Resize ---
    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", handleResize);

    // --- Animation loop ---
    let frameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Rotate particles slowly
      particles.rotation.y = t * 0.02;
      particles.rotation.x = t * 0.008;

      // Animate orbs
      orbData.forEach((orb) => {
        orb.mesh.position.y = orb.yOffset + Math.sin(t * orb.speed + orb.phase) * orb.radius * 0.5;
        orb.mesh.position.x += Math.sin(t * orb.speed * 0.7 + orb.phase) * 0.002;
        orb.mesh.rotation.y = t * orb.speed * 0.3;
      });

      // Rotate rings
      ring.rotation.z = t * 0.04;
      ring2.rotation.z = -t * 0.025;

      // Camera parallax on mouse
      camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.03;
      camera.lookAt(scene.position);

      // Pulse gold light
      goldLight.intensity = 1.5 + Math.sin(t * 1.5) * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
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
