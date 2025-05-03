import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Brush,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface SetChartData {
  date: string;
  weight: number;
  reps: number;
}

interface Props {
  data: SetChartData[];
}

const MachineExerciseChart: React.FC<Props> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={data}
        margin={{ top: 40, right: 20, left: 10, bottom: 20 }}
        barCategoryGap={0}
        barGap={0}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis
          label={{
            value: 'Weight (kg)',
            angle: -90,
            position: 'insideLeft',
            offset: 10,
          }}
        />
        <Tooltip />
        <Bar dataKey="weight" fill="#3880ff" barSize={35}>
          <LabelList
            dataKey="reps"
            position="top"
            offset={10}
            formatter={(v: number) => `${v} reps`}
          />
        </Bar>
        {/* Brush for selectable date range */}
        <Brush dataKey="date" height={30} stroke="#3880ff" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MachineExerciseChart;
