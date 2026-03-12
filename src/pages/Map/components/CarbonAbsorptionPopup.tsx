import * as Cesium from 'cesium'
import type { SelectedFeature } from '../hooks/useCarbonAbsorption'

interface CarbonColorRange {
  min: number
  max: number
  color: Cesium.Color
  label: string
}

interface CarbonAbsorptionPopupProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  isLoaded: boolean
  featureCount: number
  selectedFeature: SelectedFeature | null
  carbonColors: CarbonColorRange[]
  onLoadData: () => void
  onClearData: () => void
}

function CarbonAbsorptionPopup({
  isOpen,
  onClose,
  isLoading,
  isLoaded,
  featureCount,
  selectedFeature,
  carbonColors,
  onLoadData,
  onClearData,
}: CarbonAbsorptionPopupProps) {
  if (!isOpen) return null

  return (
    <div className="control-popup carbon-popup">
      <div className="control-popup-header">
        <h4>산림지역 탄소 흡수 지도</h4>
        <button className="popup-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="control-popup-body">
        {/* 조회 버튼 섹션 */}
        <div className="carbon-section">
          <h5>데이터 조회</h5>
          <div className="carbon-actions">
            {!isLoaded ? (
              <button
                className="carbon-btn primary"
                onClick={onLoadData}
                disabled={isLoading}
              >
                {isLoading ? '로딩 중...' : '조회'}
              </button>
            ) : (
              <button
                className="carbon-btn secondary"
                onClick={onClearData}
              >
                데이터 초기화
              </button>
            )}
          </div>
          {isLoading && (
            <div className="carbon-loading">
              <div className="loading-spinner"></div>
              <span>데이터를 불러오는 중...</span>
            </div>
          )}
          {isLoaded && (
            <div className="carbon-info">
              <span className="info-label">총 피처 수</span>
              <span className="info-value">{featureCount.toLocaleString()}개</span>
            </div>
          )}
        </div>

        {/* 선택된 피처 정보 */}
        {isLoaded && selectedFeature && (
          <>
            <div className="carbon-divider"></div>
            <div className="carbon-section">
              <h5>선택 영역 정보</h5>
              <div className="feature-info">
                <div className="feature-info-row">
                  <span className="feature-label">수종</span>
                  <span className="feature-value">{selectedFeature.speciesName}</span>
                </div>
                <div className="feature-info-row">
                  <span className="feature-label">림종</span>
                  <span className="feature-value">{selectedFeature.forestType}</span>
                </div>
                <div className="feature-info-row">
                  <span className="feature-label">영급</span>
                  <span className="feature-value">{selectedFeature.ageClass}</span>
                </div>
                <div className="feature-info-row">
                  <span className="feature-label">밀도</span>
                  <span className="feature-value">{selectedFeature.densityName} ({selectedFeature.densityFactor}%)</span>
                </div>
                <div className="feature-info-row">
                  <span className="feature-label">면적</span>
                  <span className="feature-value">{selectedFeature.area} ha</span>
                </div>
                <div className="feature-info-row highlight">
                  <span className="feature-label">총 탄소 흡수량</span>
                  <span className="feature-value">{selectedFeature.totalAbsorption} tCO2/년</span>
                </div>
              </div>
            </div>
          </>
        )}

        {isLoaded && !selectedFeature && (
          <>
            <div className="carbon-divider"></div>
            <div className="carbon-section">
              <p className="carbon-hint">지도에서 영역을 클릭하면 상세 정보를 볼 수 있습니다.</p>
            </div>
          </>
        )}

        {/* 범례 */}
        {isLoaded && (
          <>
            <div className="carbon-divider"></div>
            <div className="carbon-section">
              <h5>탄소 흡수량 범례</h5>
              <div className="carbon-legend">
                {carbonColors.map((item, index) => (
                  <div key={index} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: item.color.toCssColorString() }}
                    ></span>
                    <span className="legend-label">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CarbonAbsorptionPopup
