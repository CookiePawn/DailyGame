import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import { Assets } from '@/assets';
import {
  collectPassiveIncomeAtom,
  employeesAtom,
  equippedEmployeeIdsAtom,
  goldAtom,
  incomePerSecondAtom,
  PassiveIncomeResult,
} from '@/lib/jotai';
import { Employee } from '@/models';

const formatGold = (value: number) => value.toLocaleString('ko-KR');

const formatElapsedTime = (elapsedSeconds: number) => {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  const seconds = elapsedSeconds % 60;

  if (hours > 0) return `${hours}시간${minutes > 0 ? ` ${minutes}분` : ''}`;
  if (minutes > 0) return `${minutes}분`;
  return `${seconds}초`;
};

const getEmployeeImage = (employee: Employee) =>
  Assets.Images.Characters[employee.templateId
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof Assets.Images.Characters];

const Home = () => {
  const [gold] = useAtom(goldAtom);
  const [employees] = useAtom(employeesAtom);
  const [equippedEmployeeIds] = useAtom(equippedEmployeeIdsAtom);
  const [incomePerSecond] = useAtom(incomePerSecondAtom);
  const collectPassiveIncome = useSetAtom(collectPassiveIncomeAtom);
  const isCollectingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const workPulse = useRef(new Animated.Value(0.5)).current;
  const [passiveReward, setPassiveReward] = useState<PassiveIncomeResult | null>(null);

  const equippedEmployees = useMemo(
    () => equippedEmployeeIds
      .map(employeeId => employees.find(employee => employee.id === employeeId))
      .filter((employee): employee is Employee => employee !== undefined),
    [employees, equippedEmployeeIds],
  );

  const collect = useCallback(async (showReward: boolean) => {
      if (isCollectingRef.current) return;

      isCollectingRef.current = true;
      try {
        const result = await collectPassiveIncome();
        if (showReward && result.amount > 0 && result.elapsedSeconds > 0) {
          setPassiveReward(result);
        }
      } finally {
        isCollectingRef.current = false;
      }
  }, [collectPassiveIncome]);

  useEffect(() => {
    void collect(true);
    const interval = setInterval(() => void collect(false), 1000);
    return () => clearInterval(interval);
  }, [collect]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      const returningFromBackground = /inactive|background/.test(appStateRef.current) && nextAppState === 'active';
      appStateRef.current = nextAppState;

      if (returningFromBackground) void collect(true);
    });

    return () => subscription.remove();
  }, [collect]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(workPulse, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(workPulse, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [workPulse]);

  const isWorking = equippedEmployees.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Modal
        animationType="fade"
        transparent
        visible={passiveReward !== null}
        onRequestClose={() => setPassiveReward(null)}
      >
        <View style={styles.rewardOverlay}>
          <View style={styles.rewardModal}>
            <Text style={styles.rewardEyebrow}>자동 프로젝트 정산</Text>
            <Text style={styles.rewardTitle}>직원들이 프로젝트를 완료했어요!</Text>
            <Text style={styles.rewardDuration}>
              {passiveReward ? `${formatElapsedTime(passiveReward.elapsedSeconds)} 동안 열심히 일했어요.` : ''}
            </Text>
            <View style={styles.rewardAmountBox}>
              <Text style={styles.rewardAmountLabel}>획득 골드</Text>
              <Text style={styles.rewardAmount}>+ {formatGold(passiveReward?.amount ?? 0)}</Text>
            </View>
            <Pressable style={styles.rewardButton} onPress={() => setPassiveReward(null)}>
              <Text style={styles.rewardButtonText}>확인</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>사장님, 오늘도 화이팅!</Text>
            <Text style={styles.companyName}>채용왕 컴퍼니</Text>
          </View>
          <View style={styles.goldPill}>
            <Text style={styles.coin}>●</Text>
            <Text style={styles.goldText}>{formatGold(gold)}</Text>
          </View>
        </View>

        <View style={styles.incomeCard}>
          <Text style={styles.incomeLabel}>현재 초당 수익</Text>
          <Text style={styles.incomeValue}>+ {formatGold(incomePerSecond)} <Text style={styles.incomeUnit}>골드 / 초</Text></Text>
          <View style={styles.incomeBarTrack}>
            <View style={[styles.incomeBarFill, { width: `${Math.min(100, incomePerSecond)}%` }]} />
          </View>
        </View>

        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <View>
              <Text style={styles.projectEyebrow}>자동 프로젝트</Text>
              <Text style={styles.projectTitle}>{isWorking ? '신규 서비스 출시 프로젝트' : '프로젝트 대기 중'}</Text>
            </View>
            <View style={styles.workStatus}>
              <Animated.View style={[styles.workStatusDot, { opacity: isWorking ? workPulse : 0.3 }]} />
              <Text style={styles.workStatusText}>{isWorking ? '업무 진행 중' : '직원 장착 필요'}</Text>
            </View>
          </View>

          <Text style={styles.projectDescription}>
            {isWorking
              ? '장착한 직원들이 각자의 역량으로 프로젝트를 진행하고 있어요.'
              : '직원 관리에서 프로젝트에 투입할 직원을 최대 3명 장착하세요.'}
          </Text>

          <View style={styles.teamArea}>
            {equippedEmployees.length > 0 ? equippedEmployees.map(employee => {
              const image = getEmployeeImage(employee);
              return (
                <View key={employee.id} style={styles.workerCard}>
                  {image ? <Image source={image} style={styles.workerImage} resizeMode="contain" /> : null}
                  <View style={styles.workerTextArea}>
                    <Text numberOfLines={1} style={styles.workerName}>{employee.name}</Text>
                    <Text numberOfLines={1} style={styles.workerJob}>{employee.job}</Text>
                  </View>
                  <Animated.View style={[styles.workSpark, { opacity: workPulse }]} />
                </View>
              );
            }) : (
              <View style={styles.waitingTeam}>
                <Text style={styles.waitingTeamText}>장착된 직원이 없습니다.</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipTitle}>프로젝트 수익 안내</Text>
          <Text style={styles.tipText}>장착 직원의 업무 기여도가 높을수록 초당 수익이 증가합니다.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F4F5FC' },
  container: { padding: 20, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { color: '#59627A', fontSize: 12, fontWeight: '700' },
  companyName: { marginTop: 3, color: '#1D2742', fontSize: 22, fontWeight: '900' },
  goldPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 16, backgroundColor: '#202A48' },
  coin: { color: '#F4BF31', fontSize: 15 },
  goldText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  incomeCard: { marginTop: 20, padding: 18, borderRadius: 18, backgroundColor: '#E8EDF9' },
  incomeLabel: { color: '#5E6882', fontSize: 12, fontWeight: '800' },
  incomeValue: { marginTop: 5, color: '#202A48', fontSize: 26, fontWeight: '900' },
  incomeUnit: { fontSize: 14 },
  incomeBarTrack: { height: 6, marginTop: 14, overflow: 'hidden', borderRadius: 4, backgroundColor: '#D2D9EB' },
  incomeBarFill: { height: '100%', minWidth: 4, borderRadius: 4, backgroundColor: '#6479D7' },
  projectCard: { marginTop: 18, padding: 18, borderRadius: 22, backgroundColor: '#202A48' },
  projectHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  projectEyebrow: { color: '#ABB8DB', fontSize: 11, fontWeight: '800' },
  projectTitle: { marginTop: 4, color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  workStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2 },
  workStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6BE1A4' },
  workStatusText: { color: '#D9E1F9', fontSize: 10, fontWeight: '700' },
  projectDescription: { marginTop: 10, color: '#C7D0EB', fontSize: 12, lineHeight: 18 },
  teamArea: { marginTop: 16, gap: 8 },
  workerCard: { position: 'relative', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', minHeight: 64, paddingHorizontal: 10, borderRadius: 12, backgroundColor: '#303C60' },
  workerImage: { width: 54, height: 58 },
  workerTextArea: { marginLeft: 8 },
  workerName: { maxWidth: 140, color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  workerJob: { marginTop: 2, color: '#B9C7E9', fontSize: 11, fontWeight: '700' },
  workSpark: { position: 'absolute', top: 13, right: 14, width: 7, height: 7, borderRadius: 4, backgroundColor: '#6BE1A4' },
  waitingTeam: { alignItems: 'center', justifyContent: 'center', minHeight: 86, borderWidth: 1, borderStyle: 'dashed', borderColor: '#66749B', borderRadius: 12 },
  waitingTeamText: { color: '#B7C3E2', fontSize: 12, fontWeight: '700' },
  tipCard: { marginTop: 18, padding: 16, borderWidth: 1, borderColor: '#E0E3EE', borderRadius: 16, backgroundColor: '#FFFFFF' },
  tipTitle: { color: '#3C4660', fontSize: 14, fontWeight: '900' },
  tipText: { marginTop: 6, color: '#768098', fontSize: 12, lineHeight: 18 },
  rewardOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: 'rgba(15, 23, 45, 0.58)' },
  rewardModal: { width: '100%', maxWidth: 360, alignItems: 'center', padding: 25, borderRadius: 24, backgroundColor: '#FFFFFF' },
  rewardEyebrow: { color: '#6678D7', fontSize: 12, fontWeight: '900' },
  rewardTitle: { marginTop: 7, color: '#202A48', fontSize: 19, fontWeight: '900' },
  rewardDuration: { marginTop: 8, color: '#6F7890', fontSize: 13, fontWeight: '700' },
  rewardAmountBox: { width: '100%', alignItems: 'center', marginTop: 20, paddingVertical: 17, borderRadius: 15, backgroundColor: '#F1F4FF' },
  rewardAmountLabel: { color: '#6A748D', fontSize: 12, fontWeight: '800' },
  rewardAmount: { marginTop: 4, color: '#5369D6', fontSize: 25, fontWeight: '900' },
  rewardButton: { width: '100%', alignItems: 'center', marginTop: 18, paddingVertical: 14, borderRadius: 13, backgroundColor: '#5369D6' },
  rewardButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
});

export default Home;
