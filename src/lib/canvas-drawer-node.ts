/**
 * canvas-drawer-node.ts
 *
 * Node.js-compatible re-export of canvas drawing functions.
 * Identical logic to canvas-drawer.ts but imports Slide type inline
 * (avoids the @/lib/store browser-only Zustand import).
 *
 * Used by server-renderer.ts running under Node.js with node-canvas.
 */

// ── Easing ────────────────────────────────────────────────────────────────

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

// ── Local Slide type (mirrors store.ts — no Zustand import needed) ─────────

interface SlideContent {
    bullets?: string[];
    chart_data?: { labels: string[]; values: number[]; label?: string };
    flow_steps?: string[];
    table_data?: { headers: string[]; rows: string[][] };
    code_snippet?: string;
    highlight_lines?: number[];
}

interface Slide {
    slide_id: number;
    title: string;
    subtitle?: string;
    layout: string;
    content: SlideContent;
    narration: string;
    duration?: number;
}

// ── Retro Background ──────────────────────────────────────────────────────

export function drawRetroBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
) {
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

    const v1 = ctx.createRadialGradient(width * 0.5, height * 0.1, 0, width * 0.5, height * 0.1, Math.max(width, height) * 1.1);
    v1.addColorStop(0, 'rgba(255,255,255,0.26)');
    v1.addColorStop(0.42, 'rgba(255,255,255,0)');
    v1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = v1;
    ctx.fillRect(0, 0, width, height);

    const v2 = ctx.createRadialGradient(width * 0.8, height * 0.7, 0, width * 0.8, height * 0.7, Math.max(width, height) * 1.1);
    v2.addColorStop(0, 'rgba(0,0,0,0.16)');
    v2.addColorStop(0.55, 'rgba(0,0,0,0)');
    v2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = v2;
    ctx.fillRect(0, 0, width, height);

    const v3 = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 1.2);
    v3.addColorStop(0, 'rgba(0,0,0,0)');
    v3.addColorStop(0.58, 'rgba(0,0,0,0)');
    v3.addColorStop(1, 'rgba(0,0,0,0.20)');
    ctx.fillStyle = v3;
    ctx.fillRect(0, 0, width, height);
}

// ── Neon Background ───────────────────────────────────────────────────────

export function drawNeonBackground(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
) {
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    const positions = [1, -1];
    const scaleX = width / 696;
    const scaleY = height / 316;

    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.translate(696 / 2, 316 / 2);

    positions.forEach(position => {
        for (let i = 0; i < 36; i++) {
            const duration = 20 + (i % 10);
            const progress = (time % duration) / duration;
            const opacity = 0.3 + 0.3 * Math.sin(progress * Math.PI);
            const offset = 1 * Math.sin(progress * Math.PI);

            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.5})`;
            ctx.lineWidth = 0.5 + i * 0.03;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            const p1x = -(380 - i * 5 * position);
            const p1y = -(189 + i * 6);
            const cp2x = -(312 - i * 5 * position);
            const cp2y = (216 - i * 6);
            const endx = (152 - i * 5 * position);
            const endy = (343 - i * 6);
            const cp3x = (616 - i * 5 * position);
            const cp3y = (470 - i * 6);
            const cp4x = (684 - i * 5 * position);
            const cp4y = (875 - i * 6);

            // node-canvas uses beginPath() rather than Path2D
            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.bezierCurveTo(p1x, p1y, cp2x, cp2y, endx, endy);
            ctx.bezierCurveTo(cp3x, cp3y, cp4x, cp4y, cp4x, cp4y);

            const pathLen = 1500;
            ctx.setLineDash([pathLen, pathLen]);
            ctx.lineDashOffset = -offset * pathLen;
            ctx.stroke();
        }
    });

    ctx.setLineDash([]);
    ctx.restore();
}

// ── Slide Content ─────────────────────────────────────────────────────────

export function drawSlideContent(
    ctx: CanvasRenderingContext2D,
    slide: Slide,
    fontKey: string,
    width: number,
    height: number,
    localTime: number,
    template: 'neon' | 'retro'
) {
    // Map fontKey to a safe system/web font family for node-canvas
    const fontFamilyMap: Record<string, string> = {
        'Modern': 'sans-serif',
        'NTR': 'sans-serif',
        'Ramabhadra': 'sans-serif',
        'Inter': 'sans-serif',
        'Roboto': 'sans-serif',
    };
    const fontFamily = fontFamilyMap[fontKey] ?? 'sans-serif';

    const accentColor = template === 'retro' ? '#2563eb' : '#22d3ee';
    const textColor = template === 'retro' ? '#1e293b' : '#ffffff';

    // ── Title ────────────────────────────────────────────────────────────

    const titleFontSize = Math.min(width / 15, 80);
    ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';

    const titleY = height * 0.22;
    const words = slide.title.split(' ');

    // Measure full title width for cursor positioning
    const fullTitleWidth = ctx.measureText(slide.title).width;
    let titleCursorX = (width - fullTitleWidth) / 2;

    words.forEach((word, i) => {
        const start = i * 0.1;
        const p = Math.min(1, Math.max(0, (localTime - start) / 0.8));
        const eased = easeOutCubic(p);
        const yOff = 20 * (1 - eased);

        ctx.save();
        ctx.globalAlpha = eased;
        ctx.translate(0, yOff);

        if (template === 'neon') {
            const g = ctx.createLinearGradient(titleCursorX, titleY, titleCursorX + 100, titleY);
            g.addColorStop(0, '#ffffff');
            g.addColorStop(1, 'rgba(255,255,255,0.8)');
            ctx.fillStyle = g;
        } else {
            ctx.fillStyle = textColor;
        }

        ctx.textAlign = 'left';
        ctx.fillText(word, titleCursorX, titleY);
        ctx.restore();

        titleCursorX += ctx.measureText(word + ' ').width;
    });

    // ── Subtitle (intro slide) ────────────────────────────────────────────

    if ((slide.layout === 'title' || slide.layout === 'intro') && slide.subtitle) {
        const subP = Math.min(1, Math.max(0, (localTime - 0.5) / 0.8));
        const subEased = easeOutCubic(subP);
        ctx.save();
        ctx.globalAlpha = subEased;
        ctx.font = `${Math.min(width / 35, 36)}px ${fontFamily}`;
        ctx.fillStyle = accentColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(slide.subtitle, width / 2, height * 0.35);
        ctx.restore();
    }

    // ── Content Body ──────────────────────────────────────────────────────

    const contentY = height * 0.36;

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

    const wrapText = (text: string, x: number, y: number, maxW: number, lineH: number) => {
        const ws = text.split(' ');
        let line = '';
        let cy = y;
        for (const w of ws) {
            const test = line + w + ' ';
            if (ctx.measureText(test).width > maxW && line !== '') {
                ctx.fillText(line.trim(), x, cy);
                line = w + ' ';
                cy += lineH;
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line.trim(), x, cy);
    };

    if (slide.layout === 'columns_3' && slide.content.bullets) {
        const items = slide.content.bullets.slice(0, 3);
        const gap = 40;
        const totalW = width * 0.8;
        const colW = (totalW - gap * 2) / 3;
        const startX = width * 0.1;

        items.forEach((item, i) => {
            const delay = 0.5 + i * 0.3;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.8));
            const eased = easeOutCubic(p);
            if (p <= 0) return;

            const x = startX + i * (colW + gap);
            const y = contentY;
            const h = height * 0.48;

            ctx.globalAlpha = eased;
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;
            roundRect(x, y, colW, h, 16);
            ctx.fill();
            ctx.stroke();

            // Number circle
            const ccx = x + colW / 2;
            const ccy = y + 60;
            ctx.beginPath();
            ctx.arc(ccx, ccy, 30, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = `bold ${Math.min(width / 60, 24)}px ${fontFamily}`;
            ctx.fillStyle = accentColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((i + 1).toString(), ccx, ccy);

            ctx.fillStyle = textColor;
            ctx.font = `${Math.min(width / 60, 20)}px ${fontFamily}`;
            wrapText(item, ccx, y + 140, colW - 40, 28);
            ctx.globalAlpha = 1;
        });

    } else if (slide.layout === 'grid_cards' && slide.content.bullets) {
        const items = slide.content.bullets.slice(0, 4);
        const gap = 30;
        const totalW = width * 0.7;
        const colW = (totalW - gap) / 2;
        const rowH = height * 0.24;
        const startX = (width - totalW) / 2;

        items.forEach((item, i) => {
            const delay = 0.5 + i * 0.25;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.8));
            const eased = easeOutCubic(p);
            if (p <= 0) return;

            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = startX + col * (colW + gap);
            const y = contentY + row * (rowH + gap);

            ctx.globalAlpha = eased;
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 2;
            roundRect(x, y, colW, rowH, 16);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = textColor;
            ctx.font = `${Math.min(width / 50, 22)}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            wrapText(item, x + colW / 2, y + rowH / 2, colW - 40, 30);
            ctx.globalAlpha = 1;
        });

    } else if ((slide.layout === 'chart_bar' || slide.layout === 'chart_line') && slide.content.chart_data) {
        const { labels, values } = slide.content.chart_data;
        const chartH = height * 0.38;
        const chartW = width * 0.6;
        const startX = (width - chartW) / 2;
        const startY = contentY + chartH;
        const maxVal = Math.max(...values, 1);

        // Axes
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + chartW, startY);
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX, startY - chartH);
        ctx.stroke();

        if (slide.layout === 'chart_bar') {
            const barW = (chartW / values.length) * 0.6;
            const gap = (chartW / values.length) * 0.4;
            values.forEach((val, i) => {
                const delay = 0.5 + i * 0.1;
                const p = Math.min(1, Math.max(0, (localTime - delay) / 0.5));
                const eased = easeOutCubic(p);
                const barH = (val / maxVal) * chartH * eased;
                const x = startX + gap / 2 + i * (barW + gap);
                const y = startY - barH;

                const grd = ctx.createLinearGradient(0, y, 0, startY);
                grd.addColorStop(0, accentColor);
                grd.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grd;
                ctx.fillRect(x, y, barW, barH);

                if (p > 0.5) {
                    ctx.fillStyle = textColor;
                    ctx.font = `${Math.min(width / 60, 18)}px ${fontFamily}`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillText(labels[i] ?? '', x + barW / 2, startY + 8);
                }
            });
        } else {
            // Line chart
            const stepX = chartW / Math.max(values.length - 1, 1);
            const progress = Math.min(1, Math.max(0, (localTime - 0.5) / 1.5));
            const maxDraw = Math.ceil((values.length - 1) * progress);

            ctx.beginPath();
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 3;
            values.forEach((val, i) => {
                const px = startX + i * stepX;
                const py = startY - (val / maxVal) * chartH;
                if (i === 0) ctx.moveTo(px, py);
                else if (i <= maxDraw) ctx.lineTo(px, py);
            });
            ctx.stroke();
        }

    } else if (slide.layout === 'process_flow' && slide.content.flow_steps) {
        const steps = slide.content.flow_steps;
        const stepW = width / (steps.length + 1);
        const midY = height * 0.52;

        steps.forEach((step, i) => {
            const delay = 0.5 + i * 0.3;
            const p = Math.min(1, Math.max(0, (localTime - delay) / 0.5));
            const eased = easeOutCubic(p);
            if (p <= 0) return;

            const cx = stepW + i * ((width - 2 * stepW) / Math.max(steps.length - 1, 1));

            ctx.globalAlpha = eased;
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.strokeStyle = accentColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, midY, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = accentColor;
            ctx.font = `bold ${Math.min(width / 60, 20)}px ${fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText((i + 1).toString(), cx, midY);

            ctx.fillStyle = textColor;
            ctx.font = `${Math.min(width / 50, 18)}px ${fontFamily}`;
            wrapText(step, cx, midY + 60, 160, 24);

            if (i < steps.length - 1 && p > 0.8) {
                const nextCx = stepW + (i + 1) * ((width - 2 * stepW) / Math.max(steps.length - 1, 1));
                ctx.beginPath();
                ctx.moveTo(cx + 45, midY);
                ctx.lineTo(nextCx - 45, midY);
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.globalAlpha = 1;
        });

    } else if (slide.content.bullets && slide.content.bullets.length > 0) {
        // Default: bullet list
        const p = Math.min(1, Math.max(0, (localTime - 0.4) / 0.8));
        ctx.globalAlpha = easeOutCubic(p);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = `${Math.min(width / 32, 36)}px ${fontFamily}`;

        slide.content.bullets.forEach((bullet, i) => {
            const bx = width * 0.14;
            const by = contentY + i * 70;

            ctx.fillStyle = accentColor;
            ctx.beginPath();
            ctx.arc(bx, by, 6, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = textColor;
            ctx.fillText(bullet, bx + 32, by);
        });

        ctx.globalAlpha = 1;
    }

    // ── Narration subtitle (bottom) ───────────────────────────────────────

    if (slide.narration) {
        const nP = Math.min(1, localTime * 0.5);
        ctx.globalAlpha = nP;
        ctx.font = `italic ${Math.min(width / 52, 22)}px ${fontFamily}`;
        ctx.fillStyle = template === 'retro' ? 'rgba(30,41,59,0.7)' : 'rgba(255,255,255,0.55)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        const maxW = width * 0.78;
        const narr = slide.narration;
        if (ctx.measureText(narr).width > maxW) {
            // Truncate with ellipsis for bottom caption
            let truncated = narr;
            while (ctx.measureText(truncated + '…').width > maxW && truncated.length > 0) {
                truncated = truncated.slice(0, -1);
            }
            ctx.fillText(truncated + '…', width / 2, height - 28);
        } else {
            ctx.fillText(narr, width / 2, height - 28);
        }

        ctx.globalAlpha = 1;
    }
}
