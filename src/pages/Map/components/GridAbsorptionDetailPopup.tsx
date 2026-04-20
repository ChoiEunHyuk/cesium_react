import type { SelectedGridAbsorption } from '../hooks/useCarbonAbsorption'

interface GridAbsorptionDetailPopupProps {
  selectedGridAbsorption: SelectedGridAbsorption | null
  isDetailLoading: boolean
  onClose: () => void
}

function GridAbsorptionDetailPopup({ selectedGridAbsorption, isDetailLoading, onClose }: GridAbsorptionDetailPopupProps) {
  if (!isDetailLoading && !selectedGridAbsorption) return null

  const style: React.CSSProperties = selectedGridAbsorption
    ? { left: selectedGridAbsorption.screenX + 12, top: selectedGridAbsorption.screenY - 10 }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  const d = selectedGridAbsorption?.data

  return (
    <div className="parcel-detail-popup" style={style}>
      <div className="parcel-detail-header">
        <span className="parcel-detail-title">격자 상세정보</span>
        <button className="popup-close-btn" onClick={onClose}>×</button>
      </div>

      {isDetailLoading && (
        <div className="parcel-detail-loading">
          <span className="loading-spinner" />
          <span>조회 중...</span>
        </div>
      )}

      {!isDetailLoading && d && (
        <div className="parcel-detail-body">
          {d.gid && (
            <div className="parcel-detail-row">
              <span className="parcel-detail-label">격자 ID</span>
              <span className="parcel-detail-value">{d.gid}</span>
            </div>
          )}
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">포함 산림 수</span>
            <span className="parcel-detail-value">
              {d.forestCount != null ? `${d.forestCount.toLocaleString()}개` : '-'}
            </span>
          </div>
          <div className="parcel-detail-divider" />
          <div className="parcel-detail-row highlight">
            <span className="parcel-detail-label">총 탄소흡수량</span>
            <span className="parcel-detail-value emission">
              {d.totalAbsorption != null ? `${d.totalAbsorption.toFixed(2)} tCO2/년` : '데이터 없음'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GridAbsorptionDetailPopup
