import mongoose from 'mongoose';

const processedWebhookEventSchema = new mongoose.Schema({
    eventId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    eventType: {
        type: String,
        required: true
    },
    processedAt: {
        type: Date,
        default: Date.now,
        expires: 2592000 // Auto-delete after 30 days (TTL index)
    }
});

export default mongoose.model('ProcessedWebhookEvent', processedWebhookEventSchema);