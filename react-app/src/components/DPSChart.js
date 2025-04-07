import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const DPSChart = ({ symbol }) => {
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`http://localhost:5000/eps-dividend?symbol=${symbol}`);
        const data = await res.json();

        if (
          !data ||
          !Array.isArray(data.EPS) ||
          !Array.isArray(data.DividendPayout) ||
          !Array.isArray(data.years) ||
          data.EPS.length === 0 ||
          data.DividendPayout.length === 0 ||
          data.years.length === 0
        ) {
          setChartData(null); // forcefully hide chart if invalid
          return;
        }

        const indexOfTTM = data.years.indexOf("TTM");
        const years = indexOfTTM !== -1 ? data.years.slice(0, indexOfTTM) : data.years;
        const EPS = data.EPS.slice(0, years.length);
        const DPS = data.DividendPayout.slice(0, years.length).map((payout, i) =>
          ((EPS[i] * payout) / 100).toFixed(2)
        );

        setChartData({ years, EPS, DPS });
      } catch (err) {
        console.error("Failed to fetch EPS & DPS data", err);
        setChartData(null); // ensure chart doesn't show if there's an error
      }
    };

    if (symbol) {
      fetchData();
    }
  }, [symbol]);

  // Don't render anything if chartData is missing or invalid
  if (
    !chartData ||
    !Array.isArray(chartData.EPS) ||
    chartData.EPS.length === 0 ||
    !Array.isArray(chartData.DPS) ||
    chartData.DPS.length === 0 ||
    !Array.isArray(chartData.years) ||
    chartData.years.length === 0
  ) {
    return null;
  }

  const data = {
    labels: chartData.years,
    datasets: [
      {
        label: "EPS (₹)",
        data: chartData.EPS,
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
      {
        label: "DPS (₹)",
        data: chartData.DPS,
        backgroundColor: "rgba(255, 159, 64, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const datasetLabel = context.dataset.label;
            const value = context.raw;
            const EPS = parseFloat(chartData.EPS[index]);
            const DPS = parseFloat(chartData.DPS[index]);
            const yieldPercent = EPS > 0 ? ((DPS / EPS) * 100).toFixed(2) : "0.00";
            return `${datasetLabel}: ₹${value} (Dividend Yield: ${yieldPercent}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (₹)",
        },
        grid: {
          display: false,
        },
      },
      x: {
        grid: {
          display: true,
        },
      },
    },
  };

  return (
    <div style={styles.chartContainer}>
      <h2>EPS & DPS Over the Years</h2>
      <Bar data={data} options={options} />
    </div>
  );
};

const styles = {
  chartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    maxWidth: "1000px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "10px",
    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    margin: "30px auto",
  },
};

export default DPSChart;
