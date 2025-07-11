import { useEffect, useRef, useState } from "react";
import type { SimilarStreet } from "../types/types/types";

const useCheckSoundWorker = (streetList: string[]) => {
  const workerRef = useRef<Worker | null>(null);
  const handlers = useRef<
    Record<string, (result: SimilarStreet | undefined) => void>
  >({});
  const [match, setMatch] = useState<SimilarStreet | undefined>(undefined);

  useEffect(() => {
    const worker = new Worker(
      new URL("./checkSoundWorker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;

    // Send full list to worker
    worker.postMessage({ type: "init", streetList });

    // Listen for responses
    worker.onmessage = (e) => {
      const { id, match } = e.data;
      handlers.current[id]?.(match);
      delete handlers.current[id];
    };

    return () => {
      worker.terminate();
    };
  }, [streetList]);

  const checkSoundsSimilar = (
    inputName: string
  ): Promise<SimilarStreet | undefined> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substring(2);
      handlers.current[id] = (result: SimilarStreet | undefined) => {
        setMatch(result);
        resolve(result);
      };
      workerRef.current?.postMessage({ type: "check", id, inputName });
    });
  };

  return { match, checkSoundsSimilar };
};

export default useCheckSoundWorker;
