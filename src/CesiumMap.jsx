import { useEffect, useRef, useState, useCallback } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import './CesiumMap.css'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODg3ZmRkMS0xMjBhLTQwNWQtYjkxNS00NGJkMzUxOWQwNGQiLCJpZCI6Mzc4OTA0LCJpYXQiOjE3Njg0NjI4MzB9.ixCIJjyhqXIALvMNMxQbBLkshlm0s2XpiyJagexiT7o'

const IMAGE_LIST = [
  '/img/20250820_gw_avg_futr_01m.png',
  '/img/20250820_gw_avg_futr_01w.png',
  '/img/20250820_gw_avg_futr_02m.png',
  '/img/20250820_gw_avg_futr_02w.png',
  '/img/20250820_gw_avg_futr_03m.png',
]

const POLYGON_COORDS = [
  125.695742, 36.483790,  // 남서 (SW)
  129.344191, 36.467887,  // 남동 (SE)
  129.431245, 39.168407,  // 북동 (NE)
  125.647267, 39.185925,  // 북서 (NW)
]

function CesiumMap() {
  const cesiumContainer = useRef(null)
  const viewerRef = useRef(null)
  const entitiesRef = useRef([])
  const intervalRef = useRef(null)
  const currentIndexRef = useRef(0)
  const opacityRef = useRef(1.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [opacity, setOpacity] = useState(100)

  useEffect(() => {
    if (cesiumContainer.current && !viewerRef.current) {
      viewerRef.current = new Cesium.Viewer(cesiumContainer.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        animation: false,
        timeline: false,
        baseLayerPicker: true,
        geocoder: true,
        homeButton: true,
        sceneModePicker: true,
        navigationHelpButton: true,
        fullscreenButton: true,
      })

      viewerRef.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(127.5, 37.8, 450000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      })
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  // 이미지 entity 생성
  const createImageEntities = useCallback(() => {
    if (!viewerRef.current) return

    entitiesRef.current = IMAGE_LIST.map((imageSrc, index) => {
      return viewerRef.current.entities.add({
        show: index === 0,
        polygon: {
          hierarchy: Cesium.Cartesian3.fromDegreesArray(POLYGON_COORDS),
          material: new Cesium.ImageMaterialProperty({
            image: imageSrc,
            transparent: true,
            color: new Cesium.Color(1, 1, 1, opacityRef.current),
          }),
          stRotation: Cesium.Math.toRadians(0),
        },
      })
    })
  }, [])

  // 투명도 업데이트
  const updateOpacity = useCallback((newOpacity) => {
    opacityRef.current = newOpacity
    entitiesRef.current.forEach(entity => {
      if (entity.polygon && entity.polygon.material) {
        entity.polygon.material.color = new Cesium.Color(1, 1, 1, newOpacity)
      }
    })
  }, [])

  // 투명도 슬라이더 핸들러
  const handleOpacityChange = (e) => {
    const value = parseInt(e.target.value, 10)
    setOpacity(value)
    updateOpacity(value / 100)
  }

  // 슬라이드 시작
  const startSlide = () => {
    if (intervalRef.current) return

    currentIndexRef.current = 0
    setCurrentIndex(0)
    createImageEntities()
    setIsPlaying(true)

    // 2초마다 show 토글로 이미지 전환
    intervalRef.current = setInterval(() => {
      entitiesRef.current[currentIndexRef.current].show = false
      currentIndexRef.current = (currentIndexRef.current + 1) % IMAGE_LIST.length
      entitiesRef.current[currentIndexRef.current].show = true
      setCurrentIndex(currentIndexRef.current)
    }, 2000)
  }

  // 슬라이드 중지
  const stopSlide = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // 모든 entity 제거
    entitiesRef.current.forEach(entity => {
      if (viewerRef.current) {
        viewerRef.current.entities.remove(entity)
      }
    })
    entitiesRef.current = []
    currentIndexRef.current = 0
    setCurrentIndex(0)
    setIsPlaying(false)
  }

  return (
    <div className="map-wrapper">
      <div ref={cesiumContainer} className="cesium-container" />
      <div className="slide-controls">
        <button
          onClick={isPlaying ? stopSlide : startSlide}
          className={`slide-btn ${isPlaying ? 'slide-btn--stop active' : 'slide-btn--start'}`}
        >
          {isPlaying ? '슬라이드 중지' : '이미지 슬라이드'}
        </button>
        {isPlaying && (
          <>
            <span className="slide-counter">
              {currentIndex + 1} / {IMAGE_LIST.length}
            </span>
            <div className="opacity-control show">
              <label htmlFor="opacitySlider">투명도:</label>
              <input
                type="range"
                id="opacitySlider"
                min="0"
                max="100"
                value={opacity}
                onChange={handleOpacityChange}
              />
              <span className="opacity-value">{opacity}%</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CesiumMap
