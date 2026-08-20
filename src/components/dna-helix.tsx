"use client";

import { useEffect, useRef } from "react";
import type { Vector3, WebGLRenderer, PerspectiveCamera } from "three";

const HELIX_HEIGHT = 24; 

export function DnaHelix() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    let animId: number;
    let renderer: WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const el = mountRef.current;

    const init = async () => {
      const THREE = await import("three");

      const width = el.clientWidth;
      const height = el.clientHeight;

      
      const fitCameraToContainer = (
        camera: PerspectiveCamera,
        w: number,
        h: number,
      ) => {
        camera.aspect = w / h;
        const vFov = (camera.fov * Math.PI) / 180;
        const distanceForHeight = HELIX_HEIGHT / (2 * Math.tan(vFov / 2));
        const aspectPadding = Math.max(1, 1 / camera.aspect) * 1.15;
        camera.position.z = distanceForHeight * aspectPadding * 0.55;
        camera.updateProjectionMatrix();
      };

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
      fitCameraToContainer(camera, width, height);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      el.appendChild(renderer.domElement);

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
      const HEIGHT = HELIX_HEIGHT;
      const RADIUS = 2.6;

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

      const tube1 = new THREE.TubeGeometry(curve1, SEGMENTS, 0.13, 8, false);
      group.add(new THREE.Mesh(tube1, new THREE.MeshPhongMaterial({ color: 0xde8246, shininess: 90 })));

      const tube2 = new THREE.TubeGeometry(curve2, SEGMENTS, 0.13, 8, false);
      group.add(new THREE.Mesh(tube2, new THREE.MeshPhongMaterial({ color: 0x4a8f50, shininess: 90 })));

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

        const rungGeo = new THREE.CylinderGeometry(0.065, 0.065, len, 6);
        const rung = new THREE.Mesh(rungGeo, mat);
        rung.position.copy(mid);
        rung.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        group.add(rung);

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

      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry || !renderer) return;
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (w === 0 || h === 0) return;
        fitCameraToContainer(camera, w, h);
        renderer.setSize(w, h);
      });
      resizeObserver.observe(el);

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
      resizeObserver?.disconnect();
      if (renderer) {
        try { el.removeChild(renderer.domElement); } catch {}
        renderer.dispose();
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}