import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PriceToBook = ({ symbol }) => {
  const [pbvData, setPbvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const fetchPBV = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/pbv?symbol=${symbol}`);
        setPbvData(response.data);
        setError(null);
      } catch (err) {
        setError('Price-to-Book data not found');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchPBV();
    }
  }, [symbol]);

  if (loading) return <div style={styles.loading}>Loading PBV...</div>;
  if (error || !pbvData) return null;

  return (
    <div
      style={styles.cardContainer}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
    >
      <div
        style={{
          ...styles.card,
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Face */}
        <div style={{ ...styles.face, ...styles.front }}>
          <div style={styles.title}>📘 Price to Book Value</div>
          <div style={styles.value}>{pbvData.pbv}</div>
        </div>

        {/* Back Face */}
        <div style={{ ...styles.face, ...styles.back }}>
          <div style={styles.infoTitle}>What is PBV?</div>
          <div style={styles.infoText}>
            Price to Book Value (PBV) compares a company's market value to its book value. A PBV &lt; 1 could suggest the stock is undervalued. A higher PBV may indicate investor optimism or overvaluation.
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  cardContainer: {
    perspective: '1000px',
    width: '280px',
    height: '160px',
    margin: '10px',
  },
  card: {
    width: '100%',
    height: '100%',
    position: 'relative',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s ease-in-out',
  },
  face: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '16px',
    boxSizing: 'border-box',
    border: '1px solid #ccc',
    backfaceVisibility: 'hidden',
  },
  front: {
    backgroundColor: '#ffffff', // clean white front
    color: '#333',
    zIndex: 2,
  },
  back: {
    background: 'linear-gradient(135deg, #e0f7fa 0%, #c5e3f6 100%)', // soft aqua to baby blue gradient
    transform: 'rotateY(180deg)',
    color: '#2c3e50', // dark blue-gray for good contrast
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)', // subtle inset effect
  },
  
  title: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '10px',
    textAlign: 'center',
  },
  value: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#007bff',
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '6px',
    textAlign: 'center',
  },
  infoText: {
    fontSize: '0.9rem',
    textAlign: 'center',
    lineHeight: '1.3rem',
  },
  loading: {
    fontSize: '0.95rem',
    fontStyle: 'italic',
    color: '#666',
    padding: '10px',
  },
};

export default PriceToBook;
