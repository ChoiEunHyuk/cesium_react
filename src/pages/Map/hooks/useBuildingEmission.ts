import { useState, useCallback, useRef, useEffect } from 'react'
import * as Cesium from 'cesium'

export interface EmissionColorRange {
  min: number
  max: number
  color: string
  label: string
}

export const parcelEmissionColors: EmissionColorRange[] = [
  { min: 0,    max: 0.1,     color: '#ffffb2', label: '0 ~ 0.1 tCO2' },
  { min: 0.1,  max: 0.5,     color: '#fed976', label: '0.1 ~ 0.5 tCO2' },
  { min: 0.5,  max: 2.0,     color: '#fd8d3c', label: '0.5 ~ 2.0 tCO2' },
  { min: 2.0,  max: 10.0,    color: '#e31a1c', label: '2.0 ~ 10.0 tCO2' },
  { min: 10.0, max: Infinity, color: '#800026', label: '10.0+ tCO2' },
]

export const parcelGasEmissionColors: EmissionColorRange[] = [
  { min: 0,    max: 0.1,     color: '#f2f0f7', label: '0 ~ 0.1 tCO2' },
  { min: 0.1,  max: 0.5,     color: '#cbc9e2', label: '0.1 ~ 0.5 tCO2' },
  { min: 0.5,  max: 2.0,     color: '#9e9ac8', label: '0.5 ~ 2.0 tCO2' },
  { min: 2.0,  max: 10.0,    color: '#756bb1', label: '2.0 ~ 10.0 tCO2' },
  { min: 10.0, max: Infinity, color: '#54278f', label: '10.0+ tCO2' },
]

export const grid1kmEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 5,       color: '#ffffb2', label: '0 ~ 5 tCO2' },
  { min: 5,   max: 20,      color: '#fed976', label: '5 ~ 20 tCO2' },
  { min: 20,  max: 100,     color: '#fd8d3c', label: '20 ~ 100 tCO2' },
  { min: 100, max: 500,     color: '#e31a1c', label: '100 ~ 500 tCO2' },
  { min: 500, max: Infinity, color: '#800026', label: '500+ tCO2' },
]

export const grid500mEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 1,       color: '#ffffb2', label: '0 ~ 1 tCO2' },
  { min: 1,   max: 5,       color: '#fed976', label: '1 ~ 5 tCO2' },
  { min: 5,   max: 25,      color: '#fd8d3c', label: '5 ~ 25 tCO2' },
  { min: 25,  max: 125,     color: '#e31a1c', label: '25 ~ 125 tCO2' },
  { min: 125, max: Infinity, color: '#800026', label: '125+ tCO2' },
]

export const grid100mEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 0.1,     color: '#ffffb2', label: '0 ~ 0.1 tCO2' },
  { min: 0.1, max: 0.5,     color: '#fed976', label: '0.1 ~ 0.5 tCO2' },
  { min: 0.5, max: 2,       color: '#fd8d3c', label: '0.5 ~ 2 tCO2' },
  { min: 2,   max: 10,      color: '#e31a1c', label: '2 ~ 10 tCO2' },
  { min: 10,  max: Infinity, color: '#800026', label: '10+ tCO2' },
]

export const gridGas1kmEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 5,       color: '#f2f0f7', label: '0 ~ 5 tCO2' },
  { min: 5,   max: 20,      color: '#cbc9e2', label: '5 ~ 20 tCO2' },
  { min: 20,  max: 100,     color: '#9e9ac8', label: '20 ~ 100 tCO2' },
  { min: 100, max: 500,     color: '#756bb1', label: '100 ~ 500 tCO2' },
  { min: 500, max: Infinity, color: '#54278f', label: '500+ tCO2' },
]

export const gridGas500mEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 1,       color: '#f2f0f7', label: '0 ~ 1 tCO2' },
  { min: 1,   max: 5,       color: '#cbc9e2', label: '1 ~ 5 tCO2' },
  { min: 5,   max: 25,      color: '#9e9ac8', label: '5 ~ 25 tCO2' },
  { min: 25,  max: 125,     color: '#756bb1', label: '25 ~ 125 tCO2' },
  { min: 125, max: Infinity, color: '#54278f', label: '125+ tCO2' },
]

export const gridGas100mEmissionColors: EmissionColorRange[] = [
  { min: 0,   max: 0.1,     color: '#f2f0f7', label: '0 ~ 0.1 tCO2' },
  { min: 0.1, max: 0.5,     color: '#cbc9e2', label: '0.1 ~ 0.5 tCO2' },
  { min: 0.5, max: 2,       color: '#9e9ac8', label: '0.5 ~ 2 tCO2' },
  { min: 2,   max: 10,      color: '#756bb1', label: '2 ~ 10 tCO2' },
  { min: 10,  max: Infinity, color: '#54278f', label: '10+ tCO2' },
]

const GRID_EMISSION_COLORS: Record<string, Record<string, EmissionColorRange[]>> = {
  'elec': {
    '1KM':  grid1kmEmissionColors,
    '500M': grid500mEmissionColors,
    '100M': grid100mEmissionColors,
  },
  'gas': {
    '1KM':  gridGas1kmEmissionColors,
    '500M': gridGas500mEmissionColors,
    '100M': gridGas100mEmissionColors,
  },
}

export interface ParcelDetail {
  pnu: string
  lotAddress: string | null
  roadAddress: string | null
  useYm: string | null
  energyType: string
  usageKwh: number | null
  elecCo2: number | null
  gasCo2: number | null
  [key: string]: unknown
}

export interface SelectedParcel {
  data: ParcelDetail
  screenX: number
  screenY: number
}

export interface GridDetail {
  gid: string | null
  parcelCount: number | null
  totalKwh: number | null
  elecCo2: number | null
  gasCo2: number | null
}

export interface SelectedGrid {
  data: GridDetail
  screenX: number
  screenY: number
}

type CesiumViewerRef = React.MutableRefObject<Cesium.Viewer | null>

export interface UseBuildingEmissionReturn {
  isLoading: boolean
  isLoaded: boolean
  activeItemType: ItemType | null
  activeDetail: string
  activeEnergyType: string
  emissionColors: EmissionColorRange[]
  selectedParcel: SelectedParcel | null
  isDetailLoading: boolean
  selectedGrid: SelectedGrid | null
  isGridDetailLoading: boolean
  search: (pnuCode: string, useYm: string, itemType: ItemType, detail: string, energyType: string) => Promise<void>
  clearData: () => void
  clearSelected: () => void
  clearSelectedGrid: () => void
  cleanup: () => void
}

type ItemType = 'parcel' | 'grid'

const GEOSERVER_WMS = '/geoserver/goyang/wms'
const PARCEL_LAYERS: Record<string, string> = {
  'elec': 'goyang:elec_energy',
  'gas':  'goyang:gas_energy',
}
const PARCEL_STYLES: Record<string, string> = {
  'elec': 'energy_elec_style',
  'gas':  'energy_gas_style',
}
const GRID_LAYERS: Record<string, Record<string, string>> = {
  'elec': {
    '1KM':  'goyang:grid_elec_1km',
    '500M': 'goyang:grid_elec_500m',
    '100M': 'goyang:grid_elec_100m',
  },
  'gas': {
    '1KM':  'goyang:grid_gas_1km',
    '500M': 'goyang:grid_gas_500m',
    '100M': 'goyang:grid_gas_100m',
  },
}
const GRID_STYLES: Record<string, Record<string, string>> = {
  'elec': {
    '1KM':  'grid_elec_1km_style',
    '500M': 'grid_elec_500m_style',
    '100M': 'grid_elec_100m_style',
  },
  'gas': {
    '1KM':  'grid_gas_1km_style',
    '500M': 'grid_gas_500m_style',
    '100M': 'grid_gas_100m_style',
  },
}

const HIGHLIGHT_FILL  = Cesium.Color.fromCssColorString('#FFD700').withAlpha(0.25)
const HIGHLIGHT_OUTLINE = Cesium.Color.fromCssColorString('#FFD700')

type GeoJsonGeometry =
  | { type: 'Polygon';      coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

function applyHighlight(viewer: Cesium.Viewer, ds: Cesium.GeoJsonDataSource) {
  for (const entity of ds.entities.values) {
    if (!entity.polygon) continue
    entity.polygon.material = new Cesium.ColorMaterialProperty(HIGHLIGHT_FILL)
    entity.polygon.outline = new Cesium.ConstantProperty(true)
    entity.polygon.outlineColor = new Cesium.ConstantProperty(HIGHLIGHT_OUTLINE)
    entity.polygon.outlineWidth = new Cesium.ConstantProperty(3)
  }
  viewer.dataSources.add(ds)
}

export function useBuildingEmission(viewerRef: CesiumViewerRef): UseBuildingEmissionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeItemType, setActiveItemType] = useState<ItemType | null>(null)
  const [activeDetail, setActiveDetail] = useState<string>('')
  const [activeEnergyType, setActiveEnergyType] = useState<string>('')
  const [selectedParcel, setSelectedParcel] = useState<SelectedParcel | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedGrid, setSelectedGrid] = useState<SelectedGrid | null>(null)
  const [isGridDetailLoading, setIsGridDetailLoading] = useState(false)

  const wmsLayerRef     = useRef<Cesium.ImageryLayer | null>(null)
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)
  const currentParamsRef = useRef<{ pnuCode: string; useYm: string; energyType: string } | null>(null)
  const highlightDsRef  = useRef<Cesium.GeoJsonDataSource | null>(null)

  const clearHighlight = useCallback(() => {
    if (viewerRef.current && highlightDsRef.current) {
      viewerRef.current.dataSources.remove(highlightDsRef.current, true)
      highlightDsRef.current = null
    }
  }, [viewerRef])

  const search = useCallback(async (pnuCode: string, useYm: string, itemType: ItemType, detail: string, energyType: string) => {
    if (!viewerRef.current || isLoading) return
    setIsLoading(true)

    if (wmsLayerRef.current) {
      viewerRef.current.imageryLayers.remove(wmsLayerRef.current, true)
      wmsLayerRef.current = null
    }
    if (clickHandlerRef.current) {
      clickHandlerRef.current.destroy()
      clickHandlerRef.current = null
    }
    clearHighlight()
    setSelectedParcel(null)
    setActiveItemType(itemType)
    setActiveDetail(detail)
    setActiveEnergyType(energyType)

    const layerName: string = itemType === 'grid'
      ? (GRID_LAYERS[energyType]?.[detail] ?? 'goyang:grid_elec_1km')
      : (PARCEL_LAYERS[energyType] ?? 'goyang:elec_energy')
    const styleName: string = itemType === 'grid'
      ? (GRID_STYLES[energyType]?.[detail] ?? 'grid_elec_1km_style')
      : (PARCEL_STYLES[energyType] ?? 'energy_elec_style')

    try {
      const provider = new Cesium.WebMapServiceImageryProvider({
        url: GEOSERVER_WMS,
        layers: layerName,
        parameters: {
          format: 'image/png',
          transparent: true,
          styles: styleName,
          viewparams: `useYm:${useYm};pnuCode:${pnuCode}`,
        },
        getFeatureInfoFormats: [
          new Cesium.GetFeatureInfoFormat('json', 'application/json'),
        ],
      })

      const layer = viewerRef.current.imageryLayers.addImageryProvider(provider)
      layer.alpha = 0.85
      wmsLayerRef.current = layer
      currentParamsRef.current = { pnuCode, useYm, energyType }
      setIsLoaded(true)

      if (itemType === 'grid') {
        const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)
        handler.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          if (!viewerRef.current || !wmsLayerRef.current) return

          const viewer = viewerRef.current
          const position = click.position

          // 클릭 위치의 지리 좌표 추출
          const ray = viewer.camera.getPickRay(position)
          if (!ray) return
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            ?? viewer.camera.pickEllipsoid(position)
          if (!cartesian) return

          const carto = Cesium.Cartographic.fromCartesian(cartesian)
          const lon = Cesium.Math.toDegrees(carto.longitude)
          const lat = Cesium.Math.toDegrees(carto.latitude)

          setIsGridDetailLoading(true)
          setSelectedGrid(null)

          try {
            // viewparams를 명시적으로 포함한 GetFeatureInfo 직접 요청
            const delta = 0.001
            const params = new URLSearchParams({
              SERVICE: 'WMS',
              VERSION: '1.1.1',
              REQUEST: 'GetFeatureInfo',
              LAYERS: layerName,
              QUERY_LAYERS: layerName,
              STYLES: styleName,
              viewparams: `useYm:${useYm};pnuCode:${pnuCode}`,
              INFO_FORMAT: 'application/json',
              FEATURE_COUNT: '1',
              X: '50',
              Y: '50',
              WIDTH: '101',
              HEIGHT: '101',
              BBOX: `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`,
              SRS: 'EPSG:4326',
            })

            const res = await fetch(`${GEOSERVER_WMS}?${params.toString()}`)
            if (!res.ok) return

            const json = await res.json() as { features?: { properties: Record<string, unknown> }[] }
            const props = json.features?.[0]?.properties
            if (!props) return

            const isGas = energyType === 'gas'
            setSelectedGrid({
              data: {
                gid:         props['gid']          != null ? String(props['gid'])          : null,
                parcelCount: props['parcel_count'] != null ? Number(props['parcel_count']) : null,
                totalKwh:    props['total_kwh']    != null ? Number(props['total_kwh'])    : null,
                elecCo2:     !isGas && props['elec_co2'] != null ? Number(props['elec_co2']) : null,
                gasCo2:      isGas  && props['gas_co2']  != null ? Number(props['gas_co2'])  : null,
              },
              screenX: position.x,
              screenY: position.y,
            })
          } catch {
            // 실패 시 무시
          } finally {
            setIsGridDetailLoading(false)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        clickHandlerRef.current = handler
      }

      if (itemType === 'parcel') {
        const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)
        handler.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          if (!viewerRef.current || !currentParamsRef.current || !wmsLayerRef.current) return

          const viewer = viewerRef.current
          const position = click.position
          const { useYm: ym, energyType: etype } = currentParamsRef.current

          const ray = viewer.camera.getPickRay(position)
          if (!ray) return
          const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(ray, viewer.scene)
          if (!featuresPromise) return

          setIsDetailLoading(true)
          setSelectedParcel(null)
          clearHighlight()

          try {
            const features = await featuresPromise
            const wmsFeature = features?.find(f => f.imageryLayer === wmsLayerRef.current)
            if (!wmsFeature?.data) return

            const props = (wmsFeature.data as { properties?: Record<string, unknown> }).properties
                       ?? (wmsFeature.data as Record<string, unknown>)
            const pnu = String(props['pnu'] ?? '')
            if (!pnu) return

            const detailEndpoint = etype === 'gas'
              ? `/crbEmss/getGasParcelByPnu.do?pnu=${encodeURIComponent(pnu)}&useYm=${ym}`
              : `/crbEmss/getParcelByPnu.do?pnu=${encodeURIComponent(pnu)}&useYm=${ym}`

            const [dataRes, geomRes] = await Promise.all([
              fetch(detailEndpoint),
              fetch(`/crbEmss/getParcelGeom.do?pnu=${encodeURIComponent(pnu)}`),
            ])

            if (!dataRes.ok) return
            const data = await dataRes.json()

            setSelectedParcel({
              data: {
                pnu: data.pnu ?? null,
                lotAddress: data.lotAddress ?? null,
                roadAddress: null,
                useYm: ym,
                energyType: etype,
                usageKwh: data.usageKwh ?? null,
                elecCo2: data.elecCo2 ?? null,
                gasCo2: data.gasCo2 ?? null,
              },
              screenX: position.x,
              screenY: position.y,
            })

            if (geomRes.ok && viewerRef.current) {
              const { geom } = await geomRes.json() as { geom: string }
              const geometry = JSON.parse(geom) as GeoJsonGeometry
              const geojson = { type: 'Feature', geometry, properties: {} }
              const ds = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: true })
              applyHighlight(viewerRef.current, ds)
              highlightDsRef.current = ds
            }
          } catch {
            // 실패 시 무시
          } finally {
            setIsDetailLoading(false)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        clickHandlerRef.current = handler
      }
    } catch (error) {
      console.error('WMS 레이어 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [viewerRef, isLoading, clearHighlight])

  const clearData = useCallback(() => {
    if (viewerRef.current && wmsLayerRef.current) {
      viewerRef.current.imageryLayers.remove(wmsLayerRef.current, true)
      wmsLayerRef.current = null
    }
    if (clickHandlerRef.current) {
      clickHandlerRef.current.destroy()
      clickHandlerRef.current = null
    }
    clearHighlight()
    currentParamsRef.current = null
    setIsLoaded(false)
    setActiveItemType(null)
    setActiveDetail('')
    setActiveEnergyType('')
    setSelectedParcel(null)
    setSelectedGrid(null)
  }, [viewerRef, clearHighlight])

  const clearSelected = useCallback(() => {
    clearHighlight()
    setSelectedParcel(null)
  }, [clearHighlight])

  const clearSelectedGrid = useCallback(() => {
    setSelectedGrid(null)
  }, [])

  const cleanup = useCallback(() => {
    clearData()
  }, [clearData])

  useEffect(() => {
    return () => {
      if (clickHandlerRef.current) {
        clickHandlerRef.current.destroy()
        clickHandlerRef.current = null
      }
    }
  }, [])

  const emissionColors = activeItemType === 'grid'
    ? (GRID_EMISSION_COLORS[activeEnergyType]?.[activeDetail] ?? grid1kmEmissionColors)
    : (activeEnergyType === 'gas' ? parcelGasEmissionColors : parcelEmissionColors)

  return {
    isLoading,
    isLoaded,
    activeItemType,
    activeDetail,
    activeEnergyType,
    emissionColors,
    selectedParcel,
    isDetailLoading,
    selectedGrid,
    isGridDetailLoading,
    search,
    clearData,
    clearSelected,
    clearSelectedGrid,
    cleanup,
  }
}
