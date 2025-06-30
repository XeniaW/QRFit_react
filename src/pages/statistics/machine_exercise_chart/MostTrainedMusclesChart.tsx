import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

export interface MuscleData {
  muscle: string;
  count: number;
}

interface MostTrainedMusclesChartProps {
  data: MuscleData[];
}

const MostTrainedMusclesChart: React.FC<MostTrainedMusclesChartProps> = ({
  data,
}) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} />
        <Radar
          name="Muscle Workouts"
          dataKey="count"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default MostTrainedMusclesChart;
