import React, { useEffect, useState } from 'react';
import axios from 'axios';

const FaceValue = ({ symbol }) => {
  const [faceValueData, setFaceValueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    const fetchFaceValue = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/face-value?symbol=${symbol}`);
        setFaceValueData(response.data);
        setError(null);
      } catch (err) {
        setError('Face Value not found');
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchFaceValue();
    }
  }, [symbol]);

  if (loading) return <div style={styles.loading}>Loading Face Value...</div>;
  if (error || !faceValueData) return null;

  const cleanValue = faceValueData.facevalue.replace(/\s+/g, ' ').trim();

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
          {/* Front */}
          <div style={{ ...styles.face, ...styles.front }}>
            <div style={styles.title}>🏷️ Face Value</div>
            <div style={styles.value}>{cleanValue}</div>
          </div>

          {/* Back */}
          <div style={{ ...styles.face, ...styles.back }}>
            <div style={styles.infoTitle}>What is Face Value?</div>
            <div style={styles.infoText}>
              Face Value is the nominal value of a stock as stated by the issuer. It is important for accounting and dividend calculation but doesn't reflect market value.
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
    background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
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

export default FaceValue;
