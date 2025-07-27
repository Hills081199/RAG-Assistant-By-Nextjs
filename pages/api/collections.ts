import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Path to the collections.json file
    const filePath = path.join(process.cwd(), 'exports', 'collections.json');
    
    // Read the file
    const fileContents = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileContents);
    
    // Return the collections
    res.status(200).json({
      collections: data.collections || []
    });
  } catch (error) {
    console.error('Error reading collections:', error);
    res.status(500).json({ 
      message: 'Error reading collections',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
