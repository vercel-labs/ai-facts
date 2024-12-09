import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMicrophone } from "@/app/context/MicrophoneContextProvider";
import { useEffect } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const {
    availableMicrophones,
    selectedMicrophone,
    loadAvailableMicrophones,
    selectMicrophone,
  } = useMicrophone();

  useEffect(() => {
    loadAvailableMicrophones();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <form className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="input-source">Input Source</Label>
            <Select
              value={selectedMicrophone?.deviceId || ''}
              onValueChange={selectMicrophone}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {availableMicrophones.map((mic) => (
                  <SelectItem key={mic.deviceId} value={mic.deviceId}>
                    {mic.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
