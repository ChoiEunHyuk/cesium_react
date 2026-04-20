import { SelectedGrid } from '../hooks/useBuildingEmission'

interface GridDetailPopupProps {
  selectedGrid: SelectedGrid | null
  isDetailLoading: boolean
  activeEnergyType: string
  onClose: () => void
}

function GridDetailPopup({ selectedGrid, isDetailLoading, activeEnergyType, onClose }: GridDetailPopupProps) {
  if (!isDetailLoading && !selectedGrid) return null

  const style: React.CSSProperties = selectedGrid
    ? { left: selectedGrid.screenX + 12, top: selectedGrid.screenY - 10 }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  const d = selectedGrid?.data

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
            <span className="parcel-detail-label">포함 필지 수</span>
            <span className="parcel-detail-value">
              {d.parcelCount != null ? `${d.parcelCount.toLocaleString()}개` : '-'}
            </span>
          </div>
          <div className="parcel-detail-divider" />
          <div className="parcel-detail-row highlight">
            <span className="parcel-detail-label">
              {activeEnergyType === 'gas' ? '총 가스 사용량' : '총 전력 사용량'}
            </span>
            <span className="parcel-detail-value">
              {d.totalKwh != null ? `${d.totalKwh.toLocaleString()} kWh` : '데이터 없음'}
            </span>
          </div>
          <div className="parcel-detail-row highlight">
            <span className="parcel-detail-label">총 탄소 배출량</span>
            <span className="parcel-detail-value emission">
              {activeEnergyType === 'gas'
                ? (d.gasCo2 != null ? `${d.gasCo2.toFixed(4)} tCO2` : '데이터 없음')
                : (d.elecCo2 != null ? `${d.elecCo2.toFixed(4)} tCO2` : '데이터 없음')
              }
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default GridDetailPopup
