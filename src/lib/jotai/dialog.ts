import { ReactNode } from 'react';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

export type DialogState = {
  title?: ReactNode;
  message?: ReactNode;
  onOK: () => void;
  onCancel?: () => void;
  onDismiss: () => void;
  dismissable: boolean;
  altOK?: string;
  altCancel?: string;
};

const dialogStateAtom = atom<DialogState | null>(null);

export const useDialogState = () => useAtom(dialogStateAtom);
export const useSetDialogState = () => useSetAtom(dialogStateAtom);
export const useDialogStateValue = () => useAtomValue(dialogStateAtom);
