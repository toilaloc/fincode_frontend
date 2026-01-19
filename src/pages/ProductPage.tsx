import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import PaymentModal from '../components/PaymentModal';

interface Product {
  id: number;
  user_id: number;
  price: string;
}

const ProductPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/v1/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Failed to load product');
    }
  };

  const handlePayNow = () => {
    console.log('Pay with Fincode clicked');
    setShowPayment(true);
  };

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading product details...</p>
      </div>
    </div>
  );

  const totalAmount = parseFloat(product.price);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <button
          onClick={() => navigate('/')}
          className="group flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors mb-4 text-sm"
        >
          <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to Shop</span>
        </button>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="lg:flex">
            {/* Product Image Section */}
            <div className="lg:w-1/2 relative">
              <div className="relative bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400 h-64 lg:h-full flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-black/5"></div>
                <div className="relative z-10 text-center">
                  <svg className="w-20 h-20 text-white/80 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <div className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full inline-block">
                    Premium Quality
                  </div>
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                  NEW ARRIVAL
                </div>
              </div>
            </div>

            {/* Product Details Section */}
            <div className="lg:w-1/2 p-6 lg:p-8 flex flex-col justify-between">
              <div>
                {/* Product Header */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      FEATURED
                    </span>
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      IN STOCK
                    </span>
                  </div>
                  <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">
                    Premium Product #{product.id}
                  </h1>
                  <div className="flex items-center text-gray-600 mb-3 text-sm">
                    <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">Seller: User {product.user_id}</span>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Price</div>
                  <div className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    ¥{parseFloat(product.price).toLocaleString()}
                  </div>
                </div>

                {/* Product Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Product Description</h3>
                  <p className="text-gray-700 leading-relaxed">
                    Experience premium quality with this exceptional product. Crafted with attention to detail
                    and designed to exceed your expectations. This product combines innovative features with
                    elegant design, making it the perfect choice for discerning customers.
                  </p>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {['Premium Quality Materials', 'Expert Craftsmanship', 'Secure Payment via FinCode', 'Fast Delivery'].map((feature, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handlePayNow}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 group"
                >
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span className="text-base">Pay with</span>
                  <img
                    src="https://docs.fincode.jp/assets/images/logos/fincode.svg"
                    alt="FinCode"
                    className="h-5 w-auto filter brightness-0 invert"
                  />
                </button>
                <p className="text-center text-xs text-gray-500 mt-2">
                  🔒 Secure payment powered by FinCode
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          product={product}
          quantity={1}
          totalAmount={totalAmount}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
};

export default ProductPage;
