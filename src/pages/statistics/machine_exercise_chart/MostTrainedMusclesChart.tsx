import React, { useMemo } from 'react';
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

interface Props {
  data: MuscleData[];
}

const MostTrainedMusclesChart: React.FC<Props> = ({ data }) => {
  const max = useMemo(() => {
    const m = data.reduce((acc, d) => Math.max(acc, d.count || 0), 0);
    return Math.max(1, Math.floor(m));
  }, [data]);

  const ticks = useMemo((): number[] => {
    if (max <= 3) {
      return Array.from({ length: max + 1 }, (_, i) => i);
    }

    // target ~4 ticks
    const roughStep = max / 3;

    // snap to human-friendly steps
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalized = roughStep / magnitude;

    let step: number;
    if (normalized <= 1) step = 1 * magnitude;
    else if (normalized <= 2) step = 2 * magnitude;
    else if (normalized <= 5) step = 5 * magnitude;
    else step = 10 * magnitude;

    const result: number[] = [];
    for (let v = 0; v <= max; v += step) {
      result.push(v);
    }

    if (result[result.length - 1] !== max) {
      result.push(max);
    }

    return result;
  }, [max]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="muscle" tick={{ fontSize: 10 }} />
        <PolarRadiusAxis
          angle={30}
          domain={[0, max]}
          ticks={ticks as any} // TS typings for recharts vary; runtime accepts number[]
          allowDecimals={false}
        />
        <Radar
          dataKey="count"
          stroke="var(--ion-color-primary)"
          fill="var(--ion-color-primary)"
          fillOpacity={0.35}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default MostTrainedMusclesChart;
