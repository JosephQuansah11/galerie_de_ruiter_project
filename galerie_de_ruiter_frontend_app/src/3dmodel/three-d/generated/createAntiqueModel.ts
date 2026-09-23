import * as THREE from "three";

export function createAntiqueModel(frontImageUrl?: string): THREE.Group {
  const root = new THREE.Group();

  // --------------------------------------------------
  // Materials
  // --------------------------------------------------

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4226,
    roughness: 0.75,
    metalness: 0.05,
  });

  const frontTexture = frontImageUrl
    ? new THREE.TextureLoader().load(frontImageUrl)
    : undefined;
  if (frontTexture) {
    frontTexture.colorSpace = THREE.SRGBColorSpace;
  }

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x3f2415,
    roughness: 0.8,
    metalness: 0.05,
  });

  const goldMaterial = new THREE.MeshStandardMaterial({
    color: 0xb08d57,
    roughness: 0.35,
    metalness: 0.7,
  });

  // --------------------------------------------------
  // Main body
  // --------------------------------------------------

  const bodyGeometry = new THREE.BoxGeometry(
    2.4, // width
    1.8, // height
    1.2  // depth
  );

  const body = new THREE.Mesh(
    bodyGeometry,
    woodMaterial
  );

  body.position.y = 0.9;

  body.castShadow = true;
  body.receiveShadow = true;

  root.add(body);

  // --------------------------------------------------
  // Top
  // --------------------------------------------------

  const topGeometry = new THREE.BoxGeometry(
    2.6,
    0.18,
    1.4
  );

  const top = new THREE.Mesh(
    topGeometry,
    darkWoodMaterial
  );

  top.position.y = 1.89;

  top.castShadow = true;
  top.receiveShadow = true;

  root.add(top);

  // --------------------------------------------------
  // Four legs
  // --------------------------------------------------

  const legGeometry = new THREE.CylinderGeometry(
    0.12,
    0.16,
    0.8,
    16
  );

  const legPositions = [
    [-0.95, 0.4, -0.45],
    [0.95, 0.4, -0.45],
    [-0.95, 0.4, 0.45],
    [0.95, 0.4, 0.45],
  ];

  for (const [x, y, z] of legPositions) {
    const leg = new THREE.Mesh(
      legGeometry,
      darkWoodMaterial
    );

    leg.position.set(x, y, z);

    leg.castShadow = true;
    leg.receiveShadow = true;

    root.add(leg);
  }

  // --------------------------------------------------
  // Decorative front panel
  // --------------------------------------------------

  const panelGeometry = new THREE.BoxGeometry(
    1.7,
    0.9,
    0.08
  );

  const panelMaterial = frontTexture
    ? new THREE.MeshStandardMaterial({
        map: frontTexture,
        roughness: 0.8,
        metalness: 0.05,
      })
    : darkWoodMaterial;
  const panel = new THREE.Mesh(panelGeometry, panelMaterial);

  panel.position.set(
    0,
    1.0,
    0.64
  );

  panel.castShadow = true;
  panel.receiveShadow = true;

  root.add(panel);

  // --------------------------------------------------
  // Decorative gold frame
  // --------------------------------------------------

  const frameParts = [
    [1.85, 0.08, 0.04, 0, 1.485, 0.69],
    [1.85, 0.08, 0.04, 0, 0.515, 0.69],
    [0.08, 0.9, 0.04, -0.885, 1.0, 0.69],
    [0.08, 0.9, 0.04, 0.885, 1.0, 0.69],
  ] as const;

  for (const [width, height, depth, x, y, z] of frameParts) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      goldMaterial
    );
    frame.position.set(x, y, z);
    frame.castShadow = true;
    frame.receiveShadow = true;
    root.add(frame);
  }

  // --------------------------------------------------
  // Center decoration
  // --------------------------------------------------

  const decorationGeometry =
    new THREE.SphereGeometry(0.22, 24, 24);

  const decoration = new THREE.Mesh(
    decorationGeometry,
    goldMaterial
  );

  decoration.position.set(
    0,
    1.0,
    0.76
  );

  decoration.castShadow = true;

  root.add(decoration);

  // --------------------------------------------------
  // Normalize model
  // --------------------------------------------------

  root.position.set(0, 0, 0);

  root.rotation.set(0, 0, 0);

  root.scale.setScalar(1);

  // Store useful metadata for the designer
  root.userData = {
    type: "antique",
    source: "img2three",
    generated: true,
  };

  return root;
}