import api from './axios'

export const getMyDeliveryOrders = () => api.get('/delivery/my-orders')
export const updateDeliveryStatus = (id, data) => api.put(`/delivery/orders/${id}/status`, data)
export const getDeliveryOrder = (id) => api.get(`/delivery/orders/${id}`)
