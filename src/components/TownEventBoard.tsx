import { useState } from 'react';
import type { CityBuilding } from '../types/city';
import type { TownEvent } from '../lib/townEvents';

interface TownEventBoardProps {
  event: TownEvent;
  preview: number;
  onNextEvent: () => void;
  onVisitArtist: (artist: CityBuilding) => void;
  onReadNotice?: () => void;
}

/** Expandable festival noticeboard directly above the city map. */
export default function TownEventBoard({
  event,
  preview,
  onNextEvent,
  onVisitArtist,
  onReadNotice,
}: TownEventBoardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="town-event-board" aria-label="Scrobble Square town happenings">
      <div className="town-event-intro">
        <span className="town-event-icon" aria-hidden="true">{event.icon}</span>
        <div>
          <span className="town-event-overline">
            ✦ SCROBBLE SQUARE NOTICEBOARD ✦
          </span>
          <h3>{event.title}</h3>
          <p>{event.summary}</p>
          <small>{preview === 0 ? 'Today’s featured town story' : 'Previewing another town story'}</small>
        </div>
      </div>
      <div className="town-event-actions">
        <button type="button" onClick={() => { if (!expanded) onReadNotice?.(); setExpanded((value) => !value); }}
          aria-expanded={expanded} aria-controls="town-event-details">
          {expanded ? 'Close notice ↑' : 'Read notice →'}
        </button>
        <button type="button" onClick={() => { onNextEvent(); setExpanded(true); onReadNotice?.(); }}>
          Next poster ↻
        </button>
      </div>
      {expanded && (
        <div className="town-event-details" id="town-event-details">
          <strong>{event.icon} The Town Crier Announces...</strong>
          <p>{event.description}</p>
          {event.guestArtist && (
            <button type="button" onClick={() => onVisitArtist(event.guestArtist!)}>
              ♪ Visit {event.guestArtist.name}'s building →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
