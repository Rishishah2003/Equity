import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import StockSearch from './components/StockSearch'; // Your existing StockSearch component
import StockDetail from './components/StockDetail'; // New component to show stock symbol

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<StockSearch />} />
        <Route path="/stock/:name" element={<StockDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
