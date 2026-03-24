import { useState, useEffect } from 'react'
import { getUserOrders, createOrder, getOrderQRCode, cancelOrder } from '../../api/order.api'
import { getAvailableMeals } from '../../api/meal.api'
import type { Order, OrderStatus, PaymentStatus, CreateOrderRequest } from '../../types/order'
import type { Meal } from '../../types/meal'

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-purple-100 text-purple-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-green-200 text-green-900',
  cancelled: 'bg-red-100 text-red-800',
}

const paymentColors: Record<PaymentStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  refunded: 'bg-blue-100 text-blue-800',
}

const OrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showOrderDialog, setShowOrderDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrOrderNumber, setQrOrderNumber] = useState('')
  const [selectedMeals, setSelectedMeals] = useState<Record<string, number>>({})
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<CreateOrderRequest['paymentMethod']>('cash')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { fetchOrders(); fetchMeals() }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await getUserOrders()
      const data = res.data.data
      setOrders(Array.isArray(data) ? (data as Order[]) : [])
    } catch { setError('Failed to load orders') }
    finally { setLoading(false) }
  }

  const fetchMeals = async () => {
    try {
      const res = await getAvailableMeals()
      const data = res.data.data
      setMeals(Array.isArray(data) ? (data as Meal[]) : [])
    } catch { setError('Failed to load meals') }
  }

  const handleCreateOrder = async () => {
    const items = Object.entries(selectedMeals).filter(([, q]) => q > 0).map(([mealId, quantity]) => ({ mealId, quantity: Number(quantity) }))
    if (items.length === 0) { setError('Please select at least one meal'); return }
    if (!deliveryAddress.trim()) { setError('Please enter a delivery address'); return }
    try {
      setSubmitting(true)
      await createOrder({ items, deliveryAddress, specialInstructions, paymentMethod })
      setSuccess('Order placed!')
      setShowOrderDialog(false)
      setSelectedMeals({}); setDeliveryAddress(''); setSpecialInstructions(''); setPaymentMethod('cash')
      fetchOrders()
    } catch { setError('Failed to create order') }
    finally { setSubmitting(false) }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return
    try {
      await cancelOrder(orderId)
      setSuccess('Order cancelled successfully')
      fetchOrders()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Failed to cancel order')
    }
  }

  const handleShowQR = async (orderId: string) => {
    try {
      const res = await getOrderQRCode(orderId)
      setQrCode(res.data.data.qrCode)
      setQrOrderNumber(res.data.data.orderNumber)
      setShowQRDialog(true)
    } catch { setError('Failed to load QR code') }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-orange-600">Food Orders</p>
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
        </div>
        <button onClick={() => setShowOrderDialog(true)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition">
          + New Order
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex justify-between">{error}<button onClick={() => setError('')} className="font-bold ml-4">x</button></div>}
      {success && <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex justify-between">{success}<button onClick={() => setSuccess('')} className="font-bold ml-4">x</button></div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length },
          { label: 'Pending', value: orders.filter(o => o.status === 'pending').length },
          { label: 'Total Spent', value: `Rs.${orders.reduce((s,o) => s+o.totalAmount,0).toFixed(2)}` },
          { label: 'This Month', value: `Rs.${orders.filter(o => new Date(o.createdAt).getMonth()===new Date().getMonth()).reduce((s,o)=>s+o.totalAmount,0).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100"><h2 className="font-semibold text-slate-900">Order History</h2></div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500">No orders yet. Place your first order!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>{['Order #','Date','Items','Total','Status','Payment','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.filter(o => o.status !== 'cancelled').map(order => (
                  <tr key={order._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(order.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td>
                    <td className="px-4 py-3">{order.items.length} item{order.items.length!==1?'s':''}</td>
                    <td className="px-4 py-3 font-semibold">Rs. {order.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>{order.status}</span></td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentColors[order.paymentStatus]}`}>{order.paymentStatus}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={()=>handleShowQR(order._id)} className="text-xs px-2 py-1 rounded bg-slate-100 hover:bg-slate-200">QR</button>
                        {['pending','confirmed'].includes(order.status)&&<button onClick={()=>handleCancelOrder(order._id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Cancel</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showOrderDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">New Order</h2>
              <button onClick={()=>setShowOrderDialog(false)} className="text-xl text-slate-400">x</button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {meals.map(meal=>(
                  <div key={meal._id} className="rounded-xl border border-slate-200 p-3 flex items-center justify-between">
                    <div><p className="font-medium text-sm">{meal.name}</p><p className="text-xs text-slate-500">Rs. {meal.price.toFixed(2)}</p></div>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setSelectedMeals(p=>{const n={...p};if((n[meal._id]||0)>1)n[meal._id]--;else delete n[meal._id];return n})} disabled={!selectedMeals[meal._id]} className="w-6 h-6 rounded-full bg-slate-100 font-bold text-sm flex items-center justify-center disabled:opacity-40">-</button>
                      <span className="w-5 text-center text-sm">{selectedMeals[meal._id]||0}</span>
                      <button onClick={()=>setSelectedMeals(p=>({...p,[meal._id]:(p[meal._id]||0)+1}))} className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center">+</button>
                    </div>
                  </div>
                ))}
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address *</label><input type="text" value={deliveryAddress} onChange={e=>setDeliveryAddress(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="e.g. Room 204, Block A"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Special Instructions</label><textarea value={specialInstructions} onChange={e=>setSpecialInstructions(e.target.value)} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"/></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as CreateOrderRequest['paymentMethod'])} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="cash">Cash</option><option value="card">Card</option><option value="paypal">PayPal</option><option value="meal_plan">Meal Plan</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={()=>setShowOrderDialog(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button onClick={handleCreateOrder} disabled={submitting||Object.keys(selectedMeals).length===0} className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold disabled:opacity-50">
                {submitting?'Placing...':'Place Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showQRDialog&&qrCode&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold">Order QR Code</h2>
              <button onClick={()=>{setShowQRDialog(false);setQrCode(null)}} className="text-xl text-slate-400">x</button>
            </div>
            <div className="px-6 py-6 text-center space-y-3">
              <img src={qrCode} alt="Order QR Code" className="mx-auto w-56 h-56 rounded-lg border border-slate-200"/>
              <p className="text-sm text-slate-600">Order: <span className="font-mono font-semibold">{qrOrderNumber}</span></p>
              <p className="text-xs text-slate-400">Show this QR code when collecting your order</p>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={()=>window.print()} className="px-4 py-2 text-sm rounded-lg bg-slate-100 hover:bg-slate-200">Print</button>
              <button onClick={()=>{setShowQRDialog(false);setQrCode(null)}} className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white">Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default OrdersPage


