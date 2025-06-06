import React, { useEffect, useState } from "react";
import PhotoAlbum from "./PhotoAlbum";
import BirthdayMessageWrapper from "./BirthdayMessageWrapper";
import SecretGift from "./BirthdayWrapper";
const targetDate = new Date("2025-06-08T00:00:00");

function getTimeRemaining(target: Date) {
  const total = target.getTime() - new Date().getTime();
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { total, days, hours, minutes, seconds };
}

export default function BirthdayCountdown() {
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining(targetDate));
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(getTimeRemaining(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!hasMounted) return null;

  const isBirthday = timeLeft.total <= 0;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      background: "linear-gradient(135deg, #ffe4e1, #ffb6c1)",
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      paddingBottom: "80px",
    }}>
      {/* Countdown Timer */}
      <div style={{
        maxWidth: "420px",
        margin: "24px auto 0",
        padding: "36px 24px",
        borderRadius: "30px",
        background: "radial-gradient(circle at top left, #ffd6db 0%, #ffe9ec 100%)",
        boxShadow: "0 12px 40px rgba(255, 105, 180, 0.15), 0 0 30px rgba(255, 182, 193, 0.15)",
        textAlign: "center",
        border: "2px solid #ff8aa4",
        color: "#6a1b4d",
        userSelect: "none",
      }}>
        <h1 style={{
          fontSize: "28px",
          marginBottom: "24px",
          color: "#d81b60",
          textShadow: "1px 1px 2px #ff8ba7",
        }}>
          {isBirthday ? "Chúc mừng sinh nhật em yêu 💖" : "Đếm ngược đến sinh nhật em yêu 💝"}
        </h1>
        
        {!isBirthday && (
          <div style={{
            fontSize: "22px",
            display: "flex",
            justifyContent: "space-around",
            fontWeight: "700",
            color: "#880e4f",
          }}>
            <div>
              <p style={{ fontSize: "48px", margin: 0 }}>{timeLeft.days}</p>
              <p>Ngày</p>
            </div>
            <div>
              <p style={{ fontSize: "48px", margin: 0 }}>{timeLeft.hours}</p>
              <p>Giờ</p>
            </div>
            <div>
              <p style={{ fontSize: "48px", margin: 0 }}>{timeLeft.minutes}</p>
              <p>Phút</p>
            </div>
            <div>
              <p style={{ fontSize: "48px", margin: 0 }}>{timeLeft.seconds}</p>
              <p>Giây</p>
            </div>
          </div>
        )}
        
        {isBirthday && (
          <p style={{
            fontSize: "22px",
            marginTop: "20px",
            color: "#c2185b",
            fontWeight: "700",
          }}>
            Hôm nay là một ngày đặc biệt nhất! 💐
          </p>
        )}
      </div>

      {/* Decorative Heart */}
      <div style={{
        fontSize: '3rem',
        margin: '2rem 0 1rem 0',
        opacity: 0.6,
        animation: 'pulse 2s infinite'
      }}>
        💖
      </div>

      {/* Photo Album */}
      <div style={{
        width: '100%',
        maxWidth: '500px',
        background: 'rgba(255, 255, 255, 0.3)',
        borderRadius: '20px',
        padding: '1rem',
        boxShadow: '0 8px 32px rgba(255, 105, 180, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <PhotoAlbum />
      </div>
              
      <BirthdayMessageWrapper />
      <SecretGift />
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        @media (max-width: 500px) {
          .photo-album-container {
            width: 320px !important;
            height: 220px !important;
          }
        }
      `}</style>
    </div>
  );
}