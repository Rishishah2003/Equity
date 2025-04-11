import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PERatio = ({ symbol }) => {
  const [peData, setPeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchPERatio = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/pe-ratio?symbol=${symbol}`);
        setPeData(response.data);
        setError(null);
      } catch (err) {
        setError('P/E ratio not found');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchPERatio();
    }
  }, [symbol]);

  if (loading) return <div style={styles.loading}>Loading P/E ratio...</div>;
  if (error || !peData) return null;

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
          {/* Front Face */}
          <div style={{ ...styles.face, ...styles.front }}>
            <div style={styles.title}>📈 Price to Earnings (P/E)</div>
            <div style={styles.value}>{peData.peRatio}</div>
          </div>

          {/* Back Face */}
          <div style={{ ...styles.face, ...styles.back }}>
            <div style={styles.infoTitle}>What is P/E Ratio?</div>
            <div style={styles.infoText}>
              Indicates how much investors are willing to pay for ₹1 of earnings. A high P/E may signal high growth expectations, while a low P/E might suggest undervaluation.
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
    height: '160px',
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
    backgroundColor: '#ffffff',
    color: '#333',
    zIndex: 2,
  },
  back: {
    background: 'linear-gradient(135deg, #e0f7fa 0%, #c5e3f6 100%)',
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
    color: '#28a745',
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

export default PERatio;
