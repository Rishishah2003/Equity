import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const HistoricalPE = ({ symbol }) => {
  const [peData, setPeData] = useState([]);
  const [dates, setDates] = useState([]);

  useEffect(() => {
    const fetchPE = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/historical-pe-scrape?symbol=${symbol}`
        );
        const data = await response.json();

        const isValid =
          Array.isArray(data?.trailingPEHistory) &&
          Array.isArray(data?.dates) &&
          data.trailingPEHistory.length > 0 &&
          data.dates.length > 0 &&
          data.trailingPEHistory.every((val) => val !== null && val !== undefined);

        if (isValid) {
          setPeData(data.trailingPEHistory);
          setDates(data.dates);
        } else {
          setPeData([]);
          setDates([]);
        }
      } catch {
        setPeData([]);
        setDates([]);
      }
    };

    if (symbol) {
      fetchPE();
    }
  }, [symbol]);

  if (!peData.length || !dates.length) return null;

  const chartData = {
    labels: dates,
    datasets: [
      {
        label: "Trailing P/E Ratio",
        data: peData,
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        top: 20,
        bottom: 40,
        right: 50,
      },
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `P/E Ratio: ${tooltipItem.raw}`;
          },
        },
      },
      legend: {
        position: "top",
      },
    },
    scales: {
      x: {
        reverse: true,
        title: {
          display: true,
          text: "Date",
        },
        grid: {
          display: true,
          drawOnChartArea: true,
          drawTicks: true,
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 12,
          maxRotation: 0,
          minRotation: 0,
          padding: 10,
        },
      },
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "Trailing P/E",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={{ ...styles.chartContainer, height: "500px" }}>
      <h2>Historical Trailing P/E Ratio</h2>
      <Line data={chartData} options={options} />
    </div>
  );
};

const styles = {
  chartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "85%",
    maxWidth: "1000px",
    padding: "55px 20px 20px 20px", // Increased top padding
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    margin: "10px auto 0 auto", // Matches BorrowInvest.js nicely
  },
};

export default HistoricalPE;
