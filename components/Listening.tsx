import { useState } from 'react';
import { speak } from '@/utils/tts';
import axios from 'axios';
import ReadingComponent from '@/components/Reading';
import VocabularyComponent from './Vocabulary';

type ListeningResponse = {
  id: string;
  fullText: string;
  maskedText: string;
  missingWords: string[];
};

const Listening: React.FC = () => {
  const [data, setData] = useState<ListeningResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [level, setLevel] = useState<number>(2);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasListened, setHasListened] = useState(false);

  const handleGenerate = async () => {
    if (isSpeaking) return; // Prevent generating new exercise while speaking

    setLoading(true);
    setShowAnswers(false);
    setScore(null);
    setAnswers([]);
    setHasListened(false);

    try {
      const res = await axios.post<ListeningResponse>('/api/listening', {
        level,
        type: 'paragraph',
        numMissing: 5,
        maxWords: 200,
      });
    
      setData(res.data);
      setAnswers(new Array(res.data.missingWords.length).fill(''));
    } catch (err) {
      console.error('Error fetching exercise', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (data?.fullText && !isSpeaking) {
      setIsSpeaking(true);
      try {
        await speak(data.fullText);
        setHasListened(true);
      } catch (error) {
        console.error('Speech error:', error);
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  const handleChangeAnswer = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value.trim();
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    if (!data || isSpeaking || !hasListened) return; // Prevent submit while speaking or if not listened

    let correctCount = 0;
    for (let i = 0; i < data.missingWords.length; i++) {
      if (answers[i] && answers[i] === data.missingWords[i]) {
        correctCount++;
      }
    }

    setScore(correctCount);
    setShowAnswers(true);
  };

  return (
    <div>
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

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          main {
            max-width: 900px;
            margin: 40px auto;
            padding: 30px;
            background: linear-gradient(135deg, #e6f0ff 0%, #f0eaff 100%);
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            font-family: 'Segoe UI', Arial, sans-serif;
            animation: fadeIn 0.5s ease-out;
          }

          h1 {
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

          .instructions {
            background: #ffffff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            margin-bottom: 2rem;
            animation: slideUp 0.6s ease-out;
          }

          .instructions h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e88e5;
            margin-bottom: 0.5rem;
          }

          .instructions p {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.5;
          }

          .instructions p span {
            color: #d81b60;
            font-weight: 600;
          }

          .level-selector {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            position: relative;
          }

          .level-selector label {
            font-size: 1.1rem;
            font-weight: 500;
            color: #2b3a67;
          }

          .level-selector select {
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

          .level-selector select:focus {
            outline: none;
            border-color: #1e88e5;
            box-shadow: 0 0 8px rgba(30, 136, 229, 0.3);
          }

          .level-selector select option {
            color: #2b3a67;
            background: #fff;
            font-size: 1rem;
          }

          .level-selector select:disabled {
            background: #e5e7eb;
            cursor: not-allowed;
            opacity: 0.6;
          }

          button {
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

          button:disabled {
            background: #b0bec5;
            cursor: not-allowed;
            opacity: 0.6;
          }

          .generate-btn {
            background: #1e88e5;
            color: #fff;
            width: 100%;
          }

          .generate-btn:hover:not(:disabled) {
            background: #1565c0;
            transform: translateY(-2px);
          }

          .generate-btn.speaking {
            background: #ff9800;
            animation: pulse 1.5s infinite;
          }

          .exercise-section {
            margin-top: 2rem;
            animation: slideUp 0.6s ease-out;
          }

          .exercise-section h3 {
            font-size: 1.75rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1rem;
          }

          .exercise-section p {
            font-size: 1.2rem;
            color: #4a5568;
            background: #f9fafb;
            padding: 20px;
            border-radius: 10px;
            line-height: 1.6;
          }

          .speak-btn {
            background: #43a047;
            color: #fff;
            margin-top: 1rem;
          }

          .speak-btn:hover:not(:disabled) {
            background: #2e7d32;
            transform: translateY(-2px);
          }

          .speak-btn.speaking {
            background: #ff5722;
            animation: pulse 1.5s infinite;
          }

          .status-indicator {
            margin-top: 1rem;
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            font-weight: 500;
          }

          .status-indicator.not-listened {
            background: #fff3e0;
            color: #f57c00;
            border: 2px solid #ffb74d;
          }

          .status-indicator.listened {
            background: #e8f5e8;
            color: #2e7d32;
            border: 2px solid #81c784;
          }

          .input-section h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2b3a67;
            margin: 2rem 0 1rem;
          }

          .input-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
          }

          .input-container input {
            width: 120px;
            padding: 10px;
            font-size: 1rem;
            border: 2px solid #90caf9;
            border-radius: 8px;
            transition: border-color 0.3s, box-shadow 0.3s;
          }

          .input-container input:focus {
            outline: none;
            border-color: #1e88e5;
            box-shadow: 0 0 8px rgba(30, 136, 229, 0.3);
          }

          .submit-btn {
            background: #d81b60;
            color: #fff;
            width: 100%;
            margin-top: 1.5rem;
          }

          .submit-btn:hover:not(:disabled) {
            background: #b1134f;
            transform: translateY(-2px);
          }

          .results-section {
            margin-top: 2rem;
          }

          .results-section h4 {
            font-size: 1.25rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1rem;
          }

          .results-section ul {
            list-style: none;
            padding: 0;
          }

          .results-section li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 1rem;
            margin-bottom: 0.5rem;
          }

          .results-section li.correct {
            color: #2e7d32;
          }

          .results-section li.incorrect {
            color: #d32f2f;
          }

          .score {
            font-size: 1.2rem;
            font-weight: 500;
            color: #2b3a67;
            margin-top: 1.5rem;
          }

          .score .perfect {
            color: #f9a825;
            font-weight: 600;
            margin-left: 0.5rem;
          }

          .tooltip {
            position: relative;
            display: inline-block;
          }

          .tooltip .tooltip-text {
            visibility: hidden;
            width: 200px;
            background: #2b3a67;
            color: #fff;
            text-align: center;
            padding: 8px;
            border-radius: 6px;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
          }

          .tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
          }

          .vocabulary-section {
            margin-top: 2rem;
            padding: 20px;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            animation: slideUp 0.6s ease-out;
          }

          .vocabulary-section h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e88e5;
            margin-bottom: 1rem;
          }
        `}
      </style>
      <main>
        <h1>
          <span>🧠</span> Chinese Listening Mini Practices
        </h1>

        <div className="instructions">
          <h3>📚 Hướng dẫn học</h3>
          <p>
            Chọn trình độ HSK, nhấn "Tạo bài" để nhận đoạn văn. Nghe kỹ, điền từ còn thiếu, rồi kiểm tra kết quả!{' '}
            <span>Học mà vui, tiến bộ mỗi ngày!</span>
          </p>
        </div>

        <div className="level-selector">
          <label htmlFor="level-select">Trình độ:</label>
          <select
            id="level-select"
            value={level}
            onChange={(e) => setLevel(parseInt(e.target.value))}
            disabled={isSpeaking}
          >
            <option value={1}>HSK 1 (Sơ cấp)</option>
            <option value={2}>HSK 2 (Sơ trung)</option>
            <option value={3}>HSK 3 (Trung cấp)</option>
          </select>
        </div>

        <button
          className={`generate-btn ${isSpeaking ? 'speaking' : ''}`}
          onClick={handleGenerate}
          disabled={loading || isSpeaking}
          title={isSpeaking ? 'Đang đọc, vui lòng chờ!' : ''}
        >
          {loading ? 'Đang tạo bài...' : 
           isSpeaking ? '🔊 Đang đọc, vui lòng chờ...' : 
           'Tạo bài luyện nghe'}
        </button>

        {data && (
          <div className="exercise-section">
            <h3>Bài luyện nghe</h3>
            <p>{data.maskedText}</p>

            <button 
              className={`speak-btn ${isSpeaking ? 'speaking' : ''}`}
              onClick={handleSpeak}
              disabled={isSpeaking}
            >
              <span>🔊</span> 
              {isSpeaking ? 'Đang đọc...' : 'Nghe toàn bộ đoạn văn'}
              <div className="tooltip">
                <span className="tooltip-text">Nhấn để nghe lại toàn bộ đoạn văn!</span>
              </div>
            </button>

            <div className={`status-indicator ${hasListened ? 'listened' : 'not-listened'}`}>
              {hasListened ? 
                '✅ Đã nghe xong! Bây giờ bạn có thể điền đáp án và xem từ vựng.' : 
                '⚠️ Bạn cần nghe hết đoạn văn trước khi submit đáp án và xem từ vựng!'}
            </div>

            <div className="input-section">
              <h4>Điền các từ còn thiếu</h4>
              <div className="input-container">
                {answers.map((ans, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={ans}
                    onChange={(e) => handleChangeAnswer(idx, e.target.value)}
                    placeholder={`Ô ${idx + 1}`}
                  />
                ))}
              </div>
            </div>

            <button 
              className="submit-btn" 
              onClick={handleSubmit}
              disabled={!hasListened || isSpeaking}
              title={!hasListened ? 'Bạn cần nghe hết đoạn văn trước!' : isSpeaking ? 'Đang đọc, vui lòng chờ!' : ''}
            >
              <span>✅</span> 
              {!hasListened ? 'Phải nghe xong mới submit được!' : isSpeaking ? 'Đang đọc, vui lòng chờ!' : 'Submit đáp án'}
            </button>

            {showAnswers && (
              <div className="results-section">
                <h4>Đáp án đúng</h4>
                <ul>
                  {data.missingWords.map((word, idx) => (
                    <li
                      key={idx}
                      className={answers[idx] === word ? 'correct' : 'incorrect'}
                    >
                      <span>{idx + 1}.</span>
                      <span>{word}</span>
                      <span>
                        {answers[idx] === word ? '✔' : `✘ (Bạn điền: ${answers[idx] || '...'})`}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="score">
                  Điểm của bạn: {score} / {data.missingWords.length}
                  {score === data.missingWords.length && (
                    <span className="perfect">🎉 Xuất sắc!</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
      { data && (
        <div>
          <VocabularyComponent level={level} text={data.fullText} />
        </div>
      )}
    </div>
  );
};

export default Listening;