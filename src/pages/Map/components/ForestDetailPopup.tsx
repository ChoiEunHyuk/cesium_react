import type { SelectedForest } from '../hooks/useCarbonAbsorption'

interface ForestDetailPopupProps {
  selectedForest: SelectedForest | null
  isDetailLoading: boolean
  onClose: () => void
}

const DENSITY_LABEL: Record<string, string> = {
  A: '소 (50% 이하)',
  B: '중 (51~70%)',
  C: '밀 (71% 이상)',
}

function formatAgeClass(cd: string | null | undefined): string {
  if (!cd) return '-'
  const n = parseInt(cd, 10)
  return isNaN(n) ? cd : `${n}영급 (${n * 10}년생)`
}

function ForestDetailPopup({ selectedForest, isDetailLoading, onClose }: ForestDetailPopupProps) {
  if (!isDetailLoading && !selectedForest) return null

  const style: React.CSSProperties = selectedForest
    ? { left: selectedForest.screenX + 12, top: selectedForest.screenY - 10 }
    : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }

  const d = selectedForest?.data

  return (
    <div className="parcel-detail-popup" style={style}>
      <div className="parcel-detail-header">
        <span className="parcel-detail-title">산림 상세정보</span>
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
            <span className="parcel-detail-label">수종</span>
            <span className="parcel-detail-value">{d.koftrNm ?? '-'}</span>
          </div>
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">림종</span>
            <span className="parcel-detail-value">{d.frtpNm ?? '-'}</span>
          </div>
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">영급</span>
            <span className="parcel-detail-value">{formatAgeClass(d.agclsCd)}</span>
          </div>
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">밀도</span>
            <span className="parcel-detail-value">
              {d.dnstCd ? (DENSITY_LABEL[d.dnstCd] ?? d.dnstCd) : '-'}
            </span>
          </div>
          <div className="parcel-detail-row">
            <span className="parcel-detail-label">면적</span>
            <span className="parcel-detail-value">
              {d.areaHa != null ? `${d.areaHa.toFixed(3)} ha` : '-'}
            </span>
          </div>
          <div className="parcel-detail-divider" />
          <div className="parcel-detail-row highlight">
            <span className="parcel-detail-label">연간 탄소흡수량</span>
            <span className="parcel-detail-value emission">
              {d.totalAbsorption != null ? `${d.totalAbsorption.toFixed(2)} tCO2/년` : '데이터 없음'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ForestDetailPopup
