// Mocked OSTRICH package
module.exports = {
  __setMockedDocument: function(ostrichDocument) {
    this.ostrichDocument = ostrichDocument;
  },
  fromPath: function (file, cb) {
    if (!file) {
      cb(new Error('File not found'));
    } else {
      cb(null, this.ostrichDocument);
    }
  }
};
