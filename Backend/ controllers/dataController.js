// Data processing controller
const processData = (data) => {
  return {
    ...data,
    processed_at: new Date().toISOString()
  };
};

module.exports = { processData };
