import { useState, useEffect, useMemo } from 'react';
interface VocabularyItem {
  word: string;
  pinyin: string;
  definition: string;
  partOfSpeech: string;
  example: string;
  level?: string;
  text?: string;
}

const VocabularyComponent: React.FC<{ level: number, text: string }> = ({ level, text }) => {
  const [vocabularyData, setVocabularyData] = useState<VocabularyItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartOfSpeech, setSelectedPartOfSpeech] = useState('all');
  const [showPinyin, setShowPinyin] = useState(true);
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Text-to-Speech functionality
  const speakWord = (word: string) => {
    // Check if speech synthesis is supported
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser');
      return;
    }

    // Stop any currently speaking text
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    
    // Set language to Chinese (Mandarin)
    utterance.lang = 'zh-CN';
    
    // Set speech rate and pitch
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1;
    utterance.volume = 1;

    // Handle speech events
    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
      alert('Error playing pronunciation. Please try again.');
    };

    // Try to use a Chinese voice if available
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(voice => 
      voice.lang.includes('zh') || 
      voice.lang.includes('Chinese') ||
      voice.name.toLowerCase().includes('chinese')
    );
    
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    // Speak the word
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const fetchVocabulary = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log('Fetching vocabulary data...');
        console.log(level, text)
        
        // Mock data for demonstration since API endpoint is not available
        const mockData: VocabularyItem[] = [
          {
            word: "你好",
            pinyin: "nǐ hǎo",
            definition: "Hello, a common greeting",
            partOfSpeech: "感叹词",
            example: "你好，很高兴见到你。(Hello, nice to meet you.)",
            level: "HSK1"
          },
          {
            word: "学习",
            pinyin: "xué xí",
            definition: "To learn, to study",
            partOfSpeech: "动词",
            example: "我在学习中文。(I am learning Chinese.)",
            level: "HSK2"
          },
          {
            word: "漂亮",
            pinyin: "piào liang",
            definition: "Beautiful, pretty",
            partOfSpeech: "形容词",
            example: "这朵花很漂亮。(This flower is very beautiful.)",
            level: "HSK2"
          },
          {
            word: "快乐",
            pinyin: "kuài lè",
            definition: "Happy, joyful",
            partOfSpeech: "形容词",
            example: "祝你生日快乐！(Happy birthday to you!)",
            level: "HSK3"
          },
          {
            word: "非常",
            pinyin: "fēi cháng",
            definition: "Very, extremely",
            partOfSpeech: "副词",
            example: "今天天气非常好。(The weather is very good today.)",
            level: "HSK2"
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVocabularyData(mockData);

        /* Uncomment this for actual API call
        const response = await fetch('/api/vocabulary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            level,
            text,
          }),
        });
        if (!response.ok || response.status !== 200) {
          throw new Error(`Failed to fetch vocabulary data with status: ${response.status}`);
        }
    
        const data: VocabularyResponse = await response.json();
    
        if (Array.isArray(data.vocabulary)) {
          setVocabularyData(data.vocabulary);
        } else {
          console.error('Invalid response format: data.vocabulary is not an array', data);
          setError('Invalid response format from server. Please check console for details.');
        }
        */
      } catch (err) {
        console.error('Error fetching vocabulary data:', err);
        setError('Error fetching vocabulary data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVocabulary();
  }, [level, text]);

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      // Trigger voices loading
      window.speechSynthesis.getVoices();
    };

    if ('speechSynthesis' in window) {
      loadVoices();
      // Some browsers load voices asynchronously
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const partOfSpeechOptions = useMemo(() => {
    const unique = [...new Set(vocabularyData.map(item => item.partOfSpeech))];
    return unique.sort();
  }, [vocabularyData]);

  const filteredVocabulary = useMemo(() => {
    return vocabularyData.filter(item => {
      const matchesSearch = 
        item.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPartOfSpeech = 
        selectedPartOfSpeech === 'all' || item.partOfSpeech === selectedPartOfSpeech;
      
      return matchesSearch && matchesPartOfSpeech;
    });
  }, [searchTerm, selectedPartOfSpeech, vocabularyData]);

  const getPartOfSpeechStyle = (partOfSpeech: string) => {
    const styles = {
      '名词': 'part-of-speech-noun',
      '动词': 'part-of-speech-verb',
      '形容词': 'part-of-speech-adjective',
      '副词': 'part-of-speech-adverb',
      '感叹词': 'part-of-speech-interjection'
    };
    return styles[partOfSpeech as keyof typeof styles] || 'part-of-speech-default';
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedPartOfSpeech('all');
  };

  return (
    <div className="vocabulary-container">
      <style>
        {`
          .vocabulary-container {
            min-height: 100vh;
            background: linear-gradient(to bottom, #f8fafc, #e5e7eb);
            padding: 3rem 1rem;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }

          .vocabulary-wrapper {
            max-width: 1280px;
            margin: 0 auto;
          }

          .header {
            text-align: center;
            margin-bottom: 3rem;
          }

          .header h1 {
            font-size: 2.5rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 1rem;
          }

          .header p {
            font-size: 1.125rem;
            color: #6b7280;
          }

          .header .count {
            font-weight: 600;
            color: #4f46e5;
          }

          .controls-container {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
          }

          .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            align-items: center;
          }

          .search-container {
            flex: 1;
            position: relative;
            min-width: 200px;
          }

          .search-icon {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            color: #9ca3af;
          }

          .search-input {
            width: 100%;
            padding: 0.75rem 1rem 0.75rem 2.5rem;
            border: 1px solid #d1d5db;
            border-radius: 0.75rem;
            font-size: 1rem;
            transition: all 0.2s;
          }

          .search-input:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
          }

          .select,
          .button {
            padding: 0.75rem 1rem;
            border: 1px solid #d1d5db;
            border-radius: 0.75rem;
            font-size: 1rem;
            background: white;
            transition: all 0.2s;
            cursor: pointer;
          }

          .select:focus,
          .button:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
          }

          .button {
            background: #f3f4f6;
            color: #374151;
          }

          .button:hover {
            background: #e5e7eb;
          }

          .button-active {
            background: #4f46e5;
            color: white;
            border-color: #4f46e5;
          }

          .button-active:hover {
            background: #4338ca;
          }

          .results-info {
            margin-top: 1rem;
            font-size: 0.875rem;
            color: #6b7280;
          }

          .results-info .count {
            font-weight: 600;
            color: #4f46e5;
          }

          .loading-container,
          .error-container,
          .no-results-container {
            text-align: center;
            padding: 5rem 0;
          }

          .spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #4f46e5;
            border-top-color: transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          .error-container,
          .no-results-container {
            max-width: 24rem;
            margin: 0 auto;
            background: white;
            border-radius: 1rem;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            padding: 2rem;
          }

          .error-icon,
          .no-results-icon {
            width: 3rem;
            height: 3rem;
            color: #ef4444;
            margin: 0 auto 1rem;
          }

          .no-results-icon {
            color: #9ca3af;
          }

          .card {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: box-shadow 0.3s;
            cursor: pointer;
            overflow: hidden;
          }

          .card:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }

          .card-content {
            padding: 1.5rem;
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
          }

          .card-word {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
          }

          .card-pinyin {
            font-size: 0.875rem;
            color: #4f46e5;
            margin-top: 0.25rem;
          }

          .part-of-speech-noun {
            background: #e0e7ff;
            color: #4f46e5;
            border: 1px solid #c7d2fe;
          }

          .part-of-speech-verb {
            background: #d1fae5;
            color: #047857;
            border: 1px solid #6ee7b7;
          }

          .part-of-speech-adjective {
            background: #ede9fe;
            color: #6d28d9;
            border: 1px solid #c4b5fd;
          }

          .part-of-speech-adverb {
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fed7aa;
          }

          .part-of-speech-interjection {
            background: #fce7f3;
            color: #be185d;
            border: 1px solid #f9a8d4;
          }

          .part-of-speech-default {
            background: #f3f4f6;
            color: #374151;
            border: 1px solid #d1d5db;
          }

          .part-of-speech {
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            font-weight: 500;
            border-radius: 9999px;
          }

          .level-badge {
            display: inline-block;
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
            font-weight: 500;
            background: #fef3c7;
            color: #b45309;
            border: 1px solid #fed7aa;
            border-radius: 9999px;
            margin-bottom: 1rem;
          }

          .card-definition {
            font-size: 0.875rem;
            color: #4b5563;
            margin-bottom: 1rem;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .card-example {
            background: #f9fafb;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid #e5e7eb;
          }

          .card-example-label {
            font-size: 0.75rem;
            font-weight: 500;
            color: #6b7280;
            margin-bottom: 0.25rem;
          }

          .card-example-text {
            font-size: 0.875rem;
            color: #374151;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .vocabulary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1.5rem;
          }

          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            z-index: 50;
          }

          .modal {
            background: white;
            border-radius: 1rem;
            max-width: 32rem;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-content {
            padding: 2rem;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
          }

          .modal-word {
            font-size: 1.875rem;
            font-weight: 700;
            color: #1f2937;
          }

          .modal-pinyin {
            font-size: 1.125rem;
            color: #4f46e5;
            margin-top: 0.25rem;
          }

          .modal-close {
            color: #9ca3af;
            transition: color 0.2s;
            cursor: pointer;
          }

          .modal-close:hover {
            color: #4b5563;
          }

          .modal-section {
            margin-bottom: 1.5rem;
          }

          .modal-section-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.75rem;
          }

          .modal-definition {
            background: #e0e7ff;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #c7d2fe;
            color: #374151;
          }

          .modal-example {
            background: #d1fae5;
            padding: 1rem;
            border-radius: 0.5rem;
            border: 1px solid #6ee7b7;
            color: #374151;
          }

          .modal-button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #4f46e5;
            color: white;
            border: none;
            border-radius: 0.75rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            margin: 0 auto;
            min-width: 180px;
            justify-content: center;
          }

          .modal-button:hover {
            background: #4338ca;
          }

          .modal-button:disabled {
            background: #9ca3af;
            cursor: not-allowed;
          }

          .modal-button.speaking {
            background: #dc2626;
          }

          .modal-button.speaking:hover {
            background: #b91c1c;
          }

          .speaking-icon {
            animation: pulse 1.5s ease-in-out infinite;
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          @media (min-width: 640px) {
            .controls {
              flex-wrap: nowrap;
            }
          }
        `}
      </style>
      <div className="vocabulary-wrapper">
        {/* Header */}
        <div className="header">
          <h1>Vocabulary Learning Hub</h1>
          <p>Mastered <span className="count">{vocabularyData.length}</span> words</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="controls-container">
          <div className="controls">
            {/* Search Input */}
            <div className="search-container">
              <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search words, pinyin, or definitions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Controls */}
            <select
              value={selectedPartOfSpeech}
              onChange={(e) => setSelectedPartOfSpeech(e.target.value)}
              className="select"
            >
              <option value="all">All Parts of Speech</option>
              {partOfSpeechOptions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`button ${showPinyin ? 'button-active' : ''}`}
            >
              {showPinyin ? 'Hide Pinyin' : 'Show Pinyin'}
            </button>

            <button
              onClick={resetFilters}
              className="button"
            >
              Reset
            </button>
          </div>
          <div className="results-info">
            Showing <span className="count">{filteredVocabulary.length}</span> words
            {(searchTerm || selectedPartOfSpeech !== 'all') && (
              <span className="count"> (Filtered)</span>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading vocabulary...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="error-container">
            <svg className="error-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        )}

        {/* Vocabulary Grid */}
        {!isLoading && !error && (
          <div className="vocabulary-grid">
            {filteredVocabulary.map((item, index) => (
              <div
                key={index}
                className="card"
                onClick={() => setSelectedWord(item)}
              >
                <div className="card-content">
                  <div className="card-header">
                    <div>
                      <h3 className="card-word">{item.word}</h3>
                      {showPinyin && (
                        <p className="card-pinyin">{item.pinyin}</p>
                      )}
                    </div>
                    <span className={`part-of-speech ${getPartOfSpeechStyle(item.partOfSpeech)}`}>
                      {item.partOfSpeech}
                    </span>
                  </div>
                  {item.level && (
                    <span className="level-badge">Level: {item.level}</span>
                  )}
                  <p className="card-definition">{item.definition}</p>
                  <div className="card-example">
                    <p className="card-example-label">Example:</p>
                    <p className="card-example-text">{item.example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && !error && filteredVocabulary.length === 0 && (
          <div className="no-results-container">
            <svg className="no-results-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3>No Results</h3>
            <p>Try adjusting your search or filters.</p>
            <button
              onClick={resetFilters}
              className="button button-active"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Word Detail Modal */}
        {selectedWord && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-content">
                <div className="modal-header">
                  <div>
                    <h2 className="modal-word">{selectedWord.word}</h2>
                    <p className="modal-pinyin">{selectedWord.pinyin}</p>
                    {selectedWord.level && (
                      <span className="level-badge">Level: {selectedWord.level}</span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="modal-close"
                  >
                    <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="modal-section">
                  <span className={`part-of-speech ${getPartOfSpeechStyle(selectedWord.partOfSpeech)}`}>
                    {selectedWord.partOfSpeech}
                  </span>
                </div>

                <div className="modal-section">
                  <h4 className="modal-section-title">Definition</h4>
                  <div className="modal-definition">
                    <p>{selectedWord.definition}</p>
                  </div>
                </div>

                <div className="modal-section">
                  <h4 className="modal-section-title">Example</h4>
                  <div className="modal-example">
                    <p>{selectedWord.example}</p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => speakWord(selectedWord.word)}
                    disabled={isSpeaking}
                    className={`modal-button ${isSpeaking ? 'speaking' : ''}`}
                  >
                    <svg 
                      style={{width: '20px', height: '20px'}} 
                      className={isSpeaking ? 'speaking-icon' : ''}
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707a1 1 0 011.414 0l2.828 2.828" />
                    </svg>
                    {isSpeaking ? 'Speaking...' : 'Play Pronunciation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VocabularyComponent;