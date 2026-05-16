function getHealth(req, res) {
  res.json({
    status: 'ok',
    service: 'Smart Edu Platform API'
  });
}

module.exports = {
  getHealth
};
