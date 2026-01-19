import { Slide } from '@/lib/store';
import { FONT_OPTIONS, FontKey } from '@/lib/fonts';

// Easing function for animations
function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// Draw Retro Background (Replicates RetroTemplate)
export function drawRetroBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
) {
    // 1. Main Background: Radial Gradient
    // radial-gradient(120% 120% at 20% 18%, #f2f6ff 0%, #d5e3f6 36%, #a4bcd6 72%, #8aa3be 100%)
    // Canvas radial: x0, y0, r0, x1, y1, r1.
    // CSS radial-gradient is complex to map exactly but we can approximate.
    // Center 20% 18%.
    const cx = width * 0.2;
    const cy = height * 0.18;
    const r = Math.max(width, height) * 1.2;

    const bgGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    bgGrad.addColorStop(0, '#f2f6ff');
    bgGrad.addColorStop(0.36, '#d5e3f6');
    bgGrad.addColorStop(0.72, '#a4bcd6');
    bgGrad.addColorStop(1, '#8aa3be');

    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Grain Effect (Simplified as noise overlay?)
    // Converting repeating-linear-gradient to canvas is tedious.
    // We'll skip the micro-grain for performance/complexity trade-off unless critical.
    // It's barely visible opacity 0.08.

    // 3. Vignette Overlay (3 layers)
    // Layer 1: radial-gradient(110% 110% at 50% 10%, rgba(255,255,255,.26) 0%, rgba(255,255,255,0) 42%)
    const v1 = ctx.createRadialGradient(width * 0.5, height * 0.1, 0, width * 0.5, height * 0.1, Math.max(width, height) * 1.1);
    v1.addColorStop(0, 'rgba(255,255,255,0.26)');
    v1.addColorStop(0.42, 'rgba(255,255,255,0)');
    v1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = v1;
    ctx.fillRect(0, 0, width, height);

    // Layer 2: radial-gradient(110% 110% at 80% 70%, rgba(0,0,0,.16) 0%, rgba(0,0,0,0) 55%)
    const v2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, Math.max(width, height) * 1.1);
    v2.addColorStop(0, 'rgba(0,0,0,0.16)');
    v2.addColorStop(0.55, 'rgba(0,0,0,0)');
    v2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = v2;
    ctx.fillRect(0, 0, width, height);

    // Layer 3: radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,.20) 100%)
    const v3 = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 1.2);
    v3.addColorStop(0, 'rgba(0,0,0,0)');
    v3.addColorStop(0.58, 'rgba(0,0,0,0)');
    v3.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = v3;
    ctx.fillRect(0, 0, width, height);
}


// Draw Floating Paths Background (Replicates NeonTemplate/FloatingPaths)
export function drawNeonBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
) {
    // Clear with dark background
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw paths
    const positions = [1, -1];

    // SVG ViewBox is 0 0 696 316. We need to scale to canvas size.
    // Width ratio: width / 696
    // Height ratio: height / 316
    // We maintain aspect ratio or cover? The original is w-full h-full.
    const scaleX = width / 696;
    const scaleY = height / 316;

    ctx.save();
    ctx.scale(scaleX, scaleY);
    // Center offset? The path coordinates are centered around 0,0-ish or need offset?
    // Original path coords like -380...
    // ViewBox 0 0 696 316. 
    // SVG center is ~348, 158.
    // The paths are drawn relative to center?
    // Let's assume we translate to center.
    ctx.translate(696 / 2, 316 / 2);

    positions.forEach(position => {
        for (let i = 0; i < 36; i++) {
            const id = i;
            const duration = 20 + (id % 10);
            const progress = (time % duration) / duration;

            // Opacity animation: 0.3 -> 0.6 -> 0.3
            const opacity = 0.3 + 0.3 * Math.sin(progress * Math.PI);

            // Path Offset: 0 -> 1 -> 0
            const offset = 1 * Math.sin(progress * Math.PI);

            const colorOpacity = 0.1 + i * 0.03;
            // color: `rgba(15,23,42,${0.1 + i * 0.03})` -> slate-900 (dark)
            // But in dark mode it says dark:text-white opacity-50 in SVG parent
            // The paths in FloatingPaths.tsx have stroke="currentColor".
            // Parent has text-slate-950 dark:text-white. 
            // In Neon (dark), line color is white-ish?
            // "rgba(15,23,42...)" is dark blue.
            // Wait, FloatingPaths.tsx line 27: color is set but line 48 uses currentColor.
            // And line 39 sets className text-slate-950 dark:text-white.
            // So in Dark Mode, it is WHITE.

            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`; // 0.5 from parent opacity-50
            ctx.lineWidth = 0.5 + i * 0.03;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Calculate path points (replicated from FloatingPaths.tsx)
            // d: M start C cp1 cp2 end ...
            const p1x = -(380 - i * 5 * position);
            const p1y = -(189 + i * 6);

            const cp1x = -(380 - i * 5 * position);
            const cp1y = -(189 + i * 6);

            const cp2x = -(312 - i * 5 * position);
            const cp2y = (216 - i * 6);

            const endx = (152 - i * 5 * position);
            const endy = (343 - i * 6);

            const cp3x = (616 - i * 5 * position);
            const cp3y = (470 - i * 6);

            const cp4x = (684 - i * 5 * position);
            const cp4y = (875 - i * 6);

            const end2x = (684 - i * 5 * position);
            const end2y = (875 - i * 6);

            const path = new Path2D();
            path.moveTo(p1x, p1y);
            path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endx, endy);
            path.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, end2x, end2y);

            // Dash animation
            // Approximate length ~1500 (diagonal-ish)
            const pathLen = 1500;
            // strokeDasharray="1" pathLength="1". 
            // Means dash is 100% of length.
            // strokeDashoffset = -offset.
            // If offset is 0, full line.
            // If offset is 1, gap.
            // In pixels: dash array [pathLen, pathLen].
            // offset pixels: -offset * pathLen.

            ctx.setLineDash([pathLen, pathLen]);
            ctx.lineDashOffset = -offset * pathLen;

            ctx.stroke(path);
        }
    });

    ctx.restore();
}


// Draw Slide Content (Replicates SlideRenderer)
export function drawSlideContent(
    ctx: CanvasRenderingContext2D,
    slide: Slide,
    fontKey: string,
    width: number,
    height: number,
    localTime: number,
    template: 'neon' | 'retro'
) {
    const fontConfig = FONT_OPTIONS[fontKey as FontKey] || FONT_OPTIONS['Modern'];
    const fontFamily = fontConfig.family.replace(/'/g, "").split(',')[0]; // Extract primary family

    const accentColor = template === 'retro' ? '#2563eb' : '#22d3ee'; // Blue vs Cyan
    const textColor = template === 'retro' ? '#1e293b' : '#ffffff';

    // Title Animation
    const words = slide.title.split(" ");
    const wordBaseDelay = 0;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const titleY = height * 0.2; // 20% down

    // Measure total width first to center
    // Simplified: Draw line by line? or all in one line?
    // AnimatedTitle is flex/text-center. Assume center.

    let currentX = width / 2;
    // We'll draw word by word, centered? 
    // Actually, getting exact centered layout word-by-word with animation is hard.
    // Better: Draw full string, but use globalAlpha for fade-in?
    // User wants "minute details". AnimatedTitle animates words individually.

    // Calculate total width of title
    ctx.font = `bold ${Math.min(width / 15, 80)}px "${fontFamily}"`; // Dynamic font size
    const totalTitleWidth = ctx.measureText(slide.title).width;
    let titleCursorX = (width - totalTitleWidth) / 2;

    words.forEach((word, i) => {
        const start = wordBaseDelay + i * 0.1;
        const p = Math.min(1, Math.max(0, (localTime - start) / 0.8));
        const eased = easeOutCubic(p);

        const yOffset = 20 * (1 - eased);
        const opacity = eased;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(0, yOffset);

        // Gradient text for Neon
        if (template === 'neon') {
            const gradient = ctx.createLinearGradient(titleCursorX, titleY, titleCursorX + 100, titleY);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, 'rgba(255,255,255,0.8)');
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = textColor;
        }

        ctx.textAlign = 'left';
        ctx.fillText(word, titleCursorX, titleY);
        ctx.restore();

        titleCursorX += ctx.measureText(word + " ").width;
    });

    // Content Body based on Layout
    const contentY = height * 0.35;
    ctx.textAlign = 'left';
    ctx.fillStyle = textColor;

    // Helper: Rounded Rect
    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    };

    // Helper: Wrap Text
    const wrapText = (text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
    };

    if (slide.layout === 'columns_3' && slide.content.bullets) {
        const items = slide.content.bullets.slice(0, 3);
        const gap = 40;
        const totalGap = gap * 2;
        const remainingWidth = width * 0.8;
        const colWidth = remainingWidth / 3;
        const startX = width * 0.1;

        items.forEach((item, i) => {
            const delay = 0.5 + i * 0.3;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.8));
            const eased = easeOutCubic(p);

            if (p <= 0) return;

            const x = startX + i * (colWidth + gap);
            const y = contentY;
            const h = height * 0.5;

            ctx.globalAlpha = eased;

            // Card Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;

            // Shadow
            ctx.shadowBlur = 15;
            ctx.shadowColor = accentColor; // "Neon" glow

            roundRect(x, y, colWidth, h, 16);
            ctx.fill();
            ctx.stroke();

            ctx.shadowBlur = 0; // Reset

            // Number Circle
            const cx = x + colWidth / 2;
            const cy = y + 60;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = `bold ${Math.min(width / 60, 24)}px "${fontFamily}"`;
            ctx.fillStyle = accentColor;
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), cx, cy + 8);

            // Content
            ctx.fillStyle = textColor;
            ctx.font = `${Math.min(width / 60, 20)}px "${fontFamily}"`;
            ctx.textAlign = 'center';
            wrapText(item, cx, y + 140, colWidth - 40, 30);

            ctx.globalAlpha = 1;
        });

    } else if (slide.layout === 'grid_cards' && slide.content.bullets) {
        const items = slide.content.bullets.slice(0, 4);
        const gap = 40;
        const remainingWidth = width * 0.7; // Tighter grid
        const colWidth = remainingWidth / 2;
        const rowHeight = height * 0.25;
        const startX = (width - remainingWidth) / 2;

        items.forEach((item, i) => {
            const delay = 0.5 + i * 0.3;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.8));
            const eased = easeOutCubic(p);

            if (p <= 0) return;

            const col = i % 2;
            const row = Math.floor(i / 2);

            const x = startX + col * (colWidth + gap);
            const y = contentY + row * (rowHeight + gap);

            ctx.globalAlpha = eased;

            // Card
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = accentColor;

            roundRect(x, y, colWidth, rowHeight, 16);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Content
            ctx.fillStyle = textColor;
            ctx.font = `${Math.min(width / 50, 24)}px "${fontFamily}"`;
            ctx.textAlign = 'center';
            // Center vertically in card
            wrapText(item, x + colWidth / 2, y + rowHeight / 2 + 8, colWidth - 40, 32);

            ctx.globalAlpha = 1;
        });

    } else if (slide.layout === 'chart_bar' && slide.content.chart_data) {
        const { labels, values, label } = slide.content.chart_data;
        const chartHeight = height * 0.4;
        const chartWidth = width * 0.6;
        const startX = (width - chartWidth) / 2;
        const startY = contentY + chartHeight;

        const maxValue = Math.max(...values, 100);
        const barWidth = (chartWidth / values.length) * 0.6;
        const gap = (chartWidth / values.length) * 0.4;

        // Draw Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + chartWidth, startY); // X Axis
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY - chartHeight); // Y Axis
        ctx.stroke();

        values.forEach((val, i) => {
            const barH = (val / maxValue) * chartHeight;
            const x = startX + gap / 2 + i * (barWidth + gap);
            const y = startY - barH;

            // Animation
            const barDelay = 0.5 + i * 0.1;
            const p = Math.min(1, Math.max(0, (localTime - barDelay) / 0.5));
            const eased = easeOutCubic(p);

            const currentH = barH * eased;
            const currentY = startY - currentH;

            // Gradient Bar
            const grad = ctx.createLinearGradient(0, currentY, 0, currentY + currentH);
            grad.addColorStop(0, accentColor);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;

            ctx.fillRect(x, currentY, barWidth, currentH);

            // Label
            if (p > 0.5) {
                // drawLabel function is defined above in local scope? No, need to redefine or move it up.
                // Re-defining for scope safety due to block replacement
                ctx.textAlign = 'center';
                ctx.font = `${Math.min(width / 60, 20)}px "${fontFamily}"`;
                ctx.fillStyle = textColor;
                ctx.fillText(labels[i], x + barWidth / 2, startY + 30);
                ctx.fillText(val.toString(), x + barWidth / 2, currentY - 10);
            }
        });

    } else if (slide.layout === 'chart_line' && slide.content.chart_data) {
        const { labels, values } = slide.content.chart_data;
        const chartHeight = height * 0.4;
        const chartWidth = width * 0.6;
        const startX = (width - chartWidth) / 2;
        const startY = contentY + chartHeight;

        const maxValue = Math.max(...values, 100);
        const stepX = chartWidth / (values.length - 1);

        // Draw Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + chartWidth, startY);
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY - chartHeight);
        ctx.stroke();

        // Draw Line
        ctx.beginPath();
        ctx.strokeStyle = accentColor;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 10; // Glow
        ctx.shadowColor = accentColor;

        // Animated path
        // We can draw full path but clip it? Or draw partial?
        // Simple: Draw up to progress
        const validTime = Math.max(0, localTime - 0.5);
        const totalPoints = values.length;
        // Animation progress 0 -> 1 over 1.5s
        const progress = Math.min(1, validTime / 1.5);

        const maxIndex = (values.length - 1) * progress;

        values.forEach((val, i) => {
            const px = startX + i * stepX;
            const py = startY - (val / maxValue) * chartHeight;

            if (i === 0) ctx.moveTo(px, py);
            else {
                // simple interpolation if between indices? 
                // Just draw if i <= maxIndex + 1
                if (i <= Math.ceil(maxIndex)) {
                    ctx.lineTo(px, py);
                }
            }

            // Dots
            if (i <= maxIndex) {
                // Dot
                ctx.save();
                ctx.fillStyle = '#fff';
                ctx.shadowBlur = 0;
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();

                ctx.textAlign = 'center';
                ctx.font = `${Math.min(width / 60, 20)}px "${fontFamily}"`;
                ctx.fillStyle = textColor;
                ctx.fillText(labels[i], px, startY + 30);
            }
        });
        ctx.stroke();
        ctx.shadowBlur = 0;

    } else if (slide.layout === 'process_flow' && slide.content.flow_steps) {
        const steps = slide.content.flow_steps;
        const stepWidth = width / (steps.length + 1);
        const startX = stepWidth;
        const midY = height * 0.5;

        steps.forEach((step, i) => {
            const delay = 0.5 + i * 0.3;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.5));
            const eased = easeOutCubic(p);

            if (p <= 0) return;

            const cx = startX + i * (width - 2 * stepWidth) / (steps.length - 1 || 1);

            // Circle
            ctx.globalAlpha = eased;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 3;
            ctx.shadowBlur = 15;
            ctx.shadowColor = accentColor;

            ctx.beginPath();
            ctx.arc(cx, midY, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            // Text
            ctx.textAlign = 'center';
            ctx.fillStyle = textColor;
            ctx.font = `bold ${Math.min(width / 60, 18)}px "${fontFamily}"`;
            ctx.fillText((i + 1).toString(), cx, midY + 7);

            ctx.font = `${Math.min(width / 50, 20)}px "${fontFamily}"`;
            wrapText(step, cx, midY + 80, 150, 24);

            // Arrow to next
            if (i < steps.length - 1) {
                const nextCx = startX + (i + 1) * (width - 2 * stepWidth) / (steps.length - 1 || 1);
                // Draw arrow line
                // Animate arrow
                if (p > 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(cx + 50, midY);
                    ctx.lineTo(nextCx - 50, midY);
                    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                    ctx.stroke();
                }
            }
            ctx.globalAlpha = 1;
        });

    } else if (slide.content.bullets && slide.content.bullets.length > 0) {
        // ... (Bullets logic from previous step)
        const start = 0.5;
        const p = Math.min(1, Math.max(0, (localTime - start) / 0.8));
        const opacity = easeOutCubic(p);

        ctx.globalAlpha = opacity;
        ctx.textAlign = 'left';
        ctx.font = `${Math.min(width / 30, 40)}px "${fontFamily}"`;

        slide.content.bullets.forEach((bullet, i) => {
            const bx = width * 0.15;
            const by = contentY + i * 70;

            ctx.shadowBlur = 5;
            ctx.shadowColor = accentColor;
            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.fillStyle = textColor;
            ctx.fillText(bullet, bx + 30, by + 10);
        });
        ctx.globalAlpha = 1;
    }

    // Narration Subtitle (Bottom)
    if (slide.narration) {
        // Just fade it in
        const nOpacity = Math.min(1, localTime * 0.5);
        ctx.globalAlpha = nOpacity;

        ctx.font = `italic ${Math.min(width / 50, 24)}px "${fontFamily}"`;
        ctx.fillStyle = template === 'retro' ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';

        const maxWidth = width * 0.8;
        const words = slide.narration.split(' ');
        let line = '';
        let y = height - 60;

        // Very basic wrapping
        if (ctx.measureText(slide.narration).width > maxWidth) {
            // Simply truncate for now or show first chunk
            // Proper wrapping matches "minute detail" request? 
            // Canvas text wrapping is verbose.

            // Let's do 2 lines max
            let line1 = "";
            let line2 = "";

            for (let w of words) {
                if (ctx.measureText(line1 + w).width < maxWidth) line1 += w + " ";
                else line2 += w + " ";
            }

            ctx.fillText(line1, width / 2, y - 30);
            if (line2) ctx.fillText(line2, width / 2, y);

        } else {
            ctx.fillText(slide.narration, width / 2, y);
        }
    }
}
