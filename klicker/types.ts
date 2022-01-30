import { Location, Route } from "vue-router"

export interface Config extends Record<string, Cube> {}

// helper function which infers keys and restricts values to ElementType
export const asDimensions = <T>(et: { [K in keyof T]: Dimension }) => et
export const asNumberMetrics = <T>(et: { [K in keyof T]: Metric<number> }) => et
export const asStringMetrics = <T>(et: { [K in keyof T]: Metric<string> }) => et
export const asSlice = <T>(et: { [K in keyof T]: Slice }) => et

export type ValueTypeNumber = 'quantitative'|'ordinal'
export type ValueTypeString = 'temporal'|'nominal'
export type ValueType = ValueTypeNumber | ValueTypeString
export type MetricType = 'number'|'count'|'countDistinct'|'countDistinctApprox'|'sum'|'avg'|'min'|'max'|'runningTotal'
export type DimensionType = 'time'|'string'|'number'|'boolean'|'geo'
export type OperatorType = 'equals'|'notEquals'|'contains'|'notContains'|'gt'|'gte'|'lt'|'lte'|'set'|'notSet'|'inDateRange'|'notInDateRange'|'beforeDate'|'afterDate'
export type FormatType = 'duration'|'y/n'|'formatMode'|string // or date format or d3-format spec

export interface Cube {
  id: string
  table: string
  name: string
  hidden?: boolean
  dimensions: Dimension[]
  defaultDimensionsIds: string[]
  metrics: Metric<any>[]
  defaultMetricIds: string[]
  slices: Slice[]
  defaultSliceValues: SliceValue
  /**
   * deprecate
   */
  // ids
  metaMetrics: string[]
}

/**
 * Metric which will be transformed into a cube.js measure
 * with id `${id}_measure`.
 */
export interface Metric<T=string|number> {
  id: string
  type: T extends string ? ValueTypeString : ValueTypeNumber
  // TODO move all `name`s to en.json
  name?: string
  description?: string
  formatter?: string
  d3formatter?: string
  sign: number
  transform?: (entries: MetaGridEntry[]) => T[]
  /**
   * Vega.js encoding configuration
   * @see https://vega.github.io/vega-lite/docs/encoding.html
   */
  vega?: any
  /**
   * cube.js configuration.
   */
  config: {
    sql: string
    type: MetricType
  }
  /**
   * Configuration for statistical tests and confidence intervals
   */
  statistics?: {
    test?: {
      name: string
      test(referenceMetrics: MetaGridEntry['metricsRaw'], testMetrics: MetaGridEntry['metricsRaw']): number
      requiresMetrics: string[]
    }
    ci?: {
      ci(data: MetaGridEntry['metricsRaw']): ConfidenceInterval
      requiresMetrics: string[]
    }
  }
}

/**
 * Dimension which will be transformed into a cube.js dimension
 * with id `${id}_dimension`.
 */
export interface Dimension {
  id: string
  // TODO move all `name`s to en.json
  name?: string
  /**
   * IDs of the dimensions that this dimension aggregates.
   */
  childIds?: string[]
  /**
   * Column which contains a human-readable identifier.
   * May be the dimension or one of additionalMetrics.
   */
  naturalIdAttribute: string
  /**
   * Specification to use for formatting the natural ID.
   */
  formatter?: FormatType
  /**
   * Metrics to always request when requesting dimension.
   * Used for attributes of SCDs.
   */
  additionalMetrics: string[]
  hidden?: boolean
  type: ValueType
  /**
   * Vega.js scale configuration
   * @see https://vega.github.io/vega-lite/docs/scale.html
   */
  scale?: any
  /**
   * cube.js configuration.
   */
  config: {
    sql: string
    type: DimensionType
  }
}

export interface Slice {
  id: string
  config: { // cube.js config
    member: string // dimension/measure id
    operator: OperatorType
  }
  // TODO: for description
  // formatter: string
}

export interface SliceValue extends Record<string, (string|undefined)[]> { }

export type SliceValueUpdateListener = (s: Partial<SliceValue>) => void

export interface VisualisationProp {
  name: string
  /**
   * Component to bind to
   */
  component: string
  /**
   * Component import (optional, for non-global components)
   */
  import?: () => Promise<any>
  /**
   * HTML attributes or props to apply to the validator
   */
  props: Record<string, any>
}

export interface WidgetSpec {
  name: string
  component: string
  import: () => Promise<any>
}

export interface StaticWidgetSpec extends WidgetSpec {
  /**
   * Grid cells are 150px * 150px per unit.
   */
  initialDimensions: {
    rows: number
    columns: number
  }
  resizable?: boolean
  scalable?: boolean
  props?: Record<string, VisualisationProp>
}

export interface VisualisationSpec extends StaticWidgetSpec {
  applicable(dimensions: Dimension[], metrics: Metric[], size: number, comparing: boolean, data: MetaGridEntry[]|MetaGridEntryDiff[]): boolean
  recommended?(dimensions: Dimension[], metrics: Metric[], size: number, comparing: boolean, data: MetaGridEntry[]|MetaGridEntryDiff[]): boolean
}

export interface SlicerSpec extends WidgetSpec {
  applicable(dimensions: Dimension[], metrics: Metric[], cubeId: string): boolean
}

export interface ConfidenceInterval {
  lower: number
  mean: number
  upper: number
}

export interface MetaGridEntry {
  id: string
  dimensionsRaw: Record<string, Record<string, string>>
  metricsRaw: Record<string, number|string>
  metricsCI: Record<string, ConfidenceInterval>
  dimensions: Record<string, string>
  metrics: Record<string, string>
}

export interface ComparingMetaGridEntry extends MetaGridEntry {
  test: {
    reference: MetaGridEntry
    difference: MetaGridEntryDiff
  }
}

export interface MetaGridEntryTiered extends MetaGridEntry {
  tier: string
}

export interface MetaGridEntryDiff {
  differenceRaw: number
  difference: string
  annotatedDifference: string
  pValueRaw: number
  pValueStars: string
}

export interface AbstractCubeResponse<Q extends CubeQuery, M extends MetaGridEntry> {
  kind: string
  query: Q
  data: M[]
}

export interface CubeResponse extends AbstractCubeResponse<CubeQuery, MetaGridEntry> {
  kind: 'response'
}

export interface CubeComparingResponse extends AbstractCubeResponse<CubeComparingQuery, ComparingMetaGridEntry> {
  kind: 'comparingResponse'
}

export interface CubeQuery {
  cubeId: string
  slices: SliceValue
  dimensionsIds: string[]
  metricsIds: string[]
  limit?: number
  sortId: string
  comparing?: boolean
  confidenceInterval?: boolean
  name?: string
}

export type CubeQueryFilter = (e: MetaGridEntry) => boolean

export interface CubeComparingQuery extends CubeQuery {
  comparing: true
  reference: CubeQuery
}

export type CubeComparingQueryFilter = (e: ComparingMetaGridEntry) => boolean

export interface Report {
  id: number|undefined
  created_at?: string
  updated_at?: string
  title: string
  width: number
  height: number
  widgets: ReportWidget[]
}

export interface Widget {
  id: string
  query: CubeQuery|CubeComparingQuery|undefined
  component: string
  props: Record<string, any>
}

export interface ReportWidget extends Widget {
  frame: {
    translate: number[]
    scale: number[]
    rotate: number
    width: number
    height: number
  }
}

export interface Grid {
  id: number|undefined
  created_at?: string
  updated_at?: string
  title: string
  widgets: GridWidget[]
}

export interface GridWidget extends Widget {
  frame: {
    rows: number
    columns: number
  }
}

export interface User {
  id: number
  reports: Report[]
  grids: Grid[]
}

export interface KlickerService {
  config: Config
  visualisations: VisualisationSpec[]
  staticWidgets: StaticWidgetSpec[]
  slicers: SlicerSpec[]

  $t(key: string, args?: Record<string, string|number>): string

  $te(key: string): boolean

  format(spec: { type: ValueType, formatter?: string }, value: number|string|string[]): string

  getName(m: Metric|Dimension, modifier?: string): string

  /**
   * @param query Query specification
   * @param filter Filter to apply after client-side joins and transformations
   */
  query(query: CubeQuery, filter?: CubeQueryFilter): Promise<CubeResponse>

  /**
   * @param query Query specification
   * @param filter Filter to apply after client-side joins and transformations
   */
  comparingQuery(query: CubeComparingQuery, filter?: CubeComparingQueryFilter): Promise<CubeComparingResponse>

  convertQueryToLocation(query: CubeQuery|CubeComparingQuery): Location
  convertLocationToQuery(config: Config, defaultCubeId: string, route: Route): CubeQuery|CubeComparingQuery

  convertSlicesToLocation(slices: SliceValue): Location
  convertLocationToSlices(route: Route, defaults: SliceValue): SliceValue
}