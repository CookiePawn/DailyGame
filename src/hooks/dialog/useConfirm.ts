import { ReactNode } from 'react';
import { useSetDialogState } from '@/lib';

export const useConfirm = () => {
  const setDialogState = useSetDialogState();

  return (
    title?: ReactNode,
    message?: ReactNode,
    options?: {
      altOK?: string;
      altCancel?: string;
      /** @default true */
      dismissable?: boolean;
    },
  ) => {
    return new Promise<boolean>(resolve => {
      setDialogState({
        title,
        message,
        onOK: () => resolve(true),
        onCancel: () => resolve(false),
        onDismiss: () => resolve(false),
        dismissable: options?.dismissable !== undefined ? options.dismissable : true,
        altOK: options?.altOK,
        altCancel: options?.altCancel,
      });
    });
  };
};
