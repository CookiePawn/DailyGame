import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAtom } from 'jotai';
import { EmployeeStatRadar } from '@/components';
import { EMPLOYEE_TEMPLATES, GRADE_COLORS } from '@/constants';
import { employeesAtom } from '@/lib/jotai';
import { Employee } from '@/models';

const getEmployeeImage = (employee: Employee) =>
  EMPLOYEE_TEMPLATES.find(template => template.id === employee.templateId)?.image;

const Employees = () => {
  const [employees] = useAtom(employeesAtom);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const selectedEmployee = useMemo(
    () => employees.find(employee => employee.id === selectedEmployeeId) ?? employees[0] ?? null,
    [employees, selectedEmployeeId],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>직원</Text>
        <Text style={styles.subtitle}>채용한 직원 {employees.length}명</Text>

        {employees.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>아직 직원이 없어요</Text>
            <Text style={styles.emptyDescription}>채용 탭에서 첫 번째 직원을 만나보세요.</Text>
          </View>
        ) : (
          <>
            <View style={styles.grid}>
              {employees.map(employee => {
                const image = getEmployeeImage(employee);
                const isSelected = selectedEmployee?.id === employee.id;

                return (
                  <Pressable
                    key={employee.id}
                    accessibilityRole="button"
                    onPress={() => setSelectedEmployeeId(employee.id)}
                    style={[styles.employeeCard, isSelected && styles.selectedCard]}
                  >
                    <View style={[styles.gradeBadge, { backgroundColor: GRADE_COLORS[employee.grade] }]}>
                      <Text style={styles.gradeText}>{employee.grade}</Text>
                    </View>
                    <View style={styles.cardImageFrame}>
                      {image ? <Image source={image} style={styles.cardImage} resizeMode="contain" /> : null}
                    </View>
                    <Text numberOfLines={1} style={styles.employeeName}>{employee.name}</Text>
                    <Text numberOfLines={1} style={styles.employeeJob}>{employee.job}</Text>
                    <Text style={styles.workValue}>기여도 {employee.workValue}</Text>
                  </Pressable>
                );
              })}
            </View>

            {selectedEmployee ? (
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View>
                    <Text style={styles.detailName}>{selectedEmployee.name}</Text>
                    <Text style={styles.detailJob}>{selectedEmployee.job}</Text>
                  </View>
                  <View style={[styles.detailGrade, { backgroundColor: GRADE_COLORS[selectedEmployee.grade] }]}>
                    <Text style={styles.gradeText}>{selectedEmployee.grade}</Text>
                  </View>
                </View>
                <View style={styles.radarContainer}>
                  <EmployeeStatRadar stats={selectedEmployee.stats} />
                </View>
                <View style={styles.detailFooter}>
                  <Text style={styles.detailFooterLabel}>업무 기여도</Text>
                  <Text style={styles.detailFooterValue}>{selectedEmployee.workValue}</Text>
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F0E5' },
  container: { padding: 20, paddingBottom: 36 },
  title: { color: '#29231F', fontSize: 30, fontWeight: '800' },
  subtitle: { marginTop: 5, color: '#766B61', fontSize: 14 },
  emptyState: { alignItems: 'center', marginTop: 48, padding: 30, borderRadius: 22, backgroundColor: '#FFF9F0' },
  emptyTitle: { color: '#29231F', fontSize: 19, fontWeight: '800' },
  emptyDescription: { marginTop: 8, color: '#766B61', fontSize: 14 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginTop: 22,
  },
  employeeCard: {
    position: 'relative',
    width: '23.5%',
    alignItems: 'center',
    overflow: 'hidden',
    padding: 8,
    borderWidth: 1,
    borderColor: '#D7C6AF',
    borderRadius: 14,
    backgroundColor: '#FFF9F0',
  },
  selectedCard: { borderWidth: 2, borderColor: '#D69A2D' },
  gradeBadge: { position: 'absolute', top: 7, right: 7, zIndex: 1, minWidth: 24, alignItems: 'center', paddingVertical: 3, paddingHorizontal: 4, borderRadius: 7 },
  detailGrade: { minWidth: 46, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 9, borderRadius: 10 },
  gradeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  cardImageFrame: { width: '100%', aspectRatio: 1 },
  cardImage: { width: '100%', height: '100%' },
  employeeName: { width: '100%', color: '#29231F', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  employeeJob: { width: '100%', marginTop: 2, color: '#766B61', fontSize: 11, textAlign: 'center' },
  workValue: { marginTop: 6, color: '#9A6512', fontSize: 11, fontWeight: '800' },
  detailCard: { marginTop: 24, padding: 18, borderWidth: 1, borderColor: '#D7C6AF', borderRadius: 22, backgroundColor: '#FFF9F0' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  detailName: { color: '#29231F', fontSize: 22, fontWeight: '800' },
  detailJob: { marginTop: 3, color: '#766B61', fontSize: 14 },
  radarContainer: { alignItems: 'center', marginTop: 10 },
  detailFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#E7DCCC' },
  detailFooterLabel: { color: '#62574C', fontSize: 14, fontWeight: '700' },
  detailFooterValue: { color: '#9A6512', fontSize: 20, fontWeight: '900' },
});

export default Employees;
