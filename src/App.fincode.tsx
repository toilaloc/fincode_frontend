import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProductPage from './pages/ProductPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/products/:id" element={<ProductPage />} />
        {/* Add more routes as needed */}
        <Route path="*" element={<Navigate to="/products/1" />} />
      </Routes>
    </Router>
  );
};

export default App;
