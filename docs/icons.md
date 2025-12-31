# Icon Specifications for cp-ninja Extension

This document details the specifications for icons required by the `cp-ninja` VS Code extension.

---

### 1. Chat Participant Icon

This icon represents the `@cp-ninja` chat participant within the VS Code chat panel.

*   **File Path:** `./icon.png` (relative to the extension root, as referenced in `package.json`)
*   **Format:** PNG (Portable Network Graphics)
*   **Dimensions:** `16x16` pixels or `24x24` pixels (must be square). `16x16` is a common standard.
*   **Style:** Simple, clear, and easily recognizable. It should visually represent the "Copilot Ninja" identity. Consider using a transparent background.

---

### 2. Activity Bar View Container Icon

This icon is displayed in the VS Code Activity Bar (the far-left sidebar) and represents the "Copilot Ninja" view container.

*   **File Path:** `resources/cp-ninja-icon.svg` (relative to the extension root, as referenced in `package.json`)
*   **Format:** SVG (Scalable Vector Graphics) is **highly recommended**. SVG ensures the icon scales perfectly to different sizes and display densities without pixelation and adapts well to VS Code's theme changes.
*   **Dimensions:** While displayed at approximately `24x24` pixels, providing a vector SVG ensures optimal rendering.
*   **Style:**
    *   **Monochrome or Limited Palette:** Should primarily use a single color (e.g., black or white depending on the theme) or a very limited color palette to integrate seamlessly with VS Code's theming.
    *   **Distinctive:** Should clearly represent the extension.

---

### 3. Status Bar Item Icon

This icon appears in the VS Code Status Bar (at the bottom of the editor).

*   **Type:** This currently uses a **VS Code Theme Icon**.
*   **Implementation:** `$(beaker)` is currently used. This is a built-in icon provided by VS Code and automatically adapts its color to the active theme.
*   **Customization:** If a custom icon is desired here, it would require providing an SVG or PNG and referencing it differently in the `src/extension.ts` code that creates the status bar item. For initial setup, `$(beaker)` is sufficient.

---

### Actionable Steps:

*   **For the Chat Participant Icon:** Create a `16x16` or `24x24` PNG file named `icon.png` and place it directly in the `cp-ninja` project root (`./cp-ninja/icon.png`).
*   **For the Activity Bar Icon:** Create an SVG file named `cp-ninja-icon.svg` and place it in a new `resources` directory within the `cp-ninja` project (`./cp-ninja/resources/cp-ninja-icon.svg`). You may need to create the `resources` directory.
*   Ensure these files exist in the specified locations for the icons to load correctly in VS Code.
