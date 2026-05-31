import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Boxes, Users, ShoppingBag, IndianRupee, AlertTriangle } from 'lucide-react'

export default function Dashboard({ fetchSummary, summary, loadingSummary }) {
  const navigate = useNavigate()

  useEffect(() => {
    fetchSummary()
  }, [])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0)
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Ethara.AI Dashboard</h1>
          <p className="page-subtitle">Real-time enterprise inventory metrics and status alerts</p>
        </div>
      </div>

      {loadingSummary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--color-teal)' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Syncing metrics...</span>
        </div>
      ) : (
        <>
          {/* KPI Stat Cards */}
          <div className="kpi-grid">
            <div className="kpi-card" onClick={() => navigate('/products')} style={{ cursor: 'pointer' }}>
              <div>
                <p className="kpi-title">Total Products</p>
                <h3 className="kpi-value">{summary.total_products}</h3>
              </div>
              <div className="kpi-icon-box teal">
                <Boxes size={24} />
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/customers')} style={{ cursor: 'pointer' }}>
              <div>
                <p className="kpi-title">Total Customers</p>
                <h3 className="kpi-value">{summary.total_customers}</h3>
              </div>
              <div className="kpi-icon-box indigo">
                <Users size={24} />
              </div>
            </div>

            <div className="kpi-card" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
              <div>
                <p className="kpi-title">Total Orders</p>
                <h3 className="kpi-value">{summary.total_orders}</h3>
              </div>
              <div className="kpi-icon-box violet">
                <ShoppingBag size={24} />
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="glass-panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ color: 'var(--color-rose)' }}>
                <AlertTriangle size={18} />
                <span>Low stock products (<span style={{ fontSize: '0.8rem' }}>&lt; 5</span>)</span>
              </h2>
              {summary.low_stock_alerts && summary.low_stock_alerts.length > 0 && (
                <span className="badge badge-danger">
                  {summary.low_stock_alerts.length} Critical
                </span>
              )}
            </div>

            {(!summary.low_stock_alerts || summary.low_stock_alerts.length === 0) ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
                <p style={{ fontSize: '0.85rem' }}>All product inventory lines are currently optimal.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {summary.low_stock_alerts.map((item) => (
                  <div key={item.id} className="low-stock-item">
                    <div className="low-stock-info">
                      <span className="low-stock-name">{item.name}</span>
                      <span className="low-stock-sku">{item.sku}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-warning">{item.stock_quantity} left</span>
                      <div className="alert-circle"></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
