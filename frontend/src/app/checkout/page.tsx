'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useAuthStore } from '@/store';
import { formatPrice, cn } from '@/lib/utils';
import { gu } from '@/config/constants';
import { api } from '@/lib/api';
import type { Address } from '@/types';

interface AddressesResponse {
  addresses: Address[];
}

interface CreateAddressResponse {
  address: Address;
}

interface CreateOrderResponse {
  data: {
    order: {
      id: string;
    };
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  
  const [newAddress, setNewAddress] = useState({
    label: 'Home',
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    city: '',
    district: '',
    state: 'Gujarat',
    pincode: '',
  });

  const shipping = subtotal >= 999 ? 0 : 50;
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + shipping + tax;

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get<AddressesResponse>('/api/addresses');
      setAddresses(response.addresses || []);
      const defaultAddr = response.addresses?.find((a: Address) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr.id);
      }
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
  };

  const handleAddAddress = async () => {
    setLoading(true);
    try {
      const response = await api.post<CreateAddressResponse>('/api/addresses', newAddress);
      setAddresses([...addresses, response.address]);
      setSelectedAddress(response.address.id);
      setShowAddressForm(false);
    } catch (error) {
      alert('Failed to add address');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select an address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<CreateOrderResponse>('/api/orders', {
        addressId: selectedAddress,
        paymentMethod: 'cod',
      });

      clearCart();
      router.push(`/orders/${response.data.order.id}?success=true`);
    } catch (error) {
      alert('Order failed');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold">{gu.checkout}</h1>
        </div>
      </header>

      <main className="pb-32">
        <section className="bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">{gu.shippingAddress}</h2>
            <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-base font-medium text-primary-600">
              {showAddressForm ? 'Cancel' : '+ Add New'}
            </button>
          </div>

          <div className="space-y-2">
            {addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={cn('w-full rounded-xl border-2 p-4 text-left', selectedAddress === addr.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200')}
              >
                <p className="font-semibold text-gray-900">{addr.fullName}</p>
                <p className="text-sm text-gray-600">{addr.phone}</p>
                <p className="mt-2 text-sm text-gray-700">{addr.addressLine1}</p>
                <p className="text-sm text-gray-700">{addr.city}, {addr.district}, {addr.state} - {addr.pincode}</p>
              </button>
            ))}
          </div>

          {showAddressForm && (
            <div className="mt-4 space-y-3 rounded-xl bg-gray-50 p-4">
              <input type="text" placeholder="Full Name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3" />
              <input type="tel" placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3" />
              <input type="text" placeholder="Address" value={newAddress.addressLine1} onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3" />
              <input type="text" placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3" />
              <input type="text" placeholder="Pincode" value={newAddress.pincode} onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })} className="w-full rounded-xl border-2 border-gray-200 px-4 py-3" />
              <button onClick={handleAddAddress} disabled={loading} className="btn-lg w-full bg-primary-500 text-white">Add Address</button>
            </div>
          )}
        </section>

        <section className="mx-4 mt-4 rounded-2xl bg-white p-4">
          <h2 className="text-lg font-bold">Order Summary</h2>
          <div className="mt-3 space-y-2">
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-base">
              <span className="text-gray-600">Shipping</span>
              <span className={cn('font-medium', shipping === 0 ? 'text-green-600' : '')}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg">
              <span className="font-bold">Total</span>
              <span className="font-bold text-primary-600">{formatPrice(total)}</span>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-bottom">
        <div className="px-4 py-3">
          <button onClick={handlePlaceOrder} disabled={loading || !selectedAddress} className="btn-xl w-full bg-primary-500 text-white">
            {loading ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
