import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { embedding, limit = 5, collection: collectionName } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Invalid embedding format' });
    }

    // Use the provided collection name or fall back to environment variable
    const collection = collectionName || process.env.QDRANT_COLLECTION;
    
    if (!collection) {
      return res.status(400).json({ 
        error: 'No collection specified',
        message: 'Please provide a collection name or configure QDRANT_COLLECTION in environment variables.'
      });
    }
  
    const searchRes = await qdrantClient.search(collection, {
      vector: embedding,
      limit: limit || 5,
      with_payload: true,
      with_vector: false,
    });

    return res.status(200).json(Array.isArray(searchRes) ? searchRes : []);
  } catch (err) {
    console.error('Qdrant search error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }
}