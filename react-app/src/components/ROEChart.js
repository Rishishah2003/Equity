import React, { useEffect, useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Title,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Title, Filler);

const ROEChart = ({ symbol }) => {
  const [roeData, setRoeData] = useState(null);
  const chartRef = useRef();

  useEffect(() => {
    const fetchROE = async () => {
      try {
        const res = await fetch(`http://localhost:5000/roe?symbol=${symbol}`);
        const data = await res.json();

        const isValidData =
          Array.isArray(data?.ROE) &&
          Array.isArray(data?.years) &&
          data.ROE.length > 0 &&
          data.years.length > 0 &&
          data.ROE.every((val) => val !== null && val !== undefined);

        setRoeData(isValidData ? data : null);
      } catch (err) {
        console.error("Error fetching ROE:", err);
        setRoeData(null);
      }
    };

    if (symbol) fetchROE();
  }, [symbol]);

  if (!roeData) return null;

  const { ROE, years } = roeData;

  const yoyChange = ROE.map((val, i) =>
    i === 0 ? null : (((val - ROE[i - 1]) / ROE[i - 1]) * 100).toFixed(2)
  );

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "ROE (%)",
        data: ROE,
        fill: true,
        borderColor: "#2e7d32",
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(46, 125, 50, 0.1)");
          gradient.addColorStop(1, "rgba(46, 125, 50, 0.3)");
          return gradient;
        },
        pointBackgroundColor: "#2e7d32",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const roeVal = context.raw;
            const yoy = yoyChange[index];
            return yoy !== null
              ? `ROE: ${roeVal}% (YoY: ${yoy > 0 ? "+" : ""}${yoy}%)`
              : `ROE: ${roeVal}%`;
          },
        },
        backgroundColor: "#222",
        titleColor: "#fff",
        bodyColor: "#eee",
        borderColor: "#555",
        borderWidth: 1,
        cornerRadius: 5,
        padding: 10,
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        title: {
          display: true,
          text: "ROE (%)",
          color: "#333",
          font: { size: 14 },
        },
        grid: {
          drawBorder: false,
          color: "#eee",
        },
        ticks: {
          color: "#444",
        },
      },
      x: {
        title: {
          display: true,
          text: "Year",
          color: "#333",
          font: { size: 14 },
        },
        grid: {
          display: false,
        },
        ticks: {
          color: "#444",
        },
      },
    },
  };

  return (
    <div style={styles.chartContainer}>
      <h2>Return on Equity (ROE)</h2>
      <Line ref={chartRef} data={chartData} options={chartOptions} />
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
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    margin: "-15px auto 40px auto",
    textAlign: "center",
  },
};

export default ROEChart;
