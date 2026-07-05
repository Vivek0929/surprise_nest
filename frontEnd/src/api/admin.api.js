import api from './axios'

export const getDashboard = () => api.get('/admin/dashboard')
export const getAdminOrders = (params) => api.get('/admin/orders', { params })
export const updateOrderStatus = (id, data) => api.put(`/admin/orders/${id}/status`, data)
export const assignDeliveryPartner = (id, data) => api.put(`/admin/orders/${id}/assign`, data)
export const getDeliveryPartners = () => api.get('/admin/delivery-partners')
export const createDeliveryPartner = (data) => api.post('/admin/delivery-partners', data)
export const getInventory = () => api.get('/admin/inventory')
export const updateInventory = (id, data) => api.put(`/admin/inventory/${id}`, data)
export const getReports = (period) => api.get('/admin/reports', { params: { period } })
