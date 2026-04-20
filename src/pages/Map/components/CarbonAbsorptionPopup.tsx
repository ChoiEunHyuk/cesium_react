import { useState, useEffect, ChangeEvent } from 'react'
import type { CarbonColorRange } from '../hooks/useCarbonAbsorption'

type ItemType = 'forest' | 'grid'
type DetailType = '1KM' | '500M' | '100M'

interface SggOption {
  admSectC: string
  sggNm: string
}

interface BjdOption {
  bjdCd: string
  bjdNm: string
}

interface CarbonAbsorptionForm {
  sigungu: string
  bjdong: string
  itemType: ItemType | ''
  detail: DetailType | ''
  year: string
}

const INITIAL_FORM: CarbonAbsorptionForm = {
  sigungu: '',
  bjdong: '',
  itemType: '',
  detail: '',
  year: '',
}

interface CarbonAbsorptionPopupProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  isLoaded: boolean
  carbonColors: CarbonColorRange[]
  onSearch: (bjdCd: string, year: string, itemType: ItemType, detail: string) => void
  onClearData: () => void
}

function CarbonAbsorptionPopup({
  isOpen,
  onClose,
  isLoading,
  isLoaded,
  carbonColors,
  onSearch,
  onClearData,
}: CarbonAbsorptionPopupProps) {
  const [form, setForm] = useState<CarbonAbsorptionForm>(INITIAL_FORM)
  const [sggList, setSggList] = useState<SggOption[]>([])
  const [sggLoading, setSggLoading] = useState(false)
  const [bjdList, setBjdList] = useState<BjdOption[]>([])
  const [bjdLoading, setBjdLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setSggLoading(true)
    fetch('/crbEmss/getSgg.do')
      .then(res => res.json())
      .then((data: SggOption[]) => setSggList(data))
      .catch(() => setSggList([]))
      .finally(() => setSggLoading(false))
  }, [isOpen])

  useEffect(() => {
    if (!form.sigungu) {
      setBjdList([])
      return
    }
    setBjdLoading(true)
    fetch(`/crbEmss/getBjd.do?sggCode=${form.sigungu}`)
      .then(res => res.json())
      .then((data: BjdOption[]) => setBjdList(data))
      .catch(() => setBjdList([]))
      .finally(() => setBjdLoading(false))
  }, [form.sigungu])

  if (!isOpen) return null

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      ...(name === 'itemType' && value !== 'grid' ? { detail: '' } : {}),
      ...(name === 'sigungu' ? { bjdong: '', year: '' } : {}),
      ...(name === 'bjdong' ? { year: '' } : {}),
      [name]: value,
    }))
  }

  const canSearch =
    form.sigungu &&
    form.bjdong &&
    form.itemType &&
    (form.itemType === 'grid' ? !!form.detail : true) &&
    form.year &&
    !isLoading

  const handleSearch = () => {
    if (!canSearch) return
    onSearch(form.bjdong, form.year, form.itemType as ItemType, form.detail)
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    onClearData()
  }

  return (
    <div className="control-popup carbon-popup building-emission-popup">
      <div className="control-popup-header">
        <h4>탄소 흡수</h4>
        <button className="popup-close-btn" onClick={onClose}>×</button>
      </div>

      <div className="control-popup-body">
        {/* 시군구 */}
        <div className="be-field">
          <label htmlFor="ca-sigungu">시군구</label>
          <select
            id="ca-sigungu"
            name="sigungu"
            value={form.sigungu}
            onChange={handleChange}
            disabled={sggLoading}
          >
            <option value="">{sggLoading ? '불러오는 중...' : '선택'}</option>
            {sggList.map(sgg => (
              <option key={sgg.admSectC} value={sgg.admSectC}>
                {sgg.sggNm}
              </option>
            ))}
          </select>
        </div>

        {/* 법정동 */}
        <div className="be-field">
          <label htmlFor="ca-bjdong">법정동</label>
          <select
            id="ca-bjdong"
            name="bjdong"
            value={form.bjdong}
            onChange={handleChange}
            disabled={!form.sigungu || bjdLoading}
          >
            <option value="">{bjdLoading ? '불러오는 중...' : '선택'}</option>
            {bjdList.map(bjd => (
              <option key={bjd.bjdCd} value={bjd.bjdCd}>
                {bjd.bjdNm}
              </option>
            ))}
          </select>
        </div>

        {/* 항목 */}
        <div className="be-field">
          <label htmlFor="ca-itemType">항목</label>
          <select
            id="ca-itemType"
            name="itemType"
            value={form.itemType}
            onChange={handleChange}
          >
            <option value="">선택</option>
            <option value="forest">산림</option>
            <option value="rstree">가로수</option>
            <option value="grid">격자</option>
          </select>
        </div>

        {/* 상세 - 격자 선택 시에만 노출 */}
        {form.itemType === 'grid' && (
          <div className="be-field">
            <label htmlFor="ca-detail">상세</label>
            <select
              id="ca-detail"
              name="detail"
              value={form.detail}
              onChange={handleChange}
            >
              <option value="">선택</option>
              <option value="1KM">1KM</option>
              <option value="500M">500M</option>
              <option value="100M">100M</option>
            </select>
          </div>
        )}

        {/* 연도 */}
        <div className="be-field">
          <label htmlFor="ca-year">연도</label>
          <select
            id="ca-year"
            name="year"
            value={form.year}
            onChange={handleChange}
            disabled={!form.bjdong}
          >
            <option value="">선택</option>
            <option value="2024">2024년</option>
          </select>
        </div>

        {/* 액션 버튼 */}
        <div className="be-actions">
          <button className="be-btn secondary" onClick={handleReset} disabled={isLoading}>
            초기화
          </button>
          <button className="be-btn primary" onClick={handleSearch} disabled={!canSearch}>
            {isLoading ? '조회 중...' : '조회'}
          </button>
        </div>

        {/* 범례 */}
        {isLoaded && (
          <div className="be-legend">
            <p className="be-legend-title">탄소 흡수량 (tCO2/년)</p>
            <div className="be-legend-item">
              <span className="be-legend-color" style={{ background: '#808080' }} />
              <span className="be-legend-label">데이터 없음</span>
            </div>
            {carbonColors.map(item => (
              <div key={item.label} className="be-legend-item">
                <span className="be-legend-color" style={{ background: item.color }} />
                <span className="be-legend-label">{item.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CarbonAbsorptionPopup
