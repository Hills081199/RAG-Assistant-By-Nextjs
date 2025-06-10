// pages/api/listening.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { generateChineseListeningText } from '../../utils/gpt-helper-listening';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { level, type, numMissing, maxWords } = req.body;

    // Validate input
    if (
      typeof level !== 'number' ||
      !['dialogue', 'paragraph'].includes(type) ||
      typeof numMissing !== 'number'
    ) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const result = await generateChineseListeningText({
      level,
      type,
      numMissing,
      maxWords,
    });

    return res.status(200).json(result);
  } catch (err: unknown) {
    console.error('Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';
    return res.status(500).json({ error: errorMessage });
  }
}