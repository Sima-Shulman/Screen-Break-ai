// __mocks__/export.js
export const ExportUtils = {
  exportWeeklyReport: jest.fn(() => Promise.resolve()),
  shareToWhatsApp: jest.fn(() => Promise.resolve()),
};
