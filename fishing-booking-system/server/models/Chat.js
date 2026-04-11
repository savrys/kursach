class Chat {
  constructor(data) {
    this.id = data.id;
    this.userId = data.userId;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }
}

module.exports = Chat;