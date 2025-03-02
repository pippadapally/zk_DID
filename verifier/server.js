const express = require('express');
const snarkjs = require('snarkjs');
const fs = require('fs');

const app = express();
app.use(express.json());

const verificationKey = JSON.parse(fs.readFileSync('verification_key.json'));

app.post('/verify', async (req, res) => {
    const { proof, publicSignals } = req.body;

    try {
        const result = await snarkjs.groth16.verify(verificationKey, publicSignals, proof);
        res.json({ valid: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
