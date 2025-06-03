import React, { useEffect, useState } from "react";

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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(135deg, #ffe4e1, #ffb6c1)", // giữ nguyên nền trang
        fontFamily: "'Comic Sans MS', cursive, sans-serif",
        paddingBottom: "80px",
      }}
    >
      <div
        style={{
          maxWidth: "420px",
          margin: "24px auto 0",
          padding: "36px 24px",
          borderRadius: "30px",
          background:
            "radial-gradient(circle at top left, #ffd6db 0%, #ffe9ec 100%)",
          boxShadow:
            "0 12px 40px rgba(255, 105, 180, 0.15), 0 0 30px rgba(255, 182, 193, 0.15)",
          textAlign: "center",
          border: "2px solid #ff8aa4",
          position: "sticky",
          top: "16px",
          zIndex: 1000,
          color: "#6a1b4d",
          userSelect: "none",
        }}
      >
        <h1
          style={{
            fontSize: "28px",
            marginBottom: "24px",
            color: "#d81b60",
            textShadow: "1px 1px 2px #ff8ba7",
          }}
        >
          {isBirthday
            ? "Chúc mừng sinh nhật em yêu 💖"
            : "Đếm ngược tới sinh nhật em yêu 💝"}
        </h1>

        {!isBirthday && (
          <div
            style={{
              fontSize: "22px",
              display: "flex",
              justifyContent: "space-around",
              fontWeight: "700",
              color: "#880e4f",
            }}
          >
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
          <p
            style={{
              fontSize: "22px",
              marginTop: "20px",
              color: "#c2185b",
              fontWeight: "700",
            }}
          >
            Hôm nay là một ngày đặc biệt nhất! 💐
          </p>
        )}
      </div>

      <div
        style={{
          maxWidth: "420px",
          margin: "40px auto 0",
          padding: "0 20px",
          minHeight: "300px",
          color: "#ad1457",
          textAlign: "center",
          fontStyle: "italic",
          opacity: 0.4,
          userSelect: "none",
        }}
      >
        {/* Không gian để thêm tính năng mới */}
      </div>
    </div>
  );
}
