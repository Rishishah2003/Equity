import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import StockInfo from "./StockInfo";
import StockPriceChart from "./StockPriceChart";
import SalesChart from "./SalesChart";
import BorrowInvest from "./BorrowInvest";
import ShareholdingChange from "./ShareholdingChange";
import HistoricalPE from "./HistoricalPE";
import DPSChart from "./DPSChart";
import ROCEChart from "./ROCEChart";
import SearchBarTop from "./SearchBarTop";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ROEChart from "./ROEChart";

const StockDetail = () => {
  const { name } = useParams();
  const [symbol, setSymbol] = useState(null);

  const section1Ref = useRef(null); // Page 1
  const section2Ref = useRef(null); // Page 2
  const section3Ref = useRef(null); // Page 3

  useEffect(() => {
    const fetchStockSymbol = async () => {
      try {
        const res = await fetch(`http://localhost:5000/get-stock-symbol?stockName=${name}`);
        const data = await res.json();
        if (data.symbol) setSymbol(data.symbol);
        else console.error("Stock symbol not found");
      } catch (error) {
        console.error("Error fetching stock symbol:", error);
      }
    };

    if (name) fetchStockSymbol();
  }, [name]);

  const downloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const generateCanvas = async (ref) =>
      await html2canvas(ref, {
        scale: 2,
        useCORS: true,
      });

    const addCanvasToPDF = (canvas, addNewPage = false) => {
      const imgData = canvas.toDataURL("image/png");
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

      let heightLeft = imgHeight;
      let position = 0;

      if (addNewPage) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    };

    const canvas1 = await generateCanvas(section1Ref.current);
    addCanvasToPDF(canvas1); // Page 1

    const canvas2 = await generateCanvas(section2Ref.current);
    addCanvasToPDF(canvas2, true); // Page 2

    const canvas3 = await generateCanvas(section3Ref.current);
    addCanvasToPDF(canvas3, true); // Page 3

    pdf.save(`${name}-stock-details.pdf`);
  };

  if (!symbol) {
    return <div style={styles.loading}>Loading...</div>;
  }

  return (
    <div>
      {/* 🧭 Search Bar - Not included in PDF */}
      <div style={styles.searchBarWrapper}>
        <SearchBarTop />
      </div>

      {/* 📄 Page 1 */}
      <div ref={section1Ref} style={styles.container}>
        <StockInfo stockName={name} style={styles.card} />
        <StockPriceChart symbol={symbol} style={styles.card} />
        <SalesChart symbol={symbol} style={styles.card} />
        <BorrowInvest symbol={symbol} style={styles.card} />
      </div>

      {/* 📄 Page 2 */}
      <div ref={section2Ref} style={styles.container}>
        <ShareholdingChange stockSymbol={symbol} style={styles.card} />
        <HistoricalPE symbol={symbol} style={styles.card} />
        <DPSChart symbol={symbol} style={styles.card} />
      </div>

      {/* 📄 Page 3 */}
      <div ref={section3Ref} style={styles.container}>
        <ROCEChart symbol={symbol} style={styles.card} />
        <ROEChart symbol={symbol} style={styles.card} />
      </div>

      {/* 📥 Download Button */}
      <div style={styles.buttonWrapper}>
        <button onClick={downloadPDF} style={styles.downloadButton}>
          📄 Download Report as PDF
        </button>
      </div>
    </div>
  );
};

const styles = {
  searchBarWrapper: {
    padding: "20px",
    backgroundColor: "#ffffff",
    borderBottom: "1px solid #eee",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    position: "sticky",
    top: 0,
    zIndex: 999,
  },
  container: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "20px",
    padding: "20px",
    backgroundColor: "#f7f7f7",
    justifyContent: "center",
  },
  card: {
    width: "100%",
    maxWidth: "500px",
    padding: "20px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
    margin: "auto",
  },
  loading: {
    textAlign: "center",
    fontSize: "18px",
    fontWeight: "bold",
    marginTop: "20px",
  },
  buttonWrapper: {
    textAlign: "center",
    padding: "30px 0",
  },
  downloadButton: {
    padding: "10px 20px",
    backgroundColor: "#0070f3",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
  },
};

export default StockDetail;
