class Message {
  constructor(data) {
    this.id = data.id;
    this.chatId = data.chatId;
    this.senderId = data.senderId;
    this.text = data.text;
    this.createdAt = data.createdAt || new Date().toISOString();
    this.read = data.read || false;
  }
}

module.exports = Message;