import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

// Pattern B: Atomic Async State Machine & Race-Condition Guard
class AtomicStateRegistry {
  private currentSequenceId = 0;
  private activeState = 'INITIAL';

  public async applyStateUpdate(incomingSeq: number, newState: string): Promise<boolean> {
    // Atomic Guard: Reject out-of-order or stale asynchronous resolutions
    if (incomingSeq <= this.currentSequenceId) {
      console.warn(`[RACE CONDITION BLOCKED] Rejected stale sequence #${incomingSeq}`);
      return false;
    }
    this.currentSequenceId = incomingSeq;
    this.activeState = newState;
    return true;
  }

  public getState() {
    return { sequence: this.currentSequenceId, state: this.activeState };
  }
}

const stateRegistry = new AtomicStateRegistry();

// Pattern A: Non-Blocking Event Loop Chunking (Yielding control to Libuv Check phase)[cite: 134]
function processLargeArrayAsync<T>(items: T[], chunkFilter: (item: T) => void): Promise<void> {
  return new Promise((resolve) => {
    let index = 0;
    function doChunk() {
      const start = Date.now();
      // Process items for a maximum 8ms window per frame to prevent loop starvation[cite: 134]
      while (index < items.length && (Date.now() - start) < 8) {
        chunkFilter(items[index]);
        index++;
      }
      if (index < items.length) {
        // Yield control back to libuv Check phase via setImmediate[cite: 124, 134]
        setImmediate(doChunk);
      } else {
        resolve();
      }
    }
    doChunk();
  });
}

// Route 1: Refactored Non-Blocking Ingestion
app.post('/api/process-large', async (req: Request, res: Response) => {
  const largeDataset = new Array(50000).fill({ value: Math.random() });
  
  await processLargeArrayAsync(largeDataset, (item) => {
    Math.sqrt(item.value);
  });

  res.send({ status: 'PROCESSED_WITHOUT_STARVATION' });
});

// Route 2: Atomic Async State Transition Endpoint
app.post('/api/state-update', async (req: Request, res: Response) => {
  const { sequenceId, state } = req.body;
  const accepted = await stateRegistry.applyStateUpdate(sequenceId, state);
  
  if (accepted) {
    res.status(200).send({ status: 'ACCEPTED', current: stateRegistry.getState() });
  } else {
    res.status(409).send({ status: 'REJECTED_STALE_SEQUENCE' });
  }
});

const PORT = 5002;
app.listen(PORT, () => {
  console.log(`Refactored Core Server running on port ${PORT}`);
});