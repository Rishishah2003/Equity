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

const ROCEChart = ({ symbol }) => {
  const [roceData, setRoceData] = useState(null);
  const chartRef = useRef();

  useEffect(() => {
    const fetchROCE = async () => {
      try {
        const res = await fetch(`http://localhost:5000/roce?symbol=${symbol}`);
        const data = await res.json();

        // Only set data if valid
        if (data?.ROCE?.length && data?.years?.length) {
          setRoceData(data);
        } else {
          setRoceData(null); // Hide the chart if data is invalid
        }
      } catch (err) {
        console.error("Error fetching ROCE:", err);
        setRoceData(null);
      }
    };

    if (symbol) {
      fetchROCE();
    }
  }, [symbol]);

  if (!roceData) return null;

  const { ROCE, years } = roceData;

  const yoyChange = ROCE.map((val, i) =>
    i === 0 ? null : (((val - ROCE[i - 1]) / ROCE[i - 1]) * 100).toFixed(2)
  );

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "ROCE (%)",
        data: ROCE,
        fill: true,
        borderColor: "#3f51b5",
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(63, 81, 181, 0.1)");
          gradient.addColorStop(1, "rgba(63, 81, 181, 0.3)");
          return gradient;
        },
        pointBackgroundColor: "#3f51b5",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    animation: {
      duration: 5000,
      easing: "easeOutQuart",
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            const index = context.dataIndex;
            const roceVal = context.raw;
            const yoy = yoyChange[index];
            return yoy !== null
              ? `ROCE: ${roceVal}% (YoY: ${yoy > 0 ? "+" : ""}${yoy}%)`
              : `ROCE: ${roceVal}%`;
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
          text: "ROCE (%)",
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
      <h2>Return on Capital Employed (ROCE)</h2>
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

export default ROCEChart;
