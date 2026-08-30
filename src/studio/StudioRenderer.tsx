import type { CSSProperties, ReactNode } from 'react'

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

function StudioPage({ node }: { node: LooseObject }) {
  return (
    <main className="generated-page">
      <div className="generated-page-content">{renderChildren(node)}</div>
    </main>
  )
}

function StudioSection({ node, props }: { node: LooseObject; props: LooseObject }) {
  const title = stringValue(props.title)
  const description = stringValue(props.description)
  return (
    <section className={`generated-section emphasis-${stringValue(props.emphasis) ?? 'normal'}`}>
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
  return (
    <button type="button" className={`generated-button is-${variant} is-${size}`}>
      {stringValue(props.label) ?? ''}
    </button>
  )
}

function StudioText({ props }: { props: LooseObject }) {
  const content = stringValue(props.content) ?? ''
  const variant = stringValue(props.variant) ?? 'body'
  if (variant === 'heading') return <h2 className="generated-text is-heading">{content}</h2>
  if (variant === 'caption') return <small className="generated-text is-caption">{content}</small>
  return <p className="generated-text">{content}</p>
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

function StudioMap({ props }: { props: LooseObject }) {
  const waypoints = Array.isArray(props.waypoints) ? props.waypoints : []
  return (
    <section className="generated-card generated-route">
      {stringValue(props.title) ? <h3>{stringValue(props.title)}</h3> : null}
      <div>
        {waypoints.map((waypoint, index) => {
          const entry = objectValue(waypoint) ?? {}
          return (
            <article key={stringValue(entry.id) ?? index}>
              <span>{index + 1}</span>
              <strong>{stringValue(entry.label)}</strong>
              <small>{displayValue(entry.lat)}, {displayValue(entry.lon)}</small>
            </article>
          )
        })}
      </div>
    </section>
  )
}

function StudioNode({ node }: { node: unknown }) {
  const record = objectValue(node)
  if (!record) return null
  const props = objectValue(record.props) ?? {}

  switch (stringValue(record.type)) {
    case 'page': return <StudioPage node={record} />
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
    default: return <>{renderChildren(record)}</>
  }
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
