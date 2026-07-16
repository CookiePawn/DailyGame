import { StyleSheet, View } from 'react-native';
import Svg, { Line, Polygon, Text as SvgText } from 'react-native-svg';
import { EMPLOYEE_STAT_LABELS } from '@/constants';
import { EmployeeStats, EmployeeStatKey } from '@/models';

type EmployeeStatRadarProps = {
  stats: EmployeeStats;
  size?: number;
};

const STAT_KEYS: EmployeeStatKey[] = [
  'workSkill',
  'creativity',
  'diligence',
  'teamwork',
  'leadership',
  'luck',
];

const getPoint = (center: number, radius: number, index: number) => {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  return {
    x: center + radius * Math.cos(angle),
    y: center + radius * Math.sin(angle),
  };
};

const toPointString = (points: Array<{ x: number; y: number }>) =>
  points.map(point => `${point.x},${point.y}`).join(' ');

const EmployeeStatRadar = ({ stats, size = 220 }: EmployeeStatRadarProps) => {
  const center = size / 2;
  const chartRadius = size * 0.31;
  const labelRadius = size * 0.43;
  const outerPoints = STAT_KEYS.map((_, index) => getPoint(center, chartRadius, index));
  const valuePoints = STAT_KEYS.map((statKey, index) =>
    getPoint(center, chartRadius * (stats[statKey] / 100), index),
  );

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map(scale => (
          <Polygon
            key={scale}
            points={toPointString(STAT_KEYS.map((_, index) => getPoint(center, chartRadius * scale, index)))}
            fill="none"
            stroke="#DCCDBA"
            strokeWidth={1}
          />
        ))}
        {outerPoints.map((point, index) => (
          <Line
            key={STAT_KEYS[index]}
            x1={center}
            y1={center}
            x2={point.x}
            y2={point.y}
            stroke="#DCCDBA"
            strokeWidth={1}
          />
        ))}
        <Polygon
          points={toPointString(valuePoints)}
          fill="rgba(214, 154, 45, 0.32)"
          stroke="#B97913"
          strokeWidth={2.5}
        />
        {STAT_KEYS.map((statKey, index) => {
          const labelPoint = getPoint(center, labelRadius, index);
          return (
            <SvgText
              key={statKey}
              x={labelPoint.x}
              y={labelPoint.y - 5}
              fill="#62574C"
              fontSize={11}
              fontWeight="700"
              textAnchor="middle"
            >
              {EMPLOYEE_STAT_LABELS[statKey]}
            </SvgText>
          );
        })}
        {STAT_KEYS.map((statKey, index) => {
          const valuePoint = getPoint(center, labelRadius, index);
          return (
            <SvgText
              key={`${statKey}-value`}
              x={valuePoint.x}
              y={valuePoint.y + 10}
              fill="#A66A18"
              fontSize={12}
              fontWeight="900"
              textAnchor="middle"
            >
              {stats[statKey]}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
});

export default EmployeeStatRadar;
