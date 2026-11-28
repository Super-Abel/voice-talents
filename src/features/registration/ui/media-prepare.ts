"use client";

import type { CandidateIdentity } from "../domain/media-identity";
import type { UploadKind } from "../domain/upload-rules";

export type MediaPreparation = {
  file: File;
  /** Le navigateur ne sait pas décoder ce fichier : un poste de jury ne saura pas mieux. */
  unreadable: boolean;
  /** Durée lue pendant le transcodage ; `null` = le champ la lira lui-même. */
  durationSeconds: number | null;
};

type Job = {
  original: File;
  onProgress: (ratio: number) => void;
  settle: (preparation: MediaPreparation) => void;
};

type Reply = {
  id: number;
  type: "progress" | "done";
  ratio?: number;
  file?: File;
  durationSeconds?: number | null;
  unreadable?: boolean;
};

/**
 * Le transcodage part dans un worker : une page cachée — téléphone qui passe en
 * arrière-plan, onglet quitté — bridait ses minuteurs à ~1 s par tour et
 * multipliait la préparation par cinq. Le worker, lui, n'est pas bridé et
 * n'interrompt pas la saisie.
 */
const WORKER_SOURCE = new URL("./media-worker.ts", import.meta.url);

const jobs = new Map<number, Job>();
let worker: Worker | null = null;
let workerRefused = false;
let sequence = 0;

function unstarted(original: File): MediaPreparation {
  return { file: original, unreadable: false, durationSeconds: null };
}

/** Un worker indisponible (CSP, appareil ancien) ne doit jamais faire perdre un dossier. */
function giveUpOnWorker() {
  worker?.terminate();
  worker = null;
  workerRefused = true;
  for (const job of jobs.values()) {
    job.settle(unstarted(job.original));
  }
  jobs.clear();
}

function ensureWorker(): Worker | null {
  if (workerRefused) return null;
  if (worker) return worker;
  try {
    const created = new Worker(WORKER_SOURCE, { type: "module" });
    created.addEventListener("message", (event: MessageEvent<Reply>) => {
      const reply = event.data;
      const job = jobs.get(reply.id);
      if (!job) return;
      if (reply.type === "progress") {
        job.onProgress(reply.ratio ?? 0);
        return;
      }
      jobs.delete(reply.id);
      job.settle({
        file: reply.file ?? job.original,
        unreadable: Boolean(reply.unreadable),
        durationSeconds: reply.durationSeconds ?? null,
      });
    });
    created.addEventListener("error", giveUpOnWorker);
    worker = created;
    return worker;
  } catch {
    workerRefused = true;
    return null;
  }
}

export function prepareMedia(
  kind: UploadKind,
  file: File,
  identity: CandidateIdentity,
  onProgress: (ratio: number) => void,
): Promise<MediaPreparation> {
  const active = ensureWorker();
  if (!active) return Promise.resolve(unstarted(file));

  sequence += 1;
  const id = sequence;
  return new Promise<MediaPreparation>((resolve) => {
    jobs.set(id, { original: file, onProgress, settle: resolve });
    active.postMessage({ id, kind, file, identity });
  });
}
