import React, { useState } from "react";
import { TypeAnimation } from "react-type-animation";

const BirthdayMessage = () => {
  const [doneTyping, setDoneTyping] = useState(false);

  return (
    <div
      style={{
        textAlign: "center",
        padding: "2rem",
        fontFamily: "'Comic Sans MS', cursive",
        color: "#c2185b",
        maxWidth: "600px",
        margin: "auto",
      }}
    >
      <TypeAnimation
        sequence={[
          "Gửi em yêu dấu của anh... 💖",
          1000,
          "Gửi em yêu dấu của anh... 💖\nHôm nay là ngày đặc biệt của em 🥰",
          1000,
          "Gửi em yêu dấu của anh... 💖\nHôm nay là ngày đặc biệt của em 🥰\nVà anh chỉ muốn nói rằng...",
          1000,
          "Gửi em yêu dấu của anh... 💖\nHôm nay là ngày đặc biệt của em 🥰\nVà anh chỉ muốn nói rằng...\nAnh yêu em rất nhiều! 💌",
          1000,
          () => setDoneTyping(true),
        ]}
        speed={50}
        wrapper="pre"
        style={{ whiteSpace: "pre-wrap", fontSize: "1.3rem" }}
        repeat={0}
        cursor={true}
        cursorStyle="_"
      />

      {doneTyping && (
        <div
          style={{
            marginTop: "2rem",
            fontSize: "1.5rem",
            color: "#880e4f",
            animation: "fadeIn 1.2s ease-in-out",
          }}
        >
          🎁 Nhấn vào món quà bí mật bên dưới nhé!
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BirthdayMessage;