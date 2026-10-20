import express from 'express';

const app = express();
app.use(express.json());

// GC ROOT: Global array that never gets collected during Mark-Sweep passes
const globalEventHub: Array<() => void> = [];

app.get('/api/leak', (req, res) => {
  // Allocate a 5MB buffer per request
  const requestContext = {
    headers: req.headers,
    buffer: Buffer.alloc(1024 * 1024 * 5)
  };

  // Anonymous closure binds requestContext to globalEventHub
  globalEventHub.push(() => {
    console.log(`Retained request: ${requestContext.headers['user-agent']}`);
  });

  res.send({ status: 'Leaking memory context into Old Space...' });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Leak Simulation Server running on PID ${process.pid} at port ${PORT}`);
  console.log(`To capture native heap snapshot, run: kill -USR2 ${process.pid}`);
});

