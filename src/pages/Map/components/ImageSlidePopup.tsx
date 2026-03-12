import { ChangeEvent } from 'react'

interface ImageSlidePopupProps {
  isOpen: boolean
  onClose: () => void
  isPlaying: boolean
  currentIndex: number
  imageCount: number
  opacity: number
  onStart: () => void
  onStop: () => void
  onOpacityChange: (e: ChangeEvent<HTMLInputElement>) => void
}

function ImageSlidePopup({
  isOpen,
  onClose,
  isPlaying,
  currentIndex,
  imageCount,
  opacity,
  onStart,
  onStop,
  onOpacityChange,
}: ImageSlidePopupProps) {
  if (!isOpen) return null

  return (
    <div className="control-popup">
      <div className="control-popup-header">
        <h4>이미지 슬라이드</h4>
        <button className="popup-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="control-popup-body">
        {/* 재생/정지 버튼 */}
        <div className="play-control">
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={isPlaying ? onStop : onStart}
          >
            <span className="play-btn-icon">{isPlaying ? '■' : '▶'}</span>
            <span className="play-btn-text">{isPlaying ? '정지' : '재생'}</span>
          </button>
        </div>

        {/* 현재 이미지 정보 */}
        <div className="slide-info">
          <span className="slide-label">현재 이미지</span>
          <span className="slide-counter">
            {isPlaying ? `${currentIndex + 1} / ${imageCount}` : '- / -'}
          </span>
        </div>

        {/* 투명도 컨트롤 */}
        <div className="opacity-control">
          <label htmlFor="opacitySlider">투명도</label>
          <input
            type="range"
            id="opacitySlider"
            min="0"
            max="100"
            value={opacity}
            onChange={onOpacityChange}
            disabled={!isPlaying}
          />
          <span className="opacity-value">{opacity}%</span>
        </div>
      </div>
    </div>
  )
}

export default ImageSlidePopup
