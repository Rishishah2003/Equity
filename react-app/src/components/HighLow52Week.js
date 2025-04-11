import React, { useEffect, useState } from 'react';
import axios from 'axios';

const HighLow52Week = ({ symbol }) => {
  const [highLowData, setHighLowData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchHighLow = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/high-low?symbol=${symbol}`);
        setHighLowData(response.data["high/low"]);
        setError(null);
      } catch (err) {
        console.error(err.message);
        setError('High / Low not found');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) fetchHighLow();
  }, [symbol]);

  if (loading) return <div style={styles.loading}>Loading 52 Week Range...</div>;
  if (error || !highLowData) return null;

  return (
    <div style={styles.flexItem}>
      <div
        style={styles.cardContainer}
        onMouseEnter={() => setIsFlipped(true)}
        onMouseLeave={() => setIsFlipped(false)}
        role="button"
        tabIndex={0}
        onFocus={() => setIsFlipped(true)}
        onBlur={() => setIsFlipped(false)}
      >
        <div
          style={{
            ...styles.card,
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side */}
          <div style={{ ...styles.face, ...styles.front }}>
            <div style={styles.title}>📊 52 Week High / Low</div>
            <div style={styles.value}>{highLowData}</div>
          </div>

          {/* Back Side */}
          <div style={{ ...styles.face, ...styles.back }}>
            <div style={styles.infoTitle}>What is 52 Week High/Low?</div>
            <div style={styles.infoText}>
              This indicates the highest and lowest prices at which a stock has traded over the last 52 weeks. It helps investors assess volatility and trend direction.
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
    background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
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
    fontSize: '1.8rem',
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

export default HighLow52Week;
