const express = require('express');
const { getLedgers, getLedgerDetails, createLedger, getLedgerTransactionsByDate, updateLedger, deleteLedger } = require('../../controllers/ledger');
const router = express.Router();

router.get("/", getLedgers);
router.get("/:id", getLedgerDetails);
router.post("/", createLedger);
router.patch("/:id", updateLedger);
router.delete("/:id", deleteLedger);
router.get("/:id/transactions", getLedgerTransactionsByDate);



module.exports = router;
