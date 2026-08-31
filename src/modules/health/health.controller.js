const startedAt = new Date().toISOString();

export const getHealth = (_request, response) => {
  response.json({
    success: true,
    data: {
      service: 'smart-home-backend',
      status: 'healthy',
      startedAt,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
};

