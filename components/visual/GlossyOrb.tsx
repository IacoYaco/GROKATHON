"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function GlossyOrb({
  className,
  accent = "#286DC0",
}: {
  className?: string;
  accent?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 320;
    const height = mount.clientHeight || 320;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    camera.position.z = 4.2;

    const key = new THREE.DirectionalLight(0xffffff, 1.35);
    key.position.set(2.4, 2.8, 3.2);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    const rim = new THREE.PointLight(accent, 1.1, 12);
    rim.position.set(-2.2, -1.2, 2.4);
    scene.add(rim);

    const geo = new THREE.SphereGeometry(1.15, 64, 64);
    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#f7f3f1"),
      metalness: 0.18,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      reflectivity: 0.9,
      iridescence: 0.35,
      iridescenceIOR: 1.3,
      sheen: 0.4,
      sheenColor: new THREE.Color(accent),
      transmission: 0.08,
      thickness: 0.6,
    });
    const orb = new THREE.Mesh(geo, mat);
    scene.add(orb);

    const ringGeo = new THREE.TorusGeometry(1.55, 0.035, 24, 120);
    const ringMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(accent),
      metalness: 0.7,
      roughness: 0.18,
      clearcoat: 1,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.6;
    scene.add(ring);

    const pointer = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      const rect = mount.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    };
    mount.addEventListener("pointermove", onMove);

    let frame = 0;
    let raf = 0;
    const animate = () => {
      frame += 0.012;
      orb.rotation.y = frame * 0.35 + pointer.x * 0.35;
      orb.rotation.x = Math.sin(frame * 0.6) * 0.12 + pointer.y * 0.25;
      ring.rotation.z = frame * 0.25;
      ring.rotation.y = pointer.x * 0.2;
      orb.position.y = Math.sin(frame) * 0.08;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      const w = mount.clientWidth || width;
      const h = mount.clientHeight || height;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      mount.removeEventListener("pointermove", onMove);
      geo.dispose();
      mat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [accent]);

  return <div ref={mountRef} className={className} aria-hidden />;
}
