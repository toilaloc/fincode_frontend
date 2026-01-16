import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';
import PaymentModal from '../components/PaymentModal';

interface Product {
  id: number;
  user_id: number;
  price: string;
}

const ProductPage: React.FC = () => {
  const { id } = useParams();
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
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  const totalAmount = parseFloat(product.price);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="md:flex">
            {/* Product Image Placeholder */}
            <div className="md:w-1/2 bg-gray-200 flex items-center justify-center h-64 md:h-auto">
              <div className="text-gray-500 text-lg">Product Image</div>
            </div>
            
            {/* Product Details */}
            <div className="md:w-1/2 p-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Product {product.id}</h1>
                <p className="text-gray-600 mb-4">Seller: User {product.user_id}</p>
                <div className="text-4xl font-bold text-blue-600 mb-4">
                  ¥{parseFloat(product.price).toLocaleString()}
                </div>
                <p className="text-gray-700 leading-relaxed">
                  This is a sample product description. In a real application, this would contain detailed information about the product features, specifications, and benefits.
                </p>
              </div>

              {/* Total and Buy Button */}
              <div className="border-t pt-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-medium text-gray-700">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ¥{totalAmount.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handlePayNow}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3"
                >
                  <span className="text-lg">Pay with</span>
                  <img
                    src="https://docs.fincode.jp/assets/images/logos/fincode.svg"
                    alt="FinCode"
                    className="h-6 w-auto filter brightness-0 invert"
                  />
                </button>
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
    </div>
  );
};

export default ProductPage;
