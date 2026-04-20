import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import '../../styles/CesiumMap.css'
import MapToolbar from './MapToolbar'

// Hooks
import { useImageSlide } from './hooks/useImageSlide'
import { useSlopeAnalysis } from './hooks/useSlopeAnalysis'
import { useCarbonAbsorption } from './hooks/useCarbonAbsorption'
import { useBuildingEmission } from './hooks/useBuildingEmission'

// Components
import ImageSlidePopup from './components/ImageSlidePopup'
import SlopeAnalysisPopup from './components/SlopeAnalysisPopup'
import CarbonAbsorptionPopup from './components/CarbonAbsorptionPopup'
import BuildingEmissionPopup from './components/BuildingEmissionPopup'
import ParcelDetailPopup from './components/ParcelDetailPopup'
import GridDetailPopup from './components/GridDetailPopup'
import ForestDetailPopup from './components/ForestDetailPopup'
import GridAbsorptionDetailPopup from './components/GridAbsorptionDetailPopup'

Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ODg3ZmRkMS0xMjBhLTQwNWQtYjkxNS00NGJkMzUxOWQwNGQiLCJpZCI6Mzc4OTA0LCJpYXQiOjE3Njg0NjI4MzB9.ixCIJjyhqXIALvMNMxQbBLkshlm0s2XpiyJagexiT7o'

type PopupType = 'imageSlide' | 'slopeAnalysis' | 'carbonAbsorption' | 'buildingEmission' | null

function CesiumMap() {
  const cesiumContainer = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activePopup, setActivePopup] = useState<PopupType>(null)

  // 커스텀 훅 사용
  const imageSlide = useImageSlide(viewerRef)
  const slopeAnalysis = useSlopeAnalysis(viewerRef)
  const carbonAbsorption = useCarbonAbsorption(viewerRef)
  const buildingEmission = useBuildingEmission(viewerRef)

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
        infoBox: false,
        selectionIndicator: false,
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
      carbonAbsorption.cleanup()
      buildingEmission.cleanup()
      if (viewerRef.current) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    // 탄소 흡수 정리
    if (carbonAbsorption.isLoaded) {
      carbonAbsorption.clearData()
    }
    // 건물 탄소 배출 정리
    if (buildingEmission.isLoaded) {
      buildingEmission.clearData()
    }
    setActivePopup(null)
  }

  const toggleMenu = () => {
    setIsMenuOpen(prev => {
      if (prev) {
        // 메뉴 닫을 때 팝업도 닫기
        closeAllPopups()
      }
      return !prev
    })
  }

  const openPopup = (popupName: PopupType) => {
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
      if (activePopup === 'carbonAbsorption' && carbonAbsorption.isLoaded) {
        carbonAbsorption.clearData()
      }
      if (activePopup === 'buildingEmission' && buildingEmission.isLoaded) {
        buildingEmission.clearData()
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

  const closeCarbonAbsorptionPopup = () => {
    if (carbonAbsorption.isLoaded) {
      carbonAbsorption.clearData()
    }
    setActivePopup(null)
  }

  const closeBuildingEmissionPopup = () => {
    if (buildingEmission.isLoaded) {
      buildingEmission.clearData()
    }
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
          <li
            className={`menu-item ${activePopup === 'carbonAbsorption' ? 'active' : ''}`}
            onClick={() => openPopup('carbonAbsorption')}
          >
            <span className="menu-item-icon"></span>
            <span className="menu-item-text">탄소 흡수</span>
          </li>
          <li
            className={`menu-item ${activePopup === 'buildingEmission' ? 'active' : ''}`}
            onClick={() => openPopup('buildingEmission')}
          >
            <span className="menu-item-icon"></span>
            <span className="menu-item-text">탄소 배출</span>
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

      {/* 건물 탄소 배출 팝업 */}
      <BuildingEmissionPopup
        isOpen={activePopup === 'buildingEmission'}
        onClose={closeBuildingEmissionPopup}
        isSearching={buildingEmission.isLoading}
        isLoaded={buildingEmission.isLoaded}
        activeItemType={buildingEmission.activeItemType}
        activeDetail={buildingEmission.activeDetail}
        emissionColors={buildingEmission.emissionColors}
        onSearch={buildingEmission.search}
        onClear={buildingEmission.clearData}
      />

      {/* 필지 클릭 상세 팝업 */}
      <ParcelDetailPopup
        selectedParcel={buildingEmission.selectedParcel}
        isDetailLoading={buildingEmission.isDetailLoading}
        activeEnergyType={buildingEmission.activeEnergyType}
        onClose={buildingEmission.clearSelected}
      />

      {/* 격자 클릭 상세 팝업 */}
      <GridDetailPopup
        selectedGrid={buildingEmission.selectedGrid}
        isDetailLoading={buildingEmission.isGridDetailLoading}
        activeEnergyType={buildingEmission.activeEnergyType}
        onClose={buildingEmission.clearSelectedGrid}
      />

      {/* 산림 클릭 상세 팝업 */}
      <ForestDetailPopup
        selectedForest={carbonAbsorption.selectedForest}
        isDetailLoading={carbonAbsorption.isDetailLoading}
        onClose={carbonAbsorption.clearSelected}
      />

      {/* 탄소흡수 격자 클릭 상세 팝업 */}
      <GridAbsorptionDetailPopup
        selectedGridAbsorption={carbonAbsorption.selectedGridAbsorption}
        isDetailLoading={carbonAbsorption.isGridDetailLoading}
        onClose={carbonAbsorption.clearSelectedGridAbsorption}
      />

      {/* 탄소 흡수 지도 팝업 */}
      <CarbonAbsorptionPopup
        isOpen={activePopup === 'carbonAbsorption'}
        onClose={closeCarbonAbsorptionPopup}
        isLoading={carbonAbsorption.isLoading}
        isLoaded={carbonAbsorption.isLoaded}
        carbonColors={carbonAbsorption.carbonColors}
        onSearch={carbonAbsorption.search}
        onClearData={carbonAbsorption.clearData}
      />
    </div>
  )
}

export default CesiumMap
