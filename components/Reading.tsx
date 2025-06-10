import { useState } from 'react';
import VocabularyComponent from './Vocabulary';

type ReadingResponse = {
  id: string;
  readingText: string;
  questions: {
    question: string;
    options: {
      A: string;
      B: string;
      C: string;
      D: string;
    };
    answer: string;
    type: string;
  }[];
};

const ReadingComponent: React.FC = () => {
  const [data, setData] = useState<ReadingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(2);

  const handleGenerate = async () => {
    setLoading(true);
    setShowAnswers(false);
    setScore(null);
    setAnswers([]);

    try {
      const response = await fetch('/api/reading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level,
          type: 'dialogue', // sửa chính tả: dialogue
          numQuestions: 5,
          maxWords: 300,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reading exercise');
      }

      const data = await response.json();

      setData(data);
      setAnswers(new Array(data.questions.length).fill(''));
    } catch (err) {
      console.error('Error fetching reading exercise', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeAnswer = (questionIndex: number, selectedOption: string) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = selectedOption;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!data) return;

    let correctCount = 0;
    for (let i = 0; i < data.questions.length; i++) {
      if (answers[i] === data.questions[i].answer) {
        correctCount++;
      }
    }

    setScore(correctCount);
    setShowAnswers(true);
  };

  const allQuestionsAnswered = answers.every(answer => answer !== '');

  return (
    <div>
      <>
        <style>
          {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }

          .reading-main {
            max-width: 900px;
            margin: 40px auto;
            padding: 30px;
            background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            font-family: 'Segoe UI', Arial, sans-serif;
            animation: fadeIn 0.5s ease-out;
          }

          .reading-title {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2b3a67;
            text-align: center;
            margin-bottom: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }

          .reading-instructions {
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
            animation: slideUp 0.6s ease-out;
          }

          .reading-instructions h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1976d2;
            margin-bottom: 0.5rem;
          }

          .reading-instructions p {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.5;
          }

          .reading-instructions p span {
            color: #d81b60;
            font-weight: 600;
          }

          .reading-level-selector {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .reading-level-selector label {
            font-size: 1.1rem;
            font-weight: 500;
            color: #2b3a67;
          }

          .reading-level-selector select {
            padding: 10px 30px 10px 10px;
            font-size: 1rem;
            color: #2b3a67;
            border: 2px solid #90caf9;
            border-radius: 8px;
            background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="%232b3a67" d="M7 10l5 5 5-5H7z"/></svg>') no-repeat right 10px center;
            background-size: 12px;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            transition: border-color 0.3s, box-shadow 0.3s;
            width: 200px;
          }

          .reading-level-selector select:focus {
            outline: none;
            border-color: #1976d2;
            box-shadow: 0 0 8px rgba(25, 118, 210, 0.3);
          }

          .reading-btn {
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: background-color 0.3s, transform 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }

          .reading-btn:disabled {
            background: #b0bec5;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .generate-btn {
            background: #1976d2;
            color: #fff;
            width: 100%;
          }

          .generate-btn:hover:not(:disabled) {
            background: #1565c0;
            transform: translateY(-2px);
          }

          .reading-passage {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin: 2rem 0;
            animation: slideUp 0.6s ease-out;
          }

          .reading-passage h3 {
            font-size: 1.75rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .reading-passage p {
            font-size: 1.1rem;
            color: #4a5568;
            line-height: 1.8;
            text-align: justify;
          }

          .questions-section {
            margin-top: 2rem;
          }

          .questions-section h4 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .question-item {
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-bottom: 1.5rem;
            animation: slideUp 0.6s ease-out;
          }

          .question-text {
            font-size: 1.1rem;
            font-weight: 500;
            color: #2b3a67;
            margin-bottom: 1rem;
            position: relative;
          }

          .question-type {
            font-size: 0.9rem;
            color: #666;
            font-weight: 400;
            margin-left: 0.5rem;
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 12px;
          }

          .options-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }

          .option-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 12px;
            border: 2px solid #e3f2fd;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s;
          }

          .option-item:hover {
            background: #f8f9ff;
            border-color: #90caf9;
          }

          .option-item.selected {
            background: #e3f2fd;
            border-color: #1976d2;
          }

          .option-item.correct {
            background: #e8f5e8;
            border-color: #2e7d32;
          }

          .option-item.incorrect {
            background: #ffebee;
            border-color: #d32f2f;
          }

          .option-item.correct-answer {
            background: #e8f5e8;
            border-color: #2e7d32;
            font-weight: 600;
          }

          .option-radio {
            width: 20px;
            height: 20px;
            border: 2px solid #90caf9;
            border-radius: 50%;
            position: relative;
            flex-shrink: 0;
          }

          .option-radio.selected::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: #1976d2;
            border-radius: 50%;
          }

          .option-text {
            font-size: 1rem;
            color: #4a5568;
            flex: 1;
          }

          .submit-btn {
            background: #d81b60;
            color: #fff;
            width: 100%;
            margin-top: 2rem;
          }

          .submit-btn:hover:not(:disabled) {
            background: #b1134f;
            transform: translateY(-2px);
          }

          .results-section {
            background: #ffffff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-top: 2rem;
            animation: slideUp 0.6s ease-out;
          }

          .results-section h4 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .score-display {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1.5rem;
            text-align: center;
            padding: 15px;
            background: #f8f9ff;
            border-radius: 8px;
          }

          .score-display .perfect {
            color: #f9a825;
            margin-left: 0.5rem;
          }

          .status-indicator {
            margin-top: 1rem;
            padding: 12px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
          }

          .status-indicator.incomplete {
            background: #fff3e0;
            color: #f57c00;
            border: 2px solid #ffb74d;
          }

          .status-indicator.complete {
            background: #e8f5e8;
            color: #2e7d32;
            border: 2px solid #81c784;
          }
        `}
        </style>
        <main className="reading-main">
          <h1 className="reading-title">
            <span>📖</span> Chinese Reading Mini Practices
          </h1>

          <div className="reading-instructions">
            <h3>📚 Hướng dẫn học</h3>
            <p>
              Chọn trình độ HSK, nhấn "Tạo bài" để nhận đoạn văn đọc hiểu. Đọc kỹ đoạn văn, trả lời các câu hỏi, rồi kiểm tra kết quả!{' '}
              <span>Đọc hiểu giỏi, tiến bộ vượt bậc!</span>
            </p>
          </div>

          <div className="reading-level-selector">
            <label htmlFor="reading-level-select">Trình độ:</label>
            <select
              id="reading-level-select"
              value={level}
              onChange={(e) => setLevel(parseInt(e.target.value))}
              disabled={loading}
            >
              <option value={1}>HSK 1 (Sơ cấp)</option>
              <option value={2}>HSK 2 (Sơ trung)</option>
              <option value={3}>HSK 3 (Trung cấp)</option>
            </select>
          </div>

          <button
            className="reading-btn generate-btn"
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Đang tạo bài...' : 'Tạo bài đọc hiểu'}
          </button>

          {data && (
            <>
              <div className="reading-passage">
                <h3>
                  <span>📄</span> Đoạn văn đọc hiểu
                </h3>
                <p>{data.readingText}</p>
              </div>

              <div className="questions-section">
                <h4>
                  <span>❓</span> Câu hỏi
                </h4>

                {data.questions.map((question, qIndex) => {
                  const optionKeys = ['A', 'B', 'C', 'D'] as const;

                  return (
                    <div key={qIndex} className="question-item">
                      <div className="question-text">
                        {qIndex + 1}. {question.question}
                        <span className="question-type">({question.type})</span>
                      </div>
                      <div className="options-container">
                        {optionKeys.map((optionKey) => {
                          let optionClass = "option-item";

                          if (showAnswers) {
                            if (optionKey === question.answer) {
                              optionClass += " correct-answer";
                            } else if (answers[qIndex] === optionKey && optionKey !== question.answer) {
                              optionClass += " incorrect";
                            }
                          } else if (answers[qIndex] === optionKey) {
                            optionClass += " selected";
                          }

                          return (
                            <div
                              key={optionKey}
                              className={optionClass}
                              onClick={() => !showAnswers && handleChangeAnswer(qIndex, optionKey)}
                            >
                              <div className={`option-radio ${answers[qIndex] === optionKey ? 'selected' : ''}`} />
                              <div className="option-text">
                                {optionKey}. {question.options[optionKey]}
                              </div>
                              {showAnswers && optionKey === question.answer && <span>✓</span>}
                              {showAnswers && answers[qIndex] === optionKey && optionKey !== question.answer && <span>✗</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div className={`status-indicator ${allQuestionsAnswered ? 'complete' : 'incomplete'}`}>
                  {allQuestionsAnswered ?
                    '✅ Đã trả lời tất cả câu hỏi! Bạn có thể submit đáp án.' :
                    `⚠️ Còn ${answers.filter(a => a === '').length} câu chưa trả lời!`
                  }
                </div>

                <button
                  className="reading-btn submit-btn"
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || showAnswers}
                >
                  <span>✅</span>
                  {!allQuestionsAnswered ? 'Vui lòng trả lời tất cả câu hỏi!' : 'Submit đáp án'}
                </button>

                {showAnswers && (
                  <div className="results-section">
                    <h4>
                      <span>📊</span> Kết quả
                    </h4>
                    <div className="score-display">
                      Điểm của bạn: {score} / {data.questions.length}
                      {score === data.questions.length && (
                        <span className="perfect">🎉 Xuất sắc!</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      </>
      {data && <VocabularyComponent level={level} text={data.readingText} />}
    </div>
  );
};

export default ReadingComponent;