'use client';

import { createContext } from 'react';

type TooltipTriggerContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const TooltipTriggerContext = createContext<TooltipTriggerContextType>({
  open: false,
  setOpen: () => {}, // eslint-disable-line
});