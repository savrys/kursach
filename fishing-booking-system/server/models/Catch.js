class Catch {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.bookingId = data.bookingId;
    this.placeId = data.placeId;
    this.amount = data.amount;
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

module.exports = Catch;