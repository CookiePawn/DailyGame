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
import {
  EMPLOYEE_STAT_LABELS,
  EMPLOYEE_TEMPLATES,
  FREE_RECRUIT_COOLDOWN_MS,
  GRADE_COLORS,
  RECRUITMENT_METHODS,
} from '@/constants';
import {
  goldAtom,
  lastFreeRecruitAtAtom,
  recruitEmployeeAtom,
  totalEarnedGoldAtom,
  totalRecruitCountAtom,
} from '@/lib/jotai';
import { Employee, EmployeeStatKey, RecruitmentMethod } from '@/models';

const STAT_KEYS: EmployeeStatKey[] = [
  'workSkill',
  'creativity',
  'diligence',
  'teamwork',
  'leadership',
  'luck',
];

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
  const recruitEmployee = useSetAtom(recruitEmployeeAtom);
  const [result, setResult] = useState<Employee | null>(null);
  const [resultMethod, setResultMethod] = useState<RecruitmentMethod | null>(null);
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

  const onRecruit = (method: RecruitmentMethod) => {
    const employee = recruitEmployee(method);
    if (employee) {
      setResult(employee);
      setResultMethod(method);
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
          <View style={styles.silhouette}>
            <Text style={styles.questionMark}>?</Text>
          </View>
          <Text style={styles.recruitHint}>어떤 직원이 합류할까요?</Text>

          <View style={styles.methodList}>
            {(Object.keys(RECRUITMENT_METHODS) as RecruitmentMethod[]).map(method => {
              const recruitmentMethod = RECRUITMENT_METHODS[method];
              const isUnlocked =
                totalRecruitCount >= recruitmentMethod.requiredRecruitCount &&
                totalEarnedGold >= recruitmentMethod.requiredEarnedGold;
              const isAvailable = recruitmentMethod.isFree
                ? isFreeRecruitAvailable
                : gold >= recruitmentMethod.cost;
              const isDisabled = !isUnlocked || !isAvailable;
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
                    styles.methodCard,
                    method === 'experienced-hire' && styles.experiencedCard,
                    method === 'headhunting' && styles.headhuntingCard,
                    (isDisabled || pressed) && styles.disabledButton,
                  ]}
                >
                  <View style={styles.methodTextContainer}>
                    <Text style={styles.methodName}>{isUnlocked ? recruitmentMethod.name : `${recruitmentMethod.name} LOCK`}</Text>
                    <Text style={styles.methodDescription}>{recruitmentMethod.description}</Text>
                    {isUnlocked ? (
                      <Text style={styles.methodRange}>스탯 범위 {recruitmentMethod.minStat}~{recruitmentMethod.maxStat}</Text>
                    ) : (
                      unlockRequirements.map(requirement => (
                        <Text key={requirement} style={styles.lockRequirement}>{requirement}</Text>
                      ))
                    )}
                  </View>
                  <View style={styles.costPill}>
                    <Text style={styles.costText}>
                      {recruitmentMethod.isFree ? freeRecruitLabel : `● ${formatGold(recruitmentMethod.cost)}`}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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
              <View style={styles.statsGrid}>
                {STAT_KEYS.map(statKey => (
                  <View key={statKey} style={styles.statItem}>
                    <Text style={styles.statLabel}>{EMPLOYEE_STAT_LABELS[statKey]}</Text>
                    <Text style={styles.statValue}>{result.stats[statKey]}</Text>
                  </View>
                ))}
              </View>
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
    padding: 22,
    borderWidth: 1,
    borderColor: '#D7C6AF',
    borderRadius: 24,
    backgroundColor: '#FFF9F0',
  },
  silhouette: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 152,
    height: 152,
    borderRadius: 76,
    backgroundColor: '#5B5147',
  },
  questionMark: { color: '#FFF9F0', fontSize: 82, fontWeight: '800' },
  recruitHint: { marginTop: 14, color: '#554A40', fontSize: 16, fontWeight: '700' },
  methodList: { width: '100%', gap: 9, marginTop: 20 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#354D70',
  },
  experiencedCard: { backgroundColor: '#7A5A99' },
  headhuntingCard: { backgroundColor: '#8A5A26' },
  methodTextContainer: { flex: 1 },
  methodName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  methodDescription: { marginTop: 3, color: '#E9E2D9', fontSize: 11, lineHeight: 16 },
  methodRange: { marginTop: 5, color: '#FFE4A2', fontSize: 12, fontWeight: '700' },
  lockRequirement: { marginTop: 4, color: '#FFE4A2', fontSize: 11, fontWeight: '700' },
  costPill: { alignItems: 'center', justifyContent: 'center', minWidth: 80, paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10, backgroundColor: '#FFF4DC' },
  costText: { color: '#392B13', fontSize: 12, fontWeight: '900', textAlign: 'center' },
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginTop: 16, gap: 8 },
  statItem: {
    width: '31.5%',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F7F0E5',
  },
  statLabel: { color: '#766B61', fontSize: 12 },
  statValue: { marginTop: 2, color: '#29231F', fontSize: 18, fontWeight: '800' },
  gradeHint: { marginTop: 10, color: '#827568', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  emptyResult: {
    marginTop: 28,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#EFE3D3',
  },
  emptyResultText: { color: '#766B61', fontSize: 14, lineHeight: 20, textAlign: 'center' },
});

export default Recruit;
