import { format } from 'date-fns'

export const formatPrice = (amount) =>
  `₹${Number(amount || 0).toLocaleString('en-IN')}`

export const formatDate = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy') : '-'

export const formatDateTime = (date) =>
  date ? format(new Date(date), 'dd MMM yyyy, hh:mm a') : '-'

export const getStatusColor = (status) => {
  const map = {
    placed:           '#F59E0B',
    confirmed:        '#60A5FA',
    packed:           '#A78BFA',
    out_for_delivery: '#F472B6',
    delivered:        '#34D399',
    cancelled:        '#F87171',
  }
  return map[status] || '#A1A1AA'
}

export const truncate = (str, len = 80) =>
  str && str.length > len ? str.slice(0, len) + '…' : str
