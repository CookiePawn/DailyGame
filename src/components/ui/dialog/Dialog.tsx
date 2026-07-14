import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, TouchableOpacity } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useDialogState, useDimensionsValue } from '@/lib';
import { colors } from '@/styles';
import { Typography } from '@/components';

const Alert: React.FC = () => {
  const { window } = useDimensionsValue();

  const [dialogState, setDialogState] = useDialogState();
  const [state, setState] = useState(dialogState);

  const isVisible = Boolean(dialogState);

  const containerStyle = useAnimatedStyle(() => ({ opacity: withTiming(isVisible ? 1 : 0, { duration: 125 }) }), [isVisible]);

  const onPressOutside = () => {
    if (!dialogState || !dialogState.dismissable) return;

    dialogState.onDismiss();
    setDialogState(null);
  };

  const onOK = () => {
    dialogState?.onOK();
    setDialogState(null);
  };

  const onCancel = () => {
    dialogState?.onCancel?.();
    setDialogState(null);
  };

  useLayoutEffect(() => {
    if (!dialogState) return;

    setState(dialogState);
  }, [dialogState]);

  return (
    <Animated.View pointerEvents={isVisible ? 'box-none' : 'none'} style={[styles.absolute, containerStyle]}>
      <TouchableWithoutFeedback onPress={onPressOutside}>
        <View style={styles.innerContainer}>
          <View style={styles.dim} />
          <TouchableWithoutFeedback onPress={() => null}>
            <View style={[styles.contentContainer, { width: Math.min(window.width - 32, 480) }]}>
              {typeof state?.title === 'string' && <Typography style={styles.title}>{state.title}</Typography>}
              {typeof state?.message === 'string' && <Typography style={[styles.message, !!state.title && { marginTop: 12 }]}>{state.message}</Typography>}
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={onOK} activeOpacity={0.8} style={styles.buttonInnerContainer}>
                  <TouchableOpacity style={[styles.button, { backgroundColor: colors.neutral800 }]} disabled={true}>
                    <Typography style={{ color: colors.white }}>{state?.altOK || '확인'}</Typography>
                  </TouchableOpacity>
                </TouchableOpacity>
                {!!state?.onCancel && (
                  <TouchableOpacity onPress={onCancel} activeOpacity={0.8} style={styles.buttonInnerContainer}>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.neutral200 }]} disabled={true}>
                      <Typography style={{ color: colors.white }}>{state?.altCancel || '취소'}</Typography>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  absolute: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 9999,
  },
  innerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dim: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.neutral800,
    opacity: 0.5,
  },
  contentContainer: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  buttonInnerContainer: {
    flex: 1,
  },
  button: {
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    height: 45,
  },
});

export default Alert;
