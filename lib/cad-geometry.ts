import * as THREE from "three";
import type { CadRecipe } from "@/types/ceid";

/** Build a printable CSG-ish mesh via Shape extrusion + hole paths (mm units). */
export function buildCadMesh(recipe: CadRecipe): THREE.Mesh {
  const shape = new THREE.Shape();
  const hw = recipe.width / 2;
  const hd = recipe.depth / 2;
  const r = Math.max(0, Math.min(recipe.cornerRadius, hw, hd));

  if (r > 0) {
    shape.moveTo(-hw + r, -hd);
    shape.lineTo(hw - r, -hd);
    shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
    shape.lineTo(hw, hd - r);
    shape.quadraticCurveTo(hw, hd, hw - r, hd);
    shape.lineTo(-hw + r, hd);
    shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
    shape.lineTo(-hw, -hd + r);
    shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  } else {
    shape.moveTo(-hw, -hd);
    shape.lineTo(hw, -hd);
    shape.lineTo(hw, hd);
    shape.lineTo(-hw, hd);
    shape.lineTo(-hw, -hd);
  }

  for (const hole of recipe.holes) {
    const path = new THREE.Path();
    path.absarc(hole.x, hole.y, Math.max(0.2, hole.diameter / 2), 0, Math.PI * 2, true);
    shape.holes.push(path);
  }

  const wall = recipe.wallThickness;
  if (wall && wall > 0 && wall * 2 < recipe.width && wall * 2 < recipe.depth) {
    const inner = new THREE.Path();
    const ihw = hw - wall;
    const ihd = hd - wall;
    inner.moveTo(-ihw, -ihd);
    inner.lineTo(ihw, -ihd);
    inner.lineTo(ihw, ihd);
    inner.lineTo(-ihw, ihd);
    inner.lineTo(-ihw, -ihd);
    shape.holes.push(inner);
  }

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.4, recipe.height),
    bevelEnabled: false,
    curveSegments: 24,
  });
  // Extrude goes along +Z from 0; center vertically
  geo.translate(0, 0, 0);
  geo.rotateX(-Math.PI / 2);
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#286DC0"),
    metalness: 0.15,
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  // Raised bosses as simple boxes on top face
  for (const feature of recipe.features) {
    const fGeo = new THREE.BoxGeometry(
      Math.max(0.5, feature.width),
      Math.max(0.5, feature.height),
      Math.max(0.5, feature.depth)
    );
    const fMesh = new THREE.Mesh(
      fGeo,
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#00356B"),
        roughness: 0.4,
        metalness: 0.1,
      })
    );
    fMesh.position.set(
      feature.x,
      recipe.height + feature.height / 2,
      -feature.y
    );
    mesh.add(fMesh);
  }

  return mesh;
}

export function estimatePrintStats(recipe: CadRecipe): {
  volumeCm3: number;
  grams: number;
  minutes: number;
} {
  let volume = recipe.width * recipe.depth * recipe.height;
  for (const h of recipe.holes) {
    volume -= Math.PI * (h.diameter / 2) ** 2 * recipe.height;
  }
  if (recipe.wallThickness) {
    const innerW = Math.max(0, recipe.width - 2 * recipe.wallThickness);
    const innerD = Math.max(0, recipe.depth - 2 * recipe.wallThickness);
    volume = volume - innerW * innerD * Math.max(0, recipe.height - recipe.wallThickness);
  }
  for (const f of recipe.features) {
    volume += f.width * f.depth * f.height;
  }
  volume = Math.max(volume, 100);
  const volumeCm3 = volume / 1000;
  const grams = volumeCm3 * 1.24; // PETG-ish
  const minutes = Math.round(volumeCm3 * 8 + 12);
  return { volumeCm3, grams, minutes };
}
