import { NextApiRequest, NextApiResponse } from 'next';
import { QdrantClient } from '@qdrant/js-client-rest';

const qdrantClient = new QdrantClient({
  url: "https://98c798e6-7675-4794-abca-2b695e6e00a3.us-west-2-0.aws.cloud.qdrant.io",
  apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.Lh8pBeYzqpT1J7ZxK0JkKDwIeIXySMqZ0cyEpX53U68",
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
    const searchRes = await qdrantClient.search("huonglan86", {
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