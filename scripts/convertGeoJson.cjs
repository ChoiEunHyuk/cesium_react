const fs = require('fs')
const path = require('path')
const proj4 = require('proj4')

// EPSG:5179 (Korea 2000 / Unified CS) 정의
proj4.defs('EPSG:5179', '+proj=tmerc +lat_0=38 +lon_0=127.5 +k=0.9996 +x_0=1000000 +y_0=2000000 +ellps=GRS80 +units=m +no_defs +type=crs')

const inputPath = path.join(__dirname, '../public/carbon/forest_map_1_5000.geojson')
const outputPath = path.join(__dirname, '../public/carbon/forest_map_wgs84.geojson')

console.log('GeoJSON 변환 시작...')
console.log('입력 파일:', inputPath)

// 파일 읽기
const geojsonData = JSON.parse(fs.readFileSync(inputPath, 'utf8'))

console.log(`총 피처 수: ${geojsonData.features.length}`)

// 좌표 변환 함수
function convertCoordinates(coords) {
  if (typeof coords[0] === 'number') {
    // 단일 좌표 [x, y]
    const [lon, lat] = proj4('EPSG:5179', 'WGS84', coords)
    return [lon, lat]
  } else {
    // 배열의 배열
    return coords.map(convertCoordinates)
  }
}

// 모든 피처의 좌표 변환
let convertedCount = 0
for (const feature of geojsonData.features) {
  if (feature.geometry && feature.geometry.coordinates) {
    feature.geometry.coordinates = convertCoordinates(feature.geometry.coordinates)
    convertedCount++

    if (convertedCount % 500 === 0) {
      console.log(`${convertedCount}개 피처 변환 완료...`)
    }
  }
}

// CRS 정보 업데이트 (WGS84)
geojsonData.crs = {
  type: 'name',
  properties: {
    name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
  }
}

// 파일 저장
fs.writeFileSync(outputPath, JSON.stringify(geojsonData))

console.log(`\n변환 완료!`)
console.log(`출력 파일: ${outputPath}`)
console.log(`변환된 피처 수: ${convertedCount}`)
