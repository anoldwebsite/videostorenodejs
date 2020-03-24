const mongoose = require('mongoose')

const transactionSchema = mongoose.Schema({
    source: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Movie'
    },
    destination: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Rental'
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['borrow', 'return'],
        //default: 'borrow',
        lowercase: true,
        trim: true
    },
    state: {
        type: String,
        enum: ['initial', 'pending', 'applied', 'done', 'canceling', 'canceled'],
        lowercase: true,
        trim: true
    },
    lastModified: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports.Transaction = Transaction;