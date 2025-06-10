export function speak(text: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis;
    if (!synth) {
      alert('Trình duyệt không hỗ trợ TTS');
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    // Cancel any ongoing speech
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.75;
    utterance.pitch = 1;

    // Resolve when speech ends
    utterance.onend = () => resolve();
    // Handle errors
    utterance.onerror = (event) => reject(new Error(`Speech synthesis error: ${event.error}`));

    synth.speak(utterance);
  });
}