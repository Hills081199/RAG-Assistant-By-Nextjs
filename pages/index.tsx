import React from "react";
import BirthdayCountdown from "../components/BirthdayCountdown";
import BackgroundMusic from "../components/BackgroundMusic";
import PhotoAlbum from "../components/PhotoAlbum";

export default function Home() {
  return (
    <>
      <BackgroundMusic />
      <BirthdayCountdown />
    </>
  );
}