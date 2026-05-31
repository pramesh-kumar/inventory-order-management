import React, { useState, useEffect } from 'react'
import { Plus, Search, Trash2, X, User, Eye, Edit2 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

export default function Customers({ customers, getCustomerById, addCustomer, updateCustomer, deleteCustomer, showNotification }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [detailedCustomer, setDetailedCustomer] = useState(null)
  const [editingCustomer, setEditingCustomer] = useState(null)

  // Form fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Validation Error States (to display under inputs)
  const [nameError, setNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [phoneError, setPhoneError] = useState('')

  const handleViewDetails = async (id) => {
    const details = await getCustomerById(id)
    if (details) {
      setDetailedCustomer(details)
    }
  }

  const openAddModal = () => {
    setEditingCustomer(null)
    setFullName('')
    setEmail('')
    setPhoneNumber('')
    setNameError('')
    setEmailError('')
    setPhoneError('')
    setIsModalOpen(true)
  }

  const openEditModal = async (customer) => {
    const details = await getCustomerById(customer.id)
    if (!details) return
    
    setEditingCustomer(details)
    setFullName(details.full_name)
    setEmail(details.email)
    setPhoneNumber(details.phone_number)
    setNameError('')
    setEmailError('')
    setPhoneError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingCustomer(null)
    navigate('/customers')
  }

  useEffect(() => {
    const parts = location.pathname.split('/').filter(Boolean)
    if (parts.length === 2) {
      const id = parseInt(parts[1])
      if (!isNaN(id) && (!detailedCustomer || detailedCustomer.id !== id)) {
        handleViewDetails(id)
      }
    } else if (parts.length === 3 && parts[1] === 'edit') {
      const id = parseInt(parts[2])
      if (!isNaN(id) && (!editingCustomer || editingCustomer.id !== id)) {
        getCustomerById(id).then(details => {
          if (details) {
            setEditingCustomer(details)
            setFullName(details.full_name)
            setEmail(details.email)
            setPhoneNumber(details.phone_number)
            setNameError('')
            setEmailError('')
            setPhoneError('')
            setIsModalOpen(true)
          } else {
            navigate('/customers')
          }
        })
      }
    } else if (parts.length === 3 && parts[1] === 'delete') {
      const id = parseInt(parts[2])
      const customer = customers.find(c => c.id === id)
      if (customer) {
        handleDelete(customer.id, customer.full_name)
      } else {
        navigate('/customers')
      }
    } else {
      if (detailedCustomer) setDetailedCustomer(null)
      if (editingCustomer) {
        setEditingCustomer(null)
        setIsModalOpen(false)
      }
    }
  }, [location.pathname, customers])

  // Real-time / Blur Validation Helpers
  const validateName = (nameVal) => {
    const trimmed = nameVal.trim()
    if (!trimmed) {
      setNameError('Name is required')
      return false
    }
    if (trimmed.length < 2) {
      setNameError('Name must be at least 2 characters long')
      return false
    }
    setNameError('')
    return true
  }

  const validateEmail = (emailVal) => {
    const trimmed = emailVal.trim()
    if (!trimmed) {
      setEmailError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmed)) {
      setEmailError('Invalid email format')
      return false
    }
    const lowerEmail = trimmed.toLowerCase()
    const duplicate = customers.find(c => c.email.toLowerCase() === lowerEmail && (!editingCustomer || c.id !== editingCustomer.id))
    if (duplicate) {
      setEmailError('Email already registered')
      return false
    }
    setEmailError('')
    return true
  }

  const validatePhone = (phoneVal) => {
    if (!phoneVal) {
      setPhoneError('Phone number is required')
      return false
    }
    // Normalize: strip whitespace, hyphens, and parentheses to see if only digits remain
    const normalized = phoneVal.replace(/[\s\-\(\)\+]/g, '')
    if (!/^\d+$/.test(normalized)) {
      setPhoneError('Phone number must contain only digits')
      return false
    }
    if (normalized.length < 10 || normalized.length > 15) {
      setPhoneError('Phone number must be between 10 and 15 digits')
      return false
    }
    setPhoneError('')
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Trigger all validations
    const isNameValid = validateName(fullName)
    const isEmailValid = validateEmail(email)
    const isPhoneValid = validatePhone(phoneNumber)

    if (!isNameValid || !isEmailValid || !isPhoneValid) {
      showNotification('Please correct the validation errors in the form.', 'error')
      return
    }

    const payload = {
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone_number: phoneNumber.trim()
    }

    let success = false
    if (editingCustomer) {
      success = await updateCustomer(editingCustomer.id, payload)
    } else {
      success = await addCustomer(payload)
    }

    if (success) {
      closeModal()
    }
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete customer "${name}"? All associated orders will be deleted.`)) {
      await deleteCustomer(id)
    }
    navigate('/customers')
  }

  const filteredCustomers = customers

  return (
    <div>
      <div className="top-bar">
        <div>
          <h1 className="page-title">Customer Details</h1>
          <p className="page-subtitle">Manage customer indexes, order history links, and communication metrics</p>
        </div>
      </div>

      <div className="action-header">
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} />
          <span>Add New Customer</span>
        </button>
      </div>

      <div className="glass-panel">
        {filteredCustomers.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No customers indexed. Grow your relations by adding a new customer profile!
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Profile</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '8px',
                            background: 'rgba(99, 102, 241, 0.1)',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--color-indigo)'
                          }}
                        >
                          <User size={16} />
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                            {customer.full_name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ID: #CST-{customer.id.toString().padStart(4, '0')}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{customer.email}</td>
                    <td>{customer.phone_number}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            title="View Customer Details (GET /customers/{id})"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-icon"
                            onClick={() => navigate(`/customers/edit/${customer.id}`)}
                            title="Edit Customer Profile (PUT /customers/{id})"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-icon"
                            onClick={() => navigate(`/customers/delete/${customer.id}`)}
                            title="Delete Customer Profile (DELETE /customers/{id})"
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

      {/* Modal Dialog for Add Customer */}
      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              <X size={18} />
            </button>
            <h2 className="modal-title">{editingCustomer ? 'Edit Customer Profile' : 'Register Customer'}</h2>
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className={`form-input ${nameError ? 'invalid-state' : ''}`}
                  placeholder="Pramesh Kumar"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (nameError) validateName(e.target.value)
                  }}
                  onBlur={(e) => validateName(e.target.value)}
                  required
                />
                {nameError && (
                  <span style={{ color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>
                    {nameError}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className={`form-input ${emailError ? 'invalid-state' : ''}`}
                  placeholder="pramesh01@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) validateEmail(e.target.value)
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  required
                />
                {emailError && (
                  <span style={{ color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>
                    {emailError}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className={`form-input ${phoneError ? 'invalid-state' : ''}`}
                  placeholder="9876543210"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    if (phoneError) validatePhone(e.target.value)
                  }}
                  onBlur={(e) => validatePhone(e.target.value)}
                  required
                />
                {phoneError && (
                  <span style={{ color: 'var(--color-rose)', fontSize: '0.75rem', fontWeight: 500, marginTop: '0.2rem' }}>
                    {phoneError}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCustomer ? 'Update Profile' : 'Register Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for Customer Details */}
      {detailedCustomer && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close" onClick={() => setDetailedCustomer(null)}>
              <X size={18} />
            </button>
            <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={20} color="var(--color-indigo)" />
              <span>Customer Details</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference ID</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>#CST-{detailedCustomer.id.toString().padStart(4, '0')}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{detailedCustomer.full_name}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                <span style={{ fontWeight: 600, color: 'var(--color-indigo)' }}>{detailedCustomer.email}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Connection</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{detailedCustomer.phone_number}</span>
              </div>
            </div>
            <div className="form-actions" style={{ marginTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => { setDetailedCustomer(null); navigate('/customers'); }}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
