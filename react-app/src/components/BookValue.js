import React, { useEffect, useState } from 'react';
import axios from 'axios';

const BookValue = ({ symbol }) => {
  const [bookValueData, setBookValueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchBookValue = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/book-value?symbol=${symbol}`);
        setBookValueData(response.data);
        setError(null);
      } catch (err) {
        setError('Book Value not found');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchBookValue();
    }
  }, [symbol]);

  if (loading) return <div style={styles.loading}>Loading Book Value...</div>;
  if (error || !bookValueData) return null;

  const cleanValue = bookValueData.bookvalue.replace(/\s+/g, ' ').trim();

  return (
    <div style={styles.flexItem}>
      <div
        style={styles.cardContainer}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
      >
        <div
          style={{
            ...styles.card,
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div style={{ ...styles.face, ...styles.front }}>
            <div style={styles.title}>📚 Book Value</div>
            <div style={styles.value}>{cleanValue}</div>
          </div>

          {/* Back */}
          <div style={{ ...styles.face, ...styles.back }}>
            <div style={styles.infoTitle}>What is Book Value?</div>
            <div style={styles.infoText}>
              Book Value represents a company's total assets minus liabilities. It’s a key valuation metric showing the real net asset value of a firm.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  flexItem: {
    flex: '0 0 auto',
    width: '280px',
    height: '180px',
    margin: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    perspective: '1000px',
    width: '100%',
    height: '100%',
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
    height: '90%',
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
    backgroundColor: '#ffffff',
    color: '#333',
    zIndex: 2,
  },
  back: {
    background: 'linear-gradient(135deg, #e0f7fa 0%, #80deea 100%)',
    transform: 'rotateY(180deg)',
    color: '#2c3e50',
    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)',
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
    textAlign: 'center',
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

export default BookValue;
