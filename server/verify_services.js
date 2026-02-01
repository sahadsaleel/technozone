const mongoose = require('mongoose');
const dotenv = require('dotenv');
const ServiceSale = require('./models/ServiceSale');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const count = await ServiceSale.countDocuments();
        console.log(`Total Service Sales: ${count}`);

        const sales = await ServiceSale.find().limit(5);
        console.log('Sample Service Sales:', sales);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
