import React, { useEffect, useState } from 'react';
import axios from 'axios';

const News = ({ symbol }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const currentDate = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(currentDate.getMonth() - 1);

        const formatDate = (date) => date.toISOString().split('T')[0];
        const fromDate = formatDate(oneMonthAgo);

        const encodedQuery = `"${symbol}"`; // wrap in quotes
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: encodedQuery,
            from: fromDate,
            sortBy: 'publishedAt',
            pageSize: 5, // Limit to latest 5
            language: 'en',
            apiKey: 'f0f4ecf43f4d495f826d8a3a26a897e5',
          },
        });

        setNews(response.data.articles || []);
      } catch (error) {
        console.error('Error fetching news:', error);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchNews();
    }
  }, [symbol]);

  if (loading || !symbol) return null;

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.heading}>📰 Top News</h2>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Source</th>
              <th style={styles.th}>Title</th>
              <th style={styles.th}>URL</th>
            </tr>
          </thead>
          <tbody>
            {news.map((article, index) => (
              <tr key={index} style={styles.row}>
                <td style={styles.td}>{article.source.name}</td>
                <td style={styles.td}>{article.title}</td>
                <td style={styles.td}>
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    URL
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '20px',
  },
  box: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '1000px',
    border: '1px solid #ddd',
  },
  heading: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
    marginBottom: '20px',
    color: '#333',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    border: '1px solid #ccc',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f1f1f1',
    fontWeight: '600',
  },
  td: {
    border: '1px solid #ccc',
    padding: '12px',
    verticalAlign: 'top',
  },
  link: {
    color: '#007bff',
    textDecoration: 'underline',
    fontWeight: '500',
  },
  row: {
    backgroundColor: '#fff',
  },
};

export default News;
