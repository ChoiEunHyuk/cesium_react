import { useState, useRef, useCallback, useEffect } from 'react'
import * as Cesium from 'cesium'

// 경사도 색상 범례 (도 단위)
const SLOPE_COLORS = [
  { min: 0, max: 5, color: Cesium.Color.fromCssColorString('#2ecc71'), label: '0-5°' },
  { min: 5, max: 15, color: Cesium.Color.fromCssColorString('#f1c40f'), label: '5-15°' },
  { min: 15, max: 25, color: Cesium.Color.fromCssColorString('#e67e22'), label: '15-25°' },
  { min: 25, max: 35, color: Cesium.Color.fromCssColorString('#e74c3c'), label: '25-35°' },
  { min: 35, max: 90, color: Cesium.Color.fromCssColorString('#8e44ad'), label: '35°+' },
]

// 경사도에 따른 색상 반환
const getSlopeColor = (slopeDegrees) => {
  for (const range of SLOPE_COLORS) {
    if (slopeDegrees >= range.min && slopeDegrees < range.max) {
      return range.color.withAlpha(0.6)
    }
  }
  return SLOPE_COLORS[SLOPE_COLORS.length - 1].color.withAlpha(0.6)
}

export function useSlopeAnalysis(viewerRef) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSelectingArea, setIsSelectingArea] = useState(false)
  const [hoverSlope, setHoverSlope] = useState(null)
  const [isHoverEnabled, setIsHoverEnabled] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [gridResolution, setGridResolution] = useState(50) // 미터 단위

  const hoverHandlerRef = useRef(null)
  const areaHandlerRef = useRef(null)
  const areaPointsRef = useRef([])
  const areaEntitiesRef = useRef([])
  const analysisEntitiesRef = useRef([])
  const polygonEntityRef = useRef(null)

  // 특정 지점의 경사도 계산
  const calculateSlopeAtPoint = useCallback(async (longitude, latitude, cellSize = 10) => {
    if (!viewerRef.current) return null

    const viewer = viewerRef.current
    const terrainProvider = viewer.terrainProvider

    // 3x3 그리드 포인트 생성 (중심점 주변)
    const offset = cellSize / 111000 // 미터를 도로 변환 (대략적)
    const positions = [
      Cesium.Cartographic.fromDegrees(longitude - offset, latitude + offset), // NW
      Cesium.Cartographic.fromDegrees(longitude, latitude + offset),          // N
      Cesium.Cartographic.fromDegrees(longitude + offset, latitude + offset), // NE
      Cesium.Cartographic.fromDegrees(longitude - offset, latitude),          // W
      Cesium.Cartographic.fromDegrees(longitude, latitude),                   // Center
      Cesium.Cartographic.fromDegrees(longitude + offset, latitude),          // E
      Cesium.Cartographic.fromDegrees(longitude - offset, latitude - offset), // SW
      Cesium.Cartographic.fromDegrees(longitude, latitude - offset),          // S
      Cesium.Cartographic.fromDegrees(longitude + offset, latitude - offset), // SE
    ]

    try {
      const updatedPositions = await Cesium.sampleTerrainMostDetailed(terrainProvider, positions)

      // 높이값 추출 [NW, N, NE, W, C, E, SW, S, SE]
      const heights = updatedPositions.map(p => p.height || 0)

      // Sobel 연산자를 사용한 경사도 계산
      const dzdx = ((heights[2] + 2 * heights[5] + heights[8]) -
                    (heights[0] + 2 * heights[3] + heights[6])) / (8 * cellSize)
      const dzdy = ((heights[0] + 2 * heights[1] + heights[2]) -
                    (heights[6] + 2 * heights[7] + heights[8])) / (8 * cellSize)

      const slopeRadians = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy))
      const slopeDegrees = slopeRadians * (180 / Math.PI)

      return {
        slope: slopeDegrees,
        height: heights[4], // 중심점 높이
        longitude,
        latitude,
      }
    } catch (error) {
      console.error('경사도 계산 오류:', error)
      return null
    }
  }, [viewerRef])

  // 마우스 호버 경사도 표시 시작
  const startHoverMode = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    setIsHoverEnabled(true)

    if (hoverHandlerRef.current) {
      hoverHandlerRef.current.destroy()
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    let lastUpdateTime = 0
    const throttleMs = 200 // 200ms 쓰로틀링

    handler.setInputAction(async (movement) => {
      const now = Date.now()
      if (now - lastUpdateTime < throttleMs) return
      lastUpdateTime = now

      const cartesian = viewer.scene.pickPosition(movement.endPosition)
      if (!cartesian) {
        setHoverSlope(null)
        return
      }

      const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
      const longitude = Cesium.Math.toDegrees(cartographic.longitude)
      const latitude = Cesium.Math.toDegrees(cartographic.latitude)

      const result = await calculateSlopeAtPoint(longitude, latitude)
      if (result) {
        setHoverSlope(result)
      }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE)

    hoverHandlerRef.current = handler
  }, [viewerRef, calculateSlopeAtPoint])

  // 마우스 호버 모드 중지
  const stopHoverMode = useCallback(() => {
    if (hoverHandlerRef.current) {
      hoverHandlerRef.current.destroy()
      hoverHandlerRef.current = null
    }
    setIsHoverEnabled(false)
    setHoverSlope(null)
  }, [])

  // 영역 선택 시작
  const startAreaSelection = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    setIsSelectingArea(true)
    areaPointsRef.current = []

    // 기존 분석 결과 제거
    clearAnalysisResults()

    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    // 좌클릭: 포인트 추가
    handler.setInputAction((click) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (!cartesian) return

      areaPointsRef.current.push(cartesian)

      // 포인트 엔티티 추가
      const pointEntity = viewer.entities.add({
        position: cartesian,
        point: {
          pixelSize: 10,
          color: Cesium.Color.LIME,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
      areaEntitiesRef.current.push(pointEntity)

      // 이전 포인트와 라인 연결
      if (areaPointsRef.current.length > 1) {
        const points = areaPointsRef.current
        const lineEntity = viewer.entities.add({
          polyline: {
            positions: [points[points.length - 2], points[points.length - 1]],
            width: 3,
            material: Cesium.Color.LIME,
            clampToGround: true,
          },
        })
        areaEntitiesRef.current.push(lineEntity)
      }

      // 폴리곤 미리보기 업데이트
      updatePolygonPreview()
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 우클릭: 영역 선택 완료
    handler.setInputAction(() => {
      if (areaPointsRef.current.length >= 3) {
        finishAreaSelection()
      }
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    areaHandlerRef.current = handler
  }, [viewerRef])

  // 폴리곤 미리보기 업데이트
  const updatePolygonPreview = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    const points = areaPointsRef.current

    if (polygonEntityRef.current) {
      viewer.entities.remove(polygonEntityRef.current)
      polygonEntityRef.current = null
    }

    if (points.length >= 3) {
      polygonEntityRef.current = viewer.entities.add({
        polygon: {
          hierarchy: points,
          material: Cesium.Color.LIME.withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.LIME,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
    }
  }, [viewerRef])

  // 영역 선택 완료 및 분석 시작
  const finishAreaSelection = useCallback(async () => {
    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
      areaHandlerRef.current = null
    }
    setIsSelectingArea(false)

    // 닫는 라인 추가
    const points = areaPointsRef.current
    if (points.length >= 3 && viewerRef.current) {
      const lineEntity = viewerRef.current.entities.add({
        polyline: {
          positions: [points[points.length - 1], points[0]],
          width: 3,
          material: Cesium.Color.LIME,
          clampToGround: true,
        },
      })
      areaEntitiesRef.current.push(lineEntity)
    }

    // 경사도 분석 실행
    await analyzeArea()
  }, [viewerRef])

  // 영역 분석 실행
  const analyzeArea = useCallback(async () => {
    if (!viewerRef.current || areaPointsRef.current.length < 3) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)

    const viewer = viewerRef.current
    const points = areaPointsRef.current

    // 폴리곤 영역의 경계 계산
    const cartographics = points.map(p => Cesium.Cartographic.fromCartesian(p))
    const lons = cartographics.map(c => Cesium.Math.toDegrees(c.longitude))
    const lats = cartographics.map(c => Cesium.Math.toDegrees(c.latitude))

    const minLon = Math.min(...lons)
    const maxLon = Math.max(...lons)
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)

    // 그리드 포인트 생성
    const cellSizeDegrees = gridResolution / 111000 // 미터를 도로 변환
    const gridPoints = []

    for (let lon = minLon; lon <= maxLon; lon += cellSizeDegrees) {
      for (let lat = minLat; lat <= maxLat; lat += cellSizeDegrees) {
        // 폴리곤 내부인지 확인
        if (isPointInPolygon(lon, lat, lons, lats)) {
          gridPoints.push({ lon, lat })
        }
      }
    }

    // 배치 처리로 경사도 계산
    const batchSize = 10
    const results = []

    for (let i = 0; i < gridPoints.length; i += batchSize) {
      const batch = gridPoints.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(p => calculateSlopeAtPoint(p.lon, p.lat, gridResolution))
      )
      results.push(...batchResults.filter(r => r !== null))
      setAnalysisProgress(Math.round((i + batchSize) / gridPoints.length * 100))
    }

    // 결과 시각화
    visualizeResults(results)
    setIsAnalyzing(false)
    setAnalysisProgress(100)
  }, [viewerRef, gridResolution, calculateSlopeAtPoint])

  // 폴리곤 내부 판별 (Ray Casting 알고리즘)
  const isPointInPolygon = (x, y, polyX, polyY) => {
    let inside = false
    const n = polyX.length

    for (let i = 0, j = n - 1; i < n; j = i++) {
      if (
        polyY[i] > y !== polyY[j] > y &&
        x < ((polyX[j] - polyX[i]) * (y - polyY[i])) / (polyY[j] - polyY[i]) + polyX[i]
      ) {
        inside = !inside
      }
    }
    return inside
  }

  // 결과 시각화
  const visualizeResults = useCallback((results) => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    const cellSizeDegrees = gridResolution / 111000 / 2

    results.forEach(result => {
      const color = getSlopeColor(result.slope)

      const entity = viewer.entities.add({
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray([
            result.longitude - cellSizeDegrees, result.latitude - cellSizeDegrees,
            result.longitude + cellSizeDegrees, result.latitude - cellSizeDegrees,
            result.longitude + cellSizeDegrees, result.latitude + cellSizeDegrees,
            result.longitude - cellSizeDegrees, result.latitude + cellSizeDegrees,
          ]),
          material: color,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
      analysisEntitiesRef.current.push(entity)
    })
  }, [viewerRef, gridResolution])

  // 분석 결과 제거
  const clearAnalysisResults = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    // 분석 엔티티 제거
    analysisEntitiesRef.current.forEach(entity => {
      viewer.entities.remove(entity)
    })
    analysisEntitiesRef.current = []

    // 영역 선택 엔티티 제거
    areaEntitiesRef.current.forEach(entity => {
      viewer.entities.remove(entity)
    })
    areaEntitiesRef.current = []

    // 폴리곤 제거
    if (polygonEntityRef.current) {
      viewer.entities.remove(polygonEntityRef.current)
      polygonEntityRef.current = null
    }

    areaPointsRef.current = []
    setAnalysisProgress(0)
  }, [viewerRef])

  // 영역 선택 취소
  const cancelAreaSelection = useCallback(() => {
    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
      areaHandlerRef.current = null
    }
    setIsSelectingArea(false)
    clearAnalysisResults()
  }, [clearAnalysisResults])

  // 클린업
  useEffect(() => {
    return () => {
      if (hoverHandlerRef.current) {
        hoverHandlerRef.current.destroy()
      }
      if (areaHandlerRef.current) {
        areaHandlerRef.current.destroy()
      }
    }
  }, [])

  return {
    isAnalyzing,
    isSelectingArea,
    isHoverEnabled,
    hoverSlope,
    analysisProgress,
    gridResolution,
    slopeColors: SLOPE_COLORS,
    setGridResolution,
    startHoverMode,
    stopHoverMode,
    startAreaSelection,
    cancelAreaSelection,
    clearAnalysisResults,
  }
}
