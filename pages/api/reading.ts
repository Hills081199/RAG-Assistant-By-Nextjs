// pages/api/reading.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { generateChineseReadingExercise } from '../../utils/gpt-helper-reading'; // Đường dẫn tùy dự án bạn

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { level, maxWords } = req.body;

  if (typeof level !== 'number') {
    return res.status(400).json({ message: 'Invalid level' });
  }

  try {
    const { readingText, questions } = await generateChineseReadingExercise({
      level,
      maxWords,
      type: 'paragraph',
    });

    return res.status(200).json({
      readingText,
      questions,
    });
  } catch (err) {
    console.error('Failed to generate reading exercise:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}