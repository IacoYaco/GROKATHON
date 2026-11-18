"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { buildCadMesh } from "@/lib/cad-geometry";
import type { CadRecipe } from "@/types/ceid";

export function CadViewport({
  recipe,
  referenceBuffer,
  showGhost,
  wireframe,
}: {
  recipe: CadRecipe | null;
  referenceBuffer: ArrayBuffer | null;
  showGhost: boolean;
  wireframe: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    part: THREE.Object3D | null;
    ghost: THREE.Object3D | null;
    grid: THREE.GridHelper;
  } | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0B1120");

    const camera = new THREE.PerspectiveCamera(
      40,
      mount.clientWidth / Math.max(mount.clientHeight, 1),
      0.1,
      2000
    );
    camera.position.set(90, 70, 110);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 5, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xb0b8c0, 0.9);
    scene.add(hemi);
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(40, 80, 30);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x286dc0, 0.35);
    fill.position.set(-30, 20, -40);
    scene.add(fill);

    const grid = new THREE.GridHelper(200, 20, 0x286dc0, 0x1e293b);
    scene.add(grid);

    stateRef.current = {
      scene,
      camera,
      renderer,
      controls,
      part: null,
      ghost: null,
      grid,
    };

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = Math.max(mount.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    if (state.part) {
      state.scene.remove(state.part);
      state.part.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      state.part = null;
    }
    if (!recipe) return;
    const mesh = buildCadMesh(recipe);
    mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => {
          if ("wireframe" in m) (m as THREE.MeshStandardMaterial).wireframe = wireframe;
        });
      }
    });
    state.scene.add(mesh);
    state.part = mesh;
  }, [recipe, wireframe]);

  useEffect(() => {
    const state = stateRef.current;
    if (!state) return;
    if (state.ghost) {
      state.scene.remove(state.ghost);
      state.ghost.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      state.ghost = null;
    }
    if (!referenceBuffer || !showGhost) return;
    const loader = new STLLoader();
    const geometry = loader.parse(referenceBuffer);
    geometry.computeVertexNormals();
    geometry.center();
    // Scale mm assumption already; lift slightly
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x00356b,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const ghost = new THREE.Mesh(geometry, ghostMat);
    ghost.rotation.x = -Math.PI / 2;
    state.scene.add(ghost);
    state.ghost = ghost;
  }, [referenceBuffer, showGhost]);

  return (
    <div
      ref={mountRef}
      className="h-[360px] w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0B1120] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:h-[480px]"
    />
  );
}
