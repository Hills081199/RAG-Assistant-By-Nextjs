import React, { useState, useEffect } from "react";
import BirthdayMessage from "./BirthdayMessage";

const BirthdayMessageWrapper = () => {
  const [canOpen, setCanOpen] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [alertMsg, setAlertMsg] = useState(""); // thông báo khi chưa đến giờ

  useEffect(() => {
    const targetDate = new Date("2025-06-08T20:00:00");
    const now = new Date();

    if (now >= targetDate) {
      setCanOpen(true);
    } else {
      const timer = setInterval(() => {
        const nowCheck = new Date();
        if (nowCheck >= targetDate) {
          setCanOpen(true);
          clearInterval(timer);
        }
      }, 1000 * 60);

      return () => clearInterval(timer);
    }
  }, []);

  const handleClick = () => {
    if (canOpen) {
      setShowMessage(true);
      setAlertMsg("");
    } else {
      setAlertMsg("⏳ Chưa đến giờ mở lời nhắn, vui lòng đợi đến 20h tối 8/6/2025!");
      // Hoặc bạn có thể dùng alert() thay vì message nhỏ ở UI
    }
  };

  if (showMessage) {
    return <BirthdayMessage />;
  }

  return (
    <div
      style={{
        textAlign: "center",
        marginTop: "6rem",
        padding: "2rem",
        background: "linear-gradient(135deg, #fce4ec, #f8bbd0)",
        borderRadius: "16px",
        boxShadow: "0 8px 20px rgba(194, 24, 91, 0.3)",
        maxWidth: "400px",
        marginLeft: "auto",
        marginRight: "auto",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        color: "#880e4f",
        userSelect: "none",
      }}
    >
      <button
        onClick={handleClick}
        style={{
          padding: "1rem 2.5rem",
          fontSize: "1.3rem",
          cursor: "pointer", // luôn pointer vì luôn clickable
          background: canOpen
            ? "linear-gradient(45deg, #e91e63, #c2185b)"
            : "linear-gradient(45deg, #ccc, #999)",
          color: "#fff",
          border: "none",
          borderRadius: "50px",
          boxShadow: canOpen
            ? "0 6px 12px rgba(194, 24, 91, 0.6)"
            : "none",
          transition: "all 0.3s ease",
          fontWeight: "600",
          letterSpacing: "0.05em",
          filter: canOpen ? "drop-shadow(0 0 4px #e91e63)" : "none",
          userSelect: "none",
          outline: "none",
        }}
        onMouseEnter={e => {
          if (canOpen) {
            e.currentTarget.style.background = "linear-gradient(45deg, #c2185b, #880e4f)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(194, 24, 91, 0.8)";
            e.currentTarget.style.filter = "drop-shadow(0 0 6px #c2185b)";
          }
        }}
        onMouseLeave={e => {
          if (canOpen) {
            e.currentTarget.style.background = "linear-gradient(45deg, #e91e63, #c2185b)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(194, 24, 91, 0.6)";
            e.currentTarget.style.filter = "drop-shadow(0 0 4px #e91e63)";
          }
        }}
        onMouseDown={e => {
          if (canOpen) {
            e.currentTarget.style.transform = "scale(0.95)";
            e.currentTarget.style.boxShadow = "0 4px 8px rgba(194, 24, 91, 0.9)";
          }
        }}
        onMouseUp={e => {
          if (canOpen) {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(194, 24, 91, 0.8)";
          }
        }}
      >
        {canOpen
          ? "🎉 Nhấn để mở lời nhắn bí mật!"
          : "⏳ Lời nhắn sẽ mở lúc 20h tối 8/6/2025"}
      </button>

      {alertMsg && (
        <div
          style={{
            marginTop: "1rem",
            color: "#b0003a",
            fontWeight: "600",
            fontSize: "1rem",
            userSelect: "none",
          }}
        >
          {alertMsg}
        </div>
      )}
    </div>
  );
};

export default BirthdayMessageWrapper;