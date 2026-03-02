/**
 * POST /api/render/status-update?jobId=xxx
 *
 * Receives progress updates from the /auto-render browser page and
 * writes them to the job's status.json so the polling UI can show live progress.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const jobId = req.nextUrl.searchParams.get('jobId');
    if (!jobId) return NextResponse.json({ ok: false }, { status: 400 });

    try {
        const { status, progress, message } = await req.json();
        const statusPath = path.join(os.tmpdir(), `narrate-${jobId}`, 'status.json');

        // Merge with existing to avoid overwriting outputPath etc.
        let current: Record<string, unknown> = {};
        if (fs.existsSync(statusPath)) {
            try { current = JSON.parse(fs.readFileSync(statusPath, 'utf8')); } catch { }
        }

        fs.writeFileSync(statusPath, JSON.stringify({ ...current, status, progress, message }));
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
