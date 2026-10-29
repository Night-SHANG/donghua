# Runner scene: two actual Remotion stills

This project renders two static PNGs from actual scene code using Remotion `renderStill`: RunnerFront and RunnerTurn, each 1600×900. No video or audio is produced. No image-generation assets, user reference videos, screenshots, downloaded artwork, or paid services are included.

Pinned dependencies and browser host conventions reuse the previously verified Remotion 4.0.534 cloud host. CI installs with lifecycle scripts disabled. The workflow validates TypeScript and the exact-two-still plan, renders both PNGs once, checks signatures and dimensions, and exports source commit and SHA-256 records.

The scene is code-authored projected 3D geometry drawn with SVG; these images demonstrate the actual implementation, not conceptual artwork. A static result establishes visual feasibility only, not runtime motion or gameplay quality.
