import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import Products from './components/Products'
import Customers from './components/Customers'
import Orders from './components/Orders'
import { CheckCircle2, AlertCircle } from 'lucide-react'

// Base backend URL configured via environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function App() {
  
  // Data States
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState({
    total_products: 0,
    total_customers: 0,
    total_orders: 0,
    active_stock_value: 0,
    low_stock_alerts: []
  })

  // Loading States
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingData, setLoadingData] = useState(false)

  // Notification Alerts
  const [notifications, setNotifications] = useState([])

  // Global Notification Handler
  const showNotification = (message, type = 'success') => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])
    
    // Auto clear in 4 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }

  // --- API INTEGRATIONS ---

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/products`)
      if (!res.ok) throw new Error('Failed to synchronize products')
      const data = await res.json()
      setProducts(data)
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`)
      if (!res.ok) throw new Error('Failed to synchronize customers')
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders`)
      if (!res.ok) throw new Error('Failed to synchronize order ledger')
      const data = await res.json()
      setOrders(data)
    } catch (err) {
      showNotification(err.message, 'error')
    }
  }

  const fetchSummary = async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch(`${API_URL}/dashboard/summary`)
      if (!res.ok) throw new Error('Failed to synchronize dashboard summary')
      const data = await res.json()
      setSummary(data)
    } catch (err) {
      showNotification(err.message, 'error')
    } finally {
      setLoadingSummary(false)
    }
  }

  // Reload everything in the background
  const syncAllData = async () => {
    setLoadingData(true)
    await Promise.all([fetchProducts(), fetchCustomers(), fetchOrders(), fetchSummary()])
    setLoadingData(false)
  }

  useEffect(() => {
    syncAllData()
  }, [])

  // --- PRODUCTS MUTATIONS ---

  const addProduct = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not register catalog product')
      }
      
      showNotification(`Product "${payload.name}" successfully registered!`)
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const updateProduct = async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not update catalog product')
      }
      
      showNotification(`Product "${payload.name}" successfully updated!`)
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const deleteProduct = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not delete catalog product')
      }
      
      showNotification('Catalog product successfully removed.')
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  // --- CUSTOMERS MUTATIONS ---

  const addCustomer = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not register customer profile')
      }
      
      showNotification(`Customer "${payload.full_name}" registered successfully!`)
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const updateCustomer = async (id, payload) => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not update customer profile')
      }
      
      showNotification(`Customer "${payload.full_name}" successfully updated!`)
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const deleteCustomer = async (id) => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not remove customer profile')
      }
      
      showNotification('Customer profile successfully removed.')
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  // --- ORDERS MUTATIONS ---

  const addOrder = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not execute transaction')
      }
      
      showNotification('Order placed successfully')
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const cancelOrder = async (id) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || data.detail || 'Could not cancel transaction')
      }
      
      showNotification('Transaction cancelled. Stocks successfully restored!')
      syncAllData()
      return true
    } catch (err) {
      showNotification(err.message, 'error')
      return false
    }
  }

  const getProductById = async (id) => {
    try {
      const res = await fetch(`${API_URL}/products/${id}`)
      if (!res.ok) throw new Error('Failed to retrieve specific product details')
      return await res.json()
    } catch (err) {
      showNotification(err.message, 'error')
      return null
    }
  }

  const getCustomerById = async (id) => {
    try {
      const res = await fetch(`${API_URL}/customers/${id}`)
      if (!res.ok) throw new Error('Failed to retrieve specific customer profile')
      return await res.json()
    } catch (err) {
      showNotification(err.message, 'error')
      return null
    }
  }

  const getOrderById = async (id) => {
    try {
      const res = await fetch(`${API_URL}/orders/${id}`)
      if (!res.ok) throw new Error('Failed to retrieve specific transaction invoice')
      return await res.json()
    } catch (err) {
      showNotification(err.message, 'error')
      return null
    }
  }

  // --- VIEWS ROUTING ---

  return (
    <Layout>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              fetchSummary={fetchSummary}
              summary={summary}
              orders={orders}
              loadingSummary={loadingSummary}
            />
          }
        />
        <Route
          path="/products/*"
          element={
            <Products
              products={products}
              getProductById={getProductById}
              addProduct={addProduct}
              updateProduct={updateProduct}
              deleteProduct={deleteProduct}
              showNotification={showNotification}
            />
          }
        />
        <Route
          path="/customers/*"
          element={
            <Customers
              customers={customers}
              getCustomerById={getCustomerById}
              addCustomer={addCustomer}
              updateCustomer={updateCustomer}
              deleteCustomer={deleteCustomer}
              showNotification={showNotification}
            />
          }
        />
        <Route
          path="/orders/*"
          element={
            <Orders
              orders={orders}
              products={products}
              customers={customers}
              getOrderById={getOrderById}
              addOrder={addOrder}
              cancelOrder={cancelOrder}
              showNotification={showNotification}
            />
          }
        />
        <Route path="*" element={<div>View not implemented</div>} />
      </Routes>

      {/* Floating Status Notification Alerts */}
      <div className="notification-container">
        {notifications.map((n) => (
          <div key={n.id} className={`notification-toast ${n.type}`}>
            {n.type === 'success' ? (
              <CheckCircle2 size={18} color="#10b981" />
            ) : (
              <AlertCircle size={18} color="var(--color-rose)" />
            )}
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{n.message}</span>
          </div>
        ))}
      </div>
    </Layout>
  )
}
