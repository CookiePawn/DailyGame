import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import LottieView from 'lottie-react-native';
import { Animation_View, EmployeeStatRadar } from '@/components';
import { Assets } from '@/assets';
import {
  EMPLOYEE_TEMPLATES,
  FREE_RECRUIT_COOLDOWN_MS,
  GRADE_COLORS,
  RECRUITMENT_METHODS,
} from '@/constants';
import {
  goldAtom,
  lastFreeRecruitAtAtom,
  recruitEmployeesAtom,
  totalEarnedGoldAtom,
  totalRecruitCountAtom,
} from '@/lib/jotai';
import { AnimationType, Employee, RecruitmentMethod } from '@/models';

type PaidRecruitmentMethod = Exclude<RecruitmentMethod, 'job-posting'>;
type RecruitAnimationPhase = 'idle' | 'signature' | 'result';

const PAID_METHODS: PaidRecruitmentMethod[] = [
  'open-recruitment',
  'experienced-hire',
  'headhunting',
];

const DRAW_IMAGES: Record<PaidRecruitmentMethod, number> = {
  'open-recruitment': Assets.Images.Draw.DRAW_LV1,
  'experienced-hire': Assets.Images.Draw.DRAW_LV2,
  headhunting: Assets.Images.Draw.DRAW_LV3,
};

const formatGold = (value: number) => value.toLocaleString('ko-KR');

const getFreeRecruitLabel = (lastFreeRecruitAt: number | null, now: number) => {
  if (lastFreeRecruitAt === null) return '무료 채용';

  const remaining = FREE_RECRUIT_COOLDOWN_MS - (now - lastFreeRecruitAt);
  if (remaining <= 0) return '무료 채용';

  const minutes = Math.ceil(remaining / 60_000);
  return `${minutes}분 후 무료`;
};

const Recruit = () => {
  const [gold] = useAtom(goldAtom);
  const [totalRecruitCount] = useAtom(totalRecruitCountAtom);
  const [lastFreeRecruitAt] = useAtom(lastFreeRecruitAtAtom);
  const [totalEarnedGold] = useAtom(totalEarnedGoldAtom);
  const recruitEmployees = useSetAtom(recruitEmployeesAtom);
  const [result, setResult] = useState<Employee | null>(null);
  const [resultMethod, setResultMethod] = useState<RecruitmentMethod | null>(null);
  const [isRecruiting, setIsRecruiting] = useState(false);
  const [recruitAnimationPhase, setRecruitAnimationPhase] = useState<RecruitAnimationPhase>('idle');
  const [recruitAnimationKey, setRecruitAnimationKey] = useState(0);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const resultImage = useMemo(
    () => EMPLOYEE_TEMPLATES.find(template => template.id === result?.templateId)?.image,
    [result],
  );
  const freeRecruitLabel = getFreeRecruitLabel(lastFreeRecruitAt, now);
  const isFreeRecruitAvailable = freeRecruitLabel === '무료 채용';

  const onRecruit = async (method: RecruitmentMethod, count = 1) => {
    if (isRecruiting) return;

    setIsRecruiting(true);
    try {
      const employees = await recruitEmployees({ method, count });
      if (employees?.[0]) {
        setResult(employees[0]);
        setResultMethod(method);
        setRecruitAnimationKey(currentKey => currentKey + 1);
        setRecruitAnimationPhase('signature');
      }
    } catch (error) {
      console.error('직원 채용을 저장하지 못했습니다.', error);
    } finally {
      setIsRecruiting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.goldPill}>
          <Text style={styles.coin}>●</Text>
          <Text style={styles.goldText}>{formatGold(gold)}</Text>
        </View>

        <Text style={styles.title}>직원 채용</Text>
          <Text style={styles.subtitle}>채용 방법에 따라 더 좋은 육각형 스탯을 기대할 수 있어요.</Text>

        <View style={styles.recruitCard}>
          <Text style={styles.recruitHint}>어떤 방식으로 인재를 채용할까요?</Text>

          <View style={styles.drawCardList}>
            {PAID_METHODS.map(method => {
              const recruitmentMethod = RECRUITMENT_METHODS[method];
              const isUnlocked =
                totalRecruitCount >= recruitmentMethod.requiredRecruitCount &&
                totalEarnedGold >= recruitmentMethod.requiredEarnedGold;
              const isAvailable = gold >= recruitmentMethod.cost;
              const isDisabled = !isUnlocked || !isAvailable || isRecruiting;
              const unlockRequirements = [
                recruitmentMethod.requiredRecruitCount > 0
                  ? `누적 채용 ${totalRecruitCount} / ${recruitmentMethod.requiredRecruitCount}회`
                  : null,
                recruitmentMethod.requiredEarnedGold > 0
                  ? `누적 수익 ${formatGold(totalEarnedGold)} / ${formatGold(recruitmentMethod.requiredEarnedGold)}`
                  : null,
              ].filter(Boolean);

              return (
                <Pressable
                  key={method}
                  accessibilityRole="button"
                  disabled={isDisabled}
                  onPress={() => onRecruit(method)}
                  style={({ pressed }) => [
                    styles.drawCard,
                    method === 'experienced-hire' && styles.experiencedDrawCard,
                    method === 'headhunting' && styles.headhuntingDrawCard,
                    (isDisabled || pressed) && styles.disabledButton,
                  ]}
                >
                  <Text numberOfLines={1} style={styles.methodName}>{isUnlocked ? recruitmentMethod.name : 'LOCK'}</Text>
                  <Text numberOfLines={2} style={styles.methodDescription}>{recruitmentMethod.description}</Text>
                  <Image source={DRAW_IMAGES[method]} style={styles.drawImage} resizeMode="contain" />
                  {isUnlocked ? (
                    <Text style={styles.methodRange}>스탯 {recruitmentMethod.minStat}~{recruitmentMethod.maxStat}</Text>
                  ) : (
                    <View style={styles.lockTextContainer}>
                      {unlockRequirements.map(requirement => (
                        <Text key={requirement} numberOfLines={2} style={styles.lockRequirement}>{requirement}</Text>
                      ))}
                    </View>
                  )}
                  <View style={styles.costPill}>
                    <Text style={styles.costText}>● {formatGold(recruitmentMethod.cost)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.bottomRecruitActions}>
            <Pressable
              accessibilityRole="button"
              disabled={!isFreeRecruitAvailable || isRecruiting}
              onPress={() => onRecruit('job-posting')}
              style={({ pressed }) => [
                styles.freeRecruitButton,
                (!isFreeRecruitAvailable || isRecruiting || pressed) && styles.disabledButton,
              ]}
            >
              <Text style={styles.freeRecruitButtonText}>{freeRecruitLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              disabled={gold < RECRUITMENT_METHODS['open-recruitment'].cost * 9 || isRecruiting}
              onPress={() => onRecruit('open-recruitment', 10)}
              style={({ pressed }) => [
                styles.tenRecruitButton,
                (gold < RECRUITMENT_METHODS['open-recruitment'].cost * 9 || isRecruiting || pressed) && styles.disabledButton,
              ]}
            >
              <Text style={styles.tenRecruitButtonTitle}>10회 공개 채용</Text>
              <Text style={styles.tenRecruitButtonCost}>● {formatGold(RECRUITMENT_METHODS['open-recruitment'].cost * 9)} · 10% 할인</Text>
            </Pressable>
          </View>
        </View>

        {result ? (
          <View style={styles.resultSection}>
            <Text style={styles.sectionTitle}>{resultMethod ? `${RECRUITMENT_METHODS[resultMethod].name} 결과` : '채용 결과'}</Text>
            <View style={styles.resultCard}>
              <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[result.grade] }]}>
                <Text style={styles.gradeText}>{result.grade}</Text>
              </View>
              {resultImage ? <Image source={resultImage} style={styles.characterImage} resizeMode="contain" /> : null}
              <Text style={styles.employeeName}>{result.name}</Text>
              <Text style={styles.employeeJob}>{result.job}</Text>
              <View style={styles.workValue}>
                <Text style={styles.workValueLabel}>업무 기여도</Text>
                <Text style={styles.workValueNumber}>{result.workValue}</Text>
              </View>
              <EmployeeStatRadar stats={result.stats} size={210} />
            </View>
            <Text style={styles.gradeHint}>
              등급은 육각형 스탯의 가중 평균으로 결정됩니다. 모든 스탯이 100이면 SSS+입니다.
            </Text>
          </View>
        ) : (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyResultText}>채용하면 직원의 육각형 스탯과 등급을 확인할 수 있어요.</Text>
          </View>
        )}
      </ScrollView>

      {recruitAnimationPhase === 'signature' ? (
        <View style={styles.signatureOverlay}>
          <LottieView
            key={`signature-${recruitAnimationKey}`}
            autoPlay
            loop={false}
            source={Assets.Lotties.SIGN}
            style={styles.signatureLottie}
            onAnimationFinish={() => setRecruitAnimationPhase('result')}
          />
        </View>
      ) : null}

      {recruitAnimationPhase === 'result' && result ? (
        <View style={styles.resultOverlay}>
          <View pointerEvents="none" style={styles.confettiLayer}>
            <LottieView
              key={`confetti-${recruitAnimationKey}`}
              autoPlay
              loop={false}
              source={Assets.Lotties.CONFETTI}
              style={styles.confettiLottie}
            />
          </View>
          <Animation_View animation={AnimationType.FADE_IN} endTiming={400} style={styles.resultAnimationContainer}>
            <View style={styles.resultRevealCard}>
              <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[result.grade] }]}>
                <Text style={styles.gradeText}>{result.grade}</Text>
              </View>
              {resultImage ? <Image source={resultImage} style={styles.revealCharacterImage} resizeMode="contain" /> : null}
              <Text style={styles.revealName}>{result.name}</Text>
              <Text style={styles.employeeJob}>{result.job}</Text>
              <View style={styles.workValue}>
                <Text style={styles.workValueLabel}>업무 기여도</Text>
                <Text style={styles.workValueNumber}>{result.workValue}</Text>
              </View>
              <EmployeeStatRadar stats={result.stats} size={220} />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setRecruitAnimationPhase('idle')}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>확인</Text>
            </Pressable>
          </Animation_View>
        </View>
      ) : null}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F0E5' },
  container: { padding: 20, paddingBottom: 36 },
  goldPill: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#3D342B',
  },
  coin: { color: '#F7C749', fontSize: 16 },
  goldText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  title: { marginTop: 22, color: '#29231F', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 6, color: '#766B61', fontSize: 14 },
  recruitCard: {
    alignItems: 'center',
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D7C6AF',
    borderRadius: 18,
    backgroundColor: '#FFF9F0',
  },
  recruitHint: { color: '#554A40', fontSize: 16, fontWeight: '800' },
  drawCardList: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 14 },
  drawCard: {
    flex: 1,
    alignItems: 'center',
    minHeight: 250,
    padding: 8,
    borderWidth: 1,
    borderColor: '#D2C1AC',
    borderRadius: 11,
    backgroundColor: '#F4EFE6',
  },
  experiencedDrawCard: { backgroundColor: '#F1EEE9' },
  headhuntingDrawCard: { borderColor: '#D6B16C', backgroundColor: '#F8ECD0' },
  methodName: { width: '100%', color: '#342C25', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  methodDescription: { width: '100%', minHeight: 30, marginTop: 4, color: '#786C60', fontSize: 9, lineHeight: 13, textAlign: 'center' },
  drawImage: { width: '100%', height: 118, marginVertical: 2 },
  methodRange: { color: '#8D6628', fontSize: 9, fontWeight: '800', textAlign: 'center' },
  lockTextContainer: { minHeight: 24, justifyContent: 'center' },
  lockRequirement: { color: '#A44D3A', fontSize: 8, fontWeight: '800', lineHeight: 11, textAlign: 'center' },
  costPill: { alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 7, paddingVertical: 7, borderRadius: 8, backgroundColor: '#D4B27A' },
  costText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  bottomRecruitActions: { flexDirection: 'row', width: '100%', gap: 8, marginTop: 12 },
  freeRecruitButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 50, borderWidth: 1, borderColor: '#9B8B76', borderRadius: 10, backgroundColor: '#F5F1E8' },
  freeRecruitButtonText: { color: '#3B332B', fontSize: 13, fontWeight: '900' },
  tenRecruitButton: { flex: 1.45, alignItems: 'center', justifyContent: 'center', minHeight: 50, borderWidth: 1, borderColor: '#A9782C', borderRadius: 10, backgroundColor: '#E5B953' },
  tenRecruitButtonTitle: { color: '#392B13', fontSize: 14, fontWeight: '900' },
  tenRecruitButtonCost: { marginTop: 2, color: '#674615', fontSize: 10, fontWeight: '700' },
  disabledButton: { opacity: 0.45 },
  resultSection: { marginTop: 28 },
  sectionTitle: { color: '#29231F', fontSize: 20, fontWeight: '800' },
  resultCard: {
    position: 'relative',
    alignItems: 'center',
    marginTop: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D7C6AF',
    borderRadius: 24,
    backgroundColor: '#FFF9F0',
  },
  gradeBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    minWidth: 46,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  characterImage: { width: 148, height: 148 },
  employeeName: { color: '#29231F', fontSize: 24, fontWeight: '800' },
  employeeJob: { marginTop: 3, color: '#766B61', fontSize: 14 },
  workValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 7,
    marginTop: 16,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F1E6D7',
  },
  workValueLabel: { color: '#62574C', fontSize: 13, fontWeight: '700' },
  workValueNumber: { color: '#9A6512', fontSize: 22, fontWeight: '900' },
  gradeHint: { marginTop: 10, color: '#827568', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyResult: {
    marginTop: 28,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#EFE3D3',
  },
  emptyResultText: { color: '#766B61', fontSize: 14, lineHeight: 20, textAlign: 'center' },
  signatureOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    backgroundColor: '#FFFFFF',
  },
  signatureLottie: { width: 260, height: 260 },
  resultOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    padding: 24,
    backgroundColor: '#FFFDF8',
  },
  confettiLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 1 },
  confettiLottie: { width: '100%', height: '100%' },
  resultAnimationContainer: { alignItems: 'center', width: '100%', zIndex: 2 },
  resultRevealCard: {
    position: 'relative',
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D7C6AF',
    borderRadius: 24,
    backgroundColor: '#FFF9F0',
  },
  revealCharacterImage: { width: 174, height: 174 },
  revealName: { color: '#29231F', fontSize: 27, fontWeight: '800' },
  confirmButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
    height: 52,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#354D70',
  },
  confirmButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
});

export default Recruit;
