import { useState, useCallback, useRef, useEffect } from 'react'
import * as Cesium from 'cesium'

export interface CarbonColorRange {
  min: number
  max: number
  color: string
  label: string
}

export const forestAbsorptionColors: CarbonColorRange[] = [
  { min: 0,  max: 5,        color: '#edf8e9', label: '0 ~ 5 tCO2/년' },
  { min: 5,  max: 15,       color: '#bae4b3', label: '5 ~ 15 tCO2/년' },
  { min: 15, max: 30,       color: '#74c476', label: '15 ~ 30 tCO2/년' },
  { min: 30, max: 50,       color: '#31a354', label: '30 ~ 50 tCO2/년' },
  { min: 50, max: Infinity, color: '#006d2c', label: '50+ tCO2/년' },
]

export const grid1kmAbsorptionColors: CarbonColorRange[] = [
  { min: 0,   max: 50,       color: '#edf8e9', label: '0 ~ 50 tCO2/년' },
  { min: 50,  max: 150,      color: '#bae4b3', label: '50 ~ 150 tCO2/년' },
  { min: 150, max: 300,      color: '#74c476', label: '150 ~ 300 tCO2/년' },
  { min: 300, max: 500,      color: '#31a354', label: '300 ~ 500 tCO2/년' },
  { min: 500, max: Infinity, color: '#006d2c', label: '500+ tCO2/년' },
]

export const grid500mAbsorptionColors: CarbonColorRange[] = [
  { min: 0,   max: 10,       color: '#edf8e9', label: '0 ~ 10 tCO2/년' },
  { min: 10,  max: 50,       color: '#bae4b3', label: '10 ~ 50 tCO2/년' },
  { min: 50,  max: 100,      color: '#74c476', label: '50 ~ 100 tCO2/년' },
  { min: 100, max: 200,      color: '#31a354', label: '100 ~ 200 tCO2/년' },
  { min: 200, max: Infinity, color: '#006d2c', label: '200+ tCO2/년' },
]

export const grid100mAbsorptionColors: CarbonColorRange[] = [
  { min: 0,  max: 1,        color: '#edf8e9', label: '0 ~ 1 tCO2/년' },
  { min: 1,  max: 5,        color: '#bae4b3', label: '1 ~ 5 tCO2/년' },
  { min: 5,  max: 15,       color: '#74c476', label: '5 ~ 15 tCO2/년' },
  { min: 15, max: 30,       color: '#31a354', label: '15 ~ 30 tCO2/년' },
  { min: 30, max: Infinity, color: '#006d2c', label: '30+ tCO2/년' },
]

// 하위 호환을 위한 alias (CarbonAbsorptionPopup 등에서 사용 중)
export const carbonColors = forestAbsorptionColors

const GRID_ABSORPTION_COLORS: Record<string, CarbonColorRange[]> = {
  '1KM':  grid1kmAbsorptionColors,
  '500M': grid500mAbsorptionColors,
  '100M': grid100mAbsorptionColors,
}

const GEOSERVER_WMS  = '/geoserver/goyang/wms'
const FOREST_LAYER   = 'goyang:crb_absorption'
const FOREST_STYLE   = 'carbon_absorption_style'

const GRID_LAYERS: Record<string, string> = {
  '1KM':  'goyang:grid_absorption_1km',
  '500M': 'goyang:grid_absorption_500m',
  '100M': 'goyang:grid_absorption_100m',
}
const GRID_STYLES: Record<string, string> = {
  '1KM':  'grid_absorption_1km_style',
  '500M': 'grid_absorption_500m_style',
  '100M': 'grid_absorption_100m_style',
}

const HIGHLIGHT_FILL    = Cesium.Color.fromCssColorString('#FFD700').withAlpha(0.25)
const HIGHLIGHT_OUTLINE = Cesium.Color.fromCssColorString('#FFD700')

type GeoJsonGeometry =
  | { type: 'Polygon';      coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }

function applyHighlight(viewer: Cesium.Viewer, ds: Cesium.GeoJsonDataSource) {
  for (const entity of ds.entities.values) {
    if (!entity.polygon) continue
    entity.polygon.material     = new Cesium.ColorMaterialProperty(HIGHLIGHT_FILL)
    entity.polygon.outline      = new Cesium.ConstantProperty(true)
    entity.polygon.outlineColor = new Cesium.ConstantProperty(HIGHLIGHT_OUTLINE)
    entity.polygon.outlineWidth = new Cesium.ConstantProperty(3)
  }
  viewer.dataSources.add(ds)
}

export interface ForestDetail {
  gid: string | null
  koftrNm: string | null
  frtpNm: string | null
  agclsCd: string | null
  dnstCd: string | null
  areaHa: number | null
  totalAbsorption: number | null
}

export interface SelectedForest {
  data: ForestDetail
  screenX: number
  screenY: number
}

export interface GridAbsorptionDetail {
  gid: string | null
  forestCount: number | null
  totalAbsorption: number | null
}

export interface SelectedGridAbsorption {
  data: GridAbsorptionDetail
  screenX: number
  screenY: number
}

type ItemType = 'forest' | 'grid'
type CesiumViewerRef = React.MutableRefObject<Cesium.Viewer | null>

export interface UseCarbonAbsorptionReturn {
  isLoading: boolean
  isLoaded: boolean
  activeItemType: ItemType | null
  activeDetail: string
  carbonColors: CarbonColorRange[]
  selectedForest: SelectedForest | null
  isDetailLoading: boolean
  selectedGridAbsorption: SelectedGridAbsorption | null
  isGridDetailLoading: boolean
  search: (bjdCd: string, year: string, itemType: ItemType, detail: string) => Promise<void>
  clearData: () => void
  clearSelected: () => void
  clearSelectedGridAbsorption: () => void
  cleanup: () => void
}

export function useCarbonAbsorption(viewerRef: CesiumViewerRef): UseCarbonAbsorptionReturn {
  const [isLoading, setIsLoading]           = useState(false)
  const [isLoaded, setIsLoaded]             = useState(false)
  const [activeItemType, setActiveItemType] = useState<ItemType | null>(null)
  const [activeDetail, setActiveDetail]     = useState<string>('')
  const [selectedForest, setSelectedForest] = useState<SelectedForest | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [selectedGridAbsorption, setSelectedGridAbsorption] = useState<SelectedGridAbsorption | null>(null)
  const [isGridDetailLoading, setIsGridDetailLoading] = useState(false)

  const wmsLayerRef     = useRef<Cesium.ImageryLayer | null>(null)
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)
  const highlightDsRef  = useRef<Cesium.GeoJsonDataSource | null>(null)
  const currentBjdCdRef = useRef<string>('')

  const clearHighlight = useCallback(() => {
    if (viewerRef.current && highlightDsRef.current) {
      viewerRef.current.dataSources.remove(highlightDsRef.current, true)
      highlightDsRef.current = null
    }
  }, [viewerRef])

  const search = useCallback(async (bjdCd: string, _year: string, itemType: ItemType, detail: string) => {
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
    setSelectedForest(null)
    setSelectedGridAbsorption(null)
    setActiveItemType(itemType)
    setActiveDetail(detail)
    currentBjdCdRef.current = bjdCd

    const layerName = itemType === 'grid'
      ? (GRID_LAYERS[detail] ?? 'goyang:grid_absorption_1km')
      : FOREST_LAYER
    const styleName = itemType === 'grid'
      ? (GRID_STYLES[detail] ?? 'grid_absorption_1km_style')
      : FOREST_STYLE

    try {
      const provider = new Cesium.WebMapServiceImageryProvider({
        url: GEOSERVER_WMS,
        layers: layerName,
        parameters: {
          format: 'image/png',
          transparent: true,
          styles: styleName,
          viewparams: `bjdCd:${bjdCd}`,
        },
      })

      const layer = viewerRef.current.imageryLayers.addImageryProvider(provider)
      layer.alpha = 0.85
      wmsLayerRef.current = layer
      setIsLoaded(true)

      if (itemType === 'grid') {
        const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)
        handler.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          if (!viewerRef.current || !wmsLayerRef.current) return

          const viewer   = viewerRef.current
          const position = click.position

          const ray = viewer.camera.getPickRay(position)
          if (!ray) return
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            ?? viewer.camera.pickEllipsoid(position)
          if (!cartesian) return

          const carto = Cesium.Cartographic.fromCartesian(cartesian)
          const lon   = Cesium.Math.toDegrees(carto.longitude)
          const lat   = Cesium.Math.toDegrees(carto.latitude)

          setIsGridDetailLoading(true)
          setSelectedGridAbsorption(null)

          try {
            const delta  = 0.001
            const params = new URLSearchParams({
              SERVICE:       'WMS',
              VERSION:       '1.1.1',
              REQUEST:       'GetFeatureInfo',
              LAYERS:        layerName,
              QUERY_LAYERS:  layerName,
              STYLES:        styleName,
              viewparams:    `bjdCd:${currentBjdCdRef.current}`,
              INFO_FORMAT:   'application/json',
              FEATURE_COUNT: '1',
              X:             '50',
              Y:             '50',
              WIDTH:         '101',
              HEIGHT:        '101',
              BBOX:          `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`,
              SRS:           'EPSG:4326',
            })

            const res  = await fetch(`${GEOSERVER_WMS}?${params.toString()}`)
            const body = await res.text()
            if (!res.ok || !body || body.trimStart().startsWith('<')) return

            const json  = JSON.parse(body) as { features?: { properties: Record<string, unknown> }[] }
            const props = json.features?.[0]?.properties
            if (!props) return

            setSelectedGridAbsorption({
              data: {
                gid:             props['gid']              != null ? String(props['gid'])              : null,
                forestCount:     props['forest_count']     != null ? Number(props['forest_count'])     : null,
                totalAbsorption: props['total_absorption'] != null ? Number(props['total_absorption']) : null,
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

      if (itemType === 'forest') {
        const handler = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)
        handler.setInputAction(async (click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          if (!viewerRef.current || !wmsLayerRef.current) return

          const viewer   = viewerRef.current
          const position = click.position

          const ray = viewer.camera.getPickRay(position)
          if (!ray) return
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene)
            ?? viewer.camera.pickEllipsoid(position)
          if (!cartesian) return

          const carto = Cesium.Cartographic.fromCartesian(cartesian)
          const lon   = Cesium.Math.toDegrees(carto.longitude)
          const lat   = Cesium.Math.toDegrees(carto.latitude)

          setIsDetailLoading(true)
          setSelectedForest(null)
          clearHighlight()

          try {
            const delta  = 0.0005
            const params = new URLSearchParams({
              SERVICE:       'WMS',
              VERSION:       '1.1.1',
              REQUEST:       'GetFeatureInfo',
              LAYERS:        FOREST_LAYER,
              QUERY_LAYERS:  FOREST_LAYER,
              STYLES:        FOREST_STYLE,
              viewparams:    `bjdCd:${currentBjdCdRef.current}`,
              INFO_FORMAT:   'application/json',
              FEATURE_COUNT: '1',
              X:             '50',
              Y:             '50',
              WIDTH:         '101',
              HEIGHT:        '101',
              BBOX:          `${lon - delta},${lat - delta},${lon + delta},${lat + delta}`,
              SRS:           'EPSG:4326',
            })

            const res  = await fetch(`${GEOSERVER_WMS}?${params.toString()}`)
            const body = await res.text()
            if (!res.ok || !body || body.trimStart().startsWith('<')) return

            const json  = JSON.parse(body) as { features?: { properties: Record<string, unknown> }[] }
            const props = json.features?.[0]?.properties
            if (!props) return

            const gid = props['gid'] != null ? String(props['gid']) : null
            if (!gid) return

            setSelectedForest({
              data: {
                gid,
                koftrNm:         props['koftr_nm']         != null ? String(props['koftr_nm'])         : null,
                frtpNm:          props['frtp_nm']          != null ? String(props['frtp_nm'])          : null,
                agclsCd:         props['agcls_cd']         != null ? String(props['agcls_cd'])         : null,
                dnstCd:          props['dnst_cd']          != null ? String(props['dnst_cd'])          : null,
                areaHa:          props['area_ha']          != null ? Number(props['area_ha'])          : null,
                totalAbsorption: props['total_absorption'] != null ? Number(props['total_absorption']) : null,
              },
              screenX: position.x,
              screenY: position.y,
            })

            const geomRes = await fetch(
              `/crbAbsorption/getForestGeom.do?gid=${encodeURIComponent(gid)}`,
              { cache: 'no-store' },
            )
            if (!geomRes.ok) return

            const { geom } = await geomRes.json() as { geom: string }
            if (!geom) return

            const geometry = JSON.parse(geom) as GeoJsonGeometry
            const geojson  = { type: 'Feature', geometry, properties: {} }
            const ds       = await Cesium.GeoJsonDataSource.load(geojson, { clampToGround: true })
            if (!viewerRef.current) return
            applyHighlight(viewerRef.current, ds)
            highlightDsRef.current = ds

          } catch {
            // 실패 시 무시
          } finally {
            setIsDetailLoading(false)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
        clickHandlerRef.current = handler
      }

    } catch {
      // 실패 시 무시
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
    currentBjdCdRef.current = ''
    setIsLoaded(false)
    setActiveItemType(null)
    setActiveDetail('')
    setSelectedForest(null)
    setSelectedGridAbsorption(null)
  }, [viewerRef, clearHighlight])

  const clearSelected = useCallback(() => {
    clearHighlight()
    setSelectedForest(null)
  }, [clearHighlight])

  const clearSelectedGridAbsorption = useCallback(() => {
    setSelectedGridAbsorption(null)
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

  const activeCarbonColors = activeItemType === 'grid'
    ? (GRID_ABSORPTION_COLORS[activeDetail] ?? grid1kmAbsorptionColors)
    : forestAbsorptionColors

  return {
    isLoading,
    isLoaded,
    activeItemType,
    activeDetail,
    carbonColors: activeCarbonColors,
    selectedForest,
    isDetailLoading,
    selectedGridAbsorption,
    isGridDetailLoading,
    search,
    clearData,
    clearSelected,
    clearSelectedGridAbsorption,
    cleanup,
  }
}
