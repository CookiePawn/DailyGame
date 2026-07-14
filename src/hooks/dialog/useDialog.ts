import { useAlert } from './useAlert';
import { useConfirm } from './useConfirm';

export const useDialog = () => ({ alert: useAlert(), confirm: useConfirm() });
