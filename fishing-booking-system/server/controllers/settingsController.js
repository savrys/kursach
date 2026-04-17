exports.getMapImage = async (req, res) => {
    try {
        const db = req.app.locals.readDB();
        const mapImage = db.settings?.mapImage || null;
        res.json({ image: mapImage });
    } catch (error) {
        console.error("Get map image error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
