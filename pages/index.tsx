import React from "react";
import BirthdayCountdown from "../components/BirthdayCountdown";
import BackgroundMusic from "../components/BackgroundMusic";
export default function Home() {
  return (
    <>
      <BackgroundMusic />
      <BirthdayCountdown />
    </>
  );
}