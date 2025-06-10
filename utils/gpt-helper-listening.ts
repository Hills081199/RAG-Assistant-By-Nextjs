import { GoogleGenerativeAI } from '@google/generative-ai';

export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('❌ Missing GEMINI_API_KEY in environment variables');
  return new GoogleGenerativeAI(apiKey);
}

interface GenerateChineseListeningTextOptions {
  level: number; // HSK level: 1, 2, 3
  type: 'dialogue' | 'paragraph'; // loại: đoạn hội thoại hay đoạn văn
  numMissing: number; // số chỗ trống
  maxWords?: number; // giới hạn số từ (tùy chọn)
  useDynamicPrompt?: boolean; // có sử dụng prompt động không
}

// Cấu trúc cho dynamic prompt generation
interface PromptTemplate {
  topics: string[];
  scenarios: string[];
  contexts: string[];
  instructions: string[];
  examples: string[];
}

// Database các thành phần để tạo prompt động
const PROMPT_COMPONENTS: Record<number, PromptTemplate> = {
  1: {
    topics: [
      '自我介绍和家庭', '日常问候和礼貌用语', '数字、时间和日期', 
      '食物和饮料', '颜色和基本形容词', '天气和感受'
    ],
    scenarios: [
      '在学校认识新朋友', '在餐厅点餐', '在商店买东西', 
      '和老师打招呼', '介绍自己的家人', '谈论今天的天气'
    ],
    contexts: [
      '学校环境中的简单对话', '家庭日常生活场景', '基础购物交流',
      '简单的自我介绍场合', '询问时间和日期', '表达基本需求和感受'
    ],
    instructions: [
      '使用最基础的问候语和常用词汇', '句型要简单直接，避免复杂语法',
      '多使用疑问句和肯定句', '重复使用常见词汇加深印象',
      '语言要自然流畅，贴近日常生活'
    ],
    examples: [
      '你好！我叫小明。', '今天天气很好。', '我喜欢吃苹果。',
      '现在几点了？', '我的老师很好。'
    ]
  },
  2: {
    topics: [
      '工作和职业', '购物和价格', '交通和出行', 
      '身体和健康', '爱好和运动', '住房和环境'
    ],
    scenarios: [
      '在银行办事情', '和医生看病对话', '计划周末活动',
      '在公司和同事交流', '租房子或买东西', '谈论兴趣爱好'
    ],
    contexts: [
      '工作场所的日常交流', '医疗健康相关对话', '购物和消费场景',
      '交通出行和方向指引', '体育运动和休闲活动', '居住环境描述'
    ],
    instructions: [
      '结合职业和工作场景使用词汇', '加入价格、数量等实用信息',
      '使用比较句型和时间表达', '涉及身体部位和健康状况',
      '表达个人喜好和计划安排'
    ],
    examples: [
      '我在公司工作。', '这件衣服多少钱？', '我每天坐地铁上班。',
      '我觉得有点累。', '我喜欢打篮球。'
    ]
  },
  3: {
    topics: [
      '教育和学习经历', '文化和传统', '环境和社会问题',
      '科技和发展', '旅游和体验', '人际关系和情感'
    ],
    scenarios: [
      '讨论学习方法和经验', '介绍传统节日和文化', '谈论环境保护',
      '分享旅游见闻', '讨论科技对生活的影响', '描述人际关系变化'
    ],
    contexts: [
      '教育背景和学习心得分享', '文化传统和节日庆祝', '社会现象和个人观点',
      '科技发展对日常生活的影响', '旅游经历和文化体验', '人际交往和情感表达'
    ],
    instructions: [
      '使用复合句型和连词', '表达个人观点和建议',
      '涉及抽象概念和社会话题', '使用过去、现在、将来时态',
      '加入情感色彩和个人感受'
    ],
    examples: [
      '我觉得学习中文很有意思。', '这个问题比较复杂。', '我希望能够去北京旅游。',
      '现在的生活比以前方便多了。', '我们应该保护环境。'
    ]
  }
};

// Hàm tạo prompt động
function generateDynamicPrompt(options: GenerateChineseListeningTextOptions): string {
  const { level, type, numMissing, maxWords } = options;
  const components = PROMPT_COMPONENTS[level];
  
  // Random selection từ các thành phần
  const randomTopic = components.topics[Math.floor(Math.random() * components.topics.length)];
  const randomScenario = components.scenarios[Math.floor(Math.random() * components.scenarios.length)];
  const randomContext = components.contexts[Math.floor(Math.random() * components.contexts.length)];
  const randomInstruction = components.instructions[Math.floor(Math.random() * components.instructions.length)];
  const randomExamples = components.examples
    .sort(() => 0.5 - Math.random())
    .slice(0, 2)
    .join('、');

  // HSK requirements (giữ nguyên)
  const hskRequirements = {
    1: "Chỉ sử dụng từ vựng HSK 1 (150 từ cơ bản nhất): 你好, 我, 是, 老师, 学生, 什么, 名字, 叫, 中国, 人, 家, 有, 没有, 喜欢, 吃, 喝, 水, 茶, 咖啡, 米饭, 苹果, 今天, 明天, 昨天, 现在, 上午, 下午, 晚上, 几点, 点钟, 分钟, 年, 月, 日, 星期, 天气, 热, 冷, 高兴, 谢谢, 不客气, 对不起, 再见...",
    2: "Sử dụng từ vựng HSK 1-2 (300 từ): bao gồm HSK 1 + 工作, 公司, 医生, 护士, 银行, 商店, 买, 卖, 便宜, 贵, 多少钱, 块, 毛, 分, 衣服, 裤子, 鞋子, 颜色, 红色, 蓝色, 白色, 黑色, 大, 小, 新, 旧, 漂亮, 累, 忙, 休息, 睡觉, 起床, 洗澡, 做饭, 看书, 听音乐, 打电话, 发短信...",
    3: "Sử dụng từ vựng HSK 1-3 (600 từ): bao gồm HSK 1-2 + 经验, 机会, 发展, 环境, 社会, 文化, 历史, 政治, 经济, 教育, 科学, 技术, 艺术, 音乐, 电影, 运动, 旅游, 健康, 疾病, 药, 医院, 检查, 治疗, 危险, 安全, 保护, 污染, 清洁..."
  };

  const hskRequirement = hskRequirements[level as keyof typeof hskRequirements];
  
  // Tính toán độ dài
  const getWordLimit = () => {
    if (maxWords) return maxWords;
    const defaultLimits = {
      dialogue: { 1: 25, 2: 35, 3: 45 },
      paragraph: { 1: 20, 2: 30, 3: 40 }
    };
    return defaultLimits[type][level as keyof typeof defaultLimits[typeof type]];
  };

  const wordLimit = getWordLimit();
  const typeDescription = type === 'dialogue'
    ? '对话 (2-3 người, có tên gọi rõ ràng như 小明, 小红, 老师, 学生)'
    : '独白 (một người kể về cuộc sống, công việc, sở thích, kế hoạch)';

  // Tạo prompt động với các thành phần ngẫu nhiên
  return `你是一位经验丰富的中文教师，专门设计HSK ${level}级听力练习。

今日任务重点：
📝 主题方向：「${randomTopic}」
🎭 情景设定：${randomScenario}
🌍 语言环境：${randomContext}

创作要求：
1. 文本类型：${typeDescription}
2. 词汇限制：${hskRequirement}
3. 特别注意：${randomInstruction}
4. 参考语言风格：${randomExamples}
5. 字数范围：不少于100字，不超过${wordLimit}字（中文字符计算）

你的任务：
- 围绕指定主题创作一个完整的${type === 'dialogue' ? '对话' : '独白'}
- 内容要生动有趣，贴近实际生活场景
- 语言表达要符合HSK ${level}级学习者的理解水平
- 创作完成后，随机选择${numMissing}个关键词（名词、动词、形容词）替换为"___"
- 不要替换功能词：你、我、他、是、的、了、吗、呢等

请严格按照以下JSON格式返回，不要添加任何markdown标记或额外说明：

{
  "fullText": "完整的中文原文",
  "maskedText": "带有___空白的练习文本", 
  "missingWords": ["被替换的词汇数组"]
}`;
}

// Hàm tạo prompt tĩnh (giữ nguyên logic cũ)
function generateStaticPrompt(options: GenerateChineseListeningTextOptions): string {
  const { level, type, numMissing, maxWords } = options;
  
  const hskRequirements = {
    1: "Chỉ sử dụng từ vựng HSK 1 (150 từ cơ bản nhất): 你好, 我, 是, 老师, 学生, 什么, 名字, 叫, 中国, 人, 家, 有, 没有, 喜欢, 吃, 喝, 水, 茶, 咖啡, 米饭, 苹果, 今天, 明天, 昨天, 现在, 上午, 下午, 晚上, 几点, 点钟, 分钟, 年, 月, 日, 星期, 天气, 热, 冷, 高兴, 谢谢, 不客气, 对不起, 再见...",
    2: "Sử dụng từ vựng HSK 1-2 (300 từ): bao gồm HSK 1 + 工作, 公司, 医生, 护士, 银行, 商店, 买, 卖, 便宜, 贵, 多少钱, 块, 毛, 分, 衣服, 裤子, 鞋子, 颜色, 红色, 蓝色, 白色, 黑色, 大, 小, 新, 旧, 漂亮, 累, 忙, 休息, 睡觉, 起床, 洗澡, 做饭, 看书, 听音乐, 打电话, 发短信...",
    3: "Sử dụng từ vựng HSK 1-3 (600 từ): bao gồm HSK 1-2 + 经验, 机会, 发展, 环境, 社会, 文化, 历史, 政治, 经济, 教育, 科学, 技术, 艺术, 音乐, 电影, 运动, 旅游, 健康, 疾病, 药, 医院, 检查, 治疗, 危险, 安全, 保护, 污染, 清洁..."
  };

  const hskRequirement = hskRequirements[level as keyof typeof hskRequirements];

  const getWordLimit = () => {
    if (maxWords) return maxWords;
    const defaultLimits = {
      dialogue: { 1: 25, 2: 35, 3: 45 },
      paragraph: { 1: 20, 2: 30, 3: 40 }
    };
    return defaultLimits[type][level as keyof typeof defaultLimits[typeof type]];
  };

  const wordLimit = getWordLimit();
  const typeDescription = type === 'dialogue'
    ? '对话 (2-3 người, có tên gọi rõ ràng như 小明, 小红, 老师, 学生)'
    : '独白 (một người kể về cuộc sống, công việc, sở thích, kế hoạch)';

  return `Bạn là một giáo viên tiếng Trung chuyên nghiệp. Hãy tạo một bài luyện nghe tiếng Trung cho trình độ HSK ${level}.

Yêu cầu bài luyện nghe:
1. Loại bài: ${typeDescription}
2. Giới hạn từ vựng: ${hskRequirement}
3. Ngữ pháp: Chỉ sử dụng ngữ pháp phù hợp trình độ HSK ${level}
4. Độ dài: Không dưới 100 từ và không quá ${wordLimit} từ (là từ đơn, không phải ký tự)
5. Chủ đề: Gắn liền với đời sống hàng ngày như tự giới thiệu, ăn uống, học tập, công việc, gia đình, mua sắm...

Nhiệm vụ của bạn:
- Viết một đoạn văn hoàn chỉnh chủ đề bất kì trong hsk, mở bài thân bài kết bài đa dạng, không giống
- Sau đó, hãy chọn ngẫu nhiên ${numMissing} từ quan trọng (danh từ, động từ, tính từ) và thay chúng bằng dấu gạch ngang "___" trong bản maskedText.
- Không được thay thế các từ chức năng như: 你、我、他、是、的、了、吗、呢… 

Vui lòng chỉ trả về dữ liệu dưới định dạng JSON thuần, không thêm markdown, chú thích hoặc văn bản ngoài lề.

Cấu trúc JSON cần trả về:
{
  "fullText": "Toàn bộ văn bản gốc bằng tiếng Trung",
  "maskedText": "Văn bản có chỗ trống, dùng ___ thay thế",
  "missingWords": ["từ1", "từ2", "..."]
}`;
}

export async function generateChineseListeningText({
  level,
  type,
  numMissing,
  maxWords,
  useDynamicPrompt = true, // Mặc định sử dụng prompt động
}: GenerateChineseListeningTextOptions) {
  const genAI = getGeminiClient();
  
  // Chọn loại prompt để sử dụng
  const prompt = useDynamicPrompt 
    ? generateDynamicPrompt({ level, type, numMissing, maxWords })
    : generateStaticPrompt({ level, type, numMissing, maxWords });

  console.log(`🎯 Sử dụng ${useDynamicPrompt ? 'Dynamic' : 'Static'} Prompt cho HSK ${level} - ${type}`);

  try {
    // Khởi tạo model Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: useDynamicPrompt ? 0.8 : 0.7, // Dynamic prompt có temperature cao hơn
        maxOutputTokens: 1000,
        responseMimeType: "application/json",
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text().trim();

    // Parse JSON response
    let parsedResult;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, '') || '';
      parsedResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('❌ Gemini response is not valid JSON:', content);
      throw new Error('Gemini trả về JSON không hợp lệ. Vui lòng thử lại.');
    }

    // Validate kết quả
    if (!parsedResult.fullText || !parsedResult.maskedText || !Array.isArray(parsedResult.missingWords)) {
      throw new Error('❌ Response thiếu trường bắt buộc: fullText, maskedText hoặc missingWords');
    }

    if (parsedResult.missingWords.length !== numMissing) {
      console.warn(`⚠️ Số từ thiếu không khớp: yêu cầu ${numMissing}, nhận được ${parsedResult.missingWords.length}`);
    }

    // Validation bổ sung
    const fullTextLength = parsedResult.fullText.replace(/[^\u4e00-\u9fa5]/g, '').length;
    if (fullTextLength < 15) {
      console.warn(`⚠️ Văn bản quá ngắn: chỉ có ${fullTextLength} ký tự Trung Quốc`);
    }

    // Kiểm tra xem maskedText có chứa đúng số lượng "___" không
    const blankCount = (parsedResult.maskedText.match(/___/g) || []).length;
    if (blankCount !== numMissing) {
      console.warn(`⚠️ Số chỗ trống không khớp: yêu cầu ${numMissing}, tìm thấy ${blankCount}`);
    }

    console.log(`✅ Thành công tạo bài nghe HSK ${level}, loại ${type}, ${fullTextLength} ký tự, ${numMissing} chỗ trống`);
    
    return parsedResult;

  } catch (error: any) {
    console.error('❌ Lỗi khi gọi Gemini API:', error);
    
    if (error.message?.includes('API key')) {
      throw new Error('❌ API key không hợp lệ. Vui lòng kiểm tra GEMINI_API_KEY.');
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      throw new Error('❌ Đã vượt quá giới hạn API. Vui lòng thử lại sau.');
    } else if (error.message?.includes('JSON')) {
      throw new Error('❌ Gemini trả về định dạng không hợp lệ. Vui lòng thử lại.');
    } else {
      throw new Error(`❌ Lỗi không xác định: ${error.message || 'Unknown error'}`);
    }
  }
}

// Helper function để test API connection (giữ nguyên)
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

// Hàm tiện ích để preview prompt trước khi gọi API
export function previewPrompt(options: GenerateChineseListeningTextOptions): string {
  const { useDynamicPrompt = true } = options;
  return useDynamicPrompt 
    ? generateDynamicPrompt(options)
    : generateStaticPrompt(options);
}