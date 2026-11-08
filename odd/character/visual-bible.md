# Original low-poly Daskalov visual bible v0.1

The original GLB is a lightweight, stylized placeholder; all geometry was generated from basic mathematical box and octahedron primitives. It contains no downloaded or third-party assets. It is *not* an actor likeness, a professional character, or a production-ready rig.

Appearance: elderly theatrical teacher; olive-grey coat, warm tan skin, charcoal moustache, grey hair, dark trousers, wooden ruler. The classroom keeps subdued green/cream walls, dark board and wooden desks. Simplified style is intentional for low-VRAM browsers.

Size and composition: local avatar origin at feet, ~3.15 scene units tall; large head, exaggerated moustache and facial eyes for readability. Procedural fallback preserves the same visual silhouette.

Asset: public/assets/daskalov-lowpoly.glb (glTF 2.0, embedded geometry, vertex position and materials; no external URLs). Named meshes Daskalov_Head, Daskalov_Mouth, Daskalov_ArmRight, Daskalov_Torso, etc. Dynamic mouth rotation and basic gestures are approximate.

Current limitations: NO skeletal skin, face morph targets, UV textures, baked lighting, professional blinks, or AnimationMixer clips. Those remain open S05.02-06 and cannot be marked FULL.

Rig target for approved future asset: hips/spine/neck/head, both upper/lower arms, eyes/lids, eyebrow pairs, jaw, lip and moustache controls; phoneme visemes REST/A/I/E/O/U/MBP/FV/L/CHSH; 8-12 named facial morphs; idle, point, turn, surprise, speak, ruler-to-desk, raise-hand clips.

LOD: current GLB under 250 KB; future low quality ≤30k triangles, medium ≤80k, high only with measured FPS and texture budget. No realistic skin textures on very weak GPUs.

License and rights: original purely procedural placeholder in this repository. Any later purchased/generated mesh, animation or voice needs explicit per-asset rights and documented provenance before publication.

## Rigged original avatar v0.2
- `public/assets/daskalov-lowpoly.glb` replaced with an original, 72 KB GLB 2.0: 7 real skeleton joints, skin weights, inverse bind matrices, vertex-colored materials, UV coordinates and textured-ready geometry.
- The face mesh `Daskalov_Mouth` exposes 12 named morph targets: mouthOpen, mouthWide, mouthNarrow, lipsClosed, lowerLipBite, tongueUp, lipsForward, browRaise, browFrown, blinkLeft, blinkRight, smile.
- Three.js GLTFLoader and AnimationMixer use named nodes Daskalov_Head, Daskalov_ArmRight, Daskalov_Torso; when GLB is invalid the procedural character remains visible.
- Mouth shapes now respond to the AudioClock via facial morph weights. This is a stylized rig with synthetic viseme timings, **not** an actor-calibrated or professionally lip-synced model.
- All meshes/materials are original procedural geometry with no downloaded external asset, voice or licensed texture dependency.
- S05.02 and S05.03 implementation can be technically checked, but production 3D gate still requires visual/manual review, measured VRAM/FPS and art-direction approval.

## Liberación del avatar provisional
Tras crear correctamente el GLB, el motor retira del grafo el avatar de esferas y libera sus geometrías independientes, conservando la BoxGeometry que comparte con el aula instanciada. Si GLB falla, el personaje provisional sigue visible. `GFX-006` prueba la política, pero deben medirse VRAM/FPS y revisarse visualmente los assets antes de aprobar 3D-READY.
