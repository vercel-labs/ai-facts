"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  ReactNode,
} from "react";

interface MicrophoneDevice {
  deviceId: string;
  label: string;
}

interface MicrophoneContextType {
  microphone: MediaRecorder | null;
  startMicrophone: () => void;
  stopMicrophone: () => void;
  setupMicrophone: (deviceId?: string) => void;
  microphoneState: MicrophoneState | null;
  availableMicrophones: MicrophoneDevice[];
  selectedMicrophone: MicrophoneDevice | null;
  loadAvailableMicrophones: () => Promise<void>;
  selectMicrophone: (deviceId: string) => Promise<void>;
}

export enum MicrophoneEvents {
  DataAvailable = "dataavailable",
  Error = "error",
  Pause = "pause",
  Resume = "resume",
  Start = "start",
  Stop = "stop",
}

export enum MicrophoneState {
  NotSetup = -1,
  SettingUp = 0,
  Ready = 1,
  Opening = 2,
  Open = 3,
  Error = 4,
  Pausing = 5,
  Paused = 6,
}

const MicrophoneContext = createContext<MicrophoneContextType | undefined>(
  undefined
);

interface MicrophoneContextProviderProps {
  children: ReactNode;
}

const MicrophoneContextProvider: React.FC<MicrophoneContextProviderProps> = ({
  children,
}) => {
  const [microphoneState, setMicrophoneState] = useState<MicrophoneState>(
    MicrophoneState.NotSetup
  );
  const [microphone, setMicrophone] = useState<MediaRecorder | null>(null);
  const [availableMicrophones, setAvailableMicrophones] = useState<MicrophoneDevice[]>([]);
  const [selectedMicrophone, setSelectedMicrophone] = useState<MicrophoneDevice | null>(null);

  const loadAvailableMicrophones = async () => {
    try {
      // Request permission to access audio devices
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get list of audio input devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputDevices = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 5)}...`
        }));

      setAvailableMicrophones(audioInputDevices);

      // Select default microphone if none is selected
      if (!selectedMicrophone && audioInputDevices.length > 0) {
        setSelectedMicrophone(audioInputDevices[0]);
      }
    } catch (err) {
      console.error('Error loading microphones:', err);
      throw err;
    }
  };

  const selectMicrophone = async (deviceId: string) => {
    const selected = availableMicrophones.find(mic => mic.deviceId === deviceId);
    if (selected) {
      setSelectedMicrophone(selected);
      // If there's an active microphone, stop it and setup the new one
      if (microphone) {
        microphone.stream.getTracks().forEach(track => track.stop());
        setMicrophone(null);
        await setupMicrophone(deviceId);
      }
    }
  };

  const setupMicrophone = async (deviceId?: string) => {
    setMicrophoneState(MicrophoneState.SettingUp);

    try {
      const userMedia = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          noiseSuppression: true,
          echoCancellation: true,
        },
      });

      const microphone = new MediaRecorder(userMedia);

      setMicrophoneState(MicrophoneState.Ready);
      setMicrophone(microphone);
    } catch (err: any) {
      console.error(err);
      setMicrophoneState(MicrophoneState.Error);
      throw err;
    }
  };
  const stopMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Pausing);

    if (microphone?.state === "recording") {
      microphone.pause();
      setMicrophoneState(MicrophoneState.Paused);
    }
  }, [microphone]);

  const startMicrophone = useCallback(() => {
    setMicrophoneState(MicrophoneState.Opening);

    if (microphone?.state === "paused") {
      microphone.resume();
    } else {
      microphone?.start(250);
    }

    setMicrophoneState(MicrophoneState.Open);
  }, [microphone]);

  return (
    <MicrophoneContext.Provider
      value={{
        microphone,
        startMicrophone,
        stopMicrophone,
        setupMicrophone,
        microphoneState,
        availableMicrophones,
        selectedMicrophone,
        loadAvailableMicrophones,
        selectMicrophone,
      }}
    >
      {children}
    </MicrophoneContext.Provider>
  );
};

function useMicrophone(): MicrophoneContextType {
  const context = useContext(MicrophoneContext);

  if (context === undefined) {
    throw new Error(
      "useMicrophone must be used within a MicrophoneContextProvider",
    );
  }

  return context;
}

export { MicrophoneContextProvider, useMicrophone };
