const express = require('express');
const cors = require('cors');
const pool = require('./db');  // Assuming you are using PostgreSQL
const axios = require('axios');
const yahooFinance = require('yahoo-finance2').default;  // Yahoo Finance API
const child_process = require("child_process");
const { spawn } = require("child_process");
const cheerio = require("cheerio");
const puppeteer = require("puppeteer");



const app = express();

// Enable CORS for frontend communication
const corsOptions = {
  // origin: 'http://localhost:3000',  // React app running on port 3000
  methods: 'GET',
  allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());

// Welcome route
app.get('/', (req, res) => {
  res.send('Welcome to the Stock Search API! Use /search?query=stockname to search.');
});

// Search API - Filters stocks as you type
app.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const results = await pool.query(
      `SELECT name_of_company, symbol FROM companies WHERE name_of_company ILIKE $1 LIMIT 5`,
      [`%${query}%`]
    );
    res.json(results.rows);
  } catch (err) {
    console.error('Error fetching stocks:', err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/stock-price', async (req, res) => {
  try {
    let { symbol } = req.query;

    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    // Append ".NS" if not present
    if (!symbol.endsWith('.NS')) {
      symbol = `${symbol}.NS`;
    }

    console.log(`📈 Fetching stock price for: ${symbol}`);

    // Fetch summary from Yahoo Finance
    const stockData = await yahooFinance.quoteSummary(symbol, { modules: ['price'] });

    // Defensive check for expected data structure
    if (!stockData || !stockData.price || !stockData.price.regularMarketPrice) {
      return res.status(404).json({ error: 'Stock data not found or incomplete' });
    }

    // Respond with formatted data
    res.json({
      symbol: stockData.price.symbol,
      price: stockData.price.regularMarketPrice,
      currency: stockData.price.currency,
    });

  } catch (error) {
    console.error('❌ Error fetching stock price:', error.message);
    res.status(500).json({ error: 'Error fetching stock price. Please try again later.' });
  }
});

app.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    console.log(`🔍 Incoming Search Query: '${query}'`);

    const results = await pool.query(
      `SELECT name_of_company, symbol 
       FROM companies 
       WHERE name_of_company ILIKE $1 OR symbol ILIKE $1 
       LIMIT 5`,
      [`%${query}%`]
    );

    console.log('📦 Raw Search Results:');
    results.rows.forEach(row =>
      console.log(`'${row.name_of_company}' - '${row.symbol}'`)
    );

    // Only return name_of_company to frontend
    const namesOnly = results.rows.map(row => ({
      name_of_company: row.name_of_company
    }));

    res.json(namesOnly);
  } catch (err) {
    console.error('❌ Error fetching stocks:', err.message);
    res.status(500).send('Server Error');
  }
});



// Historical stock price API using Yahoo Finance
app.get('/stock-price-history', async (req, res) => {
    try {
      let { symbol, interval } = req.query;
  
      // Default to 1d if no interval is specified
      if (!interval) {
        interval = '1d';
      }
  
      // Check if symbol already has ".NS", if not, append it
      if (!symbol.includes('.')) {
        symbol = `${symbol}.NS`;  // Append .NS for Indian stocks
      }
  
      // Define valid intervals and corresponding time calculations
      const validIntervals = {
        '1d': 1,
        '1wk': 7,
        '1mo': 30,
        '1y': 365,
        '5y': 5 * 365,
        'max': 365 * 20, // Assume max means last 20 years
      };
  
      if (!validIntervals[interval]) {
        return res.status(400).send('Invalid interval. Valid options: 1d, 1wk, 1mo, 1y, 5y, max.');
      }
  
      const period2 = new Date(); // Current date
      const period1 = new Date();
      period1.setDate(period1.getDate() - validIntervals[interval]); // Subtract days based on interval
  
      // Fetch historical stock data using Yahoo Finance API
      const historicalData = await yahooFinance.historical(symbol, {
        period1: Math.floor(period1.getTime() / 1000), // Convert to UNIX timestamp
        period2: Math.floor(period2.getTime() / 1000), // Convert to UNIX timestamp
        interval: '1d', // Daily interval
      });
  
      // Return data including volume
      res.json(
        historicalData.map(item => ({
          timestamp: item.date,
          price: item.close, // Closing price
          volume: item.volume, // Volume data
        }))
      );
    } catch (error) {
      console.error('Error fetching stock price history:', error);
      res.status(500).send('Error fetching stock price history');
    }
  });  

  app.get("/get-stock-symbol", async (req, res) => {
    try {
      const { stockName } = req.query;
  
      if (!stockName) {
        return res.status(400).json({ error: "Stock name is required" });
      }
  
      // Correct SQL query using parameterized query
      const result = await pool.query(
        "SELECT symbol FROM companies WHERE name_of_company = $1", 
        [stockName]
      );
  
      if (result.rows.length > 0) {
        res.json({ symbol: result.rows[0].symbol });
      } else {
        res.status(404).json({ error: "Stock not found" });
      }
    } catch (error) {
      console.error("Error fetching stock symbol:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });  

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});



///////////////////////FINAL////////////////////////////////

// Helper function to scrape data
const scrapeFinancialData = async (url, stockName) => {
  console.log(`🔍 Trying URL: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);

    let sales = [];
    let profit = [];
    let years = [];

    const table = $("table.data-table");

    if (!table.length) {
      console.log("⚠️ No financial table found at", url);
      return null; // Indicate failure
    }

    console.log("✅ Table Found! Extracting data...");

    table.find("tbody tr").each((index, row) => {
      const cols = $(row).find("td");
      const rowHeader = $(cols[0]).text().trim();

      if (rowHeader.includes("Revenue") || rowHeader.includes("Sales")) {
        cols.each((i, col) => {
          if (i > 0) {
            sales.push(parseFloat($(col).text().replace(/,/g, "")) || 0);
          }
        });
      }

      if (rowHeader.includes("Net Profit") || rowHeader.includes("Profit After Tax")) {
        cols.each((i, col) => {
          if (i > 0) {
            profit.push(parseFloat($(col).text().replace(/,/g, "")) || 0);
          }
        });
      }
    });

    if (sales.length === 0 || profit.length === 0) {
      console.log("⚠️ No financial data extracted.");
      return null; // Indicate failure
    }

    let currentYear = new Date().getFullYear();
    years = sales.map((_, i) => currentYear - (sales.length - 1 - i));

    return { stockName, sales, profit, years };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return null; // Indicate failure
  }
};

// API Route
app.get("/scrape/:symbol", async (req, res) => {
  let { symbol } = req.params;
  const stockName = symbol.replace(".NS", "");

  // Try first URL
  let financialData = await scrapeFinancialData(`https://www.screener.in/company/${stockName}/consolidated/`, stockName);

  // If first URL fails, try the second one
  if (!financialData) {
    console.log(`🔄 Retrying with basic URL for ${stockName}...`);
    financialData = await scrapeFinancialData(`https://www.screener.in/company/${stockName}/`, stockName);
  }

  if (!financialData) {
    return res.status(404).json({ error: "Financial data not available" });
  }

  res.json(financialData);
});


////////////////////////BorrowInvestInfo////////////////////////////////////////

const scrapeBorrowInvestData = async (url, stockName) => {
  console.log(`🔍 Trying URL: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com", // 🚀 Helps avoid bot detection
      },
      timeout: 10000, // ⏳ 10s timeout just in case
    });

    const $ = cheerio.load(data);
    let borrowings = [];
    let totalAssets = [];
    let years = [];
    let foundBorrowings = false;
    let foundTotalAssets = false;

    const tables = $("table.data-table");

    if (!tables.length) {
      console.log("⚠️ No financial tables found at", url);
      return null;
    }

    // ✅ Loop Through All Tables to Find Borrowings & Total Assets
    tables.each((tableIndex, table) => {
      let tableYears = [];

      // Extract Years
      $(table)
        .find("thead th")
        .each((i, el) => {
          if (i > 0) tableYears.push($(el).text().trim());
        });

      $(table)
        .find("tr")
        .each((index, row) => {
          const cols = $(row).find("td");
          const rowHeader = $(cols[0]).text().trim();

          if (rowHeader.includes("Borrowings") || rowHeader.includes("Borrowings +") || rowHeader.includes("Borrowing")) {
            foundBorrowings = true;
            let rowData = [];
            cols.each((i, col) => {
              if (i > 0) rowData.push(parseFloat($(col).text().replace(/,/g, "")) || 0);
            });
            borrowings = rowData.slice(0, tableYears.length);
            years = tableYears;
          }

          if (rowHeader.toLowerCase().includes("total assets")) {
            foundTotalAssets = true;
            let rowData = [];
            cols.each((i, col) => {
              if (i > 0) rowData.push(parseFloat($(col).text().replace(/,/g, "")) || 0);
            });
            totalAssets = rowData.slice(0, tableYears.length);
            years = tableYears;
          }
        });
    });

    if (!foundBorrowings && !foundTotalAssets) {
      console.log("⚠️ No borrowings or total asset data found.");
      return null;
    }

    return {
      stockName,
      years,
      borrowings: borrowings.length ? borrowings : "Data not available",
      totalAssets: totalAssets.length ? totalAssets : "Data not available",
    };
  } catch (error) {
    console.error(`❌ Error scraping ${url}`);

    if (error.response) {
      console.error("🔻 Response Error:", error.response.status, error.response.statusText);
    } else if (error.request) {
      console.error("🔻 No Response Received:", error.request);
    } else {
      console.error("🔻 Axios Error:", error.message);
    }

    return null;
  }
};

// 📡 Express API Route
app.get("/borrow-invest", async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  const stockName = symbol.replace(".NS", "");

  console.log(`📈 Fetching borrow & asset data for: ${stockName}`);

  // Try consolidated URL
  let borrowInvestData = await scrapeBorrowInvestData(`https://www.screener.in/company/${stockName}/consolidated/`, stockName);

  // Retry with basic URL if needed
  if (!borrowInvestData) {
    console.log(`🔄 Retrying with basic URL for ${stockName}...`);
    borrowInvestData = await scrapeBorrowInvestData(`https://www.screener.in/company/${stockName}/`, stockName);
  }

  if (!borrowInvestData) {
    return res.status(404).json({ error: "Borrowings or total asset data not available" });
  }

  res.json(borrowInvestData);
});


////////////////////////////////////PROMOTER///////////////////////////////////////////


const scrapeShareholdingData = async (url, stockName) => {
  console.log(`🔍 Scraping: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    let FIIs = [], DIIs = [], Promoters = [], Government = [], years = [];
    let foundData = false;

    const tables = $("table.data-table");
    if (!tables.length) {
      console.log("⚠️ No financial tables found.");
      return null;
    }

    tables.each((_, table) => {
      let tableYears = [];
      $(table).find("thead th").each((i, el) => {
        if (i > 0) tableYears.push($(el).text().trim());
      });

      console.log("📅 Extracted Years:", tableYears);

      $(table).find("tr").each((_, row) => {
        const cols = $(row).find("td");
        const rowHeader = $(cols[0]).text().trim();
        const rowValues = cols.map((i, col) => (i > 0 ? parseFloat($(col).text().replace(/,/g, "")) || 0 : null)).get();

        if (rowHeader.includes("FIIs")) {
          foundData = true;
          FIIs = rowValues;
          years = tableYears;
        }

        if (rowHeader.includes("DIIs")) DIIs = rowValues;
        if (rowHeader.includes("Promoters")) Promoters = rowValues;
        if (rowHeader.includes("Government")) Government = rowValues;

        console.log(`📊 ${rowHeader}:`, rowValues);
      });
    });

    if (!foundData) return null;

    return { stockName, years, FIIs, DIIs, Promoters, Government };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return null;
  }
};

app.get("/shareholding", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  const stockName = symbol.replace(".NS", "");
  let shareholdingData = await scrapeShareholdingData(`https://www.screener.in/company/${stockName}/consolidated/`, stockName);

  if (!shareholdingData) {
    return res.status(404).json({ error: "Shareholding data not available" });
  }

  res.json(shareholdingData);
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));

//////////////////////////////////////////PE RATIO//////////////////////////////////////////////

app.get("/historical-pe-scrape", async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Missing stock symbol" });
  }

  const url = `https://finance.yahoo.com/quote/${symbol}.NS/key-statistics`;

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Optional: Block images/styles/fonts for faster load
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const resourceType = req.resourceType();
      if (["image", "stylesheet", "font"].includes(resourceType)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.waitForSelector("section[data-testid='qsp-statistics']", {
      timeout: 15000,
    });

    const result = await page.evaluate(() => {
      const data = {
        peSeries: [],
        dates: [],
      };

      const tables = document.querySelectorAll(
        "section[data-testid='qsp-statistics'] table"
      );

      tables.forEach((table) => {
        const rows = table.querySelectorAll("tr");
        rows.forEach((row) => {
          const cells = row.querySelectorAll("td");
          if (cells.length > 1 && cells[0].innerText.includes("Trailing P/E")) {
            cells.forEach((cell, idx) => {
              if (idx !== 0) {
                const val = cell.innerText.trim();
                if (val !== "--" && !isNaN(parseFloat(val))) {
                  data.peSeries.push(parseFloat(val));
                }
              }
            });
          }
        });
      });

      const headerRow = document.querySelector(
        "section[data-testid='qsp-statistics'] table thead tr"
      );
      if (headerRow) {
        headerRow.querySelectorAll("th").forEach((th, idx) => {
          if (idx !== 0) {
            const date = th.innerText.trim();
            if (date) data.dates.push(date);
          }
        });
      }

      return data;
    });

    await browser.close();

    if (!result.peSeries.length) {
      return res.status(404).json({ error: "P/E data not found" });
    }

    res.json({
      symbol: `${symbol}.NS`,
      trailingPEHistory: result.peSeries,
      dates: result.dates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scraping error:", error.message);
    res.status(500).json({ error: "Failed to fetch P/E data" });
  }
});

///////////////////////////////////////EPS DPS//////////////////////////////////////

// // EPS and Dividend Scraper
// const scrapeEpsDividendData = async (url, stockName) => {
//   console.log(`🔍 Scraping EPS and Dividend Payout: ${url}`);

//   try {
//     const { data } = await axios.get(url, {
//       headers: {
//         "User-Agent":
//           "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
//         "Accept-Language": "en-US,en;q=0.9",
//       },
//     });

//     const $ = cheerio.load(data);
//     let EPS = [],
//       DividendPayout = [],
//       years = [];
//     let foundEPS = false;

//     const tables = $("table.data-table");
//     if (!tables.length) {
//       console.log("⚠️ No financial tables found.");
//       return null;
//     }

//     tables.each((_, table) => {
//       let tableYears = [];
//       $(table)
//         .find("thead th")
//         .each((i, el) => {
//           if (i > 0) tableYears.push($(el).text().trim());
//         });

//       $(table)
//         .find("tr")
//         .each((_, row) => {
//           const cols = $(row).find("td");
//           const rowHeader = $(cols[0]).text().trim();
//           const rowValues = cols
//             .map((i, col) =>
//               i > 0 ? parseFloat($(col).text().replace(/,/g, "")) || 0 : null
//             )
//             .get();

//           if (rowHeader.includes("EPS in Rs")) {
//             EPS = rowValues;
//             years = tableYears;
//             foundEPS = true;
//           }

//           if (rowHeader.includes("Dividend Payout")) {
//             DividendPayout = rowValues;
//           }
//         });
//     });

//     if (!foundEPS) return null;

//     return { stockName, years, EPS, DividendPayout };
//   } catch (error) {
//     console.error(`❌ Error scraping ${url}:`, error.message);
//     return null;
//   }
// };

// // Endpoint
// app.get("/eps-dividend", async (req, res) => {
//   const { symbol } = req.query;
//   if (!symbol) {
//     return res.status(400).json({ error: "Symbol is required" });
//   }

//   const stockName = symbol.replace(".NS", "");
//   const url = `https://www.screener.in/company/${stockName}/consolidated/`;

//   const result = await scrapeEpsDividendData(url, stockName);

//   if (!result) {
//     return res
//       .status(404)
//       .json({ error: "EPS and Dividend data not available" });
//   }

//   res.json(result);
// });

// EPS and Dividend Scraper
const scrapeEpsDividendData = async (url, stockName) => {
  console.log(`🔍 Scraping EPS and Dividend Payout: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    let EPS = [],
      DividendPayout = [],
      years = [];
    let foundEPS = false;

    const profitLossSection = $("#profit-loss");
    if (!profitLossSection.length) {
      console.log("❌ Profit & Loss section not found.");
      return null;
    }

    const table = profitLossSection.find("table.data-table").first();
    if (!table.length) {
      console.log("❌ No financial table inside Profit & Loss.");
      return null;
    }

    table.find("thead th").each((i, el) => {
      if (i > 0) years.push($(el).text().trim());
    });

    table.find("tbody tr").each((_, row) => {
      const cols = $(row).find("td");
      const rowHeader = $(cols[0]).text().trim();

      const rowValues = cols
        .map((i, col) =>
          i > 0 ? parseFloat($(col).text().replace(/,/g, "")) || 0 : null
        )
        .get();

      if (rowHeader.includes("EPS in Rs")) {
        EPS = rowValues;
        foundEPS = true;
      }

      if (rowHeader.includes("Dividend Payout")) {
        DividendPayout = rowValues;
      }
    });

    if (!foundEPS) return null;

    return { stockName, years, EPS, DividendPayout };
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return null;
  }
};

// API Endpoint
app.get("/eps-dividend", async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Symbol is required" });
  }

  const stockName = symbol.replace(".NS", "");
  const url = `https://www.screener.in/company/${stockName}/consolidated/`;

  const result = await scrapeEpsDividendData(url, stockName);

  if (!result) {
    return res
      .status(404)
      .json({ error: "EPS and Dividend data not available" });
  }

  res.json(result);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});


////////////////////////////////////////////////ROCE/////////////////////////////////////////////

// ROCE Scraper
const scrapeRoceData = async (url, stockName) => {
  console.log(`🔍 Scraping ROCE % data: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    let ROCE = [], years = [];

    const tables = $("table.data-table");
    if (!tables.length) return null;

    tables.each((_, table) => {
      let tableYears = [];
      $(table)
        .find("thead th")
        .each((i, el) => {
          if (i > 0) tableYears.push($(el).text().trim());
        });

      $(table)
        .find("tr")
        .each((_, row) => {
          const cols = $(row).find("td");
          const rowHeader = $(cols[0]).text().trim();
          const rowValues = cols
            .map((i, col) =>
              i > 0 ? parseFloat($(col).text().replace(/,/g, "")) || 0 : null
            )
            .get();

          if (rowHeader.includes("ROCE %")) {
            ROCE = rowValues;
            years = tableYears;
          }
        });
    });

    if (!ROCE.length) return null;

    return { stockName, years, ROCE };
  } catch (error) {
    console.error(`❌ Error scraping ROCE from ${url}:`, error.message);
    return null;
  }
};

// ROCE Endpoint
app.get("/roce", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  const stockName = symbol.replace(".NS", "");
  const url = `https://www.screener.in/company/${stockName}/consolidated/`;

  const result = await scrapeRoceData(url, stockName);
  if (!result)
    return res.status(404).json({ error: "ROCE data not available" });

  res.json(result);
});

///////////////////////////////////ROE////////////////////////////////////////////////

// ROE Scraper
const scrapeRoeData = async (url, stockName) => {
  console.log(`🔍 Scraping ROE % data: ${url}`);

  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    const $ = cheerio.load(data);
    let ROE = [], years = [];

    const tables = $("table.data-table");
    if (!tables.length) return null;

    tables.each((_, table) => {
      let tableYears = [];
      $(table)
        .find("thead th")
        .each((i, el) => {
          if (i > 0) tableYears.push($(el).text().trim());
        });

      $(table)
        .find("tr")
        .each((_, row) => {
          const cols = $(row).find("td");
          const rowHeader = $(cols[0]).text().trim();
          const rowValues = cols
            .map((i, col) =>
              i > 0 ? parseFloat($(col).text().replace(/,/g, "")) || 0 : null
            )
            .get();

          if (rowHeader.includes("ROE %")) {
            ROE = rowValues;
            years = tableYears;
          }
        });
    });

    if (!ROE.length) return null;

    return { stockName, years, ROE };
  } catch (error) {
    console.error(`❌ Error scraping ROE from ${url}:`, error.message);
    return null;
  }
};

// ROE Endpoint
app.get("/roe", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "Symbol is required" });

  const stockName = symbol.replace(".NS", "");
  const url = `https://www.screener.in/company/${stockName}/consolidated/`;

  const result = await scrapeRoeData(url, stockName);
  if (!result)
    return res.status(404).json({ error: "ROE data not found" });

  res.json(result);
});
