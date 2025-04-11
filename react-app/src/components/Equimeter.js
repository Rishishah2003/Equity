import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Radar } from 'react-chartjs-2';
import GaugeChart from 'react-gauge-chart';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const Equimeter = ({ symbol }) => {
  const [scores, setScores] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const backendURL = 'http://localhost:5000';

        const [
          pegRes, crossoverRes, stdDevRes, rsiRes,
          salesGrowthRes, profitGrowthRes, borrowingVsSalesRes,
          shareholdingRes, sentimentRes
        ] = await Promise.all([
          axios.get(`${backendURL}/peg-ratio?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/golden-crossover?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/std-deviation-zones?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/rsi-data?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/sales-growth/${symbol}`).catch(() => ({ data: { growthFlags: {} } })),
          axios.get(`${backendURL}/profit-growth/${symbol}`).catch(() => ({ data: { growthFlags: {} } })),
          axios.get(`${backendURL}/borrow-sales?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/shareholding-trend?symbol=${symbol}`).catch(() => ({ data: {} })),
          axios.get(`${backendURL}/sentiment?symbol=${symbol}`).catch(() => ({ data: { analysis: [] } }))
        ]);

        const parseScore = (peg, cross, stdDev, rsi, sales, profit, borrow, shares, sentimentArr) => {
          let valuation = 0;
          let tech = 0;
          let fund = 0;
          let share = 0;
          let sentiment = 0;

          // Valuation
          const pegRatio = parseFloat(peg.pegRatio);
          if (!isNaN(pegRatio)) {
            if (pegRatio > 0 && pegRatio <= 1) valuation += 20;
            else if (pegRatio <= 1.5) valuation += 10;
            else if (pegRatio <= 2) valuation += 5;
          }

          // Technical
          if (cross.latestGoldenCross) tech += 10;
          const zone = stdDev.zone || '';
          if (zone.includes('Zone A')) tech += 10;
          else if (zone.includes('Zone B')) tech += 7;
          else if (zone.includes('Zone C')) tech += 5;
          else if (zone.includes('Zone D')) tech += 3;

          const rsiValue = parseFloat(rsi?.latestRSI?.rsi);
          if (!isNaN(rsiValue)) {
            if (rsiValue < 30) tech += 10;
            else if (rsiValue < 50) tech += 3;
          }

          // Fundamental
          const salesGrowth = sales.growthFlags || {};
          const profitGrowth = profit.growthFlags || {};
          if (salesGrowth['5yr']) fund += 10;
          else if (salesGrowth['3yr']) fund += 5;
          else if (salesGrowth['1yr']) fund += 3;

          if (profitGrowth['5yr']) fund += 10;
          else if (profitGrowth['3yr']) fund += 5;
          else if (profitGrowth['1yr']) fund += 3;

          const borrowGrowth = borrow.growthComparison || {};
          if (borrowGrowth.borrowingRateBeatsSales5Yrs) fund += 10;
          else if (borrowGrowth.borrowingRateBeatsSales3Yrs) fund += 5;

          // Shareholding
          const evalTrend = (t) => t?.increased ? 10 : t?.same ? 5 : 0;
          share += evalTrend(shares.FIIs) + evalTrend(shares.DIIs) + evalTrend(shares.Promoters);

          // Sentiment
          const pos = sentimentArr.filter(s => s === 'Positive').length;
          const neg = sentimentArr.filter(s => s === 'Negative').length;
          const neu = sentimentArr.filter(s => s === 'Neutral').length;
          sentiment = (pos >= neg && pos > neu) ? 20 : (neu >= pos && neu >= neg ? 5 : 0);

          // Normalize scores
          const finalScores = {
            valuation: valuation,
            technical: parseFloat(((tech * 2) / 3).toFixed(2)),
            fundamental: parseFloat(((fund * 2) / 3).toFixed(2)),
            shareholding: parseFloat(((share * 2) / 3).toFixed(2)),
            sentiment: sentiment
          };

          finalScores.total = Object.values(finalScores).reduce((a, b) => a + b, 0).toFixed(2);
          return finalScores;
        };

        const scoreObj = parseScore(
          pegRes.data, crossoverRes.data, stdDevRes.data, rsiRes.data,
          salesGrowthRes.data, profitGrowthRes.data, borrowingVsSalesRes.data,
          shareholdingRes.data, sentimentRes.data.analysis || []
        );

        setScores(scoreObj);
      } catch (err) {
        console.error('❌ Error fetching scores:', err.message);
        setScores({
          valuation: 0,
          technical: 0,
          fundamental: 0,
          shareholding: 0,
          sentiment: 0,
          total: 0
        });
      }
    };

    if (symbol) fetchScores();
  }, [symbol]);

  if (!scores) return null;

  return (
    <div style={{
      width: '60%',
      margin: '0 auto',
      padding: '2.5rem',
      backgroundColor: '#fff',
      borderRadius: '20px',
      boxShadow: '0 12px 32px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{
        textAlign: 'center',
        fontSize: '2rem',
        fontWeight: '700',
        marginBottom: '1rem',
        color: '#212121'
      }}>Equimeter</h2>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '4rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ width: '500px' }}>
          <Radar
            data={{
              labels: ['Valuation', 'Technical', 'Fundamental', 'Shareholding', 'Sentiment'],
              datasets: [
                {
                  label: 'Score (out of 20)',
                  data: [
                    scores.valuation,
                    scores.technical,
                    scores.fundamental,
                    scores.shareholding,
                    scores.sentiment
                  ],
                  backgroundColor: 'rgba(0, 123, 255, 0.3)',
                  borderColor: '#007bff',
                  borderWidth: 2,
                  pointBackgroundColor: '#fff',
                  pointBorderColor: '#007bff',
                  pointRadius: 6,
                  pointHoverRadius: 8,
                  pointHoverBackgroundColor: '#007bff',
                }
              ],
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                r: {
                  beginAtZero: true,
                  max: 20,
                  ticks: { stepSize: 5, color: '#333' },
                  grid: { color: '#ccc' },
                  pointLabels: {
                    color: '#212529',
                    font: { size: 16, weight: 'bold' }
                  }
                }
              },
              plugins: {
                legend: { display: false }
              }
            }}
            height={450}
          />
        </div>

        <div style={{ width: '350px', textAlign: 'center' }}>
          <GaugeChart
            id="equimeter-gauge"
            nrOfLevels={30}
            arcWidth={0.4}
            colors={['#f44336', '#ff9800', '#4caf50']}
            percent={parseFloat(scores.total) / 100}
            needleColor="#111"
            textColor="transparent"
          />
          <div style={{
            fontSize: '1.8rem',
            fontWeight: '700',
            marginTop: '1rem',
            color: '#000'
          }}>
            Overall Score: {scores.total} / 100
          </div>
        </div>
      </div>
    </div>
  );
};

export default Equimeter;
