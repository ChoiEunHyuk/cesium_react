import { useState, useCallback, useRef } from 'react'
import * as Cesium from 'cesium'

// 밀도 보정계수
const densityFactors: Record<string, number> = {
  'A': 0.4,  // 소 (50% 이하)
  'B': 0.6,  // 중 (51~70%)
  'C': 1.0,  // 밀 (71% 이상)
}

// 탄소 흡수량에 따른 색상 범위 (총 흡수량 tCO2/년 기준)
interface CarbonColorRange {
  min: number
  max: number
  color: Cesium.Color
  label: string
}

const carbonColors: CarbonColorRange[] = [
  { min: 0, max: 5, color: Cesium.Color.fromCssColorString('#fee5d9'), label: '0 - 5 tCO2/년' },
  { min: 5, max: 15, color: Cesium.Color.fromCssColorString('#fcae91'), label: '5 - 15 tCO2/년' },
  { min: 15, max: 30, color: Cesium.Color.fromCssColorString('#fb6a4a'), label: '15 - 30 tCO2/년' },
  { min: 30, max: 50, color: Cesium.Color.fromCssColorString('#de2d26'), label: '30 - 50 tCO2/년' },
  { min: 50, max: Infinity, color: Cesium.Color.fromCssColorString('#a50f15'), label: '50+ tCO2/년' },
]

// 탄소 흡수량에 따른 색상 반환
function getColorByAbsorption(absorption: number): Cesium.Color {
  for (const item of carbonColors) {
    if (absorption >= item.min && absorption < item.max) {
      return item.color.withAlpha(0.7)
    }
  }
  return Cesium.Color.GRAY.withAlpha(0.5)
}

type CesiumViewerRef = React.MutableRefObject<Cesium.Viewer | null>

interface CarbonData {
  [speciesCode: string]: {
    absorption: Record<string, number>
  }
}

export interface SelectedFeature {
  speciesName: string
  forestType: string
  ageClass: string
  densityName: string
  densityFactor: string
  area: string
  totalAbsorption: string
}

export interface UseCarbonAbsorptionReturn {
  isLoading: boolean
  isLoaded: boolean
  featureCount: number
  selectedFeature: SelectedFeature | null
  carbonColors: CarbonColorRange[]
  loadCarbonData: () => Promise<void>
  clearCarbonData: () => void
  cleanup: () => void
}

export function useCarbonAbsorption(viewerRef: CesiumViewerRef): UseCarbonAbsorptionReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [featureCount, setFeatureCount] = useState(0)
  const [selectedFeature, setSelectedFeature] = useState<SelectedFeature | null>(null)

  const dataSourceRef = useRef<Cesium.GeoJsonDataSource | null>(null)
  const carbonDataRef = useRef<CarbonData | null>(null)
  const clickHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)

  // 탄소 흡수 데이터 로드
  const loadCarbonData = useCallback(async () => {
    if (!viewerRef.current || isLoading) return

    setIsLoading(true)

    try {
      // 탄소 흡수량 데이터 로드
      const absorptionResponse = await fetch('/carbon/tree_species_carbon_absorption.json')
      carbonDataRef.current = await absorptionResponse.json() as CarbonData

      // WGS84 변환된 GeoJSON 사용
      const dataSource = await Cesium.GeoJsonDataSource.load('/carbon/forest_map_wgs84.geojson', {
        clampToGround: true,
      })

      const entities = dataSource.entities.values
      setFeatureCount(entities.length)

      // 각 엔티티에 탄소 흡수량 기반 색상 적용
      for (const entity of entities) {
        const props = entity.properties
        const speciesCode = props?.KOFTR_GROU?.getValue() as string | undefined
        const ageClass = props?.AGCLS_CD?.getValue() as string | undefined
        const densityCode = props?.DNST_CD?.getValue() as string | undefined
        const area = (props?.AREA_HA?.getValue() as number | undefined) || 0

        // 1. 기준 흡수율 조회 (tCO2/ha/년)
        let baseRate = 0
        if (carbonDataRef.current && speciesCode && carbonDataRef.current[speciesCode] && ageClass) {
          const ageKey = String(parseInt(ageClass) * 10)
          baseRate = carbonDataRef.current[speciesCode]?.absorption[ageKey] || 0
        }

        // 2. 밀도 보정계수 적용
        const densityFactor = (densityCode && densityFactors[densityCode]) || 0.6
        const adjustedRate = baseRate * densityFactor

        // 3. 면적 적용하여 총 흡수량 계산 (tCO2/년)
        const totalAbsorption = adjustedRate * area

        // 색상 적용
        const color = getColorByAbsorption(totalAbsorption)

        if (entity.polygon) {
          entity.polygon.material = new Cesium.ColorMaterialProperty(color)
          entity.polygon.outline = new Cesium.ConstantProperty(true)
          entity.polygon.outlineColor = new Cesium.ConstantProperty(Cesium.Color.BLACK.withAlpha(0.3))
        }

        // 밀도 한글 변환
        const densityName = densityCode === 'A' ? '소' : densityCode === 'B' ? '중' : densityCode === 'C' ? '밀' : '알 수 없음'

        // 계산된 값 저장
        props?.addProperty('_speciesName', (props?.KOFTR_NM?.getValue() as string | undefined) || '알 수 없음')
        props?.addProperty('_forestType', (props?.FRTP_NM?.getValue() as string | undefined) || '알 수 없음')
        props?.addProperty('_ageClass', ageClass ? `${parseInt(ageClass)}영급 (${parseInt(ageClass) * 10}년생)` : '알 수 없음')
        props?.addProperty('_densityName', densityName)
        props?.addProperty('_densityFactor', (densityFactor * 100).toFixed(0))
        props?.addProperty('_area', area.toFixed(3))
        props?.addProperty('_totalAbsorption', totalAbsorption.toFixed(2))
      }

      // 기존 데이터 제거
      if (dataSourceRef.current) {
        viewerRef.current.dataSources.remove(dataSourceRef.current)
      }

      viewerRef.current.dataSources.add(dataSource)
      dataSourceRef.current = dataSource

      // 클릭 핸들러 등록
      if (!clickHandlerRef.current) {
        clickHandlerRef.current = new Cesium.ScreenSpaceEventHandler(viewerRef.current.scene.canvas)
        clickHandlerRef.current.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
          const pickedObject = viewerRef.current?.scene.pick(click.position)
          if (Cesium.defined(pickedObject) && pickedObject.id && pickedObject.id.properties) {
            const props = pickedObject.id.properties
            setSelectedFeature({
              speciesName: (props._speciesName?.getValue() as string | undefined) || '알 수 없음',
              forestType: (props._forestType?.getValue() as string | undefined) || '알 수 없음',
              ageClass: (props._ageClass?.getValue() as string | undefined) || '알 수 없음',
              densityName: (props._densityName?.getValue() as string | undefined) || '알 수 없음',
              densityFactor: (props._densityFactor?.getValue() as string | undefined) || '0',
              area: (props._area?.getValue() as string | undefined) || '0',
              totalAbsorption: (props._totalAbsorption?.getValue() as string | undefined) || '0',
            })
          } else {
            setSelectedFeature(null)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
      }

      // 데이터 영역으로 카메라 이동
      viewerRef.current.flyTo(dataSource, {
        duration: 2,
      })

      setIsLoaded(true)
    } catch (error) {
      console.error('탄소 흡수 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }, [viewerRef, isLoading])

  // 데이터 제거
  const clearCarbonData = useCallback(() => {
    if (viewerRef.current && dataSourceRef.current) {
      viewerRef.current.dataSources.remove(dataSourceRef.current)
      dataSourceRef.current = null
    }

    if (clickHandlerRef.current) {
      clickHandlerRef.current.destroy()
      clickHandlerRef.current = null
    }

    setIsLoaded(false)
    setFeatureCount(0)
    setSelectedFeature(null)
  }, [viewerRef])

  // 정리
  const cleanup = useCallback(() => {
    clearCarbonData()
  }, [clearCarbonData])

  return {
    isLoading,
    isLoaded,
    featureCount,
    selectedFeature,
    carbonColors,
    loadCarbonData,
    clearCarbonData,
    cleanup,
  }
}
