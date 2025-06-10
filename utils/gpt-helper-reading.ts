import { GoogleGenerativeAI } from '@google/generative-ai';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('❌ Missing GEMINI_API_KEY in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

interface GenerateChineseReadingExerciseOptions {
  level: number;
  type: 'dialogue' | 'paragraph' | 'story';
  maxWords?: number;
  questionCount?: number;
  useDynamicPrompt?: boolean;
}

// Cơ sở dữ liệu thành phần để tạo prompt động cho reading
interface ReadingPromptTemplate {
  themes: string[];
  scenarios: string[];
  characters: string[];
  settings: string[];
  plotElements: string[];
  emotions: string[];
  questionFocus: string[];
}

const READING_PROMPT_COMPONENTS: Record<number, ReadingPromptTemplate> = {
  1: {
    themes: [
      '家庭温暖时光', '校园友谊故事', '美食探索之旅', 
      '节日庆祝活动', '宠物与主人', '购物小经历'
    ],
    scenarios: [
      '周末家庭聚餐', '新同学初来乍到', '第一次独自买菜',
      '生日派对准备', '照顾小动物', '选择礼物'
    ],
    characters: [
      '小明和爸爸妈妈', '新来的转学生小红', '热心的店员阿姨',
      '可爱的弟弟妹妹', '邻居家的老爷爷', '班上的好朋友'
    ],
    settings: [
      '温馨的家庭餐厅', '热闹的学校操场', '繁忙的菜市场',
      '安静的图书馆', '美丽的公园', '熟悉的教室'
    ],
    plotElements: [
      '遇到小困难然后解决', '学会新技能', '帮助别人获得快乐',
      '发现有趣的事物', '克服害羞交到朋友', '完成简单任务'
    ],
    emotions: [
      '开心满足', '有点紧张但很兴奋', '温暖感动',
      '骄傲自豪', '好奇探索', '友善亲切'
    ],
    questionFocus: [
      '人物关系和基本信息', '时间地点等具体细节', '简单的因果关系',
      '人物的感受和态度', '故事的主要内容'
    ]
  },
  2: {
    themes: [
      '职场新人适应记', '旅行中的文化体验', '兴趣爱好的探索',
      '人际关系的变化', '生活习惯的改变', '学习方法的发现'
    ],
    scenarios: [
      '第一天上班的经历', '独自旅行遇到的趣事', '参加社团活动',
      '搬到新城市生活', '学习新技能的过程', '和不同年龄人交往'
    ],
    characters: [
      '刚毕业的大学生', '经验丰富的前辈', '来自不同地方的朋友',
      '有趣的房东', '专业的教练或老师', '热情的当地人'
    ],
    settings: [
      '现代化的办公室', '风景优美的旅游景点', '充满活力的健身房',
      '文艺气息的咖啡馆', '历史悠久的老街', '设备齐全的学习中心'
    ],
    plotElements: [
      '通过努力达成目标', '在挑战中成长', '发现意外的机会',
      '建立新的友谊', '改变原有的想法', '获得宝贵的经验'
    ],
    emotions: [
      '挑战与成就并存', '紧张中带着期待', '感谢和感动',
      '自信和满足', '好奇与探索欲', '理解与包容'
    ],
    questionFocus: [
      '人物的动机和目标', '事件发展的逻辑', '深层的情感变化',
      '不同观点的对比', '经验和教训的总结'
    ]
  },
  3: {
    themes: [
      '跨文化交流与理解', '个人成长与人生选择', '环境保护与社会责任',
      '科技发展对生活的影响', '传统文化在现代的传承', '教育理念的探讨'
    ],
    scenarios: [
      '国际交流项目中的文化冲突与融合', '面临重要人生决策的思考过程',
      '参与环保活动的心路历程', '体验新科技带来的生活变化',
      '探索传统手工艺的现代价值', '不同教育方式的比较和反思'
    ],
    characters: [
      '来自不同国家的交流学生', '面临职业选择的年轻人',
      '环保志愿者和社区居民', '科技公司的研发人员',
      '传统手工艺人和现代设计师', '教育工作者和学生家长'
    ],
    settings: [
      '多元文化的国际环境', '充满机遇的都市生活',
      '需要保护的自然环境', '科技创新的研发中心',
      '承载历史的文化街区', '教育资源丰富的学术环境'
    ],
    plotElements: [
      '通过深入了解化解误解', '在复杂情况下做出理性选择',
      '从个人行动扩展到社会影响', '在变化中寻找平衡点',
      '将传统智慧与现代需求结合', '通过实践验证理论观点'
    ],
    emotions: [
      '深度思考与理解', '责任感与使命感', '希望与担忧并存',
      '兴奋与谨慎的平衡', '敬佩与传承的愿望', '反思与成长的喜悦'
    ],
    questionFocus: [
      '复杂概念的理解与应用', '多角度分析问题', '价值观念的探讨',
      '趋势预测与影响评估', '传统与现代的关系', '教育理念的深层理解'
    ]
  }
};

// Hàm tạo prompt động cho reading
function generateDynamicReadingPrompt(options: GenerateChineseReadingExerciseOptions): string {
  const { level, type, maxWords, questionCount = 5 } = options;
  const components = READING_PROMPT_COMPONENTS[level];
  
  const randomTheme = components.themes[Math.floor(Math.random() * components.themes.length)];
  const randomScenario = components.scenarios[Math.floor(Math.random() * components.scenarios.length)];
  const randomCharacters = components.characters[Math.floor(Math.random() * components.characters.length)];
  const randomSetting = components.settings[Math.floor(Math.random() * components.settings.length)];
  const randomPlot = components.plotElements[Math.floor(Math.random() * components.plotElements.length)];
  const randomEmotion = components.emotions[Math.floor(Math.random() * components.emotions.length)];
  const randomQuestionFocus = components.questionFocus[Math.floor(Math.random() * components.questionFocus.length)];

  const hskRequirements = {
    1: "只使用HSK 1级词汇（150个最基础词汇）：人称代词、基本动词（是、有、去、来、吃、喝）、数字、时间、家庭成员、颜色、简单形容词等",
    2: "使用HSK 1-2级词汇（300个词汇）：可以包含更多日常动词、方位词、简单连词（和、但是）、基本副词（很、太、都）等",
    3: "使用HSK 1-3级词汇（600个词汇）：可以使用复合句、更多时态表达、丰富的形容词和副词、基本的语法结构等"
  };

  const getWordLimit = () => {
    if (maxWords) return maxWords;
    const defaultLimits = {
      dialogue: { 1: 120, 2: 180, 3: 250 },
      paragraph: { 1: 150, 2: 220, 3: 300 },
      story: { 1: 200, 2: 280, 3: 400 },
    };
    return defaultLimits[type][level as keyof typeof defaultLimits[typeof type]];
  };

  const wordLimit = getWordLimit();

  const typeDescriptions = {
    dialogue: '生动对话 (2-4人自然对话，语言真实，情感丰富)',
    paragraph: '深度叙述 (详细描写，层次分明，内容充实)',
    story: '完整故事 (情节完整，人物鲜明，寓意深刻)'
  };

  return `你是顶尖的中文教学专家，正在为HSK ${level}级学生精心设计阅读理解练习。

🎯 今日创作任务：
💡 核心主题：「${randomTheme}」
🎬 故事场景：${randomScenario}
👥 主要人物：${randomCharacters}
🏢 环境设定：${randomSetting}
📈 情节发展：${randomPlot}
💝 情感基调：${randomEmotion}

✍️ 创作标准：
1. 文本类型：${typeDescriptions[type as keyof typeof typeDescriptions]}
2. 词汇要求：${hskRequirements[level as keyof typeof hskRequirements]}
3. 篇幅控制：${Math.floor(wordLimit * 0.8)}-${wordLimit}个汉字
4. 语言风格：地道自然，符合中国人表达习惯
5. 内容深度：富有教育意义，启发学生思考

🧠 题目设计重点：
- 总题数：${questionCount}道精品选择题
- 核心考查：${randomQuestionFocus}
- 难度分布：循序渐进，最后1-2题具有挑战性
- 选项设计：每个干扰项都要合理可信
- 答案平衡：A、B、C、D选项分布均匀

🔥 质量要求：
- 故事要有起伏，不能平铺直叙
- 人物对话要个性化，符合身份特点
- 细节描写要丰富，增强画面感
- 情感表达要真挚，引起读者共鸣
- 语言表达要优美，但不超出HSK ${level}级范围

请按照JSON格式返回，不要任何额外标记：
{
  "readingText": "精心创作的阅读内容，确保达到字数要求",
  "wordCount": 准确的字数统计,
  "questions": [
    {
      "question": "问题内容？",
      "options": {
        "A": "选项A内容",
        "B": "选项B内容", 
        "C": "选项C内容",
        "D": "选项D内容"
      },
      "answer": "正确答案字母",
      "type": "题目类型(理解/推理/细节)"
    }
  ]
}`;
}

// Hàm tạo prompt tĩnh (giữ nguyên logic cũ)
function generateStaticReadingPrompt(options: GenerateChineseReadingExerciseOptions): string {
  const { level, type, maxWords, questionCount = 5 } = options;

  const hskRequirements = {
    1: "只使用HSK 1级词汇（150个最基础词汇）：人称代词、基本动词（是、有、去、来、吃、喝）、数字、时间、家庭成员、颜色、简单形容词等",
    2: "使用HSK 1-2级词汇（300个词汇）：可以包含更多日常动词、方位词、简单连词（和、但是）、基本副词（很、太、都）等",
    3: "使用HSK 1-3级词汇（600个词汇）：可以使用复合句、更多时态表达、丰富的形容词和副词、基本的语法结构等"
  };

  const getWordLimit = () => {
    if (maxWords) return maxWords;
    const defaultLimits = {
      dialogue: { 1: 120, 2: 180, 3: 250 },
      paragraph: { 1: 150, 2: 220, 3: 300 },
      story: { 1: 200, 2: 280, 3: 400 },
    };
    return defaultLimits[type][level as keyof typeof defaultLimits[typeof type]];
  };

  const wordLimit = getWordLimit();

  const typeDescriptions = {
    dialogue: '多人对话 (3-4人对话，情节丰富，有起承转合，人物性格鲜明)',
    paragraph: '叙述文章 (详细描述一个主题，包含多个方面和细节)',
    story: '完整故事 (有开头、发展、高潮、结尾的完整叙事，人物和情节发展清晰)'
  };

  const contentThemes = {
    1: "家庭生活、学校日常、购物吃饭、自我介绍、简单的日常活动",
    2: "朋友聚会、旅行经历、工作学习、兴趣爱好、节日庆祝、简单的人际关系",
    3: "生活变化、成长经历、未来计划、文化差异、社会现象、人生感悟"
  };

  return `你是资深的中文教师和教材编写专家，请创建一个HSK ${level}级别的高质量中文阅读理解练习。

📋 基本要求：
1. 内容类型：${typeDescriptions[type as keyof typeof typeDescriptions]}
2. 词汇标准：${hskRequirements[level as keyof typeof hskRequirements]}
3. 语法要求：严格遵循HSK ${level}级语法规范，句式由简到繁，循序渐进
4. 长度标准：全文必须达到${Math.floor(wordLimit * 0.8)}-${wordLimit}个汉字
5. 主题范围：${contentThemes[level as keyof typeof contentThemes]}

🎯 内容深度要求：
- 故事/对话要有完整的情节发展，不能过于简单
- 人物形象要鲜明，对话要自然流畅
- 包含丰富的生活细节和情感表达
- 语言表达要地道，符合中国人日常交流习惯
- 避免生硬的教学式语言，要生动有趣

📝 题目设计标准：
- 创建${questionCount}道高质量选择题
- 题型分布：理解题(${Math.ceil(questionCount * 0.4)}道) + 推理题(${Math.floor(questionCount * 0.4)}道) + 细节题(${questionCount - Math.ceil(questionCount * 0.4) - Math.floor(questionCount * 0.4)}道)
- 难度梯度：由易到难，最后1-2题有一定挑战性
- 干扰选项要合理，避免明显错误的选项
- 答案分布要均匀（A、B、C、D选项都要有）

🔍 质量检查：
- 确保所有词汇都在HSK ${level}级范围内
- 语法结构符合该级别学习者水平
- 内容积极向上，富有教育意义
- 题目测试学生的真实理解能力，而非猜测

请严格按照以下JSON格式返回，不要添加任何markdown标记、注释或额外解释：

{
  "readingText": "完整的阅读内容，确保达到规定字数",
  "wordCount": 实际字数,
  "questions": [
    {
      "question": "问题内容？",
      "options": {
        "A": "选项A内容",
        "B": "选项B内容", 
        "C": "选项C内容",
        "D": "选项D内容"
      },
      "answer": "正确答案字母",
      "type": "题目类型(理解/推理/细节)"
    }
  ]
}`;
}

export async function generateChineseReadingExercise({
  level,
  type,
  maxWords,
  questionCount = 5,
  useDynamicPrompt = true
}: GenerateChineseReadingExerciseOptions) {

  const gemini = getGeminiClient();

  // Chọn loại prompt để sử dụng
  const prompt = useDynamicPrompt 
    ? generateDynamicReadingPrompt({ level, type, maxWords, questionCount })
    : generateStaticReadingPrompt({ level, type, maxWords, questionCount });

  console.log(`📚 Sử dụng ${useDynamicPrompt ? 'Dynamic' : 'Static'} Prompt cho HSK ${level} Reading - ${type}`);

  const model = gemini.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: useDynamicPrompt ? 0.4 : 0.3, // Dynamic có creativity cao hơn
      topP: 0.8,
      topK: 40,
      responseMimeType: "application/json"
    }
  });

  try {
    const result = await model.generateContent(prompt);
    const content = result.response?.text();

    const cleanContent = content?.replace(/```json\n?|\n?```/g, '') || '';
    const parsedResult = JSON.parse(cleanContent);

    // Validation
    if (!parsedResult.readingText || !Array.isArray(parsedResult.questions)) {
      throw new Error('❌ Missing required fields: readingText or questions');
    }

    if (parsedResult.questions.length !== questionCount) {
      console.warn(`⚠️ 问题数量不匹配: 期望${questionCount}道，实际${parsedResult.questions.length}道`);
    }

    // Validate từng câu hỏi
    for (const [index, q] of parsedResult.questions.entries()) {
      if (!q.question || !q.options || !q.answer) {
        throw new Error(`❌ 第${index + 1}题缺少必要字段`);
      }
      const requiredOptions = ['A', 'B', 'C', 'D'];
      for (const option of requiredOptions) {
        if (!q.options[option]) {
          throw new Error(`❌ 第${index + 1}题缺少选项${option}`);
        }
      }
      if (!requiredOptions.includes(q.answer)) {
        throw new Error(`❌ 第${index + 1}题答案无效: ${q.answer}`);
      }
    }

    // Kiểm tra độ dài
    const actualWordCount = parsedResult.readingText.replace(/[^\u4e00-\u9fa5]/g, '').length;
    const getWordLimit = () => {
      if (maxWords) return maxWords;
      const defaultLimits = {
        dialogue: { 1: 120, 2: 180, 3: 250 },
        paragraph: { 1: 150, 2: 220, 3: 300 },
        story: { 1: 200, 2: 280, 3: 400 },
      };
      return defaultLimits[type][level as keyof typeof defaultLimits[typeof type]];
    };
    
    const wordLimit = getWordLimit();
    const minWords = Math.floor(wordLimit * 0.8);

    if (actualWordCount < minWords) {
      console.warn(`⚠️ 文本长度不足: 实际${actualWordCount}字，要求至少${minWords}字`);
    }

    if (!parsedResult.wordCount) {
      parsedResult.wordCount = actualWordCount;
    }

    console.log(`✅ 成功生成HSK ${level}级${type}阅读练习，共${actualWordCount}字，${questionCount}道题`);

    return parsedResult;

  } catch (err: any) {
    console.error('❌ Gemini返回JSON解析失败:', err);
    
    if (err.message?.includes('API key')) {
      throw new Error('❌ API key không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY.');
    } else if (err.message?.includes('quota') || err.message?.includes('limit')) {
      throw new Error('❌ Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
    } else if (err.message?.includes('JSON')) {
      throw new Error('❌ Gemini trả về định dạng không hợp lệ. Vui lòng thử lại.');
    } else {
      throw new Error(`❌ Lỗi không xác định: ${err.message || 'Unknown error'}`);
    }
  }
}

// Helper function để test API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Say 'Hello' in Chinese");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API connection successful:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini API connection failed:', error);
    return false;
  }
}

// Hàm preview prompt
export function previewReadingPrompt(options: GenerateChineseReadingExerciseOptions): string {
  const { useDynamicPrompt = true } = options;
  return useDynamicPrompt 
    ? generateDynamicReadingPrompt(options)
    : generateStaticReadingPrompt(options);
}

// Hàm phân tích câu hỏi theo loại
export function analyzeQuestionTypes(questions: any[]): { 
  理解: number, 
  推理: number, 
  细节: number,
  其他: number 
} {
  const analysis = { 理解: 0, 推理: 0, 细节: 0, 其他: 0 };
  
  questions.forEach(q => {
    const type = q.type || '其他';
    if (analysis.hasOwnProperty(type)) {
      analysis[type as keyof typeof analysis]++;
    } else {
      analysis.其他++;
    }
  });
  
  return analysis;
}