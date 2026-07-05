import api from './axios'

export const getThemes = (params) => api.get('/themes', { params })
export const getTheme = (id) => api.get(`/themes/${id}`)
export const createTheme = (data) => api.post('/themes', data)
export const updateTheme = (id, data) => api.put(`/themes/${id}`, data)
export const deleteTheme = (id) => api.delete(`/themes/${id}`)
export const getThemeReviews = (themeId) => api.get(`/reviews/theme/${themeId}`)
