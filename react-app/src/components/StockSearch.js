import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const StockSearch = () => {
  const [query, setQuery] = useState('');
  const [stocks, setStocks] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (query.trim()) {
        fetchStocks(query);
      } else {
        setStocks([]);
        setSelectedIndex(-1);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const fetchStocks = async (searchTerm) => {
    try {
      const res = await fetch(`http://localhost:5000/search?query=${searchTerm}`);
      const data = await res.json();
      setStocks(data);
    } catch (error) {
      console.error('Error fetching stocks:', error);
    }
  };

  const handleStockClick = (stockName) => {
    navigate(`/stock/${stockName}`);
  };

  const handleKeyDown = (e) => {
    if (stocks.length === 0) return;

    if (e.key === 'ArrowDown') {
      setSelectedIndex((prev) => (prev < stocks.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter' && selectedIndex !== -1) {
      handleStockClick(stocks[selectedIndex].name_of_company);
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        width: '350px',
        textAlign: 'center',
        margin: 'auto',
        marginTop: '10vh',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#2a9d8f',
          marginBottom: '15px',
        }}
      >
        STOCK EQ
      </h1>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <FaSearch
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#888',
          }}
        />
        <input
          type="text"
          placeholder="Search by name or symbol..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: 'calc(100% - 40px)',
            padding: '10px 10px 10px 38px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#fafafa',
            outline: 'none',
            transition: '0.3s',
          }}
        />
      </div>

      {stocks.length > 0 && (
        <ul
          style={{
            listStyleType: 'none',
            padding: '0',
            margin: '0',
            border: '1px solid #ddd',
            borderRadius: '5px',
            maxHeight: '180px',
            overflowY: 'auto',
            backgroundColor: '#fff',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {stocks.map((stock, index) => (
            <li
              key={index}
              onClick={() => handleStockClick(stock.name_of_company)}
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                cursor: 'pointer',
                backgroundColor: selectedIndex === index ? '#e8f5e9' : 'transparent',
                transition: 'background-color 0.2s',
                borderBottom: '1px solid #ddd',
              }}
              onMouseOver={() => setSelectedIndex(index)}
            >
              {stock.name_of_company}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StockSearch;
