/**
 * POST /api/render/start
 *
 * Creates a new server-side render job and returns its ID immediately.
 * Actual rendering runs in the background, concurrency-limited to 2 jobs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createJob, RenderParams } from '@/lib/render-job-manager';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const { script, voice, provider, narrationLanguage, font, width, height, fps } = body;

        if (!script || !script.slides || !Array.isArray(script.slides)) {
            return NextResponse.json(
                { error: 'Missing or invalid "script" in request body' },
                { status: 400 }
            );
        }

        const params: RenderParams = {
            script,
            voice: voice ?? 'te-IN-MohanNeural',
            provider: provider ?? 'azure',
            narrationLanguage: narrationLanguage ?? 'te-IN',
            font: font ?? 'NTR',
            width: width ?? 1280,
            height: height ?? 720,
            fps: fps ?? 30,
        };

        const jobId = createJob(params);

        console.log(`[/api/render/start] Created job ${jobId} for ${script.slides.length} slides`);

        return NextResponse.json({ jobId }, { status: 202 });

    } catch (err: any) {
        console.error('[/api/render/start] Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
