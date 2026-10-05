/**
 * Carga de zonas con la cancha dibujada, para la última acción registrada
 * (saque o ataque). Paso 1: zona de origen en la cancha propia. Paso 2: zona
 * de destino en la cancha rival. No bloquea: si se registra otra acción, el
 * selector pasa a esa.
 */
import { useState } from 'react';
import type { Zone } from '../../domain/zones';
import { routeLabel } from '../../domain/zones';
import type { ActionEvent, Match } from '../../domain/types';
import { otherSide } from '../../domain/types';
import { Court } from '../court/Court';
import type { HalfPosition } from '../court/geometry';
import { describeEvent } from '../format';

interface Props {
  match: Match;
  event: ActionEvent;
  onChange: (zones: { startZone?: Zone; endZone?: Zone }) => void;
  onClose: () => void;
}

/** Se monta con key={event.id}, así el estado se reinicia con cada acción nueva. */
export function ZonePicker({ match, event, onChange, onClose }: Props) {
  // En la carga, la cancha siempre muestra al local a la izquierda.
  const actorHalf: HalfPosition = event.team === 'home' ? 'left' : 'right';
  const [skipStart, setSkipStart] = useState(false);
  const step: 'start' | 'end' = event.startZone === undefined && !skipStart ? 'start' : 'end';
  const opponent = otherSide(event.team);

  function pick(half: HalfPosition, zone: Zone) {
    if (step === 'start' && half === actorHalf) {
      onChange({ startZone: zone, endZone: event.endZone });
    } else if (step === 'end' && half !== actorHalf) {
      onChange({ startZone: event.startZone, endZone: zone });
      onClose();
    }
  }

  const half = (side: 'home' | 'away') => {
    const isActor = side === event.team;
    const selected = isActor ? event.startZone : event.endZone;
    return {
      label: match[side].name,
      tone: side,
      clickable: step === 'start' ? isActor : !isActor,
      selected: selected ? [selected] : [],
    };
  };

  return (
    <section className="zone-picker" aria-label="Zonas de la última acción">
      <div className="row-between">
        <div>
          <div className="small muted">Zonas de: {describeEvent(match, event)}</div>
          <strong>
            {step === 'start'
              ? `1) Toca la zona de ORIGEN en la cancha de ${match[event.team].name}`
              : `2) Toca la zona de DESTINO en la cancha de ${match[opponent].name}`}
          </strong>
        </div>
        <div className="button-row">
          {step === 'start' && (
            <button className="btn" onClick={() => setSkipStart(true)}>
              Sin origen →
            </button>
          )}
          <button className="btn ghost" onClick={onClose}>
            {event.startZone || event.endZone ? 'Listo' : 'Omitir'}
          </button>
        </div>
      </div>
      <Court
        ariaLabel="Cancha para elegir zonas"
        left={half('home')}
        right={half('away')}
        onZoneClick={pick}
      />
      {(event.startZone || event.endZone) && (
        <p className="small muted">Recorrido: {routeLabel(event.startZone, event.endZone)}</p>
      )}
    </section>
  );
}
