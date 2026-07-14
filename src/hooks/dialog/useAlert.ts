import { ReactNode } from 'react';
import { useSetDialogState } from '@/lib';

export const useAlert = () => {
  const setDialogState = useSetDialogState();

  return (
    title?: ReactNode,
    message?: ReactNode,
    options?: {
      altOK?: string;
      /** @default true */
      dismissable?: boolean;
    },
  ) => {
    return new Promise<void>(resolve => {
      setDialogState({
        title,
        message,
        onOK: resolve,
        onDismiss: resolve,
        dismissable: options?.dismissable !== undefined ? options.dismissable : true,
        altOK: options?.altOK,
      });
    });
  };
};
