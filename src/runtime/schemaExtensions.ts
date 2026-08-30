type SchemaRecord = Record<string, unknown>

function record(value: unknown): SchemaRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as SchemaRecord)
    : null
}

const latitude = { type: 'number', minimum: -90, maximum: 90 }
const longitude = { type: 'number', minimum: -180, maximum: 180 }

const mapDefinitions: SchemaRecord = {
  MapWaypoint: {
    type: 'object',
    title: 'MapWaypoint',
    additionalProperties: false,
    required: ['id', 'label', 'lat', 'lon', 'kind'],
    properties: {
      id: { type: 'string', minLength: 1, maxLength: 80 },
      label: { type: 'string', minLength: 1, maxLength: 120 },
      lat: latitude,
      lon: longitude,
      kind: { type: 'string', enum: ['origin', 'stop', 'destination'] },
    },
  },
  MapMarker: {
    type: 'object',
    title: 'MapMarker',
    additionalProperties: false,
    required: ['lat', 'lon', 'label'],
    properties: {
      lat: latitude,
      lon: longitude,
      label: { type: 'string', minLength: 1, maxLength: 120 },
    },
  },
  MapSegment: {
    type: 'object',
    title: 'MapSegment',
    additionalProperties: false,
    required: ['from', 'to', 'status'],
    properties: {
      from: { type: 'string', minLength: 1, maxLength: 80 },
      to: { type: 'string', minLength: 1, maxLength: 80 },
      status: { type: 'string', enum: ['planned', 'active', 'diverted'] },
    },
  },
  MapProps: {
    type: 'object',
    title: 'MapProps',
    additionalProperties: false,
    required: ['waypoints', 'segments'],
    properties: {
      waypoints: {
        type: 'array',
        minItems: 2,
        maxItems: 12,
        items: { $ref: '#/$defs/MapWaypoint' },
      },
      marker: {
        anyOf: [{ $ref: '#/$defs/MapMarker' }, { type: 'null' }],
        default: null,
      },
      segments: {
        type: 'array',
        minItems: 1,
        maxItems: 16,
        items: { $ref: '#/$defs/MapSegment' },
      },
      emphasis: {
        type: 'string',
        enum: ['normal', 'warning', 'critical'],
        default: 'normal',
      },
    },
  },
  MapNode: {
    type: 'object',
    title: 'MapNode',
    additionalProperties: false,
    required: ['id', 'type', 'props'],
    properties: {
      id: {
        type: 'string',
        minLength: 4,
        maxLength: 131,
        pattern: '^ui_[a-z0-9][a-z0-9_-]{0,127}$',
      },
      type: { type: 'string', const: 'map' },
      props: { $ref: '#/$defs/MapProps' },
    },
  },
}

function addMapToNodeUnions(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(addMapToNodeUnions)
    return
  }

  const node = record(value)
  if (!node) return

  const discriminator = record(node.discriminator)
  const mapping = record(discriminator?.mapping)
  if (
    discriminator?.propertyName === 'type' &&
    mapping?.page === '#/$defs/PageNode' &&
    mapping.section === '#/$defs/SectionNode'
  ) {
    mapping.map = '#/$defs/MapNode'
    const oneOf = Array.isArray(node.oneOf) ? node.oneOf : []
    if (!oneOf.some((item) => record(item)?.$ref === '#/$defs/MapNode')) {
      oneOf.push({ $ref: '#/$defs/MapNode' })
      node.oneOf = oneOf
    }
  }

  Object.values(node).forEach(addMapToNodeUnions)
}

/**
 * Extends the checked-in Pydantic v1 schema at runtime while backend lands the
 * approved v1.1 schema. Generated files stay untouched and remain traceable to
 * their backend source.
 */
export function withFrontendV11Extensions(input: unknown): SchemaRecord {
  const cloned = JSON.parse(JSON.stringify(input)) as SchemaRecord
  const definitions = record(cloned.$defs)
  if (!definitions) {
    throw new Error('El JSON Schema runtime no contiene $defs.')
  }

  Object.assign(definitions, mapDefinitions)

  const runProjection = record(definitions.RunProjection)
  const projectionProperties = record(runProjection?.properties)
  if (projectionProperties) {
    projectionProperties.operationId = {
      anyOf: [
        { type: 'string', minLength: 1, maxLength: 160 },
        { type: 'null' },
      ],
      default: null,
    }
  }

  addMapToNodeUnions(cloned)
  return cloned
}
