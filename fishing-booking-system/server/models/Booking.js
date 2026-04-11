class Booking {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.placeId = data.placeId;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.extendedCount = data.extendedCount || 0;
    this.catchAmount = data.catchAmount || 0;
    this.approvedAt = data.approvedAt;
    this.approvedBy = data.approvedBy;
    this.rejectedAt = data.rejectedAt;
    this.rejectedBy = data.rejectedBy;
    this.cancelledAt = data.cancelledAt;
  }
}

module.exports = Booking;