import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Boxes, Users, ShoppingBag } from 'lucide-react'

export default function Layout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    { id: 'dashboard', path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', path: '/products', label: 'Products', icon: Boxes },
    { id: 'customers', path: '/customers', label: 'Customers', icon: Users },
    { id: 'orders', path: '/orders', label: 'Orders', icon: ShoppingBag },
  ]

  const getActiveTab = () => {
    const path = location.pathname
    if (path.startsWith('/products')) return 'products'
    if (path.startsWith('/customers')) return 'customers'
    if (path.startsWith('/orders')) return 'orders'
    return 'dashboard'
  }

  const activeTab = getActiveTab()

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand-section" style={{ cursor: 'pointer', padding: '0.5rem 0' }} onClick={() => navigate('/')}>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>Ethara.AI</span>
        </div>

        <nav>
          <ul className="nav-menu">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    className={`nav-item-btn ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
