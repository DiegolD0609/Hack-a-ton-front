import { useEffect, useId, useRef, useState } from 'react'
import mapLibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import type {
  Map as MapLibreMap,
  Marker as MapLibreMarker,
  StyleSpecification,
} from 'maplibre-gl'
import type { Feature, FeatureCollection, LineString } from 'geojson'
import type { MapProps, MapSegment, MapWaypoint } from '@/runtime/contracts'

const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION =
  '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a>'

const emphasisClasses = {
  normal: 'emphasis-normal',
  warning: 'emphasis-warning',
  critical: 'emphasis-critical',
} as const

const segmentPresentation = {
  planned: { label: 'Planeado', color: '#48647e', dash: '7 7' },
  active: { label: 'En curso', color: '#0f8f6f', dash: '' },
  diverted: { label: 'Desviado', color: '#d85b36', dash: '3 6' },
} as const

type RenderMode = 'loading' | 'interactive' | 'fallback'
type MapLibreModule = typeof import('maplibre-gl')
type RouteProperties = { status: MapSegment['status'] }

function supportsInteractiveMap(): boolean {
  return (
    typeof window !== 'undefined' &&
    (typeof window.WebGLRenderingContext !== 'undefined' ||
      typeof window.WebGL2RenderingContext !== 'undefined') &&
    navigator.onLine !== false
  )
}

function mapStyle(tileUrl: string): StyleSpecification {
  return {
    version: 8,
    sources: {
      osm: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        attribution: OSM_ATTRIBUTION,
      },
    },
    layers: [
      {
        id: 'osm-basemap',
        type: 'raster',
        source: 'osm',
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  }
}

function routeBounds(
  waypoints: MapWaypoint[],
  marker: MapProps['marker'],
): [[number, number], [number, number]] {
  const points = marker ? [...waypoints, marker] : waypoints
  const anchor = points[0]?.lon ?? 0
  const normalized = points.map((point) => {
    let lon = point.lon
    while (lon - anchor > 180) lon -= 360
    while (lon - anchor < -180) lon += 360
    return [lon, point.lat] as const
  })
  const longitudes = normalized.map(([lon]) => lon)
  const latitudes = normalized.map(([, lat]) => lat)
  return [
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ]
}

function routeGeoJson(
  waypoints: MapWaypoint[],
  segments: MapSegment[],
): FeatureCollection<LineString, RouteProperties> {
  const waypointsById = new Map(waypoints.map((waypoint) => [waypoint.id, waypoint]))
  const features: Array<Feature<LineString, RouteProperties>> = []

  for (const segment of segments) {
    const start = waypointsById.get(segment.fromId)
    const end = waypointsById.get(segment.toId)
    if (!start || !end) continue
    let endLongitude = end.lon
    const difference = endLongitude - start.lon
    if (difference >= 180) endLongitude -= 360
    if (difference <= -180) endLongitude += 360
    features.push({
      type: 'Feature',
      properties: { status: segment.status },
      geometry: {
        type: 'LineString',
        coordinates: [[start.lon, start.lat], [endLongitude, end.lat]],
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

function markerElement(className: string, label: string, content = ''): HTMLDivElement {
  const element = document.createElement('div')
  element.className = className
  element.setAttribute('aria-label', label)
  element.setAttribute('title', label)
  element.textContent = content
  return element
}

function addMarkers(
  maplibregl: MapLibreModule,
  map: MapLibreMap,
  waypoints: MapWaypoint[],
  marker: MapProps['marker'],
): MapLibreMarker[] {
  const markers = waypoints.map((waypoint) => {
    const element = markerElement(
      `route-map-waypoint route-map-waypoint-${waypoint.kind}`,
      waypoint.label,
    )
    const popup = new maplibregl.Popup({ offset: 14 }).setText(waypoint.label)
    return new maplibregl.Marker({ element })
      .setLngLat([waypoint.lon, waypoint.lat])
      .setPopup(popup)
      .addTo(map)
  })

  if (marker) {
    const label = marker.label?.trim() || 'Posición actual'
    const element = markerElement('route-map-live-marker', label, '⛴')
    markers.push(
      new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([marker.lon, marker.lat])
        .setPopup(new maplibregl.Popup({ offset: 22 }).setText(label))
        .addTo(map),
    )
  }

  return markers
}

interface OfflineRouteMapProps extends MapProps {
  titleId: string
}

function OfflineRouteMap({
  titleId,
  title,
  waypoints,
  segments,
  marker,
}: OfflineRouteMapProps) {
  const waypointIndex = new Map(waypoints.map((waypoint, index) => [waypoint.id, index]))
  const xForIndex = (index: number) =>
    waypoints.length <= 1 ? 360 : 70 + (index * 580) / (waypoints.length - 1)
  const nearestMarkerIndex = marker
    ? waypoints.reduce(
        (nearest, waypoint, index) => {
          const longitudeDistance = Math.min(
            Math.abs(marker.lon - waypoint.lon),
            360 - Math.abs(marker.lon - waypoint.lon),
          )
          const distance = Math.hypot(marker.lat - waypoint.lat, longitudeDistance)
          return distance < nearest.distance ? { index, distance } : nearest
        },
        { index: 0, distance: Number.POSITIVE_INFINITY },
      ).index
    : 0

  return (
    <div data-testid="route-map-fallback">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-ui-caption font-semibold uppercase tracking-wide opacity-75">
            Ruta · respaldo local
          </p>
          {title ? <h3 id={titleId} className="mt-ui-1 text-ui-title font-semibold">{title}</h3> : null}
        </div>
        <span className="rounded-full border border-current/20 px-3 py-1 text-ui-caption font-semibold">
          Sin mapa base
        </span>
      </div>

      <svg
        className="mt-ui-3 h-auto w-full rounded-control bg-surface/75"
        viewBox="0 0 720 250"
        role="img"
        aria-label="Mapa de ruta esquemático sin conexión"
      >
        <rect x="0" y="0" width="720" height="250" rx="16" fill="currentColor" opacity="0.04" />
        {segments.map((segment) => {
          const fromIndex = waypointIndex.get(segment.fromId)
          const toIndex = waypointIndex.get(segment.toId)
          if (fromIndex === undefined || toIndex === undefined) return null
          const presentation = segmentPresentation[segment.status]
          return (
            <line
              key={`${segment.fromId}-${segment.toId}`}
              x1={xForIndex(fromIndex)}
              y1="122"
              x2={xForIndex(toIndex)}
              y2="122"
              stroke={presentation.color}
              strokeWidth="7"
              strokeDasharray={presentation.dash}
              strokeLinecap="round"
            />
          )
        })}
        {waypoints.map((waypoint, index) => (
          <g key={waypoint.id} transform={`translate(${xForIndex(index)} 122)`}>
            <circle r="11" fill="white" stroke="currentColor" strokeWidth="4" />
            <text y={index % 2 === 0 ? -24 : 38} textAnchor="middle" className="route-map-svg-label">
              {waypoint.label}
            </text>
          </g>
        ))}
        {marker ? (
          <g transform={`translate(${xForIndex(nearestMarkerIndex)} 72)`}>
            <circle className="route-marker-pulse" r="22" fill="#0f8f6f" opacity="0.25" />
            <circle r="17" fill="#082f49" />
            <text y="6" textAnchor="middle" fontSize="18">⛴</text>
          </g>
        ) : null}
      </svg>

      <div className="mt-ui-3 flex flex-wrap items-center justify-between gap-3 text-ui-caption">
        <p className="font-semibold">
          {waypoints[0]?.label} → {waypoints.at(-1)?.label}
        </p>
        {marker ? (
          <p>Posición: {marker.label?.trim() || `${marker.lat.toFixed(2)}, ${marker.lon.toFixed(2)}`}</p>
        ) : null}
      </div>
    </div>
  )
}

export default function RouteMap(props: MapProps) {
  const { title, waypoints, segments, marker, emphasis } = props
  const titleId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<RenderMode>('loading')

  useEffect(() => {
    if (!supportsInteractiveMap() || !containerRef.current) {
      setMode('fallback')
      return
    }

    let disposed = false
    let loaded = false
    let map: MapLibreMap | null = null
    let mapMarkers: MapLibreMarker[] = []
    let loadTimeout: number | undefined
    setMode('loading')

    const useFallback = () => {
      if (disposed) return
      window.clearTimeout(loadTimeout)
      setMode('fallback')
      mapMarkers.forEach((item) => item.remove())
      mapMarkers = []
      map?.remove()
      map = null
    }

    const initializeMap = async () => {
      try {
        const maplibregl = await import('maplibre-gl')
        if (disposed || !containerRef.current) return
        maplibregl.setWorkerUrl(mapLibreWorkerUrl)
        const mapInstance = new maplibregl.Map({
          container: containerRef.current,
          style: mapStyle(import.meta.env.VITE_MAP_TILE_URL || DEFAULT_TILE_URL),
          center: [waypoints[0]?.lon ?? 0, waypoints[0]?.lat ?? 0],
          zoom: 2,
          minZoom: 1,
          maxZoom: 12,
          attributionControl: false,
          cooperativeGestures: true,
        })
        map = mapInstance
        mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
        mapInstance.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

        mapInstance.on('load', () => {
          if (disposed || map !== mapInstance) return
          loaded = true
          window.clearTimeout(loadTimeout)
          mapInstance.addSource('runtime-route', {
            type: 'geojson',
            data: routeGeoJson(waypoints, segments),
          })
          mapInstance.addLayer({
            id: 'runtime-route-halo',
            type: 'line',
            source: 'runtime-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: { 'line-color': '#ffffff', 'line-width': 10, 'line-opacity': 0.82 },
          })
          mapInstance.addLayer({
            id: 'runtime-route-line',
            type: 'line',
            source: 'runtime-route',
            layout: { 'line-cap': 'round', 'line-join': 'round' },
            paint: {
              'line-color': [
                'match',
                ['get', 'status'],
                'active',
                segmentPresentation.active.color,
                'diverted',
                segmentPresentation.diverted.color,
                segmentPresentation.planned.color,
              ],
              'line-width': 6,
              'line-opacity': 0.95,
            },
          })
          mapMarkers = addMarkers(maplibregl, mapInstance, waypoints, marker)
          mapInstance.fitBounds(routeBounds(waypoints, marker), {
            padding: { top: 72, right: 72, bottom: 72, left: 72 },
            maxZoom: 5,
            duration: 0,
          })
          setMode('interactive')
        })

        mapInstance.on('error', () => {
          if (!loaded) useFallback()
        })
      } catch {
        useFallback()
      }
    }

    loadTimeout = window.setTimeout(useFallback, 10_000)
    void initializeMap()

    window.addEventListener('offline', useFallback)
    return () => {
      disposed = true
      window.clearTimeout(loadTimeout)
      window.removeEventListener('offline', useFallback)
      mapMarkers.forEach((item) => item.remove())
      map?.remove()
    }
  }, [marker, segments, waypoints])

  return (
    <section
      className={`overflow-hidden rounded-control border-l-4 ${emphasisClasses[emphasis]}`}
      data-testid="route-map"
      aria-labelledby={title ? titleId : undefined}
    >
      {mode === 'fallback' ? (
        <div className="p-ui-4">
          <OfflineRouteMap {...props} titleId={titleId} />
        </div>
      ) : (
        <div className="relative min-h-[24rem] bg-surface-tinted">
          <div
            ref={containerRef}
            className="route-map-host absolute inset-0"
            data-testid="route-map-canvas"
            role="region"
            aria-label="Mapa interactivo de la ruta"
          />
          <div className="pointer-events-none absolute left-4 top-4 z-10 max-w-[calc(100%_-_7rem)] rounded-control border border-white/45 bg-white/90 px-4 py-3 text-content shadow-lg backdrop-blur">
            <p className="text-ui-caption font-semibold uppercase tracking-wide text-content-muted">
              Ruta interactiva
            </p>
            {title ? <h3 id={titleId} className="mt-1 text-ui-title font-semibold">{title}</h3> : null}
            <p className="mt-1 text-ui-caption text-content-muted">
              {waypoints[0]?.label} → {waypoints.at(-1)?.label}
            </p>
          </div>
          {mode === 'loading' ? (
            <div className="absolute inset-0 z-20 grid place-items-center bg-surface-tinted/90" role="status">
              <span className="rounded-full bg-surface px-4 py-2 text-ui-caption font-semibold shadow-sm">
                Cargando mapa…
              </span>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
