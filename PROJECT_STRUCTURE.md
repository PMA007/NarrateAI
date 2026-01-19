# Project Structure & File Use Cases

## 📂 src/app
The main application routing and page structure (Next.js App Router).

- **`layout.tsx`**: The root layout wrapper handling fonts (`Outfit`, `Inter`) and global metadata.
- **`page.tsx`**: The **Home Page**. Contains the hero section, template selection grid (Neon, Liquid Glass, Lux), and the "Create" button to start the wizard.
- **`globals.css`**: Global Tailwind CSS styles and custom utility classes.
- **`editor/page.tsx`**: The **Editor Interface**. Allows users to edit the generated script, change slide layouts, headers, and content before rendering.
- **`studio/page.tsx`**: The **Studio/Recording Interface**. Handles the "High Quality" recording workflow using screen capture.
- **`render/page.tsx`**: The **Rendering Page**. Displays the video generation progress (scripting, audio, rendering) and the final video player/download.

### 📂 src/app/api
Server-side API endpoints.
- **`api/generate/route.ts`**: The core **Generation API**. Orchestrates the AI implementation plan:
    1.  Receives user topic/prompt.
    2.  Calls `src/lib/llm.ts` to generate the script.
    3.  Calls `src/lib/tts.ts` to generate audio for each slide.
    4.  Returns the complete `Script` object to the client.
- **`api/tts/route.ts`**: A dedicated endpoint for Text-to-Speech generation, used for individual slide updates or retries.

## 📂 src/lib
Core business logic and utility functions.

- **`store.ts`**: **Global State Management** (Zustand). Stores the current `Script`, `audioUrls`, playback state (`isPlaying`, `currentTime`), and user preferences. central nervous system of the app.
- **`webcodecs-renderer.ts`**: The **Video Rendering Engine**. Uses `VideoEncoder`, `AudioEncoder`, and `Mp4Muxer` to generate high-quality MP4 videos directly in the browser. Handles canvas drawing, frame encoding, and audio mixing.
- **`renderer.ts`**: **Legacy/Base Types**. Likely contains older rendering logic or type definitions shared across renderers.
- **`llm.ts`**: **AI Logic**. Interfaces with the LLM (Gemini/OpenAI) to generate the presentation structure, slide content, and narration based on the user's prompt.
- **`tts.ts`**: **Text-to-Speech Logic**. Handles requests to the TTS provider (Google/Edge/OpenAI) to convert slide narration into MP3 audio buffers.
- **`utils.ts`**: General helper functions (class name merging, etc.).
- **`dummy-data.ts`**: Contains static example scripts (`DUMMY_NEON_SCRIPT`, `DUMMY_LUX_SCRIPT`) used for previews and testing.
- **`fonts.ts`**: Font loading and configuration utilities.
- **`pdf.ts`**: Logic for exporting the presentation as a PDF document.
- **`prompt.ts`**: System prompts and constraints for the LLM to ensure consistent JSON output for scripts.

## 📂 src/components/canvas
The core visual rendering layer. These components draw the actual slides.

- **`Stage.tsx`**: The **Main Canvas Container**. Handles scaling, aspect ratio (16:9), and renders the active `Slide` based on the timeline. It acts as the "screen" for the presentation.
- **`Slide.tsx`**: The **Master Slide Component**. Determines which layout to render (Title, Columns, Chart, etc.) and applies the correct typography and animations based on the active Template.
- **`theme.ts`**: **Theme Definitions**. Defines the colors, fonts, and shape properties for each design system (Neon, Liquid Glass, Lux).

## 📂 src/components/templates
Background visual systems for the slides.

- **`NeonTemplate.tsx`**: The "Neon Dark" background. Features moving gradient paths (`BackgroundPaths`) and a dark tech aesthetic.
- **`LiquidGlassTemplate.tsx`**: The "Liquid Glass" background. Uses advanced WebGL shaders (`LiquidMetal`) for a distorted, fluid visual effect.

## 📂 src/components/ui
Reusable UI components.

- **`layout-preview-modal.tsx` / `template-preview-modal.tsx`**: Modals for previewing how a specific template or layout looks before selecting it.
- **`slide-thumbnail.tsx`**: Renders a small preview of a slide for the timeline or navigation strip.
- **`floating-paths.tsx`**: The animated SVG paths used in the Neon template.
- **`liquid-svg.tsx`**: Helper for SVG rendering in liquid templates.
- **`render-settings-modal.tsx`**: UI component for configuring export settings (resolution, format).
- **`background-shades.tsx`**: Wrapper for the shader effects used in the Liquid Glass template.

## 🗑️ Cleaned Up / Removed Files
The following irrelevant or unused items were identified and removed:
- `src/components/controls`: (Empty directory)
- `src/app/aura-demo`: (Leftover demo page)
- `src/components/templates/AuraTemplate.tsx`: (Reverted template)
- `studio_lint.txt`: (Temporary log file)
