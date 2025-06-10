import { useState } from 'react';
import ListeningComponent from '@/components/Listening';
import ReadingComponent from '@/components/Reading';

const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'listening' | 'reading'>('listening');

  return (
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

          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }

          @keyframes slideIn {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }

          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }

          .navbar {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
            position: sticky;
            top: 0;
            z-index: 1000;
            padding: 0 2rem;
          }

          .navbar-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 0;
          }

          .logo {
            font-size: 1.8rem;
            font-weight: 700;
            color: #2b3a67;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .nav-tabs {
            display: flex;
            gap: 1rem;
          }

          .nav-tab {
            padding: 0.75rem 1.5rem;
            border: none;
            background: transparent;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            color: #4a5568;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .nav-tab:hover {
            background: rgba(30, 136, 229, 0.1);
            color: #1e88e5;
            transform: translateY(-2px);
          }

          .nav-tab.active {
            background: linear-gradient(135deg, #1e88e5, #1565c0);
            color: white;
            box-shadow: 0 4px 12px rgba(30, 136, 229, 0.3);
          }

          .nav-tab.active:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(30, 136, 229, 0.4);
          }

          .main-container {
            max-width: 1000px;
            margin: 2rem auto;
            padding: 0 2rem;
          }

          .tab-content {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 2rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            animation: fadeIn 0.5s ease-out;
          }

          .section-header {
            text-align: center;
            margin-bottom: 2rem;
          }

          .section-header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            color: #2b3a67;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }

          .section-header p {
            color: #4a5568;
            font-size: 1.1rem;
            opacity: 0.8;
          }

          .instructions {
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            border-left: 4px solid #1e88e5;
          }

          .instructions h3 {
            font-size: 1.3rem;
            font-weight: 600;
            color: #1e88e5;
            margin-bottom: 0.5rem;
          }

          .instructions p {
            color: #4a5568;
            font-size: 1rem;
            line-height: 1.6;
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
            padding: 1rem;
            background: rgba(248, 250, 252, 0.8);
            border-radius: 12px;
          }

          .level-selector label {
            font-size: 1.1rem;
            font-weight: 500;
            color: #2b3a67;
          }

          .level-selector select {
            padding: 10px 30px 10px 15px;
            font-size: 1rem;
            color: #2b3a67;
            border: 2px solid #90caf9;
            border-radius: 8px;
            background: #fff url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"><path fill="%232b3a67" d="M7 10l5 5 5-5H7z"/></svg>') no-repeat right 10px center;
            background-size: 12px;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            transition: all 0.3s ease;
            min-width: 200px;
          }

          .level-selector select:focus {
            outline: none;
            border-color: #1e88e5;
            box-shadow: 0 0 12px rgba(30, 136, 229, 0.3);
          }

          button {
            padding: 12px 24px;
            font-size: 1rem;
            font-weight: 600;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
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
            background: linear-gradient(135deg, #1e88e5, #1565c0);
            color: #fff;
            width: 100%;
            margin-bottom: 1rem;
          }

          .generate-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #1565c0, #0d47a1);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(30, 136, 229, 0.3);
          }

          .generate-btn.speaking {
            background: linear-gradient(135deg, #ff9800, #f57c00);
            animation: pulse 1.5s infinite;
          }

          .exercise-section {
            margin-top: 2rem;
            animation: slideUp 0.6s ease-out;
          }

          .exercise-section h3 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #2b3a67;
            margin-bottom: 1rem;
          }

          .exercise-section p {
            font-size: 1.2rem;
            color: #4a5568;
            background: rgba(249, 250, 251, 0.8);
            padding: 1.5rem;
            border-radius: 12px;
            line-height: 1.8;
            border-left: 4px solid #43a047;
          }

          .speak-btn {
            background: linear-gradient(135deg, #43a047, #2e7d32);
            color: #fff;
            margin-top: 1rem;
          }

          .speak-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #2e7d32, #1b5e20);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(67, 160, 71, 0.3);
          }

          .speak-btn.speaking {
            background: linear-gradient(135deg, #ff5722, #d84315);
            animation: pulse 1.5s infinite;
          }

          .status-indicator {
            margin-top: 1rem;
            padding: 1rem;
            border-radius: 12px;
            text-align: center;
            font-weight: 500;
            font-size: 0.95rem;
          }

          .status-indicator.not-listened {
            background: linear-gradient(135deg, #fff3e0, #ffe0b2);
            color: #f57c00;
            border: 2px solid #ffb74d;
          }

          .status-indicator.listened {
            background: linear-gradient(135deg, #e8f5e8, #c8e6c9);
            color: #2e7d32;
            border: 2px solid #81c784;
          }

          .input-section h4 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2b3a67;
            margin: 2rem 0 1rem;
          }

          .input-container {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .input-container input {
            width: 120px;
            padding: 12px;
            font-size: 1rem;
            border: 2px solid #90caf9;
            border-radius: 8px;
            transition: all 0.3s ease;
            background: rgba(255, 255, 255, 0.9);
          }

          .input-container input:focus {
            outline: none;
            border-color: #1e88e5;
            box-shadow: 0 0 12px rgba(30, 136, 229, 0.3);
            background: white;
          }

          .submit-btn {
            background: linear-gradient(135deg, #d81b60, #b1134f);
            color: #fff;
            width: 100%;
            margin-top: 1rem;
          }

          .submit-btn:hover:not(:disabled) {
            background: linear-gradient(135deg, #b1134f, #8e0038);
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(216, 27, 96, 0.3);
          }

          .results-section {
            margin-top: 2rem;
            background: rgba(248, 250, 252, 0.5);
            padding: 1.5rem;
            border-radius: 12px;
          }

          .results-section h4 {
            font-size: 1.2rem;
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
            gap: 0.75rem;
            font-size: 1rem;
            margin-bottom: 0.75rem;
            padding: 0.5rem;
            border-radius: 6px;
            transition: all 0.3s ease;
          }

          .results-section li.correct {
            color: #2e7d32;
            background: rgba(200, 230, 201, 0.3);
          }

          .results-section li.incorrect {
            color: #d32f2f;
            background: rgba(255, 205, 210, 0.3);
          }

          .score {
            font-size: 1.3rem;
            font-weight: 600;
            color: #2b3a67;
            margin-top: 1.5rem;
            text-align: center;
            padding: 1rem;
            background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
            border-radius: 12px;
          }

          .score .perfect {
            color: #f9a825;
            font-weight: 700;
            margin-left: 0.5rem;
            animation: pulse 2s infinite;
          }

          .reading-section {
            animation: slideIn 0.5s ease-out;
          }

          @media (max-width: 768px) {
            .navbar-content {
              flex-direction: column;
              gap: 1rem;
              padding: 1rem 0;
            }

            .nav-tabs {
              width: 100%;
              justify-content: center;
            }

            .nav-tab {
              flex: 1;
              text-align: center;
            }

            .main-container {
              padding: 0 1rem;
            }

            .section-header h1 {
              font-size: 2rem;
            }

            .input-container {
              justify-content: center;
            }

            .level-selector {
              flex-direction: column;
              text-align: center;
            }
          }
        `}
      </style>
      
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <div className="logo">
            <span>🧠</span>
            Chinese Learning Hub
          </div>
          <div className="nav-tabs">
            <button 
              className={`nav-tab ${activeTab === 'listening' ? 'active' : ''}`}
              onClick={() => setActiveTab('listening')}
            >
              <span>🎧</span>
              Listening
            </button>
            <button 
              className={`nav-tab ${activeTab === 'reading' ? 'active' : ''}`}
              onClick={() => setActiveTab('reading')}
            >
              <span>📖</span>
              Reading
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-container">
        <div className="tab-content">
          {activeTab === 'listening' && <ListeningComponent />}
          {activeTab === 'reading' && <ReadingComponent /> } 
        </div>
        {/* <LoginPage /> */}
      </div>
    </>
  );
};

export default Home;