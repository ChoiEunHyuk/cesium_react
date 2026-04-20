import { useState, useEffect, useMemo, ChangeEvent } from 'react'
import { EmissionColorRange } from '../hooks/useBuildingEmission'

type EnergyTab = 'electricity' | 'gas' | 'heating'
type ItemType = 'parcel' | 'grid'
type DetailType = '1KM' | '500M' | '100M'

interface SggOption {
  admSectC: string
  sggNm: string
}

interface BjdOption {
  bjdCd: string
  bjdNm: string
}

interface BuildingEmissionForm {
  sigungu: string
  bjdong: string
  itemType: ItemType | ''
  detail: DetailType | ''
  year: string
  month: string
}

interface BuildingEmissionPopupProps {
  isOpen: boolean
  onClose: () => void
  isSearching: boolean
  isLoaded: boolean
  activeItemType: ItemType | null
  activeDetail: string
  emissionColors: EmissionColorRange[]
  onSearch: (pnuCode: string, useYm: string, itemType: ItemType, detail: string, energyType: string) => void
  onClear: () => void
}

const TAB_LABELS: Record<EnergyTab, string> = {
  electricity: '전력',
  gas: '가스',
  heating: '지역난방',
}

const TAB_TO_ENERGY: Record<EnergyTab, string> = {
  electricity: 'elec',
  gas: 'gas',
  heating: 'heating',
}

const INITIAL_FORM: BuildingEmissionForm = {
  sigungu: '',
  bjdong: '',
  itemType: '',
  detail: '',
  year: '',
  month: '',
}

function BuildingEmissionPopup({
  isOpen,
  onClose,
  isSearching,
  isLoaded,
  activeItemType,
  activeDetail,
  emissionColors,
  onSearch,
  onClear,
}: BuildingEmissionPopupProps) {
  const [activeTab, setActiveTab] = useState<EnergyTab>('electricity')
  const [form, setForm] = useState<BuildingEmissionForm>(INITIAL_FORM)
  const [sggList, setSggList] = useState<SggOption[]>([])
  const [sggLoading, setSggLoading] = useState(false)
  const [bjdList, setBjdList] = useState<BjdOption[]>([])
  const [bjdLoading, setBjdLoading] = useState(false)
  const [useYmList, setUseYmList] = useState<string[]>([])
  const [useYmLoading, setUseYmLoading] = useState(false)
  const [useYmFetched, setUseYmFetched] = useState(false)

  // 팝업 열릴 때 시군구 로드
  useEffect(() => {
    if (!isOpen) return
    setSggLoading(true)
    fetch('/crbEmss/getSgg.do')
      .then(res => res.json())
      .then((data: SggOption[]) => setSggList(data))
      .catch(() => setSggList([]))
      .finally(() => setSggLoading(false))
  }, [isOpen])

  // 시군구 변경 시 법정동 로드
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

  // 법정동 변경 또는 탭 변경 시 use_ym 로드
  useEffect(() => {
    if (!form.bjdong) {
      setUseYmList([])
      setUseYmFetched(false)
      return
    }
    const energyType = TAB_TO_ENERGY[activeTab]
    setUseYmLoading(true)
    setUseYmFetched(false)
    fetch(`/crbEmss/getUseYm.do?energyType=${energyType}&pnuCode=${form.bjdong}`)
      .then(res => res.json())
      .then((data: string[]) => setUseYmList(data))
      .catch(() => setUseYmList([]))
      .finally(() => {
        setUseYmLoading(false)
        setUseYmFetched(true)
      })
  }, [form.bjdong, activeTab])

  // use_ym에서 연도 목록 추출 (중복 제거)
  const years = useMemo(() =>
    [...new Set(useYmList.map(ym => ym.slice(0, 4)))].sort(),
    [useYmList]
  )

  // 선택한 연도의 월 목록 추출
  const months = useMemo(() =>
    useYmList
      .filter(ym => ym.startsWith(form.year))
      .map(ym => String(parseInt(ym.slice(4, 6), 10)))
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => parseInt(a) - parseInt(b)),
    [useYmList, form.year]
  )

  if (!isOpen) return null

  const handleTabChange = (tab: EnergyTab) => {
    setActiveTab(tab)
    setForm(INITIAL_FORM)
    onClear()
  }

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      ...(name === 'itemType' && value !== 'grid' ? { detail: '' } : {}),
      ...(name === 'sigungu' ? { bjdong: '', year: '', month: '' } : {}),
      ...(name === 'bjdong' ? { year: '', month: '' } : {}),
      ...(name === 'year' ? { month: '' } : {}),
      [name]: value,
    }))
  }

  const canSearch =
    form.sigungu &&
    form.bjdong &&
    form.itemType &&
    (form.itemType === 'grid' ? !!form.detail : true) &&
    form.year &&
    form.month &&
    !isSearching

  const handleSearch = () => {
    if (!canSearch) return
    const pnuCode = form.bjdong
    const useYm = form.year + form.month.padStart(2, '0')
    const energyType = TAB_TO_ENERGY[activeTab]
    onSearch(pnuCode, useYm, form.itemType as ItemType, form.detail, energyType)
  }

  const handleReset = () => {
    setForm(INITIAL_FORM)
    setUseYmList([])
    setUseYmFetched(false)
    onClear()
  }

  const noData = useYmFetched && !useYmLoading && useYmList.length === 0

  return (
    <div className="control-popup building-emission-popup">
      <div className="control-popup-header">
        <h4>건물 탄소 배출</h4>
        <button className="popup-close-btn" onClick={onClose}>×</button>
      </div>

      {/* 탭 */}
      <div className="be-tab-bar">
        {(Object.keys(TAB_LABELS) as EnergyTab[]).map(tab => (
          <button
            key={tab}
            className={`be-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => handleTabChange(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="control-popup-body">
        {/* 시군구 */}
        <div className="be-field">
          <label htmlFor="sigungu">시군구</label>
          <select
            id="sigungu"
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
          <label htmlFor="bjdong">법정동</label>
          <select
            id="bjdong"
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
          <label htmlFor="itemType">항목</label>
          <select id="itemType" name="itemType" value={form.itemType} onChange={handleChange}>
            <option value="">선택</option>
            <option value="parcel">필지</option>
            <option value="grid">격자</option>
          </select>
        </div>

        {/* 상세 - 격자 선택 시에만 노출 */}
        {form.itemType === 'grid' && (
          <div className="be-field">
            <label htmlFor="detail">상세</label>
            <select id="detail" name="detail" value={form.detail} onChange={handleChange}>
              <option value="">선택</option>
              <option value="1KM">1KM</option>
              <option value="500M">500M</option>
              <option value="100M">100M</option>
            </select>
          </div>
        )}

        {/* 연도 */}
        <div className="be-field">
          <label htmlFor="year">연도</label>
          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            disabled={!form.bjdong || useYmLoading || noData}
          >
            {useYmLoading && <option value="">불러오는 중...</option>}
            {!useYmLoading && noData && <option value="">데이터 없음</option>}
            {!useYmLoading && !noData && <option value="">선택</option>}
            {years.map(year => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
        </div>

        {/* 월 */}
        <div className="be-field">
          <label htmlFor="month">월</label>
          <select
            id="month"
            name="month"
            value={form.month}
            onChange={handleChange}
            disabled={!form.year}
          >
            <option value="">선택</option>
            {months.map(month => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
        </div>

        {/* 액션 버튼 */}
        <div className="be-actions">
          <button className="be-btn secondary" onClick={handleReset} disabled={isSearching}>
            초기화
          </button>
          <button className="be-btn primary" onClick={handleSearch} disabled={!canSearch}>
            {isSearching ? '조회 중...' : '조회'}
          </button>
        </div>

        {/* 조회 결과 및 범례 */}
        {isLoaded && (
          <>
            <div className="be-legend">
              <p className="be-legend-title">
                {activeItemType === 'grid'
                  ? `격자 탄소 배출량 합계 [${activeDetail}] (tCO2/월)`
                  : '탄소 배출량 (tCO2/월)'}
              </p>
              <div className="be-legend-item">
                <span className="be-legend-color" style={{ background: '#808080' }} />
                <span className="be-legend-label">데이터 없음</span>
              </div>
              {emissionColors.map(range => (
                <div key={range.label} className="be-legend-item">
                  <span className="be-legend-color" style={{ background: range.color }} />
                  <span className="be-legend-label">{range.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BuildingEmissionPopup
