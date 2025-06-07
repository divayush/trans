import type { VoiceRecognitionResult } from "@/types";

export class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private silenceTimer: NodeJS.Timeout | null = null;
  private lastResultTime: number = 0;

  constructor() {
    this.synthesis = window.speechSynthesis;

    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true; // Keep listening for better experience
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }

    // Clean up audio when page unloads
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Clean up audio when page becomes hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanup();
      }
    });
  }

  async startListening(
    language: string = 'en-US',
    onResult: (result: VoiceRecognitionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError('Speech recognition not supported in this browser. Please try using Chrome or Safari.');
      return;
    }

    if (this.isListening) {
      this.stopListening();
    }

    // Detect iOS devices and browsers
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSSafari = isIOS && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isIOSChrome = isIOS && /Chrome/.test(navigator.userAgent);

    try {
      // Check if we already have permission to avoid repeated requests
      if (navigator.permissions) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          if (permissionStatus.state === 'granted') {
            console.log('Microphone permission already granted');
            // Skip permission request
          } else if (permissionStatus.state === 'denied') {
            onError('Microphone access denied. Please allow microphone access in your browser settings and refresh the page.');
            return;
          }
        } catch (permError) {
          console.log('Permission query not supported, proceeding with getUserMedia');
        }
      }

      // For iOS Safari, we need special handling
      if (isIOSSafari) {
        // First try to request permission directly without checking
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              volume: 1.0
            }
          });
          // Stop the stream immediately as we just needed permission
          stream.getTracks().forEach(track => track.stop());
          console.log('iOS Safari microphone permission granted');

          // Add delay for iOS Safari to properly register permission
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (iosError: any) {
          console.error('iOS Safari permission error:', iosError);
          // Don't throw error immediately, show specific iOS Safari instructions
          onError('For iOS Safari: Please go to Settings > Safari > Camera & Microphone, allow access for this website, then refresh the page and try again.');
          return;
        }
      } else {
        // Request microphone permission for other browsers with minimal audio processing
        console.log('Requesting microphone permission...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
            volume: 1.0
          }
        });

        // Stop the stream immediately as we just needed permission
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');

        // Small delay to ensure permission is properly registered
        await new Promise(resolve => setTimeout(resolve, 100));
      }

    } catch (error: any) {
      console.error('Microphone permission error:', error);
      let errorMessage = '';

      if (isIOSSafari) {
        errorMessage = 'iOS Safari: Go to Settings > Safari > Camera & Microphone, allow access for this website, then refresh and try again.';
      } else if (isIOSChrome) {
        errorMessage = 'iOS Chrome: Tap the microphone icon in the address bar, allow access, then refresh and try again.';
      } else if (isIOS) {
        errorMessage = 'iOS: Please allow microphone access when prompted and refresh the page.';
      } else {
        errorMessage = 'Please allow microphone access in your browser settings and refresh the page.';
      }

      onError(errorMessage);
      return;
    }

    try {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      throw new Error('Speech recognition not supported');
    }

    this.recognition = new SpeechRecognition();

    // iOS Chrome specific settings
    const isIOSChrome = /CriOS/.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    if (isIOS || isIOSChrome) {
      this.recognition.continuous = false; // iOS works better with non-continuous mode
      this.recognition.interimResults = false;
    } else {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
    }

    this.recognition.lang = language;
    this.recognition.maxAlternatives = 1;
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      onError('Failed to initialize speech recognition. Please try again.');
      return;
    }

    this.recognition.lang = language;
    this.isListening = true;

    this.recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      this.lastResultTime = Date.now();

      // Reset silence timer when we get speech
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      onResult({
        transcript: result[0].transcript,
        confidence: result[0].confidence,
        isFinal: result.isFinal
      });

      // Set new silence timer for auto-stop (4 seconds)
      if (result.isFinal && result[0].transcript.trim().length > 0) {
        this.silenceTimer = setTimeout(() => {
          if (this.isListening) {
            console.log('Auto-stopping due to silence');
            this.stopListening();
          }
        }, 4000); // 4 seconds of silence after final result
      }
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      console.error('Speech recognition error:', event.error);

      // Clear silence timer on error
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }

      let errorMessage = `Speech recognition error: ${event.error}`;
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        if (isIOSSafari) {
          errorMessage = 'Microphone access denied. On iOS Safari, please:\n1. Go to Settings > Safari > Camera & Microphone\n2. Allow this website to access your microphone\n3. Refresh the page and try again';
        } else if (isIOSChrome) {
          errorMessage = 'Microphone access denied. On iOS Chrome, please:\n1. Tap the microphone icon in the address bar\n2. Allow microphone access\n3. Refresh the page and try again';
        } else {
          errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings and refresh the page.';
        }
        onError(errorMessage);
        return;
      } else if (event.error === 'no-speech') {
        // Don't show error for no speech - this is normal when user doesn't speak
        console.log('No speech detected - this is normal');
        return;
      } else if (event.error === 'aborted') {
        // Don't show error for aborted - this happens when stopping normally
        console.log('Speech recognition aborted - this is normal');
        return;
      } else if (event.error === 'network') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (event.error === 'audio-capture') {
        if (isIOSSafari || isIOSChrome) {
          errorMessage = 'Microphone not available. Please ensure your microphone is working and try again. On iOS, make sure no other apps are using the microphone.';
        } else {
          errorMessage = 'Microphone not available. Please check your microphone connection.';
        }
      } else if (event.error === 'language-not-supported') {
        errorMessage = 'The selected language is not supported for speech recognition.';
      }

      // Only show errors for actual problems, not normal flow
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        onError(errorMessage);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // Clear silence timer when recognition ends
      if (this.silenceTimer) {
        clearTimeout(this.silenceTimer);
        this.silenceTimer = null;
      }
    };

    try {
      this.recognition.start();
    } catch (error) {
      this.isListening = false;
      onError('Failed to start speech recognition. Please try again.');
    }
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }

    // Clear silence timer
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  speak(text: string, language: string = 'en-US', rate: number = 1, pitch: number = 1): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      // Wait a bit to ensure cancellation is complete
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);

        // Improve language mapping and voice selection
        const langCode = language.split('-')[0];
        const voices = this.synthesis.getVoices();
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(langCode) || voice.lang.startsWith(language)
        );

        if (preferredVoice) {
          utterance.voice = preferredVoice;
          utterance.lang = preferredVoice.lang;
        } else {
          utterance.lang = language;
        }

        utterance.rate = Math.max(0.1, Math.min(rate, 10)); // Clamp rate to valid range
        utterance.pitch = Math.max(0, Math.min(pitch, 2)); // Clamp pitch to valid range
        utterance.volume = 1;

        // Increase timeout and add retry logic
        const timeout = setTimeout(() => {
          this.synthesis.cancel();
          // Try to restart synthesis if it hangs
          setTimeout(() => {
            try {
              this.synthesis.speak(utterance);
            } catch (retryError) {
              reject(new Error('Speech synthesis failed after retry'));
            }
          }, 500);
        }, 60000); // Increased to 60 second timeout

        let hasEnded = false;

        utterance.onend = () => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            resolve();
          }
        };

        utterance.onerror = (event) => {
          if (!hasEnded) {
            hasEnded = true;
            clearTimeout(timeout);
            console.error('Speech synthesis error:', event.error);
            
            // Handle specific error types
            if (event.error === 'network') {
              reject(new Error('Network error - please check your connection'));
            } else if (event.error === 'synthesis-failed') {
              reject(new Error('Speech synthesis failed - please try again'));
            } else if (event.error === 'audio-busy') {
              reject(new Error('Audio device is busy - please try again'));
            } else {
              resolve(); // Resolve instead of reject for less critical errors
            }
          }
        };

        // Add start callback to detect if synthesis actually starts
        utterance.onstart = () => {
          console.log('Speech synthesis started successfully');
        };

        try {
          // Check if synthesis is working before speaking
          if (this.synthesis.speaking) {
            this.synthesis.cancel();
            setTimeout(() => {
              this.synthesis.speak(utterance);
            }, 200);
          } else {
            this.synthesis.speak(utterance);
          }
        } catch (error) {
          clearTimeout(timeout);
          reject(new Error('Failed to start speech synthesis'));
        }
      }, 100);
    });
  }

  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis.getVoices();
  }

  isRecognitionSupported(): boolean {
    return this.recognition !== null;
  }

  isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  async checkMicrophonePermission(): Promise<boolean> {
    try {
      // On iOS Safari, permissions API might not work properly
      const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      const isIOSChrome = /CriOS/.test(navigator.userAgent);

      if (isIOSSafari || isIOSChrome) {
        // For iOS devices, only check permission state without requesting access
        if (navigator.permissions) {
          try {
            const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
            return result.state === 'granted';
          } catch {
            // If permissions API fails, return unknown state as false
            return false;
          }
        }
        return false;
      } else {
        // For other browsers, use permissions API only
        if (navigator.permissions) {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          return result.state === 'granted';
        }
        return false;
      }
    } catch (error) {
      // Don't try to access microphone directly in check method
      return false;
    }
  }

  async requestMicrophonePermission(): Promise<boolean> {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      // iOS Chrome specific handling
      const isIOSChrome = /CriOS/.test(navigator.userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

      if (isIOS || isIOSChrome) {
        // For iOS, we need to request permission in a more specific way
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: true
          });
          stream.getTracks().forEach(track => track.stop());
          return true;
        } catch (iosError) {
          // If the above fails, try with minimal constraints
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false
            } 
          });
          stream.getTracks().forEach(track => track.stop());
          return true;
        }
      }

      // For other browsers, use enhanced constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });

      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());

      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      return false;
    }
  }

  cleanup(): void {
    // Stop listening
    this.stopListening();
    
    // Cancel any ongoing speech synthesis
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    
    // Clear any timeouts
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const voiceService = new VoiceService();