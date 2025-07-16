
const { BillSetting } = require("../../models");

exports.createSetting = async (req, res) => {
    try {
        const { icon, name, email, phone, address, preparedBy } = req.body;

        const existing = await BillSetting.findOne({ where: { userId: req.user.id } });
        if (existing) {
            return res.status(400).json({
                message: "Bill setting already exists for this user.",
                success: false,
            });
        }

        const setting = await BillSetting.create({
            userId: req.user.id,
            icon,
            name,
            email,
            phone,
            address,
            preparedBy
        });

        return res.status(201).json({ message: "Created successfully", success: true, data: setting });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", success: false });
    }
}

exports.updateSetting = async (req, res) => {
    try {
        const { icon, name, email, phone, address, preparedBy } = req.body;

        const setting = await BillSetting.findOne({ where: { userId: req.user.id } });

        if (!setting) {
            return res.status(404).json({ message: "Setting not found", success: false });
        }

        await setting.update({ icon, name, email, phone, address, preparedBy });

        return res.status(200).json({ message: "Updated successfully", success: true, data: setting });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", success: false });
    }
}

exports.fetchSetting = async (req, res) => {
    try {
        const setting = await BillSetting.findOne({
            where: { userId: req.user.id },
        });

        if (!setting) {
            return res.status(200).json({ message: "Setting not found", success: true, data: null });
        }

        return res.status(200).json({ message: "Fetched successfully", success: true, data: setting });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error", success: false });
    }
}
