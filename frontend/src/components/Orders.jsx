import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, ShoppingBag, ShoppingCart, AlertCircle, Eye } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Orders({ orders, products, customers, getOrderById, addOrder, cancelOrder, showNotification }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailedOrder, setDetailedOrder] = useState(null)

  // Form fields
  const [customerId, setCustomerId] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')

  const handleViewDetails = async (id) => {
    const details = await getOrderById(id)
    if (details) {
      setDetailedOrder(details)
    }
  }

  const openAddModal = () => {
    setCustomerId(customers.length > 0 ? customers[0].id.toString() : '')
    const inStockProducts = products.filter(p => p.stock_quantity > 0)
    setProductId(inStockProducts.length > 0 ? inStockProducts[0].id.toString() : '')
    setQuantity('1')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    navigate('/orders')
  }

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      const id = parseInt(parts[1])
      if (!isNaN(id) && (!detailedOrder || detailedOrder.id !== id)) {
        handleViewDetails(id)
      }
    } else if (parts.length === 3 && parts[1] === 'delete') {
      const id = parseInt(parts[2])
      const order = orders.find(o => o.id === id)
      if (order) {
        handleCancelOrder(order.id)
      } else {
        navigate('/orders')
      }
    } else {
      if (detailedOrder) setDetailedOrder(null)
    }
  }, [location.pathname, orders])

  // Live order calculations
  const selectedProduct = products.find((p) => p.id.toString() === productId)
  const qty = parseInt(quantity) || 0
  const availableStock = selectedProduct ? selectedProduct.stock_quantity : 0
  const price = selectedProduct ? parseFloat(selectedProduct.price) : 0
  const orderTotal = price * qty

  const hasStockError = selectedProduct && qty > availableStock
  const hasQtyError = qty <= 0
  const isFormInvalid = !customerId || !productId || hasStockError || hasQtyError

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!customerId) {
      showNotification('Please select a customer.', 'error')
      return
    }
    if (!productId) {
      showNotification('Please select a product.', 'error')
      return
    }
    if (hasQtyError) {
      showNotification('Quantity ordered must be greater than zero.', 'error')
      return
    }
    if (hasStockError) {
      showNotification(`Insufficient stock. Only ${availableStock} units of "${selectedProduct?.name}" are available.`, 'error')
      return
    }

    const payload = {
      customer_id: parseInt(customerId),
      items: [
        {
          product_id: parseInt(productId),
          quantity: qty
        }
      ]
    }

    const success = await addOrder(payload)
    if (success) {
      closeModal()
    }
  }

  const handleCancelOrder = async (id) => {
    const formattedId = `#ORD-${id.toString().padStart(4, '0')}`
    if (window.confirm(`Are you sure you want to cancel and delete order ${formattedId}? This will automatically restore the product stock.`)) {
      await cancelOrder(id)
    }
    navigate('/orders')
  }

  const filteredOrders = orders

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0)
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Transaction Details</h1>
          <p className="page-subtitle">Track, place, and cancel transactions with automatic inventory updates</p>
        </div>
      </div>

      <div className="action-header">
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Place New Order</span>
        </button>
      </div>

      <div className="glass-panel">
        {filteredOrders.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No orders found in the ledger. Tap "Place New Order" to start a transaction.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order Ref</th>
                  <th>Customer Profile</th>
                  <th>Products Ordered</th>
                  <th>Total Amount</th>
                  <th>Transaction Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span className="sku-text">#ORD-{order.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {order.customer.full_name}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.customer.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', padding: '0.2rem 0' }}>
                        {order.items.map((item) => (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{item.product.name}</span>
                            <span className="sku-text">{item.product.sku}</span>
                            <span style={{ color: 'var(--text-muted)' }}>(x{item.quantity})</span>
                            <span style={{ color: 'var(--color-teal)', fontWeight: 500 }}>{formatCurrency(item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--color-teal)' }}>
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{formatDate(order.created_at)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          title="View Order Details (GET /orders/{id})"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          onClick={() => navigate(`/orders/delete/${order.id}`)}
                          title="Cancel Order & Restore Stock (DELETE /orders/{id})"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Add Order */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
            <button className="modal-close" onClick={closeModal}>
              <X size={18} />
            </button>
            <h2 className="modal-title">Place Order</h2>
            
            {customers.length === 0 ? (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-rose)', fontWeight: 600, marginBottom: '1rem' }}>
                  No registered customers found.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please go to the "Customers" tab and register a profile before placing an order.
                </p>
              </div>
            ) : products.length === 0 ? (
              <div style={{ padding: '1rem 0', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-rose)', fontWeight: 600, marginBottom: '1rem' }}>
                  No catalog products found.
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Please go to the "Products" tab and register a product before placing an order.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Customer Reference</label>
                  <select
                    className="form-input"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    required
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.full_name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label">Product</label>
                  <select
                    className="form-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                  >
                    {products.filter(p => p.stock_quantity > 0).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {p.sku} ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className={`form-input ${hasStockError || hasQtyError ? 'invalid-state' : ''}`}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                  
                  {/* Item Details and Stock Checking alerts */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                    <div>
                      {selectedProduct && (
                        <>
                          <span style={{ color: 'var(--text-muted)' }}>Stock: </span>
                          <span className={availableStock < 5 ? 'badge badge-warning' : 'badge badge-success'}>
                            {availableStock} left
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {hasStockError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.5rem' }}>
                      <AlertCircle size={12} />
                      <span>Insufficient Stock! Available: {availableStock}</span>
                    </div>
                  )}
                  {hasQtyError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.5rem' }}>
                      <AlertCircle size={12} />
                      <span>Quantity must be greater than zero</span>
                    </div>
                  )}
                </div>

                {/* Real-time Order Summary */}
                <div
                  style={{
                    background: 'rgba(45, 212, 191, 0.05)',
                    border: '1px dashed var(--color-teal)',
                    borderRadius: '10px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ShoppingCart size={16} color="var(--color-teal)" />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-main)' }}>
                      Total Estimated Amount:
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-teal)' }}>
                    {formatCurrency(orderTotal)}
                  </span>
                </div>

                <div className="form-actions">
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isFormInvalid}
                  >
                    Place Transaction
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog for Order Details */}
      {detailedOrder && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '550px', width: '95%' }}>
            <button className="modal-close" onClick={() => setDetailedOrder(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingBag size={20} color="var(--color-teal)" />
              <span>Order Invoice #{detailedOrder.id.toString().padStart(4, '0')}</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Customer Name</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{detailedOrder.customer.full_name}</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Email Contact</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{detailedOrder.customer.email}</span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Line Items Invoice Ledger</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {detailedOrder.items.map((item) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{item.product.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {item.product.sku} | Unit Price: {formatCurrency(item.unit_price)}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: '1rem' }}>Qty: {item.quantity}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-teal)' }}>{formatCurrency(item.unit_price * item.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', background: 'rgba(45, 212, 191, 0.05)', border: '1px dashed var(--color-teal)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Transaction Sum Total</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-teal)', fontFamily: 'var(--font-display)' }}>{formatCurrency(detailedOrder.total_amount)}</span>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setDetailedOrder(null); navigate('/orders'); }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
