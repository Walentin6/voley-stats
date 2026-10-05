/**
 * Cancha de vóley dibujada en SVG, con las 9 zonas de cada mitad.
 * Se usa para tocar zonas al cargar acciones y para dibujar los mapas.
 */
import type { ReactNode } from 'react';
import { ZONES, type Zone } from '../../domain/zones';
import { COURT_LENGTH, COURT_WIDTH, zoneRect, type HalfPosition } from './geometry';

export interface HalfConfig {
  /** Nombre que se muestra debajo de la mitad. */
  label: string;
  /** Clase de color: 'home' o 'away'. */
  tone: 'home' | 'away';
  /** Si se puede tocar (resalta la mitad). */
  clickable?: boolean;
  /** Texto dentro de cada zona (por ejemplo, cantidades). Si no se da, se muestra el número de zona. */
  zoneText?: Partial<Record<Zone, string>>;
  /** Intensidad del relleno de cada zona, de 0 a 1 (para mapas de calor). */
  zoneHeat?: Partial<Record<Zone, number>>;
  /** Zonas resaltadas (por ejemplo, la elegida). */
  selected?: Zone[];
}

interface Props {
  left: HalfConfig;
  right: HalfConfig;
  onZoneClick?: (half: HalfPosition, zone: Zone) => void;
  /** Dibujos encima de la cancha (líneas de los mapas). */
  children?: ReactNode;
  ariaLabel: string;
}

const LABEL_SPACE = 12;

export function Court({ left, right, onZoneClick, children, ariaLabel }: Props) {
  const half = (position: HalfPosition, config: HalfConfig) =>
    ZONES.map((zone) => {
      const r = zoneRect(position, zone);
      const heat = config.zoneHeat?.[zone] ?? 0;
      const isSelected = config.selected?.includes(zone);
      const text = config.zoneText ? (config.zoneText[zone] ?? '') : String(zone);
      const clickable = config.clickable && onZoneClick;
      return (
        <g
          key={`${position}-${zone}`}
          className={`court-zone ${config.tone} ${clickable ? 'clickable' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={clickable ? () => onZoneClick(position, zone) : undefined}
          role={clickable ? 'button' : undefined}
          aria-label={clickable ? `Zona ${zone}` : undefined}
        >
          <rect x={r.x} y={r.y} width={r.w} height={r.h} className="zone-bg" />
          {heat > 0 && <rect x={r.x} y={r.y} width={r.w} height={r.h} className="zone-heat" opacity={heat} />}
          {config.zoneText && <text x={r.x + 3} y={r.y + 7} className="zone-number">{zone}</text>}
          <text x={r.x + r.w / 2} y={r.y + r.h / 2} className="zone-text">
            {text}
          </text>
        </g>
      );
    });

  return (
    <svg
      className="court"
      viewBox={`-2 -2 ${COURT_LENGTH + 4} ${COURT_WIDTH + LABEL_SPACE + 4}`}
      role="img"
      aria-label={ariaLabel}
    >
      {half('left', left)}
      {half('right', right)}
      {/* Líneas: borde, líneas de 3 m y red */}
      <rect x={0} y={0} width={COURT_LENGTH} height={COURT_WIDTH} className="court-border" />
      <line x1={60} y1={0} x2={60} y2={COURT_WIDTH} className="court-attack-line" />
      <line x1={120} y1={0} x2={120} y2={COURT_WIDTH} className="court-attack-line" />
      <line x1={90} y1={-2} x2={90} y2={COURT_WIDTH + 2} className="court-net" />
      {children}
      <text x={45} y={COURT_WIDTH + 9} className={`court-label ${left.tone}`}>
        {left.label}
      </text>
      <text x={135} y={COURT_WIDTH + 9} className={`court-label ${right.tone}`}>
        {right.label}
      </text>
    </svg>
  );
}
