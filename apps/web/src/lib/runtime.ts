const rawUseMockApi = import.meta.env.VITE_USE_MOCK_API;

export const runtimeConfig = {
  appName: import.meta.env.VITE_APP_NAME || "Kurs Boshqaruv",
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  useMockApi: rawUseMockApi ? rawUseMockApi !== "false" : true,
  demoPassword: String(import.meta.env.VITE_DEMO_PASSWORD || "").trim()
};
