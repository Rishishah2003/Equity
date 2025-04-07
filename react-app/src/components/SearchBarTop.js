import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';

const SearchBarTop = () => {
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
    setQuery('');
    setStocks([]);
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
    <div style={{ position: 'relative', maxWidth: '400px', margin: 'auto' }}>
      <div style={{ position: 'relative' }}>
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
            width: '100%',
            padding: '10px 10px 10px 38px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            backgroundColor: '#fafafa',
            outline: 'none',
          }}
        />
      </div>

      {stocks.length > 0 && (
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: '0',
            position: 'absolute',
            width: '100%',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderTop: 'none',
            zIndex: 1000,
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {stocks.map((stock, index) => (
            <li
              key={index}
              onClick={() => handleStockClick(stock.name_of_company)}
              onMouseOver={() => setSelectedIndex(index)}
              style={{
                padding: '10px',
                cursor: 'pointer',
                backgroundColor: selectedIndex === index ? '#e8f5e9' : 'white',
                borderBottom: '1px solid #eee',
              }}
            >
              {stock.name_of_company}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBarTop;
