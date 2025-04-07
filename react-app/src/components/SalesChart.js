import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

const SalesChart = ({ symbol }) => {
  const [sales, setSales] = useState([]);
  const [profit, setProfit] = useState([]);
  const [years, setYears] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        const response = await fetch(`http://localhost:5000/scrape/${symbol}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else {
          setSales(data.sales);
          setProfit(data.profit);
          setYears(data.years);
        }
      } catch (err) {
        setError("Failed to fetch financial data");
      }
    };

    if (symbol) {
      fetchFinancialData();
    }
  }, [symbol]);

  if (error) {
    return <div style={{ color: "red", fontWeight: "bold" }}>{error}</div>;
  }

  if (sales.length === 0 || profit.length === 0 || years.length === 0) {
    return null; // Don’t show anything until data is ready
  }

  const calculateGrowthRate = (data) => {
    return data.map((value, index) => {
      if (index === 0) return 0;
      const previousValue = data[index - 1];
      const growthRate = ((value - previousValue) / previousValue) * 100;
      return growthRate.toFixed(2);
    });
  };

  const calculateProfitToSalesPercentage = () => {
    return sales.map((sale, index) => {
      if (sale === 0) return 0;
      return ((profit[index] / sale) * 100).toFixed(2);
    });
  };

  const salesGrowthRate = calculateGrowthRate(sales);
  const profitGrowthRate = calculateGrowthRate(profit);
  const profitToSalesPercentage = calculateProfitToSalesPercentage();

  const chartData = {
    labels: years,
    datasets: [
      {
        label: "Sales (in Cr)",
        data: sales,
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
      {
        label: "Profit (in Cr)",
        data: profit,
        backgroundColor: "rgba(255, 99, 132, 0.6)",
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

            if (datasetIndex === 0) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw} Cr\nGrowth: ${salesGrowthRate[index]}%\nProfit to Sales: ${profitToSalesPercentage[index]}%`;
            } else if (datasetIndex === 1) {
              return `${tooltipItem.dataset.label}: ${tooltipItem.raw} Cr\nGrowth: ${profitGrowthRate[index]}%\nProfit to Sales: ${profitToSalesPercentage[index]}%`;
            }
            return tooltipItem.raw;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Sales/Profit (in Cr)",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div style={styles.chartContainer}>
      <h2>Sales & Profit Over Years</h2>
      <Bar data={chartData} options={options} />
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
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "8px",
    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
    textAlign: "center",
    margin: "0 auto",
  },
};

export default SalesChart;
