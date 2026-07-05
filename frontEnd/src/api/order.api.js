import api from './axios'

export const getAddons = () => api.get('/addons')
export const createAddon = (data) => api.post('/addons', data)
export const updateAddon = (id, data) => api.put(`/addons/${id}`, data)
export const deleteAddon = (id) => api.delete(`/addons/${id}`)

export const placeOrder = (data) => api.post('/orders', data)
export const getMyOrders = () => api.get('/orders/my-orders')
export const getOrder = (id) => api.get(`/orders/${id}`)
export const trackOrder = (id) => api.get(`/orders/${id}/track`)

export const submitReview = (data) => api.post('/reviews', data)
