import type { MapProps } from '@/runtime/contracts'

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

const segmentLabels = {
  planned: 'Planeado',
  active: 'En curso',
  diverted: 'Desviado',
} as const

/**
 * Contract placeholder for node #10 (addendum v1.1). Renders the route as a
 * legible list — this is also the GR1 kill-criteria fallback. Step B.4 of the
 * roadmap replaces the internals with the inline-SVG map; the props are
 * frozen and must not change.
 */
export default function RouteMap({ title, waypoints, segments, marker, emphasis }: MapProps) {
  const waypointsById = new Map(waypoints.map((waypoint) => [waypoint.id, waypoint]))
  return (
    <section
      className={`rounded-control border-l-4 p-ui-4 ${emphasisClasses[emphasis]}`}
      data-testid="route-map"
    >
      <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-75">Ruta</p>
      {title ? <h3 className="mt-ui-1 text-ui-title font-semibold">{title}</h3> : null}
      <ol className="mt-ui-2 space-y-1">
        {segments.map((segment) => (
          <li key={`${segment.fromId}-${segment.toId}`} className="text-ui-body">
            {waypointsById.get(segment.fromId)?.label ?? segment.fromId}
            {' → '}
            {waypointsById.get(segment.toId)?.label ?? segment.toId}
            <span className="ml-2 text-ui-caption uppercase opacity-75">
              {segmentLabels[segment.status]}
            </span>
          </li>
        ))}
      </ol>
      {marker ? (
        <p className="mt-ui-2 text-ui-caption opacity-75">
          {'Posición actual: '}
          {marker.label ?? `${marker.lat.toFixed(2)}, ${marker.lon.toFixed(2)}`}
        </p>
      ) : null}
    </section>
  )
}
