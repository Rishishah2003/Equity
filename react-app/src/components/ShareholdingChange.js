import React, { useState, useEffect } from "react";
import { Line, Pie } from "react-chartjs-2";
import "chart.js/auto";

const ShareholdingChange = ({ stockSymbol }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:5000/shareholding?symbol=${stockSymbol}`)
      .then((res) => res.json())
      .then((result) => {
        if (!result.error) {
          setData({
            years: result.years || [],
            FIIs: result.FIIs || [],
            DIIs: result.DIIs || [],
            Promoters: result.Promoters || [],
            Government: result.Government || [],
          });
        }
      })
      .catch(() => {});
  }, [stockSymbol]);

  if (!data || !data.years.length) return null;

  const formatNumber = (num) => (num ? parseFloat(num).toFixed(2) : "0.00");

  const lineChartData = {
    labels: data.years,
    datasets: [
      {
        label: "FIIs (%)",
        data: data.FIIs.map(formatNumber),
        borderColor: "rgba(255, 99, 132, 1)",
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        fill: true,
      },
      {
        label: "DIIs (%)",
        data: data.DIIs.map(formatNumber),
        borderColor: "rgba(54, 162, 235, 1)",
        backgroundColor: "rgba(54, 162, 235, 0.2)",
        fill: true,
      },
      {
        label: "Promoters (%)",
        data: data.Promoters.map(formatNumber),
        borderColor: "rgba(255, 206, 86, 1)",
        backgroundColor: "rgba(255, 206, 86, 0.2)",
        fill: true,
      },
      {
        label: "Government (%)",
        data: data.Government.map(formatNumber),
        borderColor: "rgba(75, 192, 192, 1)",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        fill: true,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const index = tooltipItem.dataIndex;
            const dataset = tooltipItem.dataset.data;
            const currentValue = parseFloat(dataset[index]);
            let tooltipText = `${tooltipItem.dataset.label}: ${currentValue.toFixed(2)}%`;

            if (index > 0) {
              const prevValue = parseFloat(dataset[index - 1]);
              const yoyChange = ((currentValue - prevValue) / prevValue) * 100;
              tooltipText += ` (YoY: ${yoyChange.toFixed(2)}%)`;
            }

            return tooltipText;
          },
        },
      },
    },
    scales: {
      x: { beginAtZero: true },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Shareholding (%)",
        },
      },
    },
  };

  const latestFIIs = formatNumber(data.FIIs.at(-1));
  const latestDIIs = formatNumber(data.DIIs.at(-1));
  const latestPromoters = formatNumber(data.Promoters.at(-1));
  const latestGovernment = formatNumber(data.Government.at(-1));
  const totalShareholding =
    parseFloat(latestFIIs) +
    parseFloat(latestDIIs) +
    parseFloat(latestPromoters) +
    parseFloat(latestGovernment);
  const publicShareholding = formatNumber(Math.max(100 - totalShareholding, 0));

  const pieChartData = {
    labels: ["FIIs", "DIIs", "Promoters", "Government", "Public"],
    datasets: [
      {
        data: [
          latestFIIs,
          latestDIIs,
          latestPromoters,
          latestGovernment,
          publicShareholding,
        ],
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: "easeOutBounce",
    },
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 14 },
        },
      },
    },
  };

  return (
    <div style={styles.chartContainer}>
      <h2>Shareholding Trends Over the Years</h2>
      <div style={styles.flexWrapper}>
        <div style={styles.chartWrapper}>
          <Line data={lineChartData} options={lineChartOptions} />
        </div>
        <div style={styles.pieChartWrapper}>
          <Pie data={pieChartData} options={pieChartOptions} />
        </div>
      </div>
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
    maxWidth: "1200px",
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    margin: "20px auto",
  },
  flexWrapper: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    gap: "40px",
    width: "100%",
    overflow: "hidden",
  },
  chartWrapper: {
    width: "100%",
    maxWidth: "600px",
    height: "400px",
    overflow: "hidden",
  },
  pieChartWrapper: {
    maxWidth: "400px",
    height: "400px",
  },
};

export default ShareholdingChange;
