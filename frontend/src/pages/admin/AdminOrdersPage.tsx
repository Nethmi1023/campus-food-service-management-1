import { useEffect, useState } from 'react'
import { getOrderStats, updateOrderStatus } from '../../api/order.api'
import api from '../../api/axiosClient'

interface OrderItem { name: string; quantity: number; price: number; total: number }
interface Order {
  _id: string; orderNumber: string; status: string; paymentStatus: string
  totalAmount: number; createdAt: string; deliveryAddress: string
  specialInstructions?: string; paymentMethod: string
  items: OrderItem[]; user?: { name: string; email: string }
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
}

const ALL_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [filtered, setFiltered] = useState<Order[]>([])
  const [stats, setStats] = useState<{ counts: Record<string, number>; revenue: Record<string, number> } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [viewOrder, setViewOrder] = useState<Order | null>(null)
  const [editOrder, setEditOrder] = useState<Order | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    let result = orders
    if (filterStatus !== 'all') result = result.filter(o => o.status === filterStatus)
    if (search.trim()) result = result.filter(o =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.user?.email?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [orders, filterStatus, search])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/orders/all'),
        getOrderStats(),
      ])
      setOrders(ordersRes.data.data ?? [])
      setStats(statsRes.data.data)
    } catch {
      try {
        const res = await api.get('/orders/my-orders')
        setOrders(res.data.data ?? [])
      } catch { setError('Failed to load orders') }
    } finally { setLoading(false) }
  }

  // UPDATE - status change
  const handleStatusUpdate = async () => {
    if (!editOrder || !editStatus) return
    setUpdating(editOrder._id)
    try {
      await updateOrderStatus(editOrder._id, editStatus)
      setSuccess(`Order ${editOrder.orderNumber} updated to "${editStatus}"`)
      setEditOrder(null)
      fetchAll()
    } catch { setError('Failed to update order status') }
    finally { setUpdating(null) }
  }

  // DELETE
  const handleDelete = async (order: Order) => {
    if (!window.confirm(`Delete order ${order.orderNumber}? This cannot be undone.`)) return
    setDeleting(order._id)
    try {
      await api.delete(`/orders/${order._id}`)
      setSuccess(`Order ${order.orderNumber} deleted`)
      fetchAll()
    } catch { setError('Failed to delete order') }
    finally { setDeleting(null) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-orange-600">Admin</p>
        <h1 className="text-3xl font-bold text-slate-900">Order Management</h1>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">{error}<button onClick={() => setError('')} className="font-bold ml-4">×</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex justify-between">{success}<button onClick={() => setSuccess('')} className="font-bold ml-4">×</button></div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Orders', value: stats.counts.total ?? 0 },
            { label: 'Today', value: stats.counts.today ?? 0 },
            { label: 'This Month', value: stats.counts.thisMonth ?? 0 },
            { label: 'Total Revenue', value: `Rs. ${(stats.revenue.total ?? 0).toFixed(2)}` },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Search order # or student..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-64"
        />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchAll} className="rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200">Refresh</button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">All Orders ({filtered.length})</h2>
        </div>
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>{['Order #', 'Date', 'Student', 'Items', 'Total', 'Status', 'Payment', 'Actions'].map(h =>
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                )}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(order => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{order.user?.name ?? '—'}</p>
                      <p className="text-xs text-slate-400">{order.user?.email ?? ''}</p>
                    </td>
                    <td className="px-4 py-3">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-3 font-semibold">Rs. {order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] ?? ''}`}>{order.status}</span></td>
                    <td className="px-4 py-3"><span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{order.paymentStatus}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {/* READ */}
                        <button onClick={() => setViewOrder(order)}
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100">View</button>
                        {/* UPDATE */}
                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <button onClick={() => { setEditOrder(order); setEditStatus(order.status) }}
                            className="text-xs px-2 py-1 rounded bg-orange-50 text-orange-700 hover:bg-orange-100">Edit</button>
                        )}
                        {/* DELETE */}
                        <button onClick={() => handleDelete(order)} disabled={deleting === order._id}
                          className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50">
                          {deleting === order._id ? '...' : 'Delete'}
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

      {/* VIEW Dialog */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Order Details</h2>
              <button onClick={() => setViewOrder(null)} className="text-slate-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><p className="text-xs text-slate-500">Order #</p><p className="font-mono font-semibold">{viewOrder.orderNumber}</p></div>
                <div><p className="text-xs text-slate-500">Date</p><p>{new Date(viewOrder.createdAt).toLocaleString()}</p></div>
                <div><p className="text-xs text-slate-500">Student</p><p className="font-medium">{viewOrder.user?.name ?? '—'}</p></div>
                <div><p className="text-xs text-slate-500">Email</p><p>{viewOrder.user?.email ?? '—'}</p></div>
                <div><p className="text-xs text-slate-500">Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[viewOrder.status]}`}>{viewOrder.status}</span></div>
                <div><p className="text-xs text-slate-500">Payment</p><p>{viewOrder.paymentStatus} ({viewOrder.paymentMethod})</p></div>
                <div className="col-span-2"><p className="text-xs text-slate-500">Delivery Address</p><p>{viewOrder.deliveryAddress}</p></div>
                {viewOrder.specialInstructions && <div className="col-span-2"><p className="text-xs text-slate-500">Special Instructions</p><p>{viewOrder.specialInstructions}</p></div>}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-2">Items</p>
                <table className="w-full text-xs border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50"><tr>{['Item', 'Qty', 'Price', 'Total'].map(h => <th key={h} className="px-3 py-2 text-left">{h}</th>)}</tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewOrder.items.map((item, i) => (
                      <tr key={i}>
                        <td className="px-3 py-2">{item.name}</td>
                        <td className="px-3 py-2">{item.quantity}</td>
                        <td className="px-3 py-2">Rs. {item.price.toFixed(2)}</td>
                        <td className="px-3 py-2 font-semibold">Rs. {item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-right font-bold text-slate-900">Total: Rs. {viewOrder.totalAmount.toFixed(2)}</div>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-100">
              <button onClick={() => setViewOrder(null)} className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT Dialog */}
      {editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Update Order Status</h2>
              <button onClick={() => setEditOrder(null)} className="text-slate-400 text-xl">×</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <p className="text-sm text-slate-600">Order: <span className="font-mono font-semibold">{editOrder.orderNumber}</span></p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Status</label>
                <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={() => setEditOrder(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={handleStatusUpdate} disabled={updating === editOrder._id}
                className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">
                {updating === editOrder._id ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AdminOrdersPage
