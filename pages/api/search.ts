import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL,
  apiKey: process.env.QDRANT_API_KEY,
});
console.log("CLIENT : ", qdrantClient)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { embedding, limit = 5 } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      return res.status(400).json({ error: 'Invalid embedding format' });
    }
    console.log("before search")
    const COLLECTION = process.env.QDRANT_COLLECTION;
    if (!COLLECTION) {
      throw new Error('QDRANT_COLLECTION is not defined in environment variables.');
    }
    const searchRes = await qdrantClient.search(COLLECTION, {
      vector: embedding,
      limit,
      with_payload: true,
      with_vector: false,
    });
    console.log("SEARCH RES:" ,searchRes)

    // Ensure we always return an array, even if empty
    return res.status(200).json(Array.isArray(searchRes) ? searchRes : []);
  } catch (err) {
    console.error('Qdrant search error:', err);
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: err instanceof Error ? err.message : 'Unknown error occurred'
    });
  }
}