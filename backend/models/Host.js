// Backward compatibility alias - exports Provider model as Host
// This allows existing code using Host model to continue working
const Provider = require('./Provider');

module.exports = Provider;

