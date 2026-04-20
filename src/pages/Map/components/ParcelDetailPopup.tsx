import { SelectedParcel } from '../hooks/useBuildingEmission'

interface ParcelDetailPopupProps {
  selectedParcel: SelectedParcel | null
  isDetailLoading: boolean
  activeEnergyType: string
  onClose: () => void
}

function ParcelDetailPopup({ selectedParcel, isDetailLoading, activeEnergyType, onClose }: ParcelDetailPopupProps) {
  if (!isDetailLoading && !selectedParcel) return null

  const style: React.CSSProperties = selectedParcel
    ? { left: selectedParcel.screenX + 12, top: selectedParcel.screenY - 10 }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  const d = selectedParcel?.data

  const formatYm = (ym: string | null | undefined) => {
    if (!ym || ym.length < 6) return ym ?? '-'
    return `${ym.slice(0, 4)}년 ${parseInt(ym.slice(4, 6), 10)}월`
  }

  return (
    <div className="parcel-detail-popup" style={style}>
      <div className="parcel-detail-header">
        <span className="parcel-detail-title">필지 상세정보</span>
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
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">PNU</span>
            <span className="parcel-detail-value">{d.pnu ?? '-'}</span>
          </div>
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">지번주소</span>
            <span className="parcel-detail-value">{d.lotAddress ?? '-'}</span>
          </div>
          {d.roadAddress && (
            <div className="parcel-detail-row">
              <span className="parcel-detail-label">도로명주소</span>
              <span className="parcel-detail-value">{d.roadAddress}</span>
            </div>
          )}
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">기준월</span>
            <span className="parcel-detail-value">{formatYm(d.useYm)}</span>
          </div>
          <div className="parcel-detail-divider" />
          {activeEnergyType === 'gas' ? (
            <>
              <div className="parcel-detail-row highlight">
                <span className="parcel-detail-label">가스 사용량</span>
                <span className="parcel-detail-value">
                  {d.usageKwh != null ? `${d.usageKwh.toLocaleString()} kWh` : '데이터 없음'}
                </span>
              </div>
              <div className="parcel-detail-row highlight">
                <span className="parcel-detail-label">탄소 배출량</span>
                <span className="parcel-detail-value emission">
                  {d.gasCo2 != null ? `${d.gasCo2.toFixed(4)} tCO2` : '데이터 없음'}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="parcel-detail-row highlight">
                <span className="parcel-detail-label">전력 사용량</span>
                <span className="parcel-detail-value">
                  {d.usageKwh != null ? `${d.usageKwh.toLocaleString()} kWh` : '데이터 없음'}
                </span>
              </div>
              <div className="parcel-detail-row highlight">
                <span className="parcel-detail-label">탄소 배출량</span>
                <span className="parcel-detail-value emission">
                  {d.elecCo2 != null ? `${d.elecCo2.toFixed(4)} tCO2` : '데이터 없음'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
 
export default ParcelDetailPopup
