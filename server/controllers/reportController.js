const Expense = require('../models/Expense');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Sale = require('../models/Sale');
const ServiceSale = require('../models/ServiceSale');
const ServiceExpense = require('../models/ServiceExpense');
const excel = require('exceljs');

exports.getSummary = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        let start, end;

        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        if (filter === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = endOfToday;
        } else if (filter === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = endOfToday;
        } else if (filter === 'custom' && startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            // Default to current month if no filter provided
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = endOfToday;
        }

        // 1. Total Sales for period (Product + Service)
        const salesResult = await Sale.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const productSalesTotal = salesResult[0]?.total || 0;

        const serviceSalesResult = await ServiceSale.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$charge" } } }
        ]);
        const serviceSalesTotal = serviceSalesResult[0]?.total || 0;

        const totalSales = productSalesTotal + serviceSalesTotal;

        // 2. Total Expenses for period (Business + Service Expenses)
        const expensesResult = await Expense.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const businessExpensesTotal = expensesResult[0]?.total || 0;

        const serviceExpensesResult = await ServiceExpense.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const serviceExpensesTotal = serviceExpensesResult[0]?.total || 0;

        const totalExpenses = businessExpensesTotal + serviceExpensesTotal;

        // 3. Total Purchase Cost for period
        const purchaseResult = await Purchase.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } }
        ]);
        const totalPurchaseCost = purchaseResult[0]?.total || 0;

        // 4. Total Stock Value (Current Inventory Snapshot - Not filtered by date)
        const products = await Product.find();
        const totalStockValue = products.reduce((acc, product) => {
            return acc + (product.stock * product.buyPrice);
        }, 0);
        const totalProducts = products.length;

        // 5. Net Profit / Loss Calculation
        // Net Profit = Total Sales − (Total Expenses + Purchase Cost)
        const netProfitValue = totalSales - (totalExpenses + totalPurchaseCost);

        res.json({
            totalSales,
            totalExpenses,
            totalPurchaseCost,
            totalStockValue,
            totalProducts,
            netProfit: netProfitValue,
            dateRange: {
                start,
                end,
                filter: filter || 'month'
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.downloadReport = async (req, res) => {
    console.log('[Download] Generating premium report:', req.query);
    try {
        const { filter, startDate, endDate } = req.query;
        let start, end;

        const now = new Date();
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Standardizing filter logic with getSummary
        if (filter === 'today') {
            start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            end = endOfToday;
        } else if (filter === 'month') {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = endOfToday;
        } else if (filter === 'last_week') {
            start = new Date();
            start.setDate(now.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            end = endOfToday;
        } else if (filter === 'last_month') {
            start = new Date();
            start.setMonth(now.getMonth() - 1);
            start.setHours(0, 0, 0, 0);
            end = endOfToday;
        } else if (filter === 'all') {
            start = new Date(2000, 0, 1);
            end = endOfToday;
        } else if (filter === 'custom' && startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
        } else {
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = endOfToday;
        }

        const [sales, expenses, purchases, products, serviceSales, serviceExpenses] = await Promise.all([
            Sale.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 }),
            Expense.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 }),
            Purchase.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 }),
            Product.find(),
            ServiceSale.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 }),
            ServiceExpense.find({ date: { $gte: start, $lte: end } }).sort({ date: 1 })
        ]);

        const totalStockValue = products.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0);
        const reportData = {};
        const getDateKey = (date) => new Date(date).toISOString().split('T')[0];

        sales.forEach(sale => {
            const dk = getDateKey(sale.date);
            if (!reportData[dk]) reportData[dk] = { sales: 0, expenses: 0, purchases: 0 };
            reportData[dk].sales += (sale.totalPrice || 0);
        });
        expenses.forEach(expense => {
            const dk = getDateKey(expense.date);
            if (!reportData[dk]) reportData[dk] = { sales: 0, expenses: 0, purchases: 0 };
            reportData[dk].expenses += (expense.amount || 0);
        });
        purchases.forEach(purchase => {
            const dk = getDateKey(purchase.date);
            if (!reportData[dk]) reportData[dk] = { sales: 0, expenses: 0, purchases: 0 };
            reportData[dk].purchases += (purchase.totalCost || 0);
        });

        // Add Service Sales
        serviceSales.forEach(sSale => {
            const dk = getDateKey(sSale.date);
            if (!reportData[dk]) reportData[dk] = { sales: 0, expenses: 0, purchases: 0 };
            reportData[dk].sales += (sSale.charge || 0);
        });

        // Add Service Expenses
        serviceExpenses.forEach(sExpense => {
            const dk = getDateKey(sExpense.date);
            if (!reportData[dk]) reportData[dk] = { sales: 0, expenses: 0, purchases: 0 };
            reportData[dk].expenses += (sExpense.amount || 0);
        });

        const workbook = new excel.Workbook();
        const worksheet = workbook.addWorksheet('Business Report');

        // Branding Header
        worksheet.mergeCells('A1:E1');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'TECHNOZONE FINANCIAL REPORT';
        titleCell.font = { name: 'Arial Black', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.mergeCells('A2:E2');
        const metaCell = worksheet.getCell('A2');
        metaCell.value = `Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()} | Generated: ${new Date().toLocaleString()}`;
        metaCell.font = { italic: true, size: 10 };
        metaCell.alignment = { horizontal: 'center' };

        // Define Columns
        worksheet.getRow(4).values = ['Date', 'Sales (₹)', 'Expenses (₹)', 'Purchases (₹)', 'Net Profit (₹)'];
        worksheet.columns = [
            { key: 'date', width: 18 },
            { key: 'sales', width: 18, style: { numFmt: '"₹"#,##0.00' } },
            { key: 'expenses', width: 18, style: { numFmt: '"₹"#,##0.00' } },
            { key: 'purchases', width: 18, style: { numFmt: '"₹"#,##0.00' } },
            { key: 'net', width: 22, style: { numFmt: '"₹"#,##0.00' } }
        ];

        // Style header row (Row 4)
        const headerRow = worksheet.getRow(4);
        headerRow.eachCell((cell) => {
            cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF34495E' } };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Add Data Rows
        Object.keys(reportData).sort().forEach((date, index) => {
            const d = reportData[date];
            const net = d.sales - (d.expenses + d.purchases);
            const row = worksheet.addRow({
                date,
                sales: d.sales,
                expenses: d.expenses,
                purchases: d.purchases,
                net: net
            });

            // Striped rows
            if (index % 2 !== 0) {
                row.eachCell((cell) => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F4' } };
                });
            }

            // Cell borders and alignment
            row.eachCell((cell, colNumber) => {
                cell.border = {
                    left: { style: 'thin', color: { argb: 'FFD5DBDB' } },
                    right: { style: 'thin', color: { argb: 'FFD5DBDB' } },
                    bottom: { style: 'thin', color: { argb: 'FFD5DBDB' } }
                };
                if (colNumber === 1) cell.alignment = { horizontal: 'center' };
            });
        });

        // Totals
        const totalSales = sales.reduce((s, i) => s + (i.totalPrice || 0), 0) + serviceSales.reduce((s, i) => s + (i.charge || 0), 0);
        const totalExpenses = expenses.reduce((s, i) => s + (i.amount || 0), 0) + serviceExpenses.reduce((s, i) => s + (i.amount || 0), 0);
        const totalPurchases = purchases.reduce((s, i) => s + (i.totalCost || 0), 0);
        const netProfit = totalSales - (totalExpenses + totalPurchases);

        // Summary Section
        worksheet.addRow([]);
        const summaryHeader = worksheet.addRow(['FINAL SUMMARY']);
        summaryHeader.getCell(1).font = { bold: true, size: 12, underline: true };

        const summaryData = [
            { label: 'Total Sales Revenue', value: totalSales },
            { label: 'Total Business Expenses', value: totalExpenses },
            { label: 'Total Inventory Purchase', value: totalPurchases },
            { label: 'Total Current Stock Value', value: totalStockValue },
            { label: '', value: '' }, // Blank
            { label: 'NET PROFIT/LOSS', value: netProfit }
        ];

        summaryData.forEach((item, index) => {
            if (item.label) {
                const row = worksheet.addRow([item.label, item.value]);
                row.getCell(2).numFmt = '"₹"#,##0.00';
                row.getCell(1).font = { bold: index === 5 };

                if (index === 5) { // Net Profit styling
                    row.getCell(2).font = { bold: true, color: { argb: netProfit >= 0 ? 'FF008000' : 'FFFF0000' } };
                    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEDEF' } };
                    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEDEF' } };
                }
            } else {
                worksheet.addRow([]);
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=TechnoZone_Financial_Report.xlsx');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'no-cache');
        res.status(200).send(buffer);

    } catch (err) {
        console.error('[Download] Styling Error:', err);
        if (!res.headersSent) {
            res.status(500).json({ message: 'Error generating styled report' });
        }
    }
};
