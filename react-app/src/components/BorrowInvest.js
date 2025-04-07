import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const BorrowInvest = ({ symbol }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBorrowInvest = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/borrow-invest?symbol=${symbol}`);
        setData(response.data);
      } catch (err) {
        console.error("Error fetching borrow-invest data:", err);
        setError("Failed to fetch financial data");
      }
    };

    if (symbol) {
      fetchBorrowInvest();
    }
  }, [symbol]);

  if (!data || error) return null;

  const { stockName, years, borrowings, totalAssets } = data;

  const validData =
    Array.isArray(years) &&
    Array.isArray(borrowings) &&
    Array.isArray(totalAssets) &&
    years.length === borrowings.length &&
    years.length === totalAssets.length;

  if (!validData) return null;

  const calculateGrowthRate = (arr) => {
    return arr.map((val, idx) => {
      if (idx === 0) return 0;
      const prev = arr[idx - 1];
      const growth = ((val - prev) / (prev || 1)) * 100;
      return growth.toFixed(2);
    });
  };

  const borrowingsGrowth = calculateGrowthRate(borrowings);
  const assetsGrowth = calculateGrowthRate(totalAssets);

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "Borrowings (₹ Cr)",
        data: borrowings,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
      },
      {
        label: "Total Assets (₹ Cr)",
        data: totalAssets,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const datasetIndex = tooltipItem.datasetIndex;
            const index = tooltipItem.dataIndex;
            const rawValue = tooltipItem.raw;
            let yoyChange;

            if (datasetIndex === 0) {
              yoyChange = borrowingsGrowth[index];
              return `Borrowings: ₹${rawValue.toLocaleString()} Cr\nYoY Change: ${yoyChange}%`;
            } else if (datasetIndex === 1) {
              yoyChange = assetsGrowth[index];
              return `Total Assets: ₹${rawValue.toLocaleString()} Cr\nYoY Change: ${yoyChange}%`;
            }

            return `${tooltipItem.dataset.label}: ₹${rawValue.toLocaleString()} Cr`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Amount (₹ Cr)",
        },
        grid: { display: false },
      },
      x: {
        grid: { display: true },
      },
    },
  };

  return (
    <div style={chartStyles.chartContainer}>
      <h2>Borrowings & Total Assets Over Years</h2>
      <Bar data={chartData} options={options} />
    </div>
  );
};

const chartStyles = {
  chartContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "85%",
    maxWidth: "1000px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    margin: "30px auto 0 auto",
  },
};

export default BorrowInvest;
