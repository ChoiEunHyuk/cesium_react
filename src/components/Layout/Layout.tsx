import { NavLink, Outlet } from 'react-router-dom'
import '../../styles/Layout.css'

function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <ul className="nav-list">
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              지도
            </NavLink>
          </li>
          <li>
            <NavLink to="/board" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              TODO LIST
            </NavLink>
          </li>
        </ul>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
