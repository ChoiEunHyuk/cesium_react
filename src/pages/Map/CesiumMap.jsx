import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import '../../styles/CesiumMap.css'
import MapToolbar from './MapToolbar'

// Hooks
import { useImageSlide } from './hooks/useImageSlide'
import { useSlopeAnalysis } from './hooks/useSlopeAnalysis'

// Components
import ImageSlidePopup from './components/ImageSlidePopup'
import SlopeAnalysisPopup from './components/SlopeAnalysisPopup'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODg3ZmRkMS0xMjBhLTQwNWQtYjkxNS00NGJkMzUxOWQwNGQiLCJpZCI6Mzc4OTA0LCJpYXQiOjE3Njg0NjI4MzB9.ixCIJjyhqXIALvMNMxQbBLkshlm0s2XpiyJagexiT7o'

function CesiumMap() {
  const cesiumContainer = useRef(null)
  const viewerRef = useRef(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activePopup, setActivePopup] = useState(null) // 'imageSlide' | 'slopeAnalysis' | null

  // 커스텀 훅 사용
  const imageSlide = useImageSlide(viewerRef)
  const slopeAnalysis = useSlopeAnalysis(viewerRef)

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
      imageSlide.cleanup()
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(prev => {
      if (prev) {
        // 메뉴 닫을 때 팝업도 닫기
        closeAllPopups()
      }
      return !prev
    })
  }

  const closeAllPopups = () => {
    // 이미지 슬라이드 정리
    if (imageSlide.isPlaying) {
      imageSlide.stopSlide()
    }
    // 경사도 분석 정리
    if (slopeAnalysis.isHoverEnabled) {
      slopeAnalysis.stopHoverMode()
    }
    if (slopeAnalysis.isSelectingArea) {
      slopeAnalysis.cancelAreaSelection()
    }
    setActivePopup(null)
  }

  const openPopup = (popupName) => {
    // 다른 팝업이 열려있으면 정리
    if (activePopup && activePopup !== popupName) {
      if (activePopup === 'imageSlide' && imageSlide.isPlaying) {
        imageSlide.stopSlide()
      }
      if (activePopup === 'slopeAnalysis') {
        if (slopeAnalysis.isHoverEnabled) {
          slopeAnalysis.stopHoverMode()
        }
        if (slopeAnalysis.isSelectingArea) {
          slopeAnalysis.cancelAreaSelection()
        }
      }
    }
    setActivePopup(popupName)
  }

  const closeImageSlidePopup = () => {
    if (imageSlide.isPlaying) {
      imageSlide.stopSlide()
    }
    setActivePopup(null)
  }

  const closeSlopeAnalysisPopup = () => {
    if (slopeAnalysis.isHoverEnabled) {
      slopeAnalysis.stopHoverMode()
    }
    if (slopeAnalysis.isSelectingArea) {
      slopeAnalysis.cancelAreaSelection()
    }
    slopeAnalysis.clearAnalysisResults()
    setActivePopup(null)
  }

  return (
    <div className="map-wrapper">
      <div ref={cesiumContainer} className="cesium-container" />

      {/* 우측 툴바 */}
      <MapToolbar viewerRef={viewerRef} />

      {/* 메뉴 버튼 */}
      <button className="menu-toggle-btn" onClick={toggleMenu}>
        <span className={`menu-icon ${isMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* 사이드 메뉴 */}
      <div className={`side-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="side-menu-header">
          <h3>메뉴</h3>
        </div>
        <ul className="menu-list">
          <li
            className={`menu-item ${activePopup === 'imageSlide' ? 'active' : ''}`}
            onClick={() => openPopup('imageSlide')}
          >
            <span className="menu-item-icon"></span>
            <span className="menu-item-text">이미지 슬라이드</span>
          </li>
          <li
            className={`menu-item ${activePopup === 'slopeAnalysis' ? 'active' : ''}`}
            onClick={() => openPopup('slopeAnalysis')}
          >
            <span className="menu-item-icon"></span>
            <span className="menu-item-text">DEM 경사도 분석</span>
          </li>
        </ul>
      </div>

      {/* 이미지 슬라이드 팝업 */}
      <ImageSlidePopup
        isOpen={activePopup === 'imageSlide'}
        onClose={closeImageSlidePopup}
        isPlaying={imageSlide.isPlaying}
        currentIndex={imageSlide.currentIndex}
        imageCount={imageSlide.imageCount}
        opacity={imageSlide.opacity}
        onStart={imageSlide.startSlide}
        onStop={imageSlide.stopSlide}
        onOpacityChange={imageSlide.handleOpacityChange}
      />

      {/* 경사도 분석 팝업 */}
      <SlopeAnalysisPopup
        isOpen={activePopup === 'slopeAnalysis'}
        onClose={closeSlopeAnalysisPopup}
        isAnalyzing={slopeAnalysis.isAnalyzing}
        isSelectingArea={slopeAnalysis.isSelectingArea}
        isHoverEnabled={slopeAnalysis.isHoverEnabled}
        hoverSlope={slopeAnalysis.hoverSlope}
        analysisProgress={slopeAnalysis.analysisProgress}
        gridResolution={slopeAnalysis.gridResolution}
        slopeColors={slopeAnalysis.slopeColors}
        onGridResolutionChange={slopeAnalysis.setGridResolution}
        onStartHover={slopeAnalysis.startHoverMode}
        onStopHover={slopeAnalysis.stopHoverMode}
        onStartAreaSelection={slopeAnalysis.startAreaSelection}
        onCancelAreaSelection={slopeAnalysis.cancelAreaSelection}
        onClearResults={slopeAnalysis.clearAnalysisResults}
      />
    </div>
  )
}

export default CesiumMap
