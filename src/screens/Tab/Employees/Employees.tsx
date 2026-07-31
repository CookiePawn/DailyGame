import { useMemo, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAtom, useSetAtom } from 'jotai';
import { EmployeeStatRadar } from '@/components';
import { EMPLOYEE_TEMPLATES, GRADE_COLORS } from '@/constants';
import {
  employeesAtom,
  equippedEmployeeIdsAtom,
  goldAtom,
  incomePerSecondAtom,
  maxTeamSizeAtom,
  teamSynergyAtom,
  toggleEquippedEmployeeAtom,
} from '@/lib/jotai';
import { Employee } from '@/models';

type SortMode = 'grade' | 'workValue';

const GRADE_ORDER = { D: 0, C: 1, B: 2, A: 3, S: 4, SS: 5, SSS: 6, 'SSS+': 7 };

const getEmployeeImage = (employee: Employee) =>
  EMPLOYEE_TEMPLATES.find(template => template.id === employee.templateId)?.image;

type TeamMemberCardProps = {
  employee: Employee;
  slot: number;
  isUpdating: boolean;
  onDetail: (employee: Employee) => void;
  onRemove: (employeeId: string) => void;
};

const TeamMemberCard = ({ employee, slot, isUpdating, onDetail, onRemove }: TeamMemberCardProps) => {
  const image = getEmployeeImage(employee);

  return (
    <View style={styles.teamMemberCard}>
      <View style={styles.slotBadge}><Text style={styles.slotBadgeText}>{slot}</Text></View>
      <Pressable accessibilityRole="button" onPress={() => onRemove(employee.id)} style={styles.removeButton}>
        <Text style={styles.removeButtonText}>×</Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={() => onDetail(employee)} style={styles.teamMemberContent}>
        {image ? <Image source={image} style={styles.teamMemberImage} resizeMode="contain" /> : null}
        <Text numberOfLines={1} style={styles.teamMemberName}>{employee.name}</Text>
        <View style={styles.teamMemberJobRow}>
          <Text numberOfLines={1} style={styles.teamMemberJob}>{employee.job}</Text>
          {slot === 1 ? <Text style={styles.leaderBadge}>리더</Text> : null}
        </View>
      </Pressable>
      {isUpdating ? <View style={styles.updatingOverlay} /> : null}
    </View>
  );
};

type OwnedEmployeeCardProps = {
  employee: Employee;
  isUpdating: boolean;
  onDetail: (employee: Employee) => void;
  onSelect: (employeeId: string) => void;
};

const OwnedEmployeeCard = ({ employee, isUpdating, onDetail, onSelect }: OwnedEmployeeCardProps) => {
  const image = getEmployeeImage(employee);

  return (
    <View style={styles.ownedEmployeeCard}>
      <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[employee.grade] }]}>
        <Text style={styles.gradeText}>{employee.grade}</Text>
      </View>
      <Text style={styles.favoriteIcon}>☆</Text>
      <Pressable accessibilityRole="button" onPress={() => onDetail(employee)} style={styles.ownedEmployeeContent}>
        {image ? <Image source={image} style={styles.ownedEmployeeImage} resizeMode="contain" /> : null}
        <Text numberOfLines={1} style={styles.ownedEmployeeName}>{employee.name}</Text>
        <Text numberOfLines={1} style={styles.ownedEmployeeJob}>{employee.job}</Text>
        <Text style={styles.ownedEmployeeValue}>기여도 {employee.workValue}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={isUpdating}
        onPress={() => onSelect(employee.id)}
        style={({ pressed }) => [styles.selectButton, (pressed || isUpdating) && styles.disabledButton]}
      >
        <Text style={styles.selectButtonText}>선택</Text>
      </Pressable>
    </View>
  );
};

const Employees = () => {
  const [gold] = useAtom(goldAtom);
  const [employees] = useAtom(employeesAtom);
  const [equippedEmployeeIds] = useAtom(equippedEmployeeIdsAtom);
  const [incomePerSecond] = useAtom(incomePerSecondAtom);
  const [teamSynergy] = useAtom(teamSynergyAtom);
  const [maxTeamSize] = useAtom(maxTeamSizeAtom);
  const toggleEquippedEmployee = useSetAtom(toggleEquippedEmployeeAtom);
  const [sortMode, setSortMode] = useState<SortMode>('grade');
  const [updatingEmployeeId, setUpdatingEmployeeId] = useState<string | null>(null);
  const [detailEmployee, setDetailEmployee] = useState<Employee | null>(null);

  const equippedEmployees = useMemo(
    () => equippedEmployeeIds
      .map(employeeId => employees.find(employee => employee.id === employeeId))
      .filter((employee): employee is Employee => employee !== undefined),
    [employees, equippedEmployeeIds],
  );
  const ownedEmployees = useMemo(
    () => employees
      .filter(employee => !equippedEmployeeIds.includes(employee.id))
      .sort((left, right) => sortMode === 'grade'
        ? GRADE_ORDER[right.grade] - GRADE_ORDER[left.grade] || right.workValue - left.workValue
        : right.workValue - left.workValue || GRADE_ORDER[right.grade] - GRADE_ORDER[left.grade]),
    [employees, equippedEmployeeIds, sortMode],
  );
  const projectSuccessRate = Math.min(99, 50 + Math.floor(incomePerSecond / 2));

  const onToggle = async (employeeId: string) => {
    if (updatingEmployeeId !== null) return;

    setUpdatingEmployeeId(employeeId);
    try {
      await toggleEquippedEmployee(employeeId);
    } catch (error) {
      console.error('직원 장착 상태를 저장하지 못했습니다.', error);
    } finally {
      setUpdatingEmployeeId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.backIcon}><Text style={styles.backIconText}>‹</Text></View>
          <Text style={styles.title}>프로젝트 팀 편성</Text>
          <View style={styles.goldPill}><Text style={styles.goldCoin}>●</Text><Text style={styles.goldText}>{gold.toLocaleString('ko-KR')}</Text></View>
        </View>

        <View style={styles.projectSummary}>
          <View style={styles.projectIcon}><Text style={styles.projectIconText}>⌘</Text></View>
          <View style={styles.projectInfo}>
            <View style={styles.projectTitleRow}>
              <Text style={styles.projectTitle}>신규 모바일 게임 개발</Text>
              <Text style={styles.projectTag}>개발</Text>
            </View>
            <View style={styles.projectMetrics}>
              <Text style={styles.projectMetric}>예상 기간 06:00:00</Text>
              <Text style={styles.projectMetric}>성공률 <Text style={styles.projectSuccess}>{projectSuccessRate}%</Text></Text>
              <Text style={styles.projectMetric}>수익 +{incomePerSecond}/초</Text>
              {teamSynergy ? <Text style={styles.projectSynergy}>{teamSynergy.name} +{Math.round((teamSynergy.multiplier - 1) * 100)}%</Text> : null}
            </View>
          </View>
        </View>

        <View style={styles.teamHeader}>
          <View style={styles.teamTitleRow}>
            <Text style={styles.teamTitle}>현재 팀</Text>
            <Text style={styles.teamCount}>({equippedEmployees.length}/{maxTeamSize})</Text>
          </View>
          <Text style={styles.teamGuide}>프로젝트에 투입할 직원을 선택하세요.</Text>
        </View>

        <View style={styles.teamList}>
          {equippedEmployees.map((employee, index) => (
            <TeamMemberCard
              key={employee.id}
              employee={employee}
              slot={index + 1}
              isUpdating={updatingEmployeeId === employee.id}
              onDetail={setDetailEmployee}
              onRemove={onToggle}
            />
          ))}
          {Array.from({ length: maxTeamSize - equippedEmployees.length }).map((_, index) => (
            <View key={`empty-team-${index}`} style={styles.emptyTeamCard}>
              <Text style={styles.emptyTeamPlus}>+</Text>
              <Text style={styles.emptyTeamText}>직원 선택</Text>
            </View>
          ))}
        </View>

        <View style={styles.selectGuide}><Text style={styles.selectGuideText}>+ 아래 보유 직원 카드에서 팀원을 선택할 수 있어요.</Text></View>

        <View style={styles.divider} />

        <View style={styles.ownedHeader}>
          <View style={styles.ownedTabs}>
            <Text style={styles.activeTab}>보유 직원</Text>
            <Text style={styles.inactiveTab}>대기 직원</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => setSortMode(mode => mode === 'grade' ? 'workValue' : 'grade')} style={styles.sortButton}>
            <Text style={styles.sortButtonText}>{sortMode === 'grade' ? '등급순' : '기여도순'} ▾</Text>
          </Pressable>
        </View>

        {ownedEmployees.length > 0 ? (
          <View style={styles.ownedGrid}>
            {ownedEmployees.map(employee => (
              <OwnedEmployeeCard
                key={employee.id}
                employee={employee}
                isUpdating={updatingEmployeeId === employee.id}
                onDetail={setDetailEmployee}
                onSelect={onToggle}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyOwnedState}><Text style={styles.emptyOwnedText}>선택할 수 있는 보유 직원이 없습니다.</Text></View>
        )}
      </ScrollView>

      <Modal animationType="fade" transparent visible={detailEmployee !== null} onRequestClose={() => setDetailEmployee(null)}>
        <View style={styles.detailOverlay}>
          <View style={styles.detailModal}>
            {detailEmployee ? (
              <>
                <View style={styles.detailModalHeader}>
                  <View>
                    <Text style={styles.detailName}>{detailEmployee.name}</Text>
                    <Text style={styles.detailJob}>{detailEmployee.job}</Text>
                  </View>
                  <View style={[styles.detailGrade, { backgroundColor: GRADE_COLORS[detailEmployee.grade] }]}><Text style={styles.detailGradeText}>{detailEmployee.grade}</Text></View>
                </View>
                <EmployeeStatRadar stats={detailEmployee.stats} size={235} />
                <View style={styles.detailValueRow}><Text style={styles.detailValueLabel}>업무 기여도</Text><Text style={styles.detailValue}>{detailEmployee.workValue}</Text></View>
              </>
            ) : null}
            <Pressable accessibilityRole="button" onPress={() => setDetailEmployee(null)} style={styles.closeButton}><Text style={styles.closeButtonText}>닫기</Text></Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
  container: { padding: 18, paddingBottom: 36 },
  header: { flexDirection: 'row', alignItems: 'center', minHeight: 54, gap: 11 },
  backIcon: { width: 32, alignItems: 'center' },
  backIconText: { color: '#202A48', fontSize: 42, fontWeight: '300', lineHeight: 42 },
  title: { flex: 1, color: '#1C2744', fontSize: 22, fontWeight: '900' },
  goldPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, borderWidth: 1, borderColor: '#DEE2ED', borderRadius: 10, backgroundColor: '#FAFBFF' },
  goldCoin: { color: '#F2B527', fontSize: 12 },
  goldText: { color: '#25304D', fontSize: 13, fontWeight: '900' },
  projectSummary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: '#E7E9F0' },
  projectIcon: { alignItems: 'center', justifyContent: 'center', width: 54, height: 54, borderRadius: 10, backgroundColor: '#5748A4' },
  projectIconText: { color: '#FFFFFF', fontSize: 29, fontWeight: '900' },
  projectInfo: { flex: 1 },
  projectTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  projectTitle: { color: '#212B47', fontSize: 17, fontWeight: '900' },
  projectTag: { color: '#6A5CE6', fontSize: 11, fontWeight: '800' },
  projectMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 9 },
  projectMetric: { color: '#7A839A', fontSize: 10, fontWeight: '700' },
  projectSuccess: { color: '#7163E8', fontWeight: '900' },
  projectSynergy: { color: '#5D50D5', fontSize: 10, fontWeight: '900' },
  teamHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 21 },
  teamTitleRow: { flexDirection: 'row', alignItems: 'baseline' },
  teamTitle: { color: '#202A47', fontSize: 18, fontWeight: '900' },
  teamCount: { marginLeft: 4, color: '#65708B', fontSize: 15, fontWeight: '800' },
  teamGuide: { color: '#7F879B', fontSize: 10, fontWeight: '600' },
  teamList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 13 },
  teamMemberCard: { position: 'relative', width: '31.8%', overflow: 'hidden', minHeight: 174, borderWidth: 1, borderColor: '#E1E4ED', borderRadius: 8, backgroundColor: '#FFFFFF' },
  teamMemberContent: { alignItems: 'center', paddingTop: 25, paddingHorizontal: 7 },
  slotBadge: { position: 'absolute', top: 0, left: 0, zIndex: 1, alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderBottomRightRadius: 8, backgroundColor: '#7163E8' },
  slotBadgeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  removeButton: { position: 'absolute', top: 4, right: 8, zIndex: 2 },
  removeButtonText: { color: '#9AA1B1', fontSize: 25, fontWeight: '300' },
  teamMemberImage: { width: 78, height: 88 },
  teamMemberName: { width: '100%', marginTop: 3, color: '#26304A', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  teamMemberJobRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', marginTop: 4 },
  teamMemberJob: { color: '#68718A', fontSize: 10, fontWeight: '700' },
  leaderBadge: { paddingHorizontal: 4, paddingVertical: 2, borderWidth: 1, borderColor: '#9C91FF', borderRadius: 4, color: '#6F60E8', fontSize: 8, fontWeight: '900' },
  updatingOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(255,255,255,0.5)' },
  emptyTeamCard: { width: '31.8%', alignItems: 'center', justifyContent: 'center', minHeight: 174, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD0DD', borderRadius: 8, backgroundColor: '#FAFBFE' },
  emptyTeamPlus: { color: '#A9B0BF', fontSize: 26, fontWeight: '300' },
  emptyTeamText: { marginTop: 3, color: '#8A93A9', fontSize: 10, fontWeight: '700' },
  selectGuide: { alignItems: 'center', justifyContent: 'center', height: 48, marginTop: 12, borderWidth: 1, borderColor: '#E1E4ED', borderRadius: 8, backgroundColor: '#FAFBFE' },
  selectGuideText: { color: '#69738C', fontSize: 11, fontWeight: '700' },
  divider: { height: 1, marginVertical: 24, backgroundColor: '#E5E7EE' },
  ownedHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ownedTabs: { flexDirection: 'row', alignItems: 'center', gap: 27 },
  activeTab: { paddingBottom: 9, borderBottomWidth: 3, borderBottomColor: '#7163E8', color: '#6557D9', fontSize: 16, fontWeight: '900' },
  inactiveTab: { paddingBottom: 9, color: '#8F96A8', fontSize: 15, fontWeight: '700' },
  sortButton: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#DDE1EB', borderRadius: 8 },
  sortButtonText: { color: '#515C76', fontSize: 11, fontWeight: '800' },
  ownedGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 16 },
  ownedEmployeeCard: { position: 'relative', width: '23.5%', overflow: 'hidden', padding: 6, borderWidth: 1, borderColor: '#E3E5ED', borderRadius: 7, backgroundColor: '#FFFFFF' },
  gradeBadge: { position: 'absolute', top: 6, left: 6, zIndex: 1, minWidth: 30, alignItems: 'center', paddingVertical: 4, paddingHorizontal: 4, borderRadius: 5 },
  gradeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  favoriteIcon: { position: 'absolute', top: 4, right: 6, zIndex: 1, color: '#B5BBC8', fontSize: 20 },
  ownedEmployeeContent: { alignItems: 'center', paddingTop: 22 },
  ownedEmployeeImage: { width: '100%', height: 75 },
  ownedEmployeeName: { width: '100%', marginTop: 2, color: '#26304B', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  ownedEmployeeJob: { width: '100%', marginTop: 2, color: '#7A8297', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  ownedEmployeeValue: { marginTop: 5, color: '#59637D', fontSize: 8, fontWeight: '700' },
  selectButton: { alignItems: 'center', justifyContent: 'center', height: 30, marginTop: 7, borderWidth: 1, borderColor: '#B8B0FF', borderRadius: 5, backgroundColor: '#FCFBFF' },
  selectButtonText: { color: '#6B5DE2', fontSize: 11, fontWeight: '900' },
  disabledButton: { opacity: 0.45 },
  emptyOwnedState: { alignItems: 'center', marginTop: 16, padding: 26, borderRadius: 10, backgroundColor: '#F7F8FC' },
  emptyOwnedText: { color: '#7E879A', fontSize: 12, fontWeight: '700' },
  detailOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(15, 21, 39, 0.52)' },
  detailModal: { alignItems: 'center', width: '100%', maxWidth: 380, padding: 21, borderRadius: 22, backgroundColor: '#FFFFFF' },
  detailModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  detailName: { color: '#202A47', fontSize: 21, fontWeight: '900' },
  detailJob: { marginTop: 3, color: '#707A91', fontSize: 12, fontWeight: '700' },
  detailGrade: { minWidth: 46, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 8, borderRadius: 8 },
  detailGradeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  detailValueRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', paddingTop: 13, borderTopWidth: 1, borderTopColor: '#E5E7EE' },
  detailValueLabel: { color: '#626C83', fontSize: 13, fontWeight: '700' },
  detailValue: { color: '#9C691F', fontSize: 18, fontWeight: '900' },
  closeButton: { alignItems: 'center', justifyContent: 'center', width: '100%', height: 48, marginTop: 18, borderRadius: 10, backgroundColor: '#272F4C' },
  closeButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});

export default Employees;
