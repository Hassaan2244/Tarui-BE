const { Transaction, Product, Ledger } = require("../../models");
const { Op } = require("sequelize");

exports.createTransaction = async (req, res) => {
    try {
        const {
            ledgerId,
            type,
            description,
            amount,
            selectedProducts,
            paid
        } = req.body;
        if (!ledgerId || !type) {
            return res.status(400).json({ message: "ledgerId and type are required.", success: false });
        }

        const latestTransaction = await Transaction.findOne({
            where: { ledgerId },
            order: [["createdAt", "DESC"]],
        });

        let prevBalance = parseFloat(latestTransaction?.runningBalance || 0);
        let delta = 0;
        let computedAmount = 0;

        const calcProductTotal = () =>
            selectedProducts?.reduce((sum, p) => sum + (p.price * p.quantity), 0) || 0;

        if (["Buy", "Sell", "Return-In", "Return-Out"].includes(type)) {
            if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
                return res.status(400).json({ message: `Selected Products is required for type "${type}".`, success: false });
            }

            computedAmount = calcProductTotal();

            for (const product of selectedProducts) {
                const dbProduct = await Product.findByPk(product.id);

                if (!dbProduct) {
                    return res.status(404).json({ message: `Product with id ${product.id} not found.`, success: false });
                }

                // Quantity updates
                if (["Buy", "Return-In"].includes(type)) {
                    dbProduct.qty += product.quantity;
                } else if (["Sell", "Return-Out"].includes(type)) {
                    if (dbProduct.qty < product.quantity) {
                        return res.status(400).json({ message: `Insufficient quantity for product ${dbProduct.name}.`, success: false });
                    }
                    dbProduct.qty -= product.quantity;
                }

                await dbProduct.save();
            }

            // Balance logic
            if (!paid) {
                if (["Buy", "Return-In"].includes(type)) delta = -computedAmount;
                if (["Sell", "Return-Out"].includes(type)) delta = computedAmount;
            }
        }

        if (["Credit Amount", "Debit Amount"].includes(type)) {
            const numericAmount = parseFloat(amount);
            if (isNaN(numericAmount)) {
                return res.status(400).json({ message: `Amount must be a valid number for type "${type}".`, success: false });
            }

            computedAmount = numericAmount;
            delta = type === "Credit Amount" ? -computedAmount : computedAmount;
        }

        const runningBalance = prevBalance + delta;

        const [updatedCount] = await Ledger.update(
            { latestBalance: runningBalance },
            { where: { id: ledgerId } }
        );

        if (updatedCount === 0) {
            return res.status(404).json({ message: "Ledger not found", success: false });
        }

        const transaction = await Transaction.create({
            userId: req.user?.id,
            ledgerId,
            type,
            paid,
            description,
            amount: computedAmount,
            runningBalance,
            prevBalance,
            selectedProducts: selectedProducts || [],
        });

        return res.status(201).json({
            message: "Transaction created successfully.",
            success: true,
            data: transaction,
        });
    } catch (error) {
        console.error("Error creating transaction:", error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
};

exports.getTransactions = async (req, res) => {
    const { page = 1, limit = 10, startDate, endDate, id } = req.query;
    const offset = (page - 1) * limit;

    const where = {
        ledgerId: id,
    };

    if (startDate && endDate) {
        where.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)],
        };
    } else if (startDate) {
        where.createdAt = {
            [Op.gte]: new Date(startDate),
        };
    } else if (endDate) {
        where.createdAt = {
            [Op.lte]: new Date(endDate),
        };
    }

    try {
        const transactions = await Transaction.findAndCountAll({
            where: where,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [["createdAt", "DESC"]],
        });

        res.json({
            total: transactions.count,
            pages: Math.ceil(transactions.count / limit),
            currentPage: parseInt(page),
            data: transactions.rows,
            success: true,
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message, success: false });
    }
};

exports.createOpenSellTransaction = async (req, res) => {
    try {
        const { description, selectedProducts } = req.body;

        if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
            return res.status(400).json({
                message: "SelectedProducts are required for Open Sell.",
                success: false,
            });
        }
        const ledger = await Ledger.findOne({
            where: {
                userId: req.user.id,
                name: "Open Sell",
            },
        });

        if (!ledger) {
            return res.status(404).json({
                message: "Open Sell ledger not found for this user.",
                success: false,
            });
        }
        const latestTransaction = await Transaction.findOne({
            where: { ledgerId: ledger.id },
            order: [["createdAt", "DESC"]],
        });

        let prevBalance = parseFloat(latestTransaction?.runningBalance || 0);
        let computedAmount = selectedProducts.reduce(
            (sum, p) => sum + (p.price * p.quantity),
            0
        );

        for (const product of selectedProducts) {
            if (product.quantity <= 0 || product.price < 0) {
                return res.status(400).json({
                    message: "Invalid price or quantity provided.",
                    success: false,
                });
            }
            const dbProduct = await Product.findByPk(product.id);

            if (!dbProduct) {
                return res.status(404).json({
                    message: `Product with id ${product.id} not found.`,
                    success: false,
                });
            }

            if (dbProduct.qty < product.quantity) {
                return res.status(400).json({
                    message: `Insufficient quantity for product ${dbProduct.name}.`,
                    success: false,
                });
            }

            dbProduct.qty -= product.quantity;
            await dbProduct.save();
        }

        const runningBalance = prevBalance + computedAmount;

        const transaction = await Transaction.create({
            userId: req.user.id,
            ledgerId: ledger.id,
            type: "Open Sell",
            description,
            amount: computedAmount,
            runningBalance,
            selectedProducts,
            paid: true
        });

        return res.status(201).json({
            message: "Open Sell transaction created successfully.",
            success: true,
            data: transaction,
        });
    } catch (error) {
        console.error("Error creating Open Sell transaction:", error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
};

exports.createBreakageTransaction = async (req, res) => {
    try {
        const { description, selectedProducts } = req.body;

        if (!Array.isArray(selectedProducts) || selectedProducts.length === 0) {
            return res.status(400).json({
                message: "SelectedProducts are required for Breakage.",
                success: false,
            });
        }

        const ledger = await Ledger.findOne({
            where: {
                userId: req.user.id,
                name: "Breakage",
            },
        });

        if (!ledger) {
            return res.status(404).json({
                message: "Breakage ledger not found for this user.",
                success: false,
            });
        }

        for (const product of selectedProducts) {
            const dbProduct = await Product.findByPk(product.id);

            if (!dbProduct) {
                return res.status(404).json({
                    message: `Product ${product.name} with id ${product.id} not found.`,
                    success: false,
                });
            }

            if (dbProduct.qty < product.quantity) {
                return res.status(400).json({
                    message: `Insufficient quantity for product ${dbProduct.name}.`,
                    success: false,
                });
            }

            dbProduct.qty -= product.quantity;
            await dbProduct.save();
        }

        const transaction = await Transaction.create({
            userId: req.user?.id,
            ledgerId: ledger.id,
            type: "Breakage",
            description,
            amount: 0,
            runningBalance: 0,
            selectedProducts,
            paid: true
        });

        return res.status(201).json({
            message: "Breakage transaction created successfully.",
            success: true,
            data: transaction,
        });
    } catch (error) {
        console.error("Error creating Breakage transaction:", error);
        return res.status(500).json({ message: "Internal server error.", success: false });
    }
};
