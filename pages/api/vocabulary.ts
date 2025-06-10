import type { NextApiRequest, NextApiResponse } from 'next';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ExtractVocabularyDto } from '../../utils/extract-vocabulary.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const dto = plainToInstance(ExtractVocabularyDto, req.body);
  const errors = await validate(dto);

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  const { level, text } = dto;
  const prompt = `你是中文教学专家。以下是一篇符合HSK ${level}级的阅读文章。请从中提取出所有对该级别学生来说可能是生词的词汇（在HSK ${level}级词表中），并按照以下JSON格式返回：

【文章内容】
${text}

【输出格式】
[
  {
    "word": "生词",
    "pinyin": "拼音",
    "definition": "中文解释" (dịch ra tiếng việt),
    "partOfSpeech": "词性",
    "example": "例句（可直接引用文章中的原句）"
  }
]

注意：
- 只输出生词列表，不添加其他解释
- 所有词汇必须来自HSK ${level}级词表
- 不要输出markdown代码块或注释`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json\n?|```/g, '');

    const vocabulary = JSON.parse(cleaned);

    return res.status(200).json({ vocabulary });
  } catch (err) {
    console.error('❌ Lỗi phân tích Gemini:', err);
    return res.status(500).json({ message: 'Gemini trả về dữ liệu không hợp lệ' });
  }
}