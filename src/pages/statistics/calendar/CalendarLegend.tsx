import React from 'react';
import './CalendarWidget.css'; // shared CSS

const CalendarLegend: React.FC = () => (
  <div className="calendar-legend">
    <div className="legend-item">
      <span className="dot--workout" />
      <span>Workout</span>
    </div>
    <div className="legend-item">
      <span className="dot--note" />
      <span>Note</span>
    </div>
    <div className="legend-item">
      <span className="legend-swatch legend-swatch--menstruation" />
      <span>Menstruation</span>
    </div>
    <div className="legend-item">
      <span className="legend-swatch legend-swatch--ovulation" />
      <span>Ovulation</span>
    </div>
  </div>
);

export default CalendarLegend;
