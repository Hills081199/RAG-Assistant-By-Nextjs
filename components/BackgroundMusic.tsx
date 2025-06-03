import React, { useEffect, useRef } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.preload = "auto";

    // Thử phát nhạc khi component mount
    audio.play().catch((err) => {
      console.warn("Trình duyệt chặn auto play:", err);
    });
  }, []);

  return (
    <audio
      ref={audioRef}
      src="/audio/happy-birthday-piano.mp3"
      style={{ display: "none" }}
      loop
      preload="auto"
    />
  );
}