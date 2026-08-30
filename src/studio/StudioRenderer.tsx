import type { CSSProperties, ReactNode } from 'react'
import { RouteMap } from '@/components/ui-kit'
import type { Emphasis, MapProps, MapSegment, MapWaypoint } from '@/runtime/contracts'

type LooseObject = Record<string, unknown>

function objectValue(value: unknown): LooseObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as LooseObject
    : null
}

function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null
}

function displayValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

function nodeChildren(node: LooseObject): unknown[] {
  return Array.isArray(node.children) ? node.children : []
}

function childKey(child: unknown, index: number): string | number {
  return stringValue(objectValue(child)?.id) ?? index
}

const gapValues: Record<string, string> = {
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
}

const alignValues: Record<string, CSSProperties['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

const justifyValues: Record<string, CSSProperties['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
}

function sectionStyle(props: LooseObject): CSSProperties {
  const direction = stringValue(props.direction) === 'row' ? 'row' : 'column'
  const gap = stringValue(props.gap) ?? 'md'
  const align = stringValue(props.align) ?? 'stretch'
  const justify = stringValue(props.justify) ?? 'start'
  return {
    display: 'flex',
    flexDirection: direction,
    flexWrap: direction === 'row' ? 'wrap' : 'nowrap',
    gap: gapValues[gap] ?? gapValues.md,
    alignItems: alignValues[align] ?? alignValues.stretch,
    justifyContent: justifyValues[justify] ?? justifyValues.start,
  }
}

function renderChildren(node: LooseObject): ReactNode {
  return nodeChildren(node).map((child, index) => (
    <StudioNode key={childKey(child, index)} node={child} />
  ))
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

function hexColor(value: unknown): string | null {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value) ? value : null
}

function StudioPage({ node, props }: { node: LooseObject; props: LooseObject }) {
  const backgroundColor = hexColor(props.backgroundColor)
  return (
    <main
      className="generated-page"
      style={backgroundColor ? { backgroundColor, borderRadius: '1rem', padding: '1.25rem' } : undefined}
    >
      <div className="generated-page-content">{renderChildren(node)}</div>
    </main>
  )
}

function StudioSection({ node, props }: { node: LooseObject; props: LooseObject }) {
  const title = stringValue(props.title)
  const description = stringValue(props.description)
  const backgroundColor = hexColor(props.backgroundColor)
  return (
    <section
      className={`generated-section emphasis-${stringValue(props.emphasis) ?? 'normal'}`}
      style={backgroundColor ? { backgroundColor, borderColor: 'transparent' } : undefined}
    >
      {title || description ? (
        <header>
          {title ? <h2>{title}</h2> : null}
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}
      <div className="generated-section-content" style={sectionStyle(props)}>
        {renderChildren(node)}
      </div>
    </section>
  )
}

function StudioButton({ props }: { props: LooseObject }) {
  const variant = stringValue(props.variant) ?? 'primary'
  const size = stringValue(props.size) ?? 'md'
  const color = hexColor(props.color)
  return (
    <button
      type="button"
      className={`generated-button is-${variant} is-${size}`}
      style={color ? { backgroundColor: color, borderColor: color, color: '#fff' } : undefined}
    >
      {stringValue(props.label) ?? ''}
    </button>
  )
}

function StudioText({ props }: { props: LooseObject }) {
  const content = stringValue(props.content) ?? ''
  const variant = stringValue(props.variant) ?? 'body'
  const color = hexColor(props.color)
  const style = color ? { color } : undefined
  if (variant === 'heading') return <h2 className="generated-text is-heading" style={style}>{content}</h2>
  if (variant === 'caption') return <small className="generated-text is-caption" style={style}>{content}</small>
  return <p className="generated-text" style={style}>{content}</p>
}

function StudioMetric({ props }: { props: LooseObject }) {
  return (
    <article className={`generated-card emphasis-${stringValue(props.emphasis) ?? 'normal'}`}>
      <span>{stringValue(props.label)}</span>
      <strong>{displayValue(props.value)}</strong>
      {stringValue(props.supportingText) ? <p>{stringValue(props.supportingText)}</p> : null}
    </article>
  )
}

function StudioAlert({ props }: { props: LooseObject }) {
  return (
    <aside className={`generated-alert emphasis-${stringValue(props.emphasis) ?? 'warning'}`}>
      <strong>{stringValue(props.title)}</strong>
      <p>{stringValue(props.message)}</p>
    </aside>
  )
}

function StudioTimeline({ props }: { props: LooseObject }) {
  const items = Array.isArray(props.items) ? props.items : []
  return (
    <section className="generated-card generated-list">
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      <ol>
        {items.map((item, index) => {
          const entry = objectValue(item) ?? {}
          return (
            <li key={stringValue(entry.id) ?? index}>
              <span className={`generated-status is-${stringValue(entry.status) ?? 'pending'}`} />
              <div>
                <strong>{stringValue(entry.title)}</strong>
                {stringValue(entry.detail) ? <p>{stringValue(entry.detail)}</p> : null}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

function StudioKeyValue({ props }: { props: LooseObject }) {
  const items = Array.isArray(props.items) ? props.items : []
  return (
    <section className="generated-card generated-key-values">
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      <dl>
        {items.map((item, index) => {
          const entry = objectValue(item) ?? {}
          return (
            <div key={stringValue(entry.key) ?? index}>
              <dt>{stringValue(entry.label)}</dt>
              <dd>{displayValue(entry.value)}</dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}

function StudioCompare({ props }: { props: LooseObject }) {
  const rows = Array.isArray(props.rows) ? props.rows : []
  return (
    <section className="generated-card generated-compare">
      <h3>{stringValue(props.title)}</h3>
      <div className="generated-compare-head">
        <span />
        <span>{stringValue(props.leftLabel)}</span>
        <span>{stringValue(props.rightLabel)}</span>
      </div>
      {rows.map((row, index) => {
        const entry = objectValue(row) ?? {}
        return (
          <div className="generated-compare-row" key={stringValue(entry.key) ?? index}>
            <strong>{stringValue(entry.label)}</strong>
            <span>{displayValue(entry.before)}</span>
            <span>{displayValue(entry.after)}</span>
          </div>
        )
      })}
    </section>
  )
}

function StudioStep({ props }: { props: LooseObject }) {
  return (
    <article className="generated-card generated-step">
      <span>{stringValue(props.status)}</span>
      <h3>{stringValue(props.title)}</h3>
      {stringValue(props.objective) ? <p>{stringValue(props.objective)}</p> : null}
      {stringValue(props.summary) ? <p>{stringValue(props.summary)}</p> : null}
    </article>
  )
}

function StudioSearchBar({ props }: { props: LooseObject }) {
  const label = stringValue(props.label)
  return (
    <label className="generated-search">
      {label ? <span>{label}</span> : null}
      <input
        type="search"
        readOnly
        placeholder={stringValue(props.placeholder) ?? 'Buscar…'}
        defaultValue={stringValue(props.value) ?? ''}
      />
    </label>
  )
}

function StudioDropdown({ props }: { props: LooseObject }) {
  const label = stringValue(props.label)
  const options = Array.isArray(props.options) ? props.options : []
  const selectedValue = stringValue(props.selectedValue)
  return (
    <label className="generated-dropdown">
      {label ? <span>{label}</span> : null}
      <select disabled defaultValue={selectedValue ?? ''}>
        {stringValue(props.placeholder) ? (
          <option value="" disabled>
            {stringValue(props.placeholder)}
          </option>
        ) : null}
        {options.map((option, index) => {
          const entry = objectValue(option) ?? {}
          const value = stringValue(entry.value) ?? String(index)
          return (
            <option key={value} value={value}>
              {stringValue(entry.label) ?? value}
            </option>
          )
        })}
      </select>
    </label>
  )
}

const CHART_COLORS = ['#7c5cff', '#dbff45', '#68b539', '#d05a43', '#4aa8d8', '#f0a63c']

function StudioChart({ props }: { props: LooseObject }) {
  const points = (Array.isArray(props.points) ? props.points : [])
    .map((point) => objectValue(point) ?? {})
    .map((entry) => ({
      label: stringValue(entry.label) ?? '',
      value: typeof entry.value === 'number' ? entry.value : Number(entry.value) || 0,
      color: hexColor(entry.color),
    }))
  const chartType = stringValue(props.chartType) ?? 'bar'
  const maxValue = Math.max(1, ...points.map((point) => point.value))

  return (
    <section className={`generated-card generated-chart emphasis-${stringValue(props.emphasis) ?? 'normal'}`}>
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      {chartType === 'pie' ? (
        <ChartPie points={points} />
      ) : chartType === 'line' ? (
        <ChartLine points={points} maxValue={maxValue} />
      ) : (
        <ChartBars points={points} maxValue={maxValue} />
      )}
    </section>
  )
}

type ChartDatum = { label: string; value: number; color: string | null }

function ChartBars({ points, maxValue }: { points: ChartDatum[]; maxValue: number }) {
  return (
    <div className="generated-chart-bars">
      {points.map((point, index) => (
        <div className="generated-chart-bar" key={`${point.label}-${index}`}>
          <div
            className="generated-chart-bar-fill"
            style={{
              height: `${Math.max(2, (point.value / maxValue) * 100)}%`,
              background: point.color ?? CHART_COLORS[index % CHART_COLORS.length],
            }}
          />
          <span className="generated-chart-value">{point.value}</span>
          <span className="generated-chart-label">{point.label}</span>
        </div>
      ))}
    </div>
  )
}

function ChartLine({ points, maxValue }: { points: ChartDatum[]; maxValue: number }) {
  const width = 100
  const height = 100
  const step = points.length > 1 ? width / (points.length - 1) : 0
  const coords = points.map((point, index) => {
    const x = points.length > 1 ? index * step : width / 2
    const y = height - (point.value / maxValue) * height
    return { x, y, point }
  })
  const path = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x},${coord.y}`).join(' ')
  const stroke = points.find((point) => point.color)?.color ?? 'var(--studio-violet)'

  return (
    <div className="generated-chart-line">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label="Gráfico de línea">
        <path d={path} fill="none" stroke={stroke} strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {coords.map((coord, index) => (
          <circle key={index} cx={coord.x} cy={coord.y} r={2} fill={stroke} />
        ))}
      </svg>
      <div className="generated-chart-line-labels">
        {points.map((point, index) => (
          <span key={`${point.label}-${index}`}>{point.label}</span>
        ))}
      </div>
    </div>
  )
}

function ChartPie({ points }: { points: ChartDatum[] }) {
  const total = points.reduce((sum, point) => sum + point.value, 0) || 1
  let cursor = 0
  const slices = points.map((point, index) => {
    const fraction = point.value / total
    const start = cursor
    cursor += fraction
    return { ...point, start, end: cursor, color: point.color ?? CHART_COLORS[index % CHART_COLORS.length] }
  })
  const gradient = slices
    .map((slice) => `${slice.color} ${(slice.start * 100).toFixed(2)}% ${(slice.end * 100).toFixed(2)}%`)
    .join(', ')

  return (
    <div className="generated-chart-pie">
      <div className="generated-chart-pie-circle" style={{ background: `conic-gradient(${gradient})` }} />
      <ul className="generated-chart-pie-legend">
        {slices.map((slice, index) => (
          <li key={`${slice.label}-${index}`}>
            <span style={{ background: slice.color }} />
            {slice.label} · {Math.round((slice.value / total) * 100)}%
          </li>
        ))}
      </ul>
    </div>
  )
}

function StudioTable({ props }: { props: LooseObject }) {
  const columns = Array.isArray(props.columns) ? props.columns.map((column) => stringValue(column) ?? '') : []
  const rows = Array.isArray(props.rows) ? props.rows : []
  return (
    <section className="generated-card generated-table">
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      <table>
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={`${column}-${index}`}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const cells = Array.isArray(row) ? row : []
            return (
              <tr key={rowIndex}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex}>{displayValue(cell)}</td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

function StudioProgress({ props }: { props: LooseObject }) {
  const value = Math.min(100, Math.max(0, typeof props.value === 'number' ? props.value : Number(props.value) || 0))
  const color = hexColor(props.color)
  return (
    <section className={`generated-card generated-progress emphasis-${stringValue(props.emphasis) ?? 'normal'}`}>
      <div className="generated-progress-head">
        <span>{stringValue(props.label)}</span>
        <strong>{Math.round(value)}%</strong>
      </div>
      <div className="generated-progress-track">
        <div
          className="generated-progress-fill"
          style={{ width: `${value}%`, ...(color ? { background: color } : null) }}
        />
      </div>
      {stringValue(props.supportingText) ? <p>{stringValue(props.supportingText)}</p> : null}
    </section>
  )
}

function StudioTags({ props }: { props: LooseObject }) {
  const items = Array.isArray(props.items) ? props.items : []
  return (
    <section className="generated-card generated-tags">
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      <div className="generated-tags-list">
        {items.map((item, index) => {
          const entry = objectValue(item) ?? {}
          const color = hexColor(entry.color)
          return (
            <span
              key={`${stringValue(entry.label) ?? index}`}
              className={`generated-tag is-${stringValue(entry.tone) ?? 'normal'}`}
              style={color ? { background: color, color: '#fff' } : undefined}
            >
              {stringValue(entry.label)}
            </span>
          )
        })}
      </div>
    </section>
  )
}

const WAYPOINT_KINDS = new Set(['origin', 'stop', 'destination'])
const SEGMENT_STATUSES = new Set(['planned', 'active', 'diverted'])
const EMPHASIS_VALUES = new Set(['normal', 'warning', 'critical'])

function toWaypoint(value: unknown, index: number): MapWaypoint | null {
  const entry = objectValue(value)
  if (!entry) return null
  const lat = numberValue(entry.lat)
  const lon = numberValue(entry.lon)
  if (lat === null || lon === null) return null
  const kind = stringValue(entry.kind)
  return {
    id: stringValue(entry.id) ?? `wp_${index}`,
    label: stringValue(entry.label) ?? `Punto ${index + 1}`,
    lat,
    lon,
    kind: (kind && WAYPOINT_KINDS.has(kind) ? kind : 'stop') as MapWaypoint['kind'],
  }
}

function toSegment(value: unknown): MapSegment | null {
  const entry = objectValue(value)
  if (!entry) return null
  const fromId = stringValue(entry.fromId)
  const toId = stringValue(entry.toId)
  if (!fromId || !toId) return null
  const status = stringValue(entry.status)
  return {
    fromId,
    toId,
    status: (status && SEGMENT_STATUSES.has(status) ? status : 'planned') as MapSegment['status'],
  }
}

function toMapProps(props: LooseObject): MapProps | null {
  const waypoints = (Array.isArray(props.waypoints) ? props.waypoints : [])
    .map(toWaypoint)
    .filter((waypoint): waypoint is MapWaypoint => waypoint !== null)
  if (waypoints.length < 2) return null

  const segments = (Array.isArray(props.segments) ? props.segments : [])
    .map(toSegment)
    .filter((segment): segment is MapSegment => segment !== null)

  const markerEntry = objectValue(props.marker)
  const markerLat = markerEntry ? numberValue(markerEntry.lat) : null
  const markerLon = markerEntry ? numberValue(markerEntry.lon) : null
  const marker =
    markerLat !== null && markerLon !== null
      ? { lat: markerLat, lon: markerLon, label: stringValue(markerEntry?.label) }
      : null

  const emphasis = stringValue(props.emphasis)

  return {
    title: stringValue(props.title),
    waypoints,
    segments,
    marker,
    emphasis: (emphasis && EMPHASIS_VALUES.has(emphasis) ? emphasis : 'normal') as Emphasis,
  }
}

function StudioMap({ props }: { props: LooseObject }) {
  const mapProps = toMapProps(props)
  if (!mapProps) {
    return (
      <section className="generated-card generated-alert emphasis-warning">
        <strong>Mapa incompleto</strong>
        <p>Este mapa necesita al menos dos puntos con coordenadas válidas.</p>
      </section>
    )
  }
  return <RouteMap {...mapProps} />
}

function StudioNode({ node }: { node: unknown }) {
  const record = objectValue(node)
  if (!record) return null
  const props = objectValue(record.props) ?? {}

  switch (stringValue(record.type)) {
    case 'page': return <StudioPage node={record} props={props} />
    case 'section': return <StudioSection node={record} props={props} />
    case 'button': return <StudioButton props={props} />
    case 'text': return <StudioText props={props} />
    case 'metric': return <StudioMetric props={props} />
    case 'alert': return <StudioAlert props={props} />
    case 'timeline': return <StudioTimeline props={props} />
    case 'keyValue': return <StudioKeyValue props={props} />
    case 'compare': return <StudioCompare props={props} />
    case 'step': return <StudioStep props={props} />
    case 'map': return <StudioMap props={props} />
    case 'searchBar': return <StudioSearchBar props={props} />
    case 'dropdown': return <StudioDropdown props={props} />
    case 'chart': return <StudioChart props={props} />
    case 'table': return <StudioTable props={props} />
    case 'progress': return <StudioProgress props={props} />
    case 'tags': return <StudioTags props={props} />
    default: return <>{renderChildren(record)}</>
  }
}

export interface StudioOrchestrationMeta {
  reasoningEffort: string | null
  feedbackAverage: number | null
  feedbackCount: number | null
  historyTurns: number | null
  usedPreviousLayout: boolean | null
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function boolValue(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null
}

/** Parse the backend's per-generation orchestration telemetry, if present. */
export function studioOrchestration(response: unknown): StudioOrchestrationMeta | null {
  const orchestration = objectValue(objectValue(response)?.orchestration)
  if (!orchestration) return null
  return {
    reasoningEffort: stringValue(orchestration.reasoningEffort),
    feedbackAverage: numberValue(orchestration.feedbackAverage),
    feedbackCount: numberValue(orchestration.feedbackCount),
    historyTurns: numberValue(orchestration.historyTurns),
    usedPreviousLayout: boolValue(orchestration.usedPreviousLayout),
  }
}

/**
 * A one-line structural outline of a layout tree, e.g.
 * ``page 'Perfil' [alert, section(column) [button 'Seguir', button 'Mensaje']]``
 * — the same shape the backend smoke script prints, so the console reads like
 * the transcript the team already knows.
 */
export function summarizeLayout(layout: unknown): { outline: string; nodeCount: number } {
  let nodeCount = 0

  const walk = (node: unknown): string => {
    const record = objectValue(node)
    if (!record) return ''
    nodeCount += 1
    const props = objectValue(record.props) ?? {}
    const type = stringValue(record.type) ?? 'node'
    let label: string = type
    if (type === 'button') label = `button '${stringValue(props.label) ?? ''}'`
    else if (type === 'text') label = `text/${stringValue(props.variant) ?? 'body'}`
    else if (type === 'section') label = `section(${stringValue(props.direction) ?? 'column'})`
    else if (type === 'page') label = `page '${stringValue(props.title) ?? ''}'`
    else if (type === 'chart') label = `chart/${stringValue(props.chartType) ?? 'bar'}`
    else if (type === 'dropdown') label = `dropdown '${stringValue(props.label) ?? ''}'`
    else if (type === 'searchBar') label = `searchBar '${stringValue(props.label) ?? ''}'`
    const children = nodeChildren(record)
    if (children.length) {
      return `${label} [${children.map(walk).filter(Boolean).join(', ')}]`
    }
    return label
  }

  const outline = walk(objectValue(layout) ? layout : null)
  return { outline, nodeCount }
}

export function studioResponseMeta(response: unknown): {
  conversationId: string | null
  generatedBy: string | null
  reason: string | null
  suggestion: string | null
  layout: unknown
  rootBlocks: number
} {
  const payload = objectValue(response)
  const layout = objectValue(payload?.layout)
  return {
    conversationId: stringValue(payload?.conversationId),
    generatedBy: stringValue(payload?.generatedBy),
    reason: stringValue(payload?.reason),
    suggestion: stringValue(payload?.suggestion),
    layout: payload?.layout,
    rootBlocks: layout ? nodeChildren(layout).length : 0,
  }
}

export default function StudioRenderer({ response }: { response: unknown }) {
  return <StudioNode node={objectValue(response)?.layout} />
}
