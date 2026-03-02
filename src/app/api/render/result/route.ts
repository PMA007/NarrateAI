/**
 * POST /api/render/result?jobId=xxx
 *
 * Receives the rendered MP4 from the /auto-render headless page and saves
 * it to the job's temp directory, then marks the job complete.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) {
        return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const tmpDir = path.join(os.tmpdir(), `narrate-${jobId}`);
    const outputPath = path.join(tmpDir, 'output.mp4');
    const statusPath = path.join(tmpDir, 'status.json');

    try {
        // Read the video blob from the request body (FormData)
        const formData = await req.formData();
        const videoFile = formData.get('video') as File | null;

        if (!videoFile) {
            return NextResponse.json({ error: 'No video file in request' }, { status: 400 });
        }

        // Save to disk
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(outputPath, buffer);

        // Mark job complete
        const statusData = {
            status: 'complete',
            progress: 100,
            message: 'Video ready for download.',
            outputPath,
        };
        fs.writeFileSync(statusPath, JSON.stringify(statusData));

        console.log(`[render/result] Job ${jobId.slice(0, 8)} complete — ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB`);

        return NextResponse.json({ ok: true, size: buffer.byteLength });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[render/result] Error for job ${jobId}:`, msg);

        // Write error to status file
        try {
            fs.writeFileSync(statusPath, JSON.stringify({ status: 'error', message: msg }));
        } catch { /* ignore */ }

        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
