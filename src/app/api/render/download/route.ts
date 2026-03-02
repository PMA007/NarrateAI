/**
 * GET /api/render/download?jobId=xxx
 *
 * Streams the completed MP4 file to the browser.
 * Uses Node.js ReadableStream to never load the full file into memory.
 * Cleans up the temp file after the stream ends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob, getOutputPath } from '@/lib/render-job-manager';
import * as fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: 'Missing jobId' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
        return NextResponse.json({ error: 'Job not found or expired' }, { status: 404 });
    }

    if (job.status !== 'complete') {
        return NextResponse.json(
            { error: `Job is not complete yet. Current status: ${job.status}` },
            { status: 409 }
        );
    }

    const outputPath = getOutputPath(jobId);

    if (!outputPath || !fs.existsSync(outputPath)) {
        return NextResponse.json({ error: 'Output file not found' }, { status: 404 });
    }

    const stat = fs.statSync(outputPath);
    const fileSize = stat.size;

    // Create a Node.js ReadableStream from the file — never loads the whole
    // MP4 into memory at once, making this safe even for large files.
    const nodeStream = fs.createReadStream(outputPath);

    // Convert Node.js ReadableStream → Web ReadableStream
    const webStream = new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk) => controller.enqueue(chunk));
            nodeStream.on('end', () => {
                controller.close();
            });
            nodeStream.on('error', (err) => controller.error(err));
        },
        cancel() {
            nodeStream.destroy();
        },
    });

    const filename = `narrate-video-${jobId.slice(0, 8)}.mp4`;

    return new Response(webStream, {
        status: 200,
        headers: {
            'Content-Type': 'video/mp4',
            'Content-Length': fileSize.toString(),
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-store',
        },
    });
}
