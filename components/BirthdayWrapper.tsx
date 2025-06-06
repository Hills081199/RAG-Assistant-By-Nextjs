import React, { useState, useEffect, useRef } from "react";
import styles from "../styles/SecretGift.module.css";

const TARGET_DATE = new Date("2025-06-08T20:00:00");

const SecretGift = () => {
  const [canOpen, setCanOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");
  const buttonRef = useRef(null);

  useEffect(() => {
    const now = new Date();
    if (now >= TARGET_DATE) {
      setCanOpen(true);
      return;
    }
    const timer = setTimeout(() => {
      setCanOpen(true);
    }, TARGET_DATE.getTime() - now.getTime());

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    if (canOpen) {
      setOpened(true);
      setMessage("");
    } else {
      setMessage("🎁 Chưa đến giờ mở quà, vui lòng đợi đến 22h ngày 8/6/2025 nhé!");
      if (buttonRef.current) {
        buttonRef.current.classList.add(styles.shake);
        setTimeout(() => {
          buttonRef.current?.classList.remove(styles.shake);
        }, 600);
      }
    }
  };

  return (
    <div className={styles.container}>
      <button
        ref={buttonRef}
        onClick={handleClick}
        className={`${styles.button} ${canOpen ? styles.active : styles.disabled}`}
        aria-pressed={opened}
      >
        🎁 Mở quà bí mật
      </button>

      {message && <div className={styles.message}>{message}</div>}

      {opened && (
        <div className={styles.giftBox}>
          <img
            src="https://cdn-icons-png.flaticon.com/512/891/891462.png"
            alt="Món quà học bổng"
            className={styles.giftImage}
          />
          <h2 className={styles.giftTitle}>🎉 Chúc mừng em yêu! 🎉</h2>
          <p className={styles.giftSubtitle}>
            Em đã xuất sắc hoàn thành năm học thứ 3 đại học với thành tích đáng tự hào!
          </p>
          <p className={styles.giftAmount}>
            Học bổng trị giá{" "}
            <span className={styles.amountNumber}>88.888.888</span> triệu đồng dành cho em 🎓💖
          </p>
          <p className={styles.giftDescription}>
            Đây là phần thưởng xứng đáng cho sự nỗ lực không ngừng và tinh thần kiên cường của em
            trong suốt chặng đường học tập. Anh tin rằng tương lai của em sẽ rực rỡ và thành công
            hơn nữa. Hãy tiếp tục vững bước, theo đuổi đam mê và luôn giữ ngọn lửa nhiệt huyết trong
            trái tim mình nhé! 🌟
          </p>
        </div>
      )}
    </div>
  );
};

export default SecretGift;