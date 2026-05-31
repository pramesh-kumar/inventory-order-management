import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, X, Boxes, Eye } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Products({ products, getProductById, addProduct, updateProduct, deleteProduct, showNotification }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [detailedProduct, setDetailedProduct] = useState(null)
  
  // Form fields
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('')

  const handleViewDetails = async (id) => {
    const details = await getProductById(id)
    if (details) {
      setDetailedProduct(details)
    }
  }

  const openAddModal = () => {
    setEditingProduct(null)
    setName('')
    setSku('')
    setPrice('')
    setStockQuantity('')
    setIsModalOpen(true)
  }

  const openEditModal = async (product) => {
    const freshProduct = await getProductById(product.id)
    if (!freshProduct) return
    
    setEditingProduct(freshProduct)
    setName(freshProduct.name)
    setSku(freshProduct.sku)
    setPrice(freshProduct.price.toString())
    setStockQuantity(freshProduct.stock_quantity.toString())
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    navigate('/products')
  }

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      const id = parseInt(parts[1])
      if (!isNaN(id) && (!detailedProduct || detailedProduct.id !== id)) {
        handleViewDetails(id)
      }
    } else if (parts.length === 3 && parts[1] === 'edit') {
      const id = parseInt(parts[2])
      if (!isNaN(id) && (!editingProduct || editingProduct.id !== id)) {
        getProductById(id).then(freshProduct => {
          if (freshProduct) {
            setEditingProduct(freshProduct)
            setName(freshProduct.name)
            setSku(freshProduct.sku)
            setPrice(freshProduct.price.toString())
            setStockQuantity(freshProduct.stock_quantity.toString())
            setIsModalOpen(true)
          } else {
            navigate('/products')
          }
        })
      }
    } else if (parts.length === 3 && parts[1] === 'delete') {
      const id = parseInt(parts[2])
      const product = products.find(p => p.id === id)
      if (product) {
        handleDelete(product.id, product.name)
      } else {
        navigate('/products')
      }
    } else {
      if (detailedProduct) setDetailedProduct(null)
      if (editingProduct) {
        setEditingProduct(null)
        setIsModalOpen(false)
      }
    }
  }, [location.pathname, products])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate inputs locally before submission
    if (!name.trim()) {
      showNotification('Product name is required.', 'error')
      return
    }
    if (!sku.trim()) {
      showNotification('Product SKU/Code is required.', 'error')
      return
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      showNotification('Price must be a positive number.', 'error')
      return
    }
    const parsedStock = parseInt(stockQuantity)
    if (isNaN(parsedStock) || parsedStock < 0) {
      showNotification('Stock quantity cannot be negative.', 'error')
      return
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: parsedPrice,
      stock_quantity: parsedStock
    }

    let success = false
    if (editingProduct) {
      success = await updateProduct(editingProduct.id, payload)
    } else {
      success = await addProduct(payload)
    }

    if (success) {
      closeModal()
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete product "${name}"?`)) {
      await deleteProduct(id)
    }
    navigate('/products')
  }

  const filteredProducts = products

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(value || 0)
  }

  // Stock status helper (< 5 low stock rule)
  const getStockStatus = (qty) => {
    if (qty === 0) return { label: 'Out of Stock', class: 'badge-danger', color: 'var(--color-rose)' }
    if (qty < 5) return { label: 'Low Stock', class: 'badge-warning', color: '#f59e0b' }
    return { label: 'In Stock', class: 'badge-success', color: 'var(--color-teal)' }
  }

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">Track and configure global catalog items and real-time inventory</p>
        </div>
      </div>

      <div className="action-header">
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      <div className="glass-panel">
        {filteredProducts.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No products found. Refine your search or create a new catalog item!
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU Code</th>
                  <th>Price</th>
                  <th>Stock Levels</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity)
                  const fillPercentage = Math.min((product.stock_quantity / 50) * 100, 100) // Scale to 50 items max
                  return (
                    <tr key={product.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: stockStatus.color
                            }}
                          >
                            <Boxes size={16} />
                          </div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{product.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="sku-text">{product.sku}</span>
                      </td>
                      <td style={{ fontWeight: 500, color: 'var(--text-main)' }}>
                        {formatCurrency(product.price)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span className={`badge ${stockStatus.class}`} style={{ width: 'fit-content' }}>
                            {product.stock_quantity} {stockStatus.label}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => navigate(`/products/${product.id}`)}
                            title="View Product Details (GET /products/{id})"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => navigate(`/products/edit/${product.id}`)}
                            title="Edit Product (PUT /products/{id})"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => navigate(`/products/delete/${product.id}`)}
                            title="Delete Product (DELETE /products/{id})"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Add / Edit Product */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              <X size={18} />
            </button>
            <h2 className="modal-title">
              {editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Gaming Laptop"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="LAP-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  disabled={!!editingProduct} // SKU shouldn't be edited once created
                />
              </div>

              <div className="form-group">
                <label className="form-label">Price (INR)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  placeholder="99999"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Quantity in Stock</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="15"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Register Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Product Details */}
      {detailedProduct && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setDetailedProduct(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Boxes size={20} color="var(--color-teal)" />
              <span>Catalog Product</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database Key ID</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>#PRD-{detailedProduct.id.toString().padStart(4, '0')}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{detailedProduct.name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SKU/Code Identifier</span>
                <span className="sku-text" style={{ padding: '0.1rem 0.5rem', width: 'fit-content' }}>{detailedProduct.sku}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catalog Unit Price</span>
                <span style={{ fontWeight: 600, color: 'var(--color-teal)' }}>{formatCurrency(detailedProduct.price)}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Warehouse Stock</span>
                <span className={detailedProduct.stock_quantity < 5 ? 'badge badge-warning' : 'badge badge-success'} style={{ display: 'inline-block', marginTop: '0.2rem' }}>
                  {detailedProduct.stock_quantity} units left
                </span>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setDetailedProduct(null); navigate('/products'); }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
