import { useId } from 'react'
import type { MapProps, MapSegment, MapWaypoint } from '@/runtime/contracts'

interface Point {
  x: number
  y: number
}

const emphasisClasses = {
  normal: 'border-emphasis-normal-border bg-emphasis-normal-bg',
  warning: 'border-emphasis-warning-border bg-emphasis-warning-bg',
  critical: 'border-emphasis-critical-border bg-emphasis-critical-bg',
} as const

const segmentClasses: Record<MapSegment['status'], string> = {
  planned: 'stroke-content-muted/45',
  active: 'stroke-primary',
  diverted: 'stroke-emphasis-critical-fg',
}

const segmentLabels: Record<MapSegment['status'], string> = {
  planned: 'Planeado',
  active: 'Activo',
  diverted: 'Desviado',
}

function project(lat: number, lon: number): Point {
  return {
    x: ((lon + 180) / 360) * 100,
    y: ((90 - lat) / 180) * 52,
  }
}

function splitAtDateLine(from: Point, to: Point): Array<[Point, Point]> {
  if (Math.abs(to.x - from.x) <= 50) return [[from, to]]

  const adjustedToX = to.x < from.x ? to.x + 100 : to.x - 100
  const boundary = adjustedToX > 100 ? 100 : 0
  const ratio = (boundary - from.x) / (adjustedToX - from.x)
  const boundaryY = from.y + (to.y - from.y) * ratio
  const oppositeBoundary = boundary === 100 ? 0 : 100

  return [
    [from, { x: boundary, y: boundaryY }],
    [{ x: oppositeBoundary, y: boundaryY }, to],
  ]
}

function routeLines(
  segment: MapSegment,
  waypoints: ReadonlyMap<string, MapWaypoint>,
): Array<[Point, Point]> {
  const from = waypoints.get(segment.from)
  const to = waypoints.get(segment.to)
  if (!from || !to) return []
  return splitAtDateLine(project(from.lat, from.lon), project(to.lat, to.lon))
}

export default function RouteMap({
  waypoints,
  marker,
  segments,
  emphasis = 'normal',
}: MapProps) {
  const gradientId = `ocean-${useId().replaceAll(':', '')}`
  const waypointById = new Map(waypoints.map((waypoint) => [waypoint.id, waypoint]))
  const markerPoint = marker ? project(marker.lat, marker.lon) : null

  return (
    <figure
      className={`overflow-hidden rounded-control border ${emphasisClasses[emphasis]}`}
      aria-label="Mapa de ruta generado"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-current/10 px-ui-4 py-ui-3">
        <div>
          <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-70">
            Ruta generada desde el estado
          </p>
          <p className="mt-ui-1 text-ui-title font-semibold">
            {waypoints[0]?.label ?? 'Origen'} → {waypoints.at(-1)?.label ?? 'Destino'}
          </p>
        </div>
        <div className="flex flex-wrap gap-ui-2 text-ui-caption font-semibold">
          {(['planned', 'active', 'diverted'] as const).map((status) => (
            <span key={status} className="inline-flex items-center gap-1.5 rounded-full bg-white/65 px-2.5 py-1">
              <span
                className={`h-0.5 w-4 ${
                  status === 'planned'
                    ? 'bg-content-muted/45'
                    : status === 'active'
                      ? 'bg-primary'
                      : 'bg-emphasis-critical-fg'
                }`}
                aria-hidden="true"
              />
              {segmentLabels[status]}
            </span>
          ))}
        </div>
      </div>

      <div className="relative bg-primary p-ui-3 sm:p-ui-4">
        <svg
          className="h-auto w-full overflow-visible rounded-control"
          viewBox="0 0 100 52"
          role="img"
          aria-labelledby={`${gradientId}-title ${gradientId}-description`}
        >
          <title id={`${gradientId}-title`}>Mapa de ruta</title>
          <desc id={`${gradientId}-description`}>
            Ruta offline con puntos, segmentos y posición actual declarados por la UISpec.
          </desc>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#142740" />
              <stop offset="1" stopColor="#1d4968" />
            </linearGradient>
          </defs>
          <rect width="100" height="52" rx="2.5" fill={`url(#${gradientId})`} />

          {[13, 26, 39].map((y) => (
            <line key={`lat-${y}`} x1="0" x2="100" y1={y} y2={y} stroke="#a8dadc" strokeOpacity="0.12" strokeWidth="0.25" />
          ))}
          {[20, 40, 60, 80].map((x) => (
            <line key={`lon-${x}`} x1={x} x2={x} y1="0" y2="52" stroke="#a8dadc" strokeOpacity="0.12" strokeWidth="0.25" />
          ))}

          <path
            d="M4 15 L12 9 L22 11 L27 17 L20 21 L10 20 Z M30 31 L35 28 L41 34 L39 45 L34 49 L31 40 Z M51 10 L64 7 L78 12 L87 20 L77 26 L68 22 L61 27 L54 22 Z M81 33 L89 31 L96 38 L91 45 L84 42 Z"
            fill="#a8dadc"
            fillOpacity="0.13"
          />

          {segments.flatMap((segment, segmentIndex) =>
            routeLines(segment, waypointById).map(([from, to], lineIndex) => (
              <line
                key={`${segment.from}-${segment.to}-${segmentIndex}-${lineIndex}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className={segmentClasses[segment.status]}
                strokeWidth={segment.status === 'diverted' ? 1.3 : 1}
                strokeDasharray={segment.status === 'planned' ? '2 1.5' : undefined}
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            )),
          )}

          {waypoints.map((waypoint) => {
            const point = project(waypoint.lat, waypoint.lon)
            const destination = waypoint.kind === 'destination'
            return (
              <g key={waypoint.id} transform={`translate(${point.x} ${point.y})`}>
                <circle r="1.35" fill={destination ? '#c56632' : '#ffffff'} stroke="#a8dadc" strokeWidth="0.55" />
                <text
                  x={point.x > 78 ? -2 : 2}
                  y={point.y < 8 ? 3.5 : -2.2}
                  fill="#ffffff"
                  fontSize="2.5"
                  fontWeight="700"
                  textAnchor={point.x > 78 ? 'end' : 'start'}
                  paintOrder="stroke"
                  stroke="#1d3557"
                  strokeWidth="0.9"
                >
                  {waypoint.label}
                </text>
              </g>
            )
          })}

          {marker && markerPoint ? (
            <g
              className="route-marker"
              transform={`translate(${markerPoint.x} ${markerPoint.y})`}
              aria-label={`Posición actual: ${marker.label}`}
            >
              <circle className="route-marker-pulse" r="3.2" fill="#c56632" fillOpacity="0.3" />
              <circle r="1.35" fill="#c56632" stroke="#ffffff" strokeWidth="0.6" />
            </g>
          ) : null}
        </svg>
      </div>

      <figcaption className="flex flex-wrap items-center justify-between gap-2 px-ui-4 py-ui-3 text-ui-caption opacity-75">
        <span>{waypoints.length} puntos · {segments.length} segmentos</span>
        <span>{marker ? `Posición: ${marker.label}` : 'Sin posición actual'}</span>
      </figcaption>
    </figure>
  )
}
