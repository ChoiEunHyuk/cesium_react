import { ChangeEvent } from 'react'
import * as Cesium from 'cesium'
import type { SlopeResult } from '../hooks/useSlopeAnalysis'

interface SlopeColorRange {
  min: number
  max: number
  color: Cesium.Color
  label: string
}

interface SlopeAnalysisPopupProps {
  isOpen: boolean
  onClose: () => void
  isAnalyzing: boolean
  isSelectingArea: boolean
  isHoverEnabled: boolean
  hoverSlope: SlopeResult | null
  analysisProgress: number
  gridResolution: number
  slopeColors: SlopeColorRange[]
  onGridResolutionChange: (value: number) => void
  onStartHover: () => void
  onStopHover: () => void
  onStartAreaSelection: () => void
  onCancelAreaSelection: () => void
  onClearResults: () => void
}

function SlopeAnalysisPopup({
  isOpen,
  onClose,
  isAnalyzing,
  isSelectingArea,
  isHoverEnabled,
  hoverSlope,
  analysisProgress,
  gridResolution,
  slopeColors,
  onGridResolutionChange,
  onStartHover,
  onStopHover,
  onStartAreaSelection,
  onCancelAreaSelection,
  onClearResults,
}: SlopeAnalysisPopupProps) {
  if (!isOpen) return null

  const handleGridResolutionChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onGridResolutionChange(parseInt(e.target.value, 10))
  }

  return (
    <div className="control-popup slope-popup">
      <div className="control-popup-header">
        <h4>DEM 경사도 분석</h4>
        <button className="popup-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="control-popup-body">
        {/* 실시간 경사도 모드 */}
        <div className="slope-section">
          <h5>실시간 경사도</h5>
          <div className="hover-control">
            <button
              className={`slope-btn ${isHoverEnabled ? 'active' : ''}`}
              onClick={isHoverEnabled ? onStopHover : onStartHover}
              disabled={isSelectingArea || isAnalyzing}
            >
              {isHoverEnabled ? '호버 모드 중지' : '호버 모드 시작'}
            </button>
          </div>
          {isHoverEnabled && hoverSlope && (
            <div className="hover-info">
              <div className="hover-info-row">
                <span className="hover-label">경사도</span>
                <span className="hover-value">{hoverSlope.slope.toFixed(1)}°</span>
              </div>
              <div className="hover-info-row">
                <span className="hover-label">고도</span>
                <span className="hover-value">{hoverSlope.height.toFixed(1)}m</span>
              </div>
              <div className="hover-info-row small">
                <span className="hover-label">위치</span>
                <span className="hover-value">
                  {hoverSlope.latitude.toFixed(5)}, {hoverSlope.longitude.toFixed(5)}
                </span>
              </div>
            </div>
          )}
          {isHoverEnabled && !hoverSlope && (
            <p className="slope-hint">지도 위에서 마우스를 움직여보세요</p>
          )}
        </div>

        {/* 구분선 */}
        <div className="slope-divider"></div>

        {/* 영역 분석 */}
        <div className="slope-section">
          <h5>영역 분석</h5>

          {/* 그리드 해상도 설정 */}
          <div className="grid-resolution">
            <label htmlFor="gridResolution">그리드 해상도</label>
            <select
              id="gridResolution"
              value={gridResolution}
              onChange={handleGridResolutionChange}
              disabled={isSelectingArea || isAnalyzing}
            >
              <option value="30">30m (상세)</option>
              <option value="50">50m (표준)</option>
              <option value="100">100m (빠름)</option>
              <option value="200">200m (매우 빠름)</option>
            </select>
          </div>

          {/* 영역 선택 버튼 */}
          {!isSelectingArea && !isAnalyzing && (
            <button
              className="slope-btn primary"
              onClick={onStartAreaSelection}
              disabled={isHoverEnabled}
            >
              영역 선택 시작
            </button>
          )}

          {/* 선택 중 상태 */}
          {isSelectingArea && (
            <div className="selection-status">
              <p className="slope-hint">좌클릭: 꼭지점 추가</p>
              <p className="slope-hint">우클릭: 선택 완료 및 분석</p>
              <button className="slope-btn cancel" onClick={onCancelAreaSelection}>
                취소
              </button>
            </div>
          )}

          {/* 분석 중 상태 */}
          {isAnalyzing && (
            <div className="analysis-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${analysisProgress}%` }}
                ></div>
              </div>
              <span className="progress-text">분석 중... {analysisProgress}%</span>
            </div>
          )}

          {/* 결과 초기화 */}
          {!isSelectingArea && !isAnalyzing && (
            <button className="slope-btn secondary" onClick={onClearResults}>
              결과 초기화
            </button>
          )}
        </div>

        {/* 구분선 */}
        <div className="slope-divider"></div>

        {/* 범례 */}
        <div className="slope-section">
          <h5>경사도 범례</h5>
          <div className="slope-legend">
            {slopeColors.map((item, index) => (
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
      </div>
    </div>
  )
}

export default SlopeAnalysisPopup
