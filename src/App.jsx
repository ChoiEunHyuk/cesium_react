import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import MapPage from './pages/Map'
import BoardPage from './pages/Board'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<MapPage />} />
          <Route path="board" element={<BoardPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
