/// <reference types="vite/client" />

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}

declare var SpeechRecognition: {
  new(): SpeechRecognition;
  prototype: SpeechRecognition;
};