import { useState, useRef, useCallback, ChangeEvent } from 'react'
import * as Cesium from 'cesium'

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

type CesiumViewerRef = React.MutableRefObject<Cesium.Viewer | null>

export interface UseImageSlideReturn {
  isPlaying: boolean
  currentIndex: number
  opacity: number
  imageCount: number
  startSlide: () => void
  stopSlide: () => void
  handleOpacityChange: (e: ChangeEvent<HTMLInputElement>) => void
  cleanup: () => void
}

export function useImageSlide(viewerRef: CesiumViewerRef): UseImageSlideReturn {
  const entitiesRef = useRef<Cesium.Entity[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const currentIndexRef = useRef(0)
  const opacityRef = useRef(1.0)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [opacity, setOpacity] = useState(100)

  // 이미지 entity 생성
  const createImageEntities = useCallback(() => {
    if (!viewerRef.current) return

    entitiesRef.current = IMAGE_LIST.map((imageSrc, index) => {
      return viewerRef.current!.entities.add({
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
  }, [viewerRef])

  // 투명도 업데이트
  const updateOpacity = useCallback((newOpacity: number) => {
    opacityRef.current = newOpacity
    entitiesRef.current.forEach(entity => {
      if (entity.polygon && entity.polygon.material) {
        (entity.polygon.material as Cesium.ImageMaterialProperty).color = new Cesium.ConstantProperty(new Cesium.Color(1, 1, 1, newOpacity))
      }
    })
  }, [])

  // 투명도 슬라이더 핸들러
  const handleOpacityChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10)
    setOpacity(value)
    updateOpacity(value / 100)
  }, [updateOpacity])

  // 슬라이드 시작
  const startSlide = useCallback(() => {
    if (intervalRef.current) return

    currentIndexRef.current = 0
    setCurrentIndex(0)
    createImageEntities()
    setIsPlaying(true)

    intervalRef.current = setInterval(() => {
      entitiesRef.current[currentIndexRef.current]!.show = false
      currentIndexRef.current = (currentIndexRef.current + 1) % IMAGE_LIST.length
      entitiesRef.current[currentIndexRef.current]!.show = true
      setCurrentIndex(currentIndexRef.current)
    }, 2000)
  }, [createImageEntities])

  // 슬라이드 중지
  const stopSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    entitiesRef.current.forEach(entity => {
      if (viewerRef.current) {
        viewerRef.current.entities.remove(entity)
      }
    })
    entitiesRef.current = []
    currentIndexRef.current = 0
    setCurrentIndex(0)
    setIsPlaying(false)
  }, [viewerRef])

  // 클린업
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  return {
    isPlaying,
    currentIndex,
    opacity,
    imageCount: IMAGE_LIST.length,
    startSlide,
    stopSlide,
    handleOpacityChange,
    cleanup,
  }
}
