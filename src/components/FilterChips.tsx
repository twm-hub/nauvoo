import { IonChip, IonLabel } from '@ionic/react';
import { LocationType, PIN_COLORS } from '../types';
import './FilterChips.css';

interface FilterChipsProps {
  types: LocationType[];
  selectedTypes: LocationType[];
  onToggle: (type: LocationType) => void;
}

const FilterChips: React.FC<FilterChipsProps> = ({
  types,
  selectedTypes,
  onToggle,
}) => {
  return (
    <div className="filter-chips-container">
      {types.map((type) => {
        const isSelected = selectedTypes.includes(type);
        const color = PIN_COLORS[type];

        return (
          <IonChip
            key={type}
            onClick={() => onToggle(type)}
            className={`filter-chip ${isSelected ? 'selected' : ''}`}
            style={{
              '--chip-color': color,
              backgroundColor: isSelected ? color : 'transparent',
              borderColor: color,
              color: isSelected ? 'white' : color,
            } as React.CSSProperties}
          >
            <IonLabel>{type}</IonLabel>
          </IonChip>
        );
      })}
    </div>
  );
};

export default FilterChips;
