import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  BarElement,
  registerables,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(...registerables, BarElement);

const StockPriceChart = ({ symbol }) => {
  const [chartData, setChartData] = useState({ datasets: [] });
  const [interval, setInterval] = useState("1mo");
  const [priceChangePercent, setPriceChangePercent] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchChartData = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/stock-price-history?symbol=${symbol}&interval=${interval}`
        );
        const data = await res.json();

        if (isMounted && data.length > 0) {
          const validData = data.filter((item) => item.volume > 0);
          validData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

          const dataMap = new Map();
          validData.forEach((item) => {
            const dateKey = new Date(item.timestamp).toISOString().split("T")[0];
            dataMap.set(dateKey, { price: item.price, volume: item.volume });
          });

          const alignedData = Array.from(dataMap.entries()).map(([date, values]) => ({
            x: new Date(date),
            price: values.price,
            volume: values.volume,
          }));

          const lineData = alignedData.map((item) => ({ x: item.x, y: item.price }));
          const volumeData = alignedData.map((item) => ({ x: item.x, y: item.volume }));

          const firstPrice = alignedData[0]?.price;
          const lastPrice = alignedData[alignedData.length - 1]?.price;
          const change =
            firstPrice && lastPrice
              ? (((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)
              : null;
          setPriceChangePercent(change);

          setChartData({
            datasets: [
              {
                label: "Stock Price",
                data: lineData,
                borderColor: "blue",
                backgroundColor: "rgba(0, 0, 255, 0.1)",
                tension: 0.3,
                fill: false,
                yAxisID: "y",
                spanGaps: true,
                pointRadius: 3,
                pointHoverRadius: 5,
                hoverBorderColor: "red",
              },
              {
                label: "Volume",
                data: volumeData,
                backgroundColor: "rgba(0, 150, 0, 0.5)",
                type: "bar",
                barThickness: 5,
                yAxisID: "y1",
                spanGaps: true,
                hoverBackgroundColor: "rgba(0, 200, 0, 0.7)",
              },
            ],
          });
        } else {
          setChartData({ datasets: [] });
          setPriceChangePercent(null);
        }
      } catch (error) {
        console.error("Error fetching stock history:", error);
      }
    };

    fetchChartData();

    return () => {
      isMounted = false;
    };
  }, [symbol, interval]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    spanGaps: true,
    interaction: {
      intersect: false,
      mode: "index",
      axis: "x",
      hover: {
        mode: "nearest",
        intersect: true,
      },
    },
    scales: {
      x: {
        type: "time",
        time: {
          unit: "day",
          displayFormats: {
            day: "MMM d",
          },
        },
        distribution: "linear",
        grid: { display: false },
      },
      y: {
        beginAtZero: false,
        position: "left",
        title: {
          display: true,
          text: "Stock Price",
        },
        grid: { display: false },
      },
      y1: {
        beginAtZero: true,
        position: "right",
        grid: { display: false },
        title: {
          display: true,
          text: "Volume",
        },
      },
    },
    plugins: {
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        callbacks: {
          title: function (tooltipItems) {
            if (!tooltipItems.length) return "";
            const item = tooltipItems[0];
            const date = new Date(item.parsed.x);
            return date.toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            });
          },
        },
      },
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "20px 0" }}>
      <div
        style={{
          width: "90%",
          maxWidth: "1000px",
          padding: "20px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          background: "white",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "15px" }}>
          <label style={{ fontSize: "16px", fontWeight: "bold" }}>Select Timeline: </label>
          <select
            style={{ padding: "5px", fontSize: "16px" }}
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
          >
            <option value="1d">1 Day</option>
            <option value="1mo">1 Month</option>
            <option value="1y">1 Year</option>
            <option value="5y">5 Years</option>
            <option value="max">Max</option>
          </select>
          {priceChangePercent !== null && (
            <span style={{ marginLeft: "15px", fontSize: "16px", fontWeight: "bold", color: "black" }}>
              Change %:{" "}
              <span style={{ color: priceChangePercent >= 0 ? "green" : "red" }}>
                {priceChangePercent >= 0 ? "+" : ""}
                {priceChangePercent}%
              </span>
            </span>
          )}
        </div>
        <div style={{ height: "400px" }}>
          <Line key={interval} data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default StockPriceChart;
