import { useState, useRef, useCallback, useEffect, ChangeEvent } from 'react'
import * as Cesium from 'cesium'
import '../../styles/MapToolbar.css'

type CesiumViewerRef = React.MutableRefObject<Cesium.Viewer | null>

interface MarkerFormData {
  title: string
  description: string
}

interface SelectedMarker {
  title: string
  description: string
}

interface MapToolbarProps {
  viewerRef: CesiumViewerRef
}

function MapToolbar({ viewerRef }: MapToolbarProps) {
  /* ========================================================================
   * 상태 관리 (State)
   * ======================================================================== */
  const [isToolPanelOpen, setIsToolPanelOpen] = useState(false)
  const [isMeasuring, setIsMeasuring] = useState(false)
  const [totalDistance, setTotalDistance] = useState(0)
  const [isMeasuringArea, setIsMeasuringArea] = useState(false)
  const [totalArea, setTotalArea] = useState(0)

  // 마커 추가 관련 상태
  const [isAddingMarker, setIsAddingMarker] = useState(false)
  const [showMarkerForm, setShowMarkerForm] = useState(false)
  const [markerFormData, setMarkerFormData] = useState<MarkerFormData>({ title: '', description: '' })
  const [pendingMarkerPosition, setPendingMarkerPosition] = useState<Cesium.Cartesian3 | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<SelectedMarker | null>(null)
  const [markerCount, setMarkerCount] = useState(0)

  /* ========================================================================
   * Refs - 거리 측정용
   * ======================================================================== */
  const measureHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)
  const measurePointsRef = useRef<Cesium.Cartesian3[]>([])
  const measureEntitiesRef = useRef<Cesium.Entity[]>([])

  /* ========================================================================
   * Refs - 면적 측정용
   * ======================================================================== */
  const areaHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)
  const areaPointsRef = useRef<Cesium.Cartesian3[]>([])
  const areaEntitiesRef = useRef<Cesium.Entity[]>([])
  const areaPolygonRef = useRef<Cesium.Entity | null>(null)

  /* ========================================================================
   * Refs - 마커 관련
   * ======================================================================== */
  const markerHandlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null)
  const markersRef = useRef<Cesium.Entity[]>([])

  /* ========================================================================
   * 유틸리티 함수 - 포맷팅
   * ======================================================================== */
  const toggleToolPanel = () => {
    setIsToolPanelOpen(prev => !prev)
  }

  const formatDistance = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(2)} km`
    }
    return `${meters.toFixed(1)} m`
  }

  const formatArea = (sqMeters: number): string => {
    if (sqMeters >= 1000000) {
      return `${(sqMeters / 1000000).toFixed(2)} km²`
    }
    return `${sqMeters.toFixed(1)} m²`
  }

  /* ========================================================================
   * 유틸리티 함수 - 면적 계산 (Spherical Excess Formula)
   * ======================================================================== */
  const calculatePolygonArea = (positions: Cesium.Cartesian3[]): number => {
    if (positions.length < 3) return 0

    const cartographics = positions.map(pos =>
      Cesium.Cartographic.fromCartesian(pos)
    )

    const earthRadius = 6371000
    let area = 0

    for (let i = 0; i < cartographics.length; i++) {
      const j = (i + 1) % cartographics.length
      const lat1 = cartographics[i]!.latitude
      const lat2 = cartographics[j]!.latitude
      const lon1 = cartographics[i]!.longitude
      const lon2 = cartographics[j]!.longitude

      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2))
    }

    area = Math.abs(area * earthRadius * earthRadius / 2)
    return area
  }

  /* ========================================================================
   * 거리 측정 기능
   * - addMeasurePoint: 클릭 지점에 포인트/라인/라벨 추가
   * - startMeasure: 측정 모드 시작 및 이벤트 핸들러 등록
   * - finishMeasure: 측정 완료 (핸들러 해제)
   * - clearMeasure: 모든 측정 데이터 초기화
   * ======================================================================== */
  const addMeasurePoint = useCallback((cartesian: Cesium.Cartesian3) => {
    if (!viewerRef.current || !cartesian) return

    const viewer = viewerRef.current
    const points = measurePointsRef.current

    const pointEntity = viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.YELLOW,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    })
    measureEntitiesRef.current.push(pointEntity)

    if (points.length > 0) {
      const prevPoint = points[points.length - 1]!
      const distance = Cesium.Cartesian3.distance(prevPoint, cartesian)

      const lineEntity = viewer.entities.add({
        polyline: {
          positions: [prevPoint, cartesian],
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.YELLOW,
          }),
          clampToGround: true,
        },
      })
      measureEntitiesRef.current.push(lineEntity)

      const midPoint = Cesium.Cartesian3.midpoint(prevPoint, cartesian, new Cesium.Cartesian3())
      const labelEntity = viewer.entities.add({
        position: midPoint,
        label: {
          text: formatDistance(distance),
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })
      measureEntitiesRef.current.push(labelEntity)

      setTotalDistance(prev => prev + distance)
    }

    points.push(cartesian)
  }, [viewerRef])

  const finishMeasure = useCallback(() => {
    if (measureHandlerRef.current) {
      measureHandlerRef.current.destroy()
      measureHandlerRef.current = null
    }
    setIsMeasuring(false)
  }, [])

  const startMeasure = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    setIsMeasuring(true)
    setTotalDistance(0)
    measurePointsRef.current = []

    if (measureHandlerRef.current) {
      measureHandlerRef.current.destroy()
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (cartesian) {
        addMeasurePoint(cartesian)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(() => {
      finishMeasure()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    measureHandlerRef.current = handler
  }, [viewerRef, addMeasurePoint, finishMeasure])

  const clearMeasure = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    measureEntitiesRef.current.forEach(entity => {
      viewer.entities.remove(entity)
    })
    measureEntitiesRef.current = []
    measurePointsRef.current = []
    setTotalDistance(0)

    if (measureHandlerRef.current) {
      measureHandlerRef.current.destroy()
      measureHandlerRef.current = null
    }
    setIsMeasuring(false)
  }, [viewerRef])

  /* ========================================================================
   * 면적 측정 기능
   * - updateAreaPolygon: 폴리곤 엔티티 생성/업데이트 및 면적 계산
   * - addAreaPoint: 클릭 지점에 꼭지점 추가
   * - startAreaMeasure: 측정 모드 시작 및 이벤트 핸들러 등록
   * - finishAreaMeasure: 측정 완료 (폴리곤 닫기)
   * - clearAreaMeasure: 모든 면적 측정 데이터 초기화
   * ======================================================================== */
  const updateAreaPolygon = useCallback((positions: Cesium.Cartesian3[]) => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    if (areaPolygonRef.current) {
      viewer.entities.remove(areaPolygonRef.current)
      areaPolygonRef.current = null
    }

    if (positions.length >= 3) {
      areaPolygonRef.current = viewer.entities.add({
        polygon: {
          hierarchy: positions,
          material: Cesium.Color.CYAN.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.CYAN,
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        },
      })

      // 면적 계산
      const area = calculatePolygonArea(positions)
      setTotalArea(area)
    }
  }, [viewerRef])

  const addAreaPoint = useCallback((cartesian: Cesium.Cartesian3) => {
    if (!viewerRef.current || !cartesian) return

    const viewer = viewerRef.current
    const points = areaPointsRef.current

    // 포인트 엔티티 추가
    const pointEntity = viewer.entities.add({
      position: cartesian,
      point: {
        pixelSize: 10,
        color: Cesium.Color.CYAN,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
    })
    areaEntitiesRef.current.push(pointEntity)

    // 이전 포인트가 있으면 라인 추가
    if (points.length > 0) {
      const prevPoint = points[points.length - 1]!

      const lineEntity = viewer.entities.add({
        polyline: {
          positions: [prevPoint, cartesian],
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.CYAN,
          }),
          clampToGround: true,
        },
      })
      areaEntitiesRef.current.push(lineEntity)
    }

    points.push(cartesian)

    // 폴리곤 업데이트
    updateAreaPolygon([...points])
  }, [viewerRef, updateAreaPolygon])

  const finishAreaMeasure = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    const points = areaPointsRef.current

    // 폴리곤 닫기 (첫점과 마지막점 연결)
    if (points.length >= 3) {
      const lineEntity = viewer.entities.add({
        polyline: {
          positions: [points[points.length - 1]!, points[0]!],
          width: 3,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.2,
            color: Cesium.Color.CYAN,
          }),
          clampToGround: true,
        },
      })
      areaEntitiesRef.current.push(lineEntity)
    }

    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
      areaHandlerRef.current = null
    }
    setIsMeasuringArea(false)
  }, [viewerRef])

  const startAreaMeasure = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    setIsMeasuringArea(true)
    setTotalArea(0)
    areaPointsRef.current = []

    // 기존 핸들러 제거
    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    // 좌클릭: 포인트 추가
    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (cartesian) {
        addAreaPoint(cartesian)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // 우클릭: 측정 완료
    handler.setInputAction(() => {
      finishAreaMeasure()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    areaHandlerRef.current = handler
  }, [viewerRef, addAreaPoint, finishAreaMeasure])

  const clearAreaMeasure = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    // 모든 면적 측정 엔티티 제거
    areaEntitiesRef.current.forEach(entity => {
      viewer.entities.remove(entity)
    })
    areaEntitiesRef.current = []
    areaPointsRef.current = []

    // 폴리곤 제거
    if (areaPolygonRef.current) {
      viewer.entities.remove(areaPolygonRef.current)
      areaPolygonRef.current = null
    }

    setTotalArea(0)

    if (areaHandlerRef.current) {
      areaHandlerRef.current.destroy()
      areaHandlerRef.current = null
    }
    setIsMeasuringArea(false)
  }, [viewerRef])

  /* ========================================================================
   * 마커 추가 기능
   * - startAddMarker: 마커 추가 모드 시작
   * - cancelAddMarker: 마커 추가 취소
   * - saveMarker: 마커 저장
   * - handleMarkerClick: 마커 클릭 시 상세정보 표시
   * ======================================================================== */
  const cancelAddMarker = useCallback(() => {
    if (markerHandlerRef.current) {
      markerHandlerRef.current.destroy()
      markerHandlerRef.current = null
    }
    setIsAddingMarker(false)
    setShowMarkerForm(false)
    setPendingMarkerPosition(null)
    setMarkerFormData({ title: '', description: '' })
  }, [])

  const startAddMarker = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current
    setIsAddingMarker(true)

    if (markerHandlerRef.current) {
      markerHandlerRef.current.destroy()
    }

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    handler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = viewer.scene.pickPosition(click.position)
      if (cartesian) {
        setPendingMarkerPosition(cartesian)
        setShowMarkerForm(true)
        setMarkerFormData({ title: '', description: '' })
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    handler.setInputAction(() => {
      cancelAddMarker()
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK)

    markerHandlerRef.current = handler
  }, [viewerRef, cancelAddMarker])

  const createMarkerIcon = (): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 40
    const ctx = canvas.getContext('2d')!

    // 마커 핀 그리기
    ctx.beginPath()
    ctx.arc(16, 14, 12, Math.PI, 0, false)
    ctx.lineTo(16, 40)
    ctx.closePath()
    ctx.fillStyle = '#4CAF50'
    ctx.fill()
    ctx.strokeStyle = '#2E7D32'
    ctx.lineWidth = 2
    ctx.stroke()

    // 내부 원
    ctx.beginPath()
    ctx.arc(16, 14, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'white'
    ctx.fill()

    return canvas.toDataURL()
  }

  const saveMarker = useCallback(() => {
    if (!viewerRef.current || !pendingMarkerPosition) return

    const viewer = viewerRef.current
    const { title, description } = markerFormData

    if (!title.trim()) return

    const markerEntity = viewer.entities.add({
      position: pendingMarkerPosition,
      billboard: {
        image: createMarkerIcon(),
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        scale: 1.0,
      },
      label: {
        text: title,
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
        pixelOffset: new Cesium.Cartesian2(0, -45),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
      },
      properties: {
        title: title,
        description: description,
        isMarker: true,
      },
    })

    markersRef.current.push(markerEntity)
    setMarkerCount(prev => prev + 1)

    // 마커 추가 모드 종료
    if (markerHandlerRef.current) {
      markerHandlerRef.current.destroy()
      markerHandlerRef.current = null
    }
    setIsAddingMarker(false)
    setShowMarkerForm(false)
    setPendingMarkerPosition(null)
    setMarkerFormData({ title: '', description: '' })
  }, [viewerRef, pendingMarkerPosition, markerFormData])

  const clearAllMarkers = useCallback(() => {
    if (!viewerRef.current) return

    const viewer = viewerRef.current

    markersRef.current.forEach(entity => {
      viewer.entities.remove(entity)
    })
    markersRef.current = []
    setMarkerCount(0)
    setSelectedMarker(null)
  }, [viewerRef])

  // 마커 클릭 이벤트 처리 (마커 추가 모드가 아닐 때만)
  useEffect(() => {
    if (!viewerRef.current || isAddingMarker || isMeasuring || isMeasuringArea) return

    const viewer = viewerRef.current

    const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)

    clickHandler.setInputAction((click: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const pickedObject = viewer.scene.pick(click.position)

      if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id as Cesium.Entity
        if (entity.properties && entity.properties.isMarker) {
          setSelectedMarker({
            title: entity.properties.title.getValue(Cesium.JulianDate.now()) as string,
            description: entity.properties.description.getValue(Cesium.JulianDate.now()) as string,
          })
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      clickHandler.destroy()
    }
  }, [viewerRef, isAddingMarker, isMeasuring, isMeasuringArea])

  /* ========================================================================
   * 카메라 제어 기능
   * ======================================================================== */
  const handleNorthUp = () => {
    if (!viewerRef.current) return

    const camera = viewerRef.current.camera
    const currentPosition = camera.positionCartographic

    camera.flyTo({
      destination: Cesium.Cartesian3.fromRadians(
        currentPosition.longitude,
        currentPosition.latitude,
        currentPosition.height
      ),
      orientation: {
        heading: 0,
        pitch: camera.pitch,
        roll: 0,
      },
      duration: 0.5,
    })
  }

  const handleZoomIn = () => {
    if (!viewerRef.current) return
    const camera = viewerRef.current.camera
    camera.zoomIn(camera.positionCartographic.height * 0.3)
  }

  const handleZoomOut = () => {
    if (!viewerRef.current) return
    const camera = viewerRef.current.camera
    camera.zoomOut(camera.positionCartographic.height * 0.3)
  }

  /* ========================================================================
   * 렌더링
   * ======================================================================== */
  return (
    <>
      <div className={`map-toolbar ${isToolPanelOpen ? 'panel-open' : ''}`}>
        <button
          className="toolbar-btn"
          onClick={handleNorthUp}
          title="정북방향"
        >N</button>
        <button
          className="toolbar-btn"
          onClick={handleZoomIn}
          title="줌인"
        >+</button>
        <button
          className="toolbar-btn"
          onClick={handleZoomOut}
          title="줌아웃"
        >−</button>
        <button
          className={`toolbar-btn ${isToolPanelOpen ? 'active' : ''}`}
          onClick={toggleToolPanel}
          title="도구모음"
        >
          <span className="tool-icon">⚙</span>
        </button>
      </div>

      {/* 도구모음 슬라이드 패널 */}
      <div className={`tool-panel ${isToolPanelOpen ? 'open' : ''}`}>
        <div className="tool-panel-header">
          <h4>도구모음</h4>
          <button className="tool-panel-close" onClick={toggleToolPanel}>×</button>
        </div>
        <div className="tool-panel-content">
          <div className="tool-section">
            <h5>측정 도구</h5>
            {!isMeasuring ? (
              <button className="tool-item" onClick={startMeasure} disabled={isMeasuringArea}>
                <span className="tool-item-icon">📏</span>
                <span>거리 측정</span>
              </button>
            ) : (
              <div className="measure-active">
                <div className="measure-info">
                  <span className="measure-label">총 거리</span>
                  <span className="measure-value">{formatDistance(totalDistance)}</span>
                </div>
                <p className="measure-hint">좌클릭: 포인트 추가 / 우클릭: 완료</p>
                <div className="measure-buttons">
                  <button className="measure-btn finish" onClick={finishMeasure}>
                    완료
                  </button>
                  <button className="measure-btn clear" onClick={clearMeasure}>
                    초기화
                  </button>
                </div>
              </div>
            )}
            {!isMeasuringArea ? (
              <button className="tool-item" onClick={startAreaMeasure} disabled={isMeasuring}>
                <span className="tool-item-icon">📐</span>
                <span>면적 측정</span>
              </button>
            ) : (
              <div className="measure-active area">
                <div className="measure-info">
                  <span className="measure-label">총 면적</span>
                  <span className="measure-value">{formatArea(totalArea)}</span>
                </div>
                <p className="measure-hint">좌클릭: 꼭지점 추가 / 우클릭: 완료</p>
                <div className="measure-buttons">
                  <button className="measure-btn finish" onClick={finishAreaMeasure}>
                    완료
                  </button>
                  <button className="measure-btn clear" onClick={clearAreaMeasure}>
                    초기화
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="tool-section">
            <h5>그리기 도구</h5>
            {!isAddingMarker ? (
              <button
                className="tool-item"
                onClick={startAddMarker}
                disabled={isMeasuring || isMeasuringArea}
              >
                <span className="tool-item-icon">📍</span>
                <span>마커 추가</span>
              </button>
            ) : (
              <div className="measure-active marker">
                <p className="measure-hint">지도를 클릭하여 마커 위치를 선택하세요</p>
                <p className="measure-hint">우클릭: 취소</p>
                <div className="measure-buttons">
                  <button className="measure-btn clear" onClick={cancelAddMarker}>
                    취소
                  </button>
                </div>
              </div>
            )}
            {markerCount > 0 && (
              <button className="tool-item danger" onClick={clearAllMarkers}>
                <span className="tool-item-icon">🗑️</span>
                <span>모든 마커 삭제</span>
              </button>
            )}
            <button className="tool-item">
              <span className="tool-item-icon">〰️</span>
              <span>선 그리기</span>
            </button>
            <button className="tool-item">
              <span className="tool-item-icon">⬡</span>
              <span>폴리곤 그리기</span>
            </button>
          </div>
          <div className="tool-section">
            <h5>보기 설정</h5>
            <button className="tool-item">
              <span className="tool-item-icon">🏠</span>
              <span>초기 위치로</span>
            </button>
            <button className="tool-item">
              <span className="tool-item-icon">📷</span>
              <span>화면 캡처</span>
            </button>
          </div>
        </div>
      </div>

      {/* 마커 입력 폼 모달 */}
      {showMarkerForm && (
        <div className="marker-modal-overlay">
          <div className="marker-modal">
            <div className="marker-modal-header">
              <h4>마커 추가</h4>
              <button className="marker-modal-close" onClick={() => {
                setShowMarkerForm(false)
                setPendingMarkerPosition(null)
              }}>×</button>
            </div>
            <div className="marker-modal-content">
              <div className="marker-form-group">
                <label htmlFor="marker-title">제목</label>
                <input
                  id="marker-title"
                  type="text"
                  placeholder="마커 제목을 입력하세요"
                  value={markerFormData.title}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setMarkerFormData(prev => ({ ...prev, title: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="marker-form-group">
                <label htmlFor="marker-description">내용</label>
                <textarea
                  id="marker-description"
                  placeholder="상세 내용을 입력하세요"
                  rows={4}
                  value={markerFormData.description}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setMarkerFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            <div className="marker-modal-footer">
              <button
                className="marker-modal-btn cancel"
                onClick={() => {
                  setShowMarkerForm(false)
                  setPendingMarkerPosition(null)
                }}
              >
                취소
              </button>
              <button
                className="marker-modal-btn save"
                onClick={saveMarker}
                disabled={!markerFormData.title.trim()}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 마커 상세정보 팝업 */}
      {selectedMarker && (
        <div className="marker-detail-popup">
          <div className="marker-detail-header">
            <h4>{selectedMarker.title}</h4>
            <button className="marker-detail-close" onClick={() => setSelectedMarker(null)}>×</button>
          </div>
          <div className="marker-detail-content">
            {selectedMarker.description ? (
              <p>{selectedMarker.description}</p>
            ) : (
              <p className="no-description">상세 내용이 없습니다.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default MapToolbar
