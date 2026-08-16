"use client";

import { useEffect, useRef } from "react";
import type { Vector3, WebGLRenderer } from "three";

export function DnaHelix() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let animId: number;
    let renderer: WebGLRenderer | null = null;
    const el = mountRef.current;

    const init = async () => {
      const THREE = await import("three");

      const width = el.clientWidth;
      const height = el.clientHeight;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      camera.position.set(0, 0, 20);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.35));

      const warmLight = new THREE.DirectionalLight(0xffa060, 1.8);
      warmLight.position.set(6, 12, 8);
      scene.add(warmLight);

      const coolLight = new THREE.DirectionalLight(0x70b5ff, 0.9);
      coolLight.position.set(-6, -8, 6);
      scene.add(coolLight);

      const group = new THREE.Group();

      const TURNS = 4;
      const SEGMENTS = 100 * TURNS;
      const HEIGHT = 24;
      const RADIUS = 2.6;

      // Build strand point arrays
      const pts1: Vector3[] = [];
      const pts2: Vector3[] = [];

      for (let i = 0; i <= SEGMENTS; i++) {
        const t = i / SEGMENTS;
        const a = t * Math.PI * 2 * TURNS;
        const y = (t - 0.5) * HEIGHT;
        pts1.push(new THREE.Vector3(Math.cos(a) * RADIUS, y, Math.sin(a) * RADIUS));
        pts2.push(new THREE.Vector3(Math.cos(a + Math.PI) * RADIUS, y, Math.sin(a + Math.PI) * RADIUS));
      }

      const curve1 = new THREE.CatmullRomCurve3(pts1);
      const curve2 = new THREE.CatmullRomCurve3(pts2);

      // Strand tubes
      const tube1 = new THREE.TubeGeometry(curve1, SEGMENTS, 0.13, 8, false);
      group.add(new THREE.Mesh(tube1, new THREE.MeshPhongMaterial({ color: 0xde8246, shininess: 90 })));

      const tube2 = new THREE.TubeGeometry(curve2, SEGMENTS, 0.13, 8, false);
      group.add(new THREE.Mesh(tube2, new THREE.MeshPhongMaterial({ color: 0x4a8f50, shininess: 90 })));

      // Base pair rungs
      const nucColors = [0x4ade80, 0xf87171, 0xfbbf24, 0x60a5fa];
      const PAIRS = TURNS * 10;

      for (let i = 0; i < PAIRS; i++) {
        const t = i / PAIRS;
        const p1 = curve1.getPoint(t);
        const p2 = curve2.getPoint(t);

        const dir = new THREE.Vector3().subVectors(p2, p1);
        const len = dir.length();
        const mid = new THREE.Vector3().lerpVectors(p1, p2, 0.5);

        const color = nucColors[i % 4]!;
        const mat = new THREE.MeshPhongMaterial({ color, shininess: 70 });

        // Rung cylinder
        const rungGeo = new THREE.CylinderGeometry(0.065, 0.065, len, 6);
        const rung = new THREE.Mesh(rungGeo, mat);
        rung.position.copy(mid);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        group.add(rung);

        // Junction spheres on each strand
        const sGeo = new THREE.SphereGeometry(0.19, 8, 8);
        const sMat = new THREE.MeshPhongMaterial({ color, shininess: 110 });

        const s1 = new THREE.Mesh(sGeo, sMat);
        s1.position.copy(p1);
        group.add(s1);

        const s2 = new THREE.Mesh(sGeo, sMat);
        s2.position.copy(p2);
        group.add(s2);
      }

      scene.add(group);

      let t = 0;
      const animate = () => {
        animId = requestAnimationFrame(animate);
        t += 0.004;
        group.rotation.y = t;
        group.rotation.x = Math.sin(t * 0.25) * 0.08;
        renderer!.render(scene, camera);
      };
      animate();
    };

    init().catch(console.error);

    return () => {
      cancelAnimationFrame(animId);
      if (renderer) {
        try { el.removeChild(renderer.domElement); } catch {}
        renderer.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
