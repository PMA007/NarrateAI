/**
 * Render Job Manager (child-process edition)
 *
 * Completely free of ffmpeg/canvas imports so Turbopack can bundle API routes
 * that import this file without errors.
 *
 * Jobs are executed by spawning `render-worker.js` as a child Node.js process.
 * Status is communicated via JSON files in /tmp/narrate-<jobId>/.
 */

import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn } from 'child_process';

// ─── Types ─────────────────────────────────────────────────────────────────

export type JobStatus = 'queued' | 'audio' | 'rendering' | 'complete' | 'error';

export interface RenderJob {
    id: string;
    status: JobStatus;
    progress: number;
    message: string;
    outputPath: string | null;
    queuePosition: number;
    createdAt: Date;
    params: RenderParams;
}

export interface RenderParams {
    script: {
        template?: string;
        slides: Array<{
            slide_id: number;
            title: string;
            subtitle?: string;
            layout: string;
            content: {
                bullets?: string[];
                flow_steps?: string[];
                chart_data?: { labels: string[]; values: number[]; label?: string };
                code_snippet?: string;
            };
            narration: string;
            duration?: number;
        }>;
    };
    voice: string;
    provider: 'azure' | 'google' | 'gemini';
    font: string;
    width?: number;
    height?: number;
    fps?: number;
}

// ─── State ─────────────────────────────────────────────────────────────────

const MAX_CONCURRENT = 2;
const CLEANUP_AFTER_MS = 30 * 60 * 1000;

// In-memory map tracks job IDs and basic metadata only
const jobMap = new Map<string, Pick<RenderJob, 'id' | 'params' | 'queuePosition' | 'createdAt'>>();
const waitQueue: string[] = [];
let activeCount = 0;

// ─── Public API ────────────────────────────────────────────────────────────

export function createJob(params: RenderParams): string {
    const id = randomUUID();
    const tmpDir = getJobTempDir(id);

    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    // Write params for the worker process — include jobId so the browser page
    // knows which job to report progress for and where to upload the result.
    fs.writeFileSync(path.join(tmpDir, 'params.json'), JSON.stringify({ ...params, jobId: id }));

    // Write initial status
    writeStatusFile(id, {
        status: 'queued',
        progress: 0,
        message: 'Waiting in queue...',
        outputPath: null,
    });

    jobMap.set(id, { id, params, queuePosition: waitQueue.length + 1, createdAt: new Date() });
    waitQueue.push(id);
    updateQueuePositions();
    runNext();

    return id;
}

export function getJob(id: string): (RenderJob & { outputPath: string | null }) | undefined {
    const meta = jobMap.get(id);
    if (!meta) return undefined;

    const statusData = readStatusFile(id);
    return {
        ...meta,
        status: statusData.status ?? 'queued',
        progress: statusData.progress ?? 0,
        message: statusData.message ?? '',
        outputPath: statusData.outputPath ?? null,
    } as RenderJob & { outputPath: string | null };
}

export function getOutputPath(id: string): string | null {
    const status = readStatusFile(id);
    return status.outputPath ?? null;
}

export function getJobTempDir(id: string): string {
    return path.join(os.tmpdir(), `narrate-${id}`);
}

// ─── Internal ──────────────────────────────────────────────────────────────

function runNext() {
    if (activeCount >= MAX_CONCURRENT || waitQueue.length === 0) return;

    const nextId = waitQueue.shift()!;
    activeCount++;
    updateQueuePositions();

    spawnWorker(nextId).finally(() => {
        activeCount--;
        runNext();
    });
}

function updateQueuePositions() {
    waitQueue.forEach((id, i) => {
        const meta = jobMap.get(id);
        if (meta) meta.queuePosition = i + 1;
    });
}

function spawnWorker(jobId: string): Promise<void> {
    return new Promise((resolve) => {
        const meta = jobMap.get(jobId);
        if (meta) meta.queuePosition = 0;

        // Path to the standalone worker script
        const workerPath = path.join(process.cwd(), 'src', 'lib', 'render-worker.js');

        writeStatusFile(jobId, {
            status: 'audio',
            progress: 0,
            message: 'Starting render process...',
        });

        // Spawn Node.js child process — this runs OUTSIDE Next.js bundle
        const child = spawn(process.execPath, [workerPath, jobId], {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env },
        });

        child.stdout?.on('data', (d: Buffer) => console.log(`[worker ${jobId.slice(0, 8)}]`, d.toString().trim()));
        child.stderr?.on('data', (d: Buffer) => console.error(`[worker ${jobId.slice(0, 8)}]`, d.toString().trim()));

        child.on('exit', (code) => {
            if (code !== 0) {
                writeStatusFile(jobId, { status: 'error', message: `Worker exited with code ${code}` });
            }
            scheduleCleanup(jobId);
            resolve();
        });
    });
}

function writeStatusFile(jobId: string, update: Partial<{ status: JobStatus; progress: number; message: string; outputPath: string | null }>) {
    try {
        const tmpDir = getJobTempDir(jobId);
        const statusPath = path.join(tmpDir, 'status.json');

        // Merge with existing
        let current: Record<string, unknown> = {};
        if (fs.existsSync(statusPath)) {
            try { current = JSON.parse(fs.readFileSync(statusPath, 'utf8')); } catch { }
        }
        fs.writeFileSync(statusPath, JSON.stringify({ ...current, ...update }));
    } catch { /* ignore */ }
}

function readStatusFile(jobId: string): Record<string, any> {
    try {
        const statusPath = path.join(getJobTempDir(jobId), 'status.json');
        if (fs.existsSync(statusPath)) {
            return JSON.parse(fs.readFileSync(statusPath, 'utf8'));
        }
    } catch { }
    return {};
}

function scheduleCleanup(jobId: string) {
    setTimeout(() => {
        const tmpDir = getJobTempDir(jobId);
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { }
        jobMap.delete(jobId);
        console.log(`[RenderJob ${jobId.slice(0, 8)}] Cleaned up.`);
    }, CLEANUP_AFTER_MS);
}
