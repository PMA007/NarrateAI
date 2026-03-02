/**
 * GET /api/render/status?jobId=xxx
 *
 * Returns the current status and progress of a render job.
 * Designed to be polled every 2 seconds by the client.
 * Pure O(1) in-memory read — zero computation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/render-job-manager';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');

    if (!jobId) {
        return NextResponse.json({ error: 'Missing jobId query parameter' }, { status: 400 });
    }

    const job = getJob(jobId);

    if (!job) {
        return NextResponse.json({ error: 'Job not found. It may have expired.' }, { status: 404 });
    }

    return NextResponse.json({
        status: job.status,
        progress: job.progress,
        message: job.message,
        queuePosition: job.queuePosition,
    });
}
