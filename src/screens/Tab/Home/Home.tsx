import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, Image, ImageBackground, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import { Assets } from '@/assets';
import { getCompanyStage } from '@/constants';
import {
  collectPassiveIncomeAtom,
  companyStageAtom,
  employeesAtom,
  equippedEmployeeIdsAtom,
  expandCompanyAtom,
  goldAtom,
  incomePerSecondAtom,
  maxTeamSizeAtom,
  PassiveIncomeResult,
  teamSynergyAtom,
  totalEarnedGoldAtom,
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

const SCENE_POSITIONS = [
  { left: '7%', top: '38%' },
  { left: '39%', top: '36%' },
  { left: '70%', top: '39%' },
  { left: '1%', top: '59%' },
  { left: '25%', top: '59%' },
  { left: '49%', top: '59%' },
  { left: '73%', top: '59%' },
  { left: '8%', top: '76%' },
  { left: '39%', top: '76%' },
  { left: '70%', top: '76%' },
] as const;

const Home = () => {
  const [gold] = useAtom(goldAtom);
  const [employees] = useAtom(employeesAtom);
  const [equippedEmployeeIds] = useAtom(equippedEmployeeIdsAtom);
  const [incomePerSecond] = useAtom(incomePerSecondAtom);
  const [teamSynergy] = useAtom(teamSynergyAtom);
  const [companyStage] = useAtom(companyStageAtom);
  const [maxTeamSize] = useAtom(maxTeamSizeAtom);
  const [totalEarnedGold] = useAtom(totalEarnedGoldAtom);
  const collectPassiveIncome = useSetAtom(collectPassiveIncomeAtom);
  const expandCompany = useSetAtom(expandCompanyAtom);
  const isCollectingRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const workPulse = useRef(new Animated.Value(0.5)).current;
  const [passiveReward, setPassiveReward] = useState<PassiveIncomeResult | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

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
  const officeBackground = companyStage.level === 1
    ? Assets.Images.Home.CAFE
    : Assets.Images.Home.OFFICE;
  const nextCompanyStage = getCompanyStage(companyStage.level + 1);
  const hasNextCompanyStage = nextCompanyStage.level !== companyStage.level;
  const meetsCompanyRequirements = hasNextCompanyStage &&
    totalEarnedGold >= nextCompanyStage.requiredTotalEarnedGold &&
    employees.length >= nextCompanyStage.requiredEmployeeCount;
  const canExpandCompany = meetsCompanyRequirements && gold >= nextCompanyStage.expansionCost;

  const onExpandCompany = async () => {
    if (!canExpandCompany || isExpanding) return;
    setIsExpanding(true);
    try {
      await expandCompany();
    } finally {
      setIsExpanding(false);
    }
  };

  return (
    <ImageBackground source={officeBackground} resizeMode="cover" style={styles.background}>
      <View style={styles.safeArea}>
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
      <View style={styles.screen}>
        <View style={styles.header}>
          <View>
            <View style={styles.goldPill}>
              <Text style={styles.coin}>●</Text>
              <Text style={styles.goldText}>{formatGold(gold)}</Text>
            </View>
            <Text style={styles.resourceText}>✦ +{formatGold(incomePerSecond)} / 초</Text>
          </View>
        </View>

        <View style={styles.sceneArea}>
          <View style={styles.projectBanner}>
            <View>
              <Text style={styles.projectBannerTitle}>{isWorking ? '팀 프로젝트 진행 중...' : '팀 프로젝트 대기 중'}</Text>
              <Text style={styles.projectBannerTime}>{isWorking ? '남은 시간 02:35:47' : '직원을 편성해 프로젝트를 시작하세요'}</Text>
            </View>
            <View style={styles.projectBannerStatus}>
              <Animated.View style={[styles.workStatusDot, { opacity: isWorking ? workPulse : 0.3 }]} />
              <Text style={styles.projectBannerStatusText}>{isWorking ? '진행 중' : '대기'}</Text>
            </View>
          </View>
          <View style={styles.sceneShade} />

          <View style={styles.sceneEmployees}>
            {equippedEmployees.map((employee, index) => {
              const image = getEmployeeImage(employee);
              return (
                <Animated.View
                  key={employee.id}
                  style={[styles.sceneWorker, SCENE_POSITIONS[index], { opacity: isWorking ? workPulse.interpolate({ inputRange: [0.45, 1], outputRange: [0.92, 1] }) : 1 }]}
                >
                  {image ? <Image source={image} style={styles.sceneWorkerImage} resizeMode="contain" /> : null}
                </Animated.View>
              );
            })}
          </View>

          {!isWorking ? (
            <View style={styles.sceneEmptyState}>
              <Text style={styles.sceneEmptyTitle}>프로젝트 팀을 편성하세요</Text>
              <Text style={styles.sceneEmptyText}>직원 관리에서 최대 {maxTeamSize}명을 장착할 수 있어요.</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.bottomHud}>
          <View style={styles.companyPanelHeader}>
            <View>
              <Text style={styles.companyPanelLabel}>회사 성장</Text>
              <Text style={styles.companyPanelTitle}>{companyStage.name}</Text>
            </View>
            <Text style={styles.companyPanelLevel}>Lv.{companyStage.level}</Text>
          </View>
          <Text style={styles.companyPanelDescription}>프로젝트 수익 +{Math.round(companyStage.incomeBonus * 100)}% · 최대 {maxTeamSize}명 편성</Text>
          <View style={styles.companyPanelDivider} />
          <View style={styles.hudInfoRow}>
            <View>
              <Text style={styles.sceneIncomeLabel}>현재 초당 수익</Text>
              <Text style={styles.sceneIncomeValue}>+{formatGold(incomePerSecond)} 골드</Text>
            </View>
            {teamSynergy ? <View style={styles.synergyBadge}><Text style={styles.synergyName}>{teamSynergy.name} +{Math.round((teamSynergy.multiplier - 1) * 100)}%</Text><Text style={styles.synergyDescription}>{teamSynergy.description}</Text></View> : null}
          </View>
          {hasNextCompanyStage ? (
            <View style={styles.companyGrowth}>
              <View style={styles.companyGrowthHeader}>
                <Text style={styles.companyGrowthStage}>다음 단계: {nextCompanyStage.name}</Text>
                <Text style={styles.companyGrowthTeam}>직원 {employees.length} / {nextCompanyStage.requiredEmployeeCount}</Text>
              </View>
              <View style={styles.growthTrack}><View style={[styles.growthFill, { width: `${Math.min(100, Math.floor(totalEarnedGold / nextCompanyStage.requiredTotalEarnedGold * 100))}%` }]} /></View>
              <Text style={styles.growthLabel}>누적 수익 {formatGold(totalEarnedGold)} / {formatGold(nextCompanyStage.requiredTotalEarnedGold)}</Text>
              <Pressable accessibilityRole="button" disabled={!canExpandCompany || isExpanding} onPress={() => void onExpandCompany()} style={[styles.expandRow, (!canExpandCompany || isExpanding) && styles.expandRowDisabled]}>
                <Text style={styles.expandRowText}>회사 확장 비용 {formatGold(nextCompanyStage.expansionCost)} 골드</Text>
                <Text style={styles.expandRowAction}>{canExpandCompany ? '확장하기' : '조건 확인'}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#17213B' },
  safeArea: { flex: 1 },
  screen: { flex: 1 },
  header: { zIndex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, paddingVertical: 10, backgroundColor: '#11192F' },
  greeting: { color: '#BFC9EB', fontSize: 10, fontWeight: '800' },
  companyName: { marginTop: 2, color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  goldPill: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  coin: { color: '#F4BF31', fontSize: 20 },
  goldText: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  resourceText: { marginTop: 3, color: '#A895EE', fontSize: 14, fontWeight: '800' },
  incomeCard: { marginTop: 20, padding: 18, borderRadius: 18, backgroundColor: '#E8EDF9' },
  incomeLabel: { color: '#5E6882', fontSize: 12, fontWeight: '800' },
  incomeValue: { marginTop: 5, color: '#202A48', fontSize: 26, fontWeight: '900' },
  incomeUnit: { fontSize: 14 },
  incomeBarTrack: { height: 6, marginTop: 14, overflow: 'hidden', borderRadius: 4, backgroundColor: '#D2D9EB' },
  incomeBarFill: { height: '100%', minWidth: 4, borderRadius: 4, backgroundColor: '#6479D7' },
  companyCard: { marginTop: 18, padding: 17, borderWidth: 1, borderColor: '#DDE1F0', borderRadius: 18, backgroundColor: '#FFFFFF' },
  companyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  companyEyebrow: { color: '#6F7892', fontSize: 11, fontWeight: '800' },
  companyTitle: { marginTop: 3, color: '#222B48', fontSize: 19, fontWeight: '900' },
  companyLevel: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, color: '#FFFFFF', fontSize: 12, fontWeight: '900', backgroundColor: '#596ED5' },
  companyBenefit: { marginTop: 8, color: '#59647D', fontSize: 12, fontWeight: '700' },
  companyDivider: { height: 1, marginVertical: 13, backgroundColor: '#E9EBF3' },
  nextCompanyTitle: { color: '#35405E', fontSize: 13, fontWeight: '900' },
  companyRequirement: { marginTop: 5, color: '#737D95', fontSize: 11, fontWeight: '700' },
  companyCost: { marginTop: 7, color: '#A46A18', fontSize: 12, fontWeight: '900' },
  companyExpandButton: { alignItems: 'center', marginTop: 12, paddingVertical: 11, borderRadius: 11, backgroundColor: '#596ED5' },
  companyExpandButtonDisabled: { backgroundColor: '#C9CEDD' },
  companyExpandButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  companyComplete: { marginTop: 12, color: '#5D6CCC', fontSize: 12, fontWeight: '900' },
  sceneArea: { position: 'relative', flex: 1, overflow: 'hidden' },
  projectBanner: { position: 'absolute', top: 0, right: 0, left: 0, zIndex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: 'rgba(22, 48, 105, 0.94)' },
  projectBannerTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  projectBannerTime: { marginTop: 3, color: '#CAD8FF', fontSize: 9, fontWeight: '700' },
  projectBannerStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: 'rgba(14, 25, 61, 0.7)' },
  projectBannerStatusText: { color: '#DDE6FF', fontSize: 9, fontWeight: '900' },
  sceneShade: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(10, 18, 42, 0.08)' },
  sceneEmployees: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 2 },
  bottomHud: { zIndex: 3, minHeight: 225, padding: 18, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: 'rgba(20, 29, 53, 0.96)' },
  companyPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  companyPanelLabel: { color: '#8F9BC0', fontSize: 10, fontWeight: '800' },
  companyPanelTitle: { marginTop: 3, color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  companyPanelLevel: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7, color: '#C9D5FF', fontSize: 11, fontWeight: '900', backgroundColor: '#29385F' },
  companyPanelDescription: { marginTop: 7, color: '#B4C0E3', fontSize: 10, fontWeight: '700' },
  companyPanelDivider: { height: 1, marginVertical: 12, backgroundColor: 'rgba(193, 205, 240, 0.2)' },
  projectSummaryRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  hudDivider: { height: 1, marginVertical: 10, backgroundColor: 'rgba(193, 205, 240, 0.2)' },
  hudInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 9 },
  expandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: '#5269D2' },
  expandRowDisabled: { backgroundColor: 'rgba(92, 105, 144, 0.7)' },
  expandRowText: { flex: 1, color: '#E8EDFF', fontSize: 10, fontWeight: '800' },
  expandRowAction: { marginLeft: 8, color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  companyGrowth: { marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: 'rgba(193, 205, 240, 0.2)' },
  companyGrowthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  companyGrowthStage: { color: '#F2F5FF', fontSize: 14, fontWeight: '900' },
  companyGrowthNext: { marginTop: 3, color: '#AAB6D9', fontSize: 10, fontWeight: '700' },
  companyGrowthTeam: { color: '#88D6A9', fontSize: 10, fontWeight: '900' },
  growthTrack: { height: 8, marginTop: 11, overflow: 'hidden', borderRadius: 5, backgroundColor: '#303C60' },
  growthFill: { height: '100%', minWidth: 3, borderRadius: 5, backgroundColor: '#57C48C' },
  growthLabel: { marginTop: 5, color: '#AAB6D9', fontSize: 10, fontWeight: '700' },
  projectScene: { position: 'relative', height: 500, marginTop: 18, overflow: 'hidden', borderRadius: 22, backgroundColor: '#202A48' },
  projectSceneImage: { borderRadius: 22 },
  sceneTopShade: { position: 'absolute', top: 0, right: 0, left: 0, height: 120, backgroundColor: 'rgba(10, 16, 35, 0.52)' },
  sceneHeader: { zIndex: 2, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', padding: 17, gap: 12 },
  projectEyebrow: { color: '#ABB8DB', fontSize: 11, fontWeight: '800' },
  projectTitle: { marginTop: 4, color: '#FFFFFF', fontSize: 19, fontWeight: '900' },
  workStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 2 },
  workStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6BE1A4' },
  workStatusText: { color: '#D9E1F9', fontSize: 10, fontWeight: '700' },
  sceneWorker: { position: 'absolute', zIndex: 1, width: '24%', alignItems: 'center' },
  sceneWorkerImage: { width: '100%', height: 72 },
  sceneWorkerName: { maxWidth: '92%', marginTop: -11, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7, backgroundColor: 'rgba(20, 29, 55, 0.82)' },
  sceneWorkerNameText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900', textAlign: 'center' },
  sceneEmptyState: { position: 'absolute', top: '43%', right: 22, left: 22, zIndex: 2, alignItems: 'center', padding: 15, borderRadius: 14, backgroundColor: 'rgba(17, 27, 52, 0.84)' },
  sceneEmptyTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '900' },
  sceneEmptyText: { marginTop: 4, color: '#D4DCF4', fontSize: 11, fontWeight: '700' },
  sceneFooter: { position: 'absolute', right: 12, bottom: 12, left: 12, zIndex: 3, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 11, borderRadius: 13, backgroundColor: 'rgba(15, 23, 45, 0.88)' },
  sceneIncomeLabel: { color: '#BFC8E5', fontSize: 10, fontWeight: '800' },
  sceneIncomeValue: { marginTop: 2, color: '#F4D05A', fontSize: 16, fontWeight: '900' },
  synergyBadge: { maxWidth: '55%', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: '#46568B' },
  synergyName: { color: '#8DEABC', fontSize: 12, fontWeight: '900' },
  synergyDescription: { marginTop: 2, color: '#D3DCF7', fontSize: 10, fontWeight: '700' },
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
