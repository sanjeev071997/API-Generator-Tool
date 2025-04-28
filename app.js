import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import shortid from 'shortid';

const app = express();

// Middlewares
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));
app.options('*', cors()); 

// In-memory database to store endpoints
const endpoints = new Map();

// Generate new API endpoint
app.post('/api/generate', (req, res) => {
  try {
    const { jsonData } = req.body;

    if (!jsonData) {
      return res.status(400).json({ error: 'No JSON data provided' });
    }

    const endpointId = shortid.generate();
    const createdAt = new Date();

    endpoints.set(endpointId, {
      data: jsonData,
      createdAt,
      accessCount: 0,
    });

    const apiUrl = `${req.protocol}://${req.get('host')}/api/data/${endpointId}`;

    res.json({
      url: apiUrl,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      id: endpointId,
    });

  } catch (error) {
    console.error('Error generating endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Handle all methods for mock API
app.all('/api/data/:id', (req, res) => {
  try {
    const { id } = req.params;
    const endpoint = endpoints.get(id);

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    // Update access count
    endpoint.accessCount++;

    switch (req.method) {
      case 'GET':
        return res.json(endpoint.data);

      case 'POST':
      case 'PUT':
        endpoint.data = req.body;
        return res.json({
          message: req.method === 'POST' ? 'Data updated successfully' : 'Data replaced successfully',
          data: endpoint.data,
        });

      case 'PATCH':
        endpoint.data = { ...endpoint.data, ...req.body };
        return res.json({
          message: 'Data patched successfully',
          data: endpoint.data,
        });

      case 'DELETE':
        endpoints.delete(id);
        return res.json({ message: 'Data deleted successfully' });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Error handling API request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get endpoint info
app.get('/api/info/:id', (req, res) => {
  try {
    const { id } = req.params;
    const endpoint = endpoints.get(id);

    if (!endpoint) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

    res.json({
      id,
      createdAt: endpoint.createdAt,
      accessCount: endpoint.accessCount,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      data: endpoint.data,
    });

  } catch (error) {
    console.error('Error getting endpoint info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});


// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Access the generator at host: ${PORT}/api/generate`);
});
