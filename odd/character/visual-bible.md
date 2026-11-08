# Original low-poly Daskalov visual bible v0.1

The original GLB is a lightweight, stylized placeholder; all geometry was generated from basic mathematical box and octahedron primitives. It contains no downloaded or third-party assets. It is *not* an actor likeness, a professional character, or a production-ready rig.

Appearance: elderly theatrical teacher; olive-grey coat, warm tan skin, charcoal moustache, grey hair, dark trousers, wooden ruler. The classroom keeps subdued green/cream walls, dark board and wooden desks. Simplified style is intentional for low-VRAM browsers.

Size and composition: local avatar origin at feet, ~3.15 scene units tall; large head, exaggerated moustache and facial eyes for readability. Procedural fallback preserves the same visual silhouette.

Asset: public/assets/daskalov-lowpoly.glb (glTF 2.0, embedded geometry, vertex position and materials; no external URLs). Named meshes Daskalov_Head, Daskalov_Mouth, Daskalov_ArmRight, Daskalov_Torso, etc. Dynamic mouth rotation and basic gestures are approximate.

Current limitations: NO skeletal skin, face morph targets, UV textures, baked lighting, professional blinks, or AnimationMixer clips. Those remain open S05.02-06 and cannot be marked FULL.

Rig target for approved future asset: hips/spine/neck/head, both upper/lower arms, eyes/lids, eyebrow pairs, jaw, lip and moustache controls; phoneme visemes REST/A/I/E/O/U/MBP/FV/L/CHSH; 8-12 named facial morphs; idle, point, turn, surprise, speak, ruler-to-desk, raise-hand clips.

LOD: current GLB under 250 KB; future low quality ≤30k triangles, medium ≤80k, high only with measured FPS and texture budget. No realistic skin textures on very weak GPUs.

License and rights: original purely procedural placeholder in this repository. Any later purchased/generated mesh, animation or voice needs explicit per-asset rights and documented provenance before publication.
