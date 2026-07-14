import { Dimensions } from 'react-native';
import { atom, useAtom, useAtomValue, useSetAtom } from 'jotai';

const dimensionsAtom = atom({
  window: Dimensions.get('window'),
  screen: Dimensions.get('screen'),
});

export const useDimensions = () => useAtom(dimensionsAtom);
export const useDimensionsValue = () => useAtomValue(dimensionsAtom);
export const useSetDimensions = () => useSetAtom(dimensionsAtom);
