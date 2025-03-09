import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Volume2 as Volume2Off, Repeat } from 'lucide-react';

function App() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string>('');
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize speech recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript;
          setTranscript((prev) => prev + ' ' + transcript);
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          // Only set isListening to false if there was an error
          // This prevents the recognition from stopping when there's a pause in speech
          if (error) {
            setIsListening(false);
          } else if (isListening) {
            // Restart recognition if it was still supposed to be listening
            try {
              recognitionRef.current?.start();
            } catch (err) {
              console.error('Failed to restart recognition:', err);
              setError(`Failed to restart recognition: ${err}`);
              setIsListening(false);
            }
          }
        };
      } else {
        setError('Speech recognition is not supported in your browser');
      }

      // Initialize speech synthesis
      if ('speechSynthesis' in window) {
        synthRef.current = window.speechSynthesis;
      } else {
        setError('Speech synthesis is not supported in your browser');
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isListening, error]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not available');
      return;
    }

    try {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        setError(''); // Clear any previous errors
        setTranscript(''); // Clear previous transcript
        recognitionRef.current.start();
        setIsListening(true);
      }
    } catch (err) {
      console.error('Failed to toggle recognition:', err);
      setError(`Failed to toggle recognition: ${err}`);
      setIsListening(false);
    }
  };

  const speak = () => {
    if (!synthRef.current || !inputText.trim()) {
      setError('Speech synthesis not available or no text to speak');
      return;
    }

    try {
      // Cancel any ongoing speech
      stopSpeaking();

      // Create a new utterance for each speech request
      const utterance = new SpeechSynthesisUtterance(inputText);
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        setError('');
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        setError('');
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event);
        setError(`Speech synthesis error: ${event.error}`);
        setIsSpeaking(false);
      };

      // Speak the text
      synthRef.current.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setError(`Failed to start speech synthesis: ${err}`);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (!synthRef.current) return;
    try {
      synthRef.current.cancel();
      setIsSpeaking(false);
    } catch (err) {
      console.error('Error stopping speech:', err);
      setError(`Failed to stop speech: ${err}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            Speech & Audio Processing
          </h1>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}

          {/* Speech-to-Text Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">Speech to Text</h2>
              <button
                onClick={toggleListening}
                className={`p-3 rounded-full transition-colors ${
                  isListening 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                }`}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>
            <div className={`min-h-32 p-4 rounded-lg border-2 transition-colors ${
              isListening ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50'
            }`}>
              <p className="text-gray-700 whitespace-pre-wrap">{transcript || 'Start speaking...'}</p>
            </div>
          </div>

          {/* Text-to-Speech Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Text to Speech</h2>
            <div className="space-y-4">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to convert to speech..."
                className="w-full h-32 p-4 rounded-lg border-2 border-gray-200 focus:border-purple-400 focus:ring focus:ring-purple-200 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={isSpeaking ? stopSpeaking : speak}
                  disabled={!inputText.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !inputText.trim() 
                      ? 'bg-gray-300 cursor-not-allowed'
                      : isSpeaking
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Volume2Off size={20} />
                      Stop Speaking
                    </>
                  ) : (
                    <>
                      <Volume2 size={20} />
                      Speak Text
                    </>
                  )}
                </button>
                <button
                  onClick={() => setInputText('')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  <Repeat size={20} />
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;