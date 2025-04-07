import React, { useEffect, useState } from 'react';

const StockInfo = ({ stockName }) => {
  const [stock, setStock] = useState(null);
  const [stockPrice, setStockPrice] = useState(null);

  useEffect(() => {
    const fetchStockDetail = async () => {
      try {
        const res = await fetch(`http://localhost:5000/search?query=${stockName}`);
        const data = await res.json();
        if (data.length > 0) {
          setStock(data[0]);
        }
      } catch (error) {
        console.error('Error fetching stock details:', error);
      }
    };

    fetchStockDetail();
  }, [stockName]);

  useEffect(() => {
    const fetchStockPrice = async () => {
      if (stock?.symbol) {
        try {
          const res = await fetch(`http://localhost:5000/stock-price?symbol=${stock.symbol}.NS`);
          const priceData = await res.json();
          if (priceData.price) {
            setStockPrice(priceData);
          }
        } catch (error) {
          console.error('Error fetching stock price:', error);
        }
      }
    };

    fetchStockPrice();
    const intervalId = setInterval(fetchStockPrice, 5000); // Update every 5 sec

    return () => clearInterval(intervalId);
  }, [stock]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>{stock?.name_of_company || 'Stock Not Found'}</h1>
        <p style={{ ...styles.price, color: stockPrice?.color || 'black' }}>
          <strong>Price:</strong> {stockPrice?.price ? `${stockPrice.price} ${stockPrice.currency}` : 'N/A'}
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start', // Aligns box to the top
    height: '13vh', // Reduced height for top positioning
    paddingTop: '20px', // Extra space at the top
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '14px 20px', // Reduced padding for a smaller look
    borderRadius: '10px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    width: '100%',
    maxWidth: '350px', // Reduced width
  },
  title: { 
    fontSize: '20px', 
    fontWeight: 'bold', 
    color: '#333',
    marginBottom: '6px',
  },
  price: { 
    fontSize: '18px', 
    fontWeight: 'bold',
    marginTop: '6px',
  },
};

export default StockInfo;
